from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, LoyaltyLedger, Coupon
from extensions import db
import random, string
from datetime import datetime, timedelta

bp = Blueprint("rewards",__name__)

def generate_code(prefix="COUP"):
    return f"{prefix}-" + "".join(random.choices(string.ascii_uppercase + string.digits,k = 6))

@bp.route("/quote", methods=["POST"])
@jwt_required()
def quote_points_redemption():
    data = request.get_json()  or {}
    points_to_use = int(data.get("points_to_use",0))
    order_subtotal_cents = int(data.get("order_subtotal_cents",0))

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({
            "error":"User not found"
        }) , 404
    
    POINTS_PER_DOLLAR = 100
    MIN_REDEEM_POINTS = 200

    if points_to_use < MIN_REDEEM_POINTS:
        return jsonify({
            "accepted":False,
            "message":f"Minimum points to redeem is {MIN_REDEEM_POINTS}"
        }) , 400
    
    if points_to_use > user.loyalty_points:
        return jsonify({
            "accepted":False,
            "message":"Not enough loyalty points"
        }) , 400
    
    max_redeemable_cents = order_subtotal_cents
    credit_cents = min(points_to_use, max_redeemable_cents // POINTS_PER_DOLLAR * POINTS_PER_DOLLAR) // 100

    final_payable_cents = max(order_subtotal_cents - (points_to_use // POINTS_PER_DOLLAR)*100, 0)

    return jsonify({
        "accepted":True,
        "requested_points": points_to_use,
        "credit_value_cents":(points_to_use // POINTS_PER_DOLLAR) * 100,
        "final_payable_cents":final_payable_cents,
        "user_balance_after": user.loyalty_points - points_to_use,
        "min_points": MIN_REDEEM_POINTS,
        "conversion_rate":"100 points = $1"
    }), 200


@bp.route("/redeem", methods=["POST"])
@jwt_required()
def redeem_points():
    data = request.get_json() or {}
    points_to_use = int(data.get("points_to_use", 0))
    order_id = data.get("order_id")
    reason = data.get("reason","manual")

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({
            "error":"User not found"
        }), 404
    
    POINTS_PER_DOLLAR = 100
    MIN_REDEEM_POINTS = 200
    
    if points_to_use < MIN_REDEEM_POINTS:
        return jsonify({
            "error": f"Minimum points to redeem is {MIN_REDEEM_POINTS}"
        }) , 400
    
    if points_to_use > user.loyalty_points:
        return jsonify({
            "error":"Not enough loyalty points"
        }) , 400
    
    credit_cents = int(points_to_use / POINTS_PER_DOLLAR * 100)

    try:
        user.loyalty_points -= points_to_use

        ledger = LoyaltyLedger(
            user_id=user_id,
            order_id=order_id,
            type="redeem",
            points=-points_to_use,
            amount_cents=credit_cents,
            meta={"reason":reason}
        )

        db.session.add(ledger)
        db.session.commit()

        return jsonify({
            "success":True,
            "redeemed_points":points_to_use,
            "credit_value_cents":credit_cents,
            "new_balance": user.loyalty_points,
            "ledger_entry": ledger.to_dict()
        }) , 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error":str(e)
        }), 500
    

@bp.route("/redeem-coupon", methods=["POST"])
@jwt_required()
def redeem_coupon():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json() or {}
    ctype = data.get("type")
    restaurant_id = data.get("restaurant_id")

    if not ctype:
        return jsonify({
            "error":"Missing coupon type"
        }), 400

    catalog = {
        "percent_off": {"cost":500,"value":20, "days":7},
        "flat":{"cost":400,"value":4,"days":7}
    }

    if ctype not in catalog:
        return jsonify({
            "error":"Invalid coupon type"
        }), 400
    
    if user.loyalty_points < catalog[ctype]["cost"]:
        return jsonify({
            "error":"Not enough loyalty points"
        }), 400
    
    cost = catalog[ctype]["cost"]
    user.loyalty_points -= cost

    coupon = Coupon(
        code = generate_code("DISC" if ctype=="percent_off" else "VCHR"),
        user_id = user.id,
        restaurant_id = restaurant_id,
        type= ctype,
        value = catalog[ctype]["value"],
        expires_at = datetime.utcnow() + timedelta(days = catalog[ctype]["days"])
    )

    db.session.add(coupon)

    db.session.add(LoyaltyLedger(
        user_id = user.id,
        type="redeem",
        points=-cost,
        amount_cents=0,
        meta={"reason":"coupon_redeemption", "coupon_code":coupon.code}
    ))
    db.session.commit()

    return jsonify({
        "message":"Coupon redeemed successfully",
        "coupon":coupon.to_dict(),
        "remaining_points":user.loyalty_points
    }), 201


@bp.route("/summary", methods=["GET"])
@jwt_required()
def get_summary():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    coupons = Coupon.query.filter_by(user_id=user_id,used=False).all()
    ledger = (LoyaltyLedger.query
              .filter_by(user_id=user_id)
              .order_by(LoyaltyLedger.created_at.desc())).limit(20).all()
    
    return jsonify({
        "points":user.loyalty_points,
        "tier": user.tier or "Bronze",
        "streak": user.streak_count or 0,
        "coupons": [c.to_dict() for c in coupons],
        "ledger": [l.to_dict() for l in ledger]
    })