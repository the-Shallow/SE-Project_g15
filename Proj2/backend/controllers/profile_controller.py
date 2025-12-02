import os
from flask import request, jsonify, current_app, url_for
from werkzeug.utils import secure_filename
from models.user import User
from extensions import db
from flask_jwt_extended import get_jwt
from models.order import GroupOrder
from models.group import Group

# Allowed file extensions for profile pictures
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_profile():
    """Fetch the logged-in user's profile with stats."""
    claims = get_jwt()
    username = claims.get("username")
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    # Calculate user statistics
    total_orders = GroupOrder.query.filter_by(username=username).count()
    
    # Count pooled orders (orders in groups with more than 1 member)
    pooled_orders = 0
    user_orders = GroupOrder.query.filter_by(username=username).all()
    
    for order in user_orders:
        group = Group.query.get(order.group_id)
        if group and len(group.members) > 1:
            pooled_orders += 1
    
    # Calculate score (50% total orders, 50% pooled orders)
    # Max score is 100
    # Assume 20 total orders = 50 points, 20 pooled orders = 50 points
    total_orders_score = min((total_orders / 20) * 50, 50)
    pooled_orders_score = min((pooled_orders / 20) * 50, 50)
    score = round(total_orders_score + pooled_orders_score)

    profile_picture_url = None
    if user.profile_picture:
        profile_picture_url = url_for(
            "uploaded_file",
            filename=os.path.basename(user.profile_picture),
            _external=True,
        )

    return (
        jsonify(
            {
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "phone": user.phone,
                "street": user.street,
                "city": user.city,
                "state": user.state,
                "pincode": user.pincode,
                "profile_picture": profile_picture_url,
                "stats": {
                    "total_orders": total_orders,
                    "pooled_orders": pooled_orders,
                    "score": score
                }
            }
        ),
        200,
    )


def update_profile():
    """Update the logged-in user's profile and optionally upload a profile picture."""
    claims = get_jwt()
    username = claims.get("username")
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"message": "User not found"}), 404

    # Handle file upload
    if "profile_picture" in request.files:
        file = request.files["profile_picture"]
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            upload_folder = current_app.config["UPLOAD_FOLDER"]
            os.makedirs(upload_folder, exist_ok=True)

            # Remove old profile picture if exists
            if user.profile_picture:
                old_path = os.path.join(
                    upload_folder, os.path.basename(user.profile_picture)
                )
                if os.path.exists(old_path):
                    os.remove(old_path)

            # Save new profile picture
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            user.profile_picture = f"uploads/profile_pictures/{filename}"

    # Update other profile fields from form data
    data = request.form
    for field in ["full_name", "phone", "street", "city", "state", "pincode"]:
        if field in data:
            setattr(user, field, data[field])

    db.session.commit()

    # Return updated profile with full URL
    profile_picture_url = None
    if user.profile_picture:
        profile_picture_url = url_for(
            "uploaded_file",
            filename=os.path.basename(user.profile_picture),
            _external=True,
        )

    return (
        jsonify(
            {
                "message": "Profile updated successfully",
                "profile_picture": profile_picture_url,
            }
        ),
        200,
    )


def get_past_orders():
    """Fetch past group orders for the logged-in user."""
    claims = get_jwt()
    username = claims.get("username")

    # Fetch all orders for this user
    orders = (
        GroupOrder.query.filter_by(username=username)
        .order_by(GroupOrder.created_at.desc())
        .all()
    )

    order_list = []
    for o in orders:
        group = Group.query.get(o.group_id)
        order_list.append(
            {
                "orderId": o.id,
                "groupName": group.name if group else "Unknown Group",
                "restaurantId": group.restaurant_id if group else None,
                "items": [item.to_dict() for item in o.items],
                "orderDate": o.created_at.isoformat() if o.created_at else None,
            }
        )

    return jsonify(order_list), 200