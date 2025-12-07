from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from extensions import db
from models import Group, GroupOrder, GroupOrderItem, GroupMember, User, MenuItem, Restaurant, LoyaltyLedger, Coupon
from . import bp
from datetime import datetime, timezone, timedelta
import json

def calculate_points(total_price: float, pool_size: int = 1, multiplier: float = 1.0, user : User = None) -> int:
        """
        Simple rewards formula:
        - base: 5% of spend (floor to int)
        - bonus: +2 points for each extra member beyond 1
        - partner multiplier: restaurant.reward_multiplier (default 1.0)
        """
        base = int(total_price * 0.5)
        bonus = max(pool_size - 1, 0) * 2
        streak_bonus = 1.0 + min(user.streak_count * 0.05, 0.30)
        total_multiplier = multiplier * bonus * streak_bonus * user.tier_multiplier()
        return int(base + total_multiplier)


def evaluate_group_goal(group):
    if group.goal_reach:
        return
    
    if group.total_cents >= 10000:
        reward_type = "coupon"
        reward_value = 10
        for member in group.members:
            coupon = Coupon(
                code=f"GROUP10-{member.username[:3].upper()}",
                user_id = member.user.id,
                type="percent_off",
                value=reward_value,
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
            db.session.add(coupon)
            db.session.add(LoyaltyLedger(
                user_id = member.user.id,
                type="bonus",
                points=0,
                amount_cents=0,
                meta={"reason":"group_goal","coupon_code":coupon.code}
            ))
        group.goal_reach = True

    elif group.total_cents >= 5000:
        reward_type = "points"
        reward_value = 100
        for member in group.members:
            user = member.user
            user.loyalty_points += reward_value
            db.session.add(LoyaltyLedger(
                user_id = user.id,
                type="bonus",
                points=reward_value,
                amount_cents=0,
                meta={"reason":"group_goal_points"}
            ))
        group.goal_reach = True
    
    db.session.add(group)
    db.session.commit()

def parse_iso_utc(dt_str: str):
    """Parse ISO datetime string, ensure UTC-aware."""
    if not dt_str:
        return None
    # Replace Z with +00:00
    if dt_str.endswith("Z"):
        dt_str = dt_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(dt_str)
    # Make timezone-aware UTC if naive
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt


# Get all orders in a group
@bp.route("/groups/<int:group_id>/orders", methods=["GET"])
@jwt_required()
def get_group_orders(group_id):
    claims = get_jwt()
    username = claims.get("username")

    # Check if user is a member
    member = GroupMember.query.filter_by(group_id=group_id, username=username).first()
    if not member:
        return jsonify({"error": "Not a member of this group"}), 403

    orders = GroupOrder.query.filter_by(group_id=group_id).all()
    return jsonify([o.to_dict() for o in orders]), 200


# Add or update an order for a user in a group
@bp.route("/groups/<int:group_id>/orders", methods=["POST"])
@jwt_required()
def add_or_update_order(group_id):
    claims = get_jwt()
    username = claims.get("username")
    user_id = get_jwt_identity()
    data = request.json or {}

    group = Group.query.get_or_404(group_id)

    # Check membership
    member = GroupMember.query.filter_by(group_id=group_id, username=username).first()
    if not member:
        return jsonify({"error": "Not a member of this group"}), 403

    data_next_order_time = data.get("nextOrderTime") or data.get("next_order_time")
    next_order_time_utc = parse_iso_utc(data_next_order_time) or group.next_order_time

    # Compare with current UTC time
    if datetime.now(timezone.utc) > next_order_time_utc:
        return jsonify({"error": "Group order time has expired"}), 400

    # Get or create user's order
    order = GroupOrder.query.filter_by(group_id=group_id, username=username).first()
    if not order:
        order = GroupOrder(group_id=group_id, username=username)
        db.session.add(order)
        db.session.flush()  # Assign order.id

    # Clear previous items
    GroupOrderItem.query.filter_by(order_id=order.id).delete()

    # Add new items
    inner = data.get("items")

    # If nested structure like {'items': {...}}, unpack it
    if isinstance(inner, dict) and "items" in inner:
        data = inner

    items = data.get("items", [])
    total_cents = 0
    for item in items:
        menu_item = MenuItem.query.get(item["menuItemId"])
        if not menu_item:
            return jsonify({
                "error": f"Menu item with ID {item['menuItemId']} not found"
            }), 404
        quantity = item.get("quantity",1)
        total_cents += int(menu_item.price * 100 * quantity)
        db.session.add(
            GroupOrderItem(
                order_id=order.id,
                menu_item_id=item["menuItemId"],
                quantity=item.get("quantity", 1),
                special_instructions=item.get("specialInstructions", ""),
            )
        )

    user = User.query.get(user_id)
    restaurant = Restaurant.query.get(group.restaurant_id)
    pool_size = len(group.members)

    redeem_points = int(data.get("redeemPoints",0))
    POINTS_PER_DOLLAR = 100
    MIN_REDEEM_POINTS = 200

    if redeem_points and redeem_points >= MIN_REDEEM_POINTS and redeem_points <= user.loyalty_points:
        redeem_value_cents = int(redeem_points / POINTS_PER_DOLLAR * 100)
        total_cents = max(total_cents - redeem_value_cents, 0)
        user.loyalty_points -= redeem_points
        db.session.add(LoyaltyLedger(
            user_id = user.id,
            order_id = order.id,
            type="redeem",
            points= -redeem_points,
            amount_cents = redeem_value_cents,
            meta={"reason":"group_order_credit"}
        ))

    coupon_code = data.get("coupon_code")
    if coupon_code:
        coupon = Coupon.query.filter_by(code=coupon_code,user_id=user.id,used=False).first()

        if not coupon or not coupon.is_valid():
            return jsonify({
                "error":"Invalid or expired coupon code"
            }), 400
        
        if coupon.type == "percent_off":
            discount_cents = int(total_cents * (coupon.value / 100))
            total_cents = max(total_cents - discount_cents, 0)
        elif coupon.type == "flat":
            discount_cents = int(coupon.value * 100)
            total_cents = max(total_cents - discount_cents , 0)
        else:
            discount_cents = 0
        
        coupon.used = True
        db.session.add(coupon)

        db.session.add(LoyaltyLedger(
            user_id=user.id,
            type="redeem",
            points=0,
            amount_cents = discount_cents,
            meta= {"reason":"coupon_used","coupon_code":coupon_code}
        ))

    earned_points = calculate_points(
        total_cents,
        pool_size,
        restaurant.reward_multiplier,
        user=user
    )

    user.loyalty_points += earned_points
    db.session.add(LoyaltyLedger(
        user_id = user.id,
        order_id = order.id,
        type="earn",
        points=earned_points,
        amount_cents=total_cents,
        meta = {
            "restaurant":restaurant.name,
            "group_size":pool_size
        }
    ))

    db.session.commit()


    group.total_cents += total_cents
    db.session.add(group)
    db.session.commit()
    evaluate_group_goal(group)


    return jsonify({
        "message":"Group order placed successfully",
        "order":order.to_dict(),
        "earned_points":earned_points,
        "redeemed_points":redeem_points,
        "new_balance":user.loyalty_points,
        "pool_size":pool_size
    }), 201


# Delete a user's order in a group
@bp.route("/groups/<int:group_id>/orders", methods=["DELETE"])
@jwt_required()
def delete_order(group_id):
    claims = get_jwt()
    username = claims.get("username")

    order = GroupOrder.query.filter_by(group_id=group_id, username=username).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404

    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Order deleted successfully"}), 200


# Place an immediate solo order
@bp.route("/groups/<int:group_id>/orders/immediate", methods=["POST"])
@jwt_required()
def place_immediate_order(group_id):
    claims = get_jwt()
    username = claims.get("username")
    user_id = get_jwt_identity()
    data = request.json  # { items: [...] }

    # Check if user is a member
    member = GroupMember.query.filter_by(group_id=group_id, username=username).first()
    if not member:
        return jsonify({"error": "Not a member of this group"}), 403
    
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404

    restaurant = Restaurant.query.get(group.restaurant_id) if group.restaurant_id else None
    multiplier = restaurant.reward_multiplier if restaurant and restaurant.reward_multiplier else 1.0

    # Immediate orders ignore next_order_time
    order = GroupOrder.query.filter_by(group_id=group_id, username=username).first()
    if not order:
        order = GroupOrder(group_id=group_id, username=username)
        db.session.add(order)
        db.session.flush()  # To get order.id

    # Clear previous items
    GroupOrderItem.query.filter_by(order_id=order.id).delete()

    # Add new items
    total_price, total_cents = 0, 0
    inner = data.get("items")

    # If nested structure like {'items': {...}}, unpack it
    if isinstance(inner, dict) and "items" in inner:
        data = inner

    items = data.get("items", [])


    for item in items:
        print(item)
        quantity = item.get("quantity", 1)
        menu_item = MenuItem.query.get(item["menuItemId"])
        if not menu_item:
            return jsonify({
                "error":f"Menu item with ID {item['menuItemId']} not found"
            }) , 404
        
        total_cents += int(menu_item.price * 100 * quantity)
        total_price += menu_item.price * quantity
        db.session.add(
            GroupOrderItem(
                order_id=order.id,
                menu_item_id=item["menuItemId"],
                quantity=item.get("quantity", 1),
                special_instructions=item.get("specialInstructions"),
            )
        )

    user = User.query.get(user_id)

    coupon_code = data.get("coupon_code")
    if coupon_code:
        coupon = Coupon.query.filter_by(code=coupon_code,user_id=user.id,used=False).first()

        if not coupon or not coupon.is_valid():
            return jsonify({
                "error":"Invalid or expired coupon code"
            }), 400
        
        if coupon.type == "percent_off":
            discount_cents = int(total_cents * (coupon.value / 100))
            total_cents = max(total_cents - discount_cents, 0)
        elif coupon.type == "flat":
            discount_cents = int(coupon.value * 100)
            total_cents = max(total_cents - discount_cents , 0)
        else:
            discount_cents = 0
        
        coupon.used = True
        db.session.add(coupon)

        db.session.add(LoyaltyLedger(
            user_id=user.id,
            type="redeem",
            points=0,
            amount_cents = discount_cents,
            meta= {"reason":"coupon_used","coupon_code":coupon_code}
        ))
    
    redeem_points = int(data.get("redeemPoints", 0))
    if redeem_points and redeem_points <= user.loyalty_points:
        redeem_value_cents = int(redeem_points / 100 * 100)
        total_cents = max(total_cents - redeem_value_cents, 0)
        user.loyalty_points -= redeem_points
        db.session.add(
            LoyaltyLedger(
                user_id = user.id,
                order_id = order.id,
                type="redeem",
                points= -redeem_points,
                amount_cents = redeem_value_cents,
                meta={"reason":"order_credit"}
            )
        )

    earned = calculate_points(
        total_price,
        pool_size=1, 
        multiplier=restaurant.reward_multiplier,
        user=user
    )

    user.loyalty_points += earned

    db.session.add(LoyaltyLedger(
        user_id=user.id,
        order_id=order.id,
        type="earn",
        points=earned,
        amount_cents=total_cents,
        meta={"restaurant":restaurant.name if restaurant else None}
    ))

    db.session.commit()


    group.total_cents += total_cents
    db.session.add(group)
    db.session.commit()
    evaluate_group_goal(group)


    return jsonify({
        "message":"Order placed successfully",
        "order": order.to_dict(),
        "earned_points": earned,
        "redeemed_points":redeem_points,
        "new_balance": user.loyalty_points
    }) , 201
