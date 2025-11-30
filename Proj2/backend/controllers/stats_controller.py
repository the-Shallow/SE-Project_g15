# controllers/stats_controller.py
from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy import func
from extensions import db
from models.user import User
from models.group import Group
from models.order import GroupOrder, GroupOrderItem

# Blueprint definition
bp = Blueprint("stats", __name__)
@jwt_required()
def get_user_stats():
    """
    Return basic stats for the logged-in user:
      - totalOrders: number of GroupOrder rows for the user
      - pooledOrders: number of user's orders that are part of groups
                      where more than one user placed an order
    Note: No monetary/spend calculation (no price data in models).
    """
    claims = get_jwt()
    username = claims.get("username")

    # total orders by this user
    total_orders = (
        db.session.query(func.count(GroupOrder.id))
        .filter(GroupOrder.username == username)
        .scalar()
        or 0
    )

    # Determine groups that have more than one order:
    # subquery: group_id -> order_count
    group_order_counts = (
        db.session.query(
            GroupOrder.group_id.label("group_id"),
            func.count(GroupOrder.id).label("order_count"),
        )
        .group_by(GroupOrder.group_id)
        .subquery()
    )

    # Count user's orders that belong to groups with order_count > 1
    pooled_orders = (
        db.session.query(func.count(GroupOrder.id))
        .join(
            group_order_counts,
            GroupOrder.group_id == group_order_counts.c.group_id,
        )
        .filter(GroupOrder.username == username)
        .filter(group_order_counts.c.order_count > 1)
        .scalar()
        or 0
    )

    return (
        jsonify(
            {
                "username": username,
                "totalOrders": int(total_orders),
                "pooledOrders": int(pooled_orders),
            }
        ),
        200,
    )


def compute_leaderboard():
    """
    Build a leaderboard of users.
    For each user we compute:
      - totalOrders: total GroupOrder count for user
      - pooledOrders: number of those orders placed in groups where group had >1 order
      - score: weighted combination (50% normalized totalOrders, 50% normalized pooledOrders)
    Returns a JSON list sorted by score descending.
    """
    # 1) subquery: group_id -> order_count (same as above)
    group_order_counts = (
        db.session.query(
            GroupOrder.group_id.label("group_id"),
            func.count(GroupOrder.id).label("order_count"),
        )
        .group_by(GroupOrder.group_id)
        .subquery()
    )

    # 2) total orders per user
    total_orders_subq = (
        db.session.query(
            GroupOrder.username.label("username"),
            func.count(GroupOrder.id).label("total_orders"),
        )
        .group_by(GroupOrder.username)
        .subquery()
    )

    # 3) pooled orders per user (join with group_order_counts and pick groups with order_count > 1)
    pooled_orders_subq = (
        db.session.query(
            GroupOrder.username.label("username"),
            func.count(GroupOrder.id).label("pooled_orders"),
        )
        .join(
            group_order_counts,
            GroupOrder.group_id == group_order_counts.c.group_id,
        )
        .filter(group_order_counts.c.order_count > 1)
        .group_by(GroupOrder.username)
        .subquery()
    )

    # 4) combine with users table (so we include users with zero orders too)
    rows = (
        db.session.query(
            User.username.label("username"),
            func.coalesce(total_orders_subq.c.total_orders, 0).label("total_orders"),
            func.coalesce(pooled_orders_subq.c.pooled_orders, 0).label("pooled_orders"),
        )
        .outerjoin(total_orders_subq, User.username == total_orders_subq.c.username)
        .outerjoin(pooled_orders_subq, User.username == pooled_orders_subq.c.username)
        .all()
    )

    # if no users, return empty list
    if not rows:
        return jsonify([]), 200

    # 5) compute normalization bases
    max_total = max([r.total_orders for r in rows]) or 1
    max_pooled = max([r.pooled_orders for r in rows]) or 1

    # avoid division by zero: if all zeros, score will be zero
    leaderboard = []
    for r in rows:
        norm_total = (r.total_orders / max_total) if max_total else 0
        norm_pooled = (r.pooled_orders / max_pooled) if max_pooled else 0
        score = 0.5 * norm_total + 0.5 * norm_pooled
        leaderboard.append(
            {
                "username": r.username,
                "totalOrders": int(r.total_orders),
                "pooledOrders": int(r.pooled_orders),
                "score": round(float(score) * 100, 2),  # score as 0..100
            }
        )

    # sort by score desc, tie-break by totalOrders desc then pooledOrders desc
    leaderboard.sort(
        key=lambda x: (x["score"], x["totalOrders"], x["pooledOrders"]), reverse=True
    )

    return jsonify(leaderboard), 200
