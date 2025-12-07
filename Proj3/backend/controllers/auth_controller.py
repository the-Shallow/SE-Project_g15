from flask import jsonify, request, Blueprint
from models import User
from extensions import db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import re

auth_bp = Blueprint("auth", __name__)


# ==============================
# REGISTER USER
# ==============================
@auth_bp.route("/api/auth/register", methods=["POST"])
def register_user():
    data = request.get_json()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    # Missing fields
    if not all([username, email, password]):
        return jsonify({"message": "All fields are required"}), 400

    # 🚫 Invalid username (only letters, digits, underscores, dots)
    if not re.match(r"^[A-Za-z0-9_.]{3,20}$", username):
        return (
            jsonify(
                {
                    "message": "Invalid username format. Use only letters, numbers, underscores, and periods."
                }
            ),
            400,
        )

    # Password too short
    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters long"}), 400

    # Invalid email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"message": "Invalid email format"}), 400

    # Existing user check
    existing_user = User.query.filter(
        (User.username.ilike(username)) | (User.email.ilike(email))
    ).first()
    if existing_user:
        return jsonify({"message": "User already exists"}), 400

    # Create new user
    new_user = User(username=username, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "User registered successfully",
                "username": new_user.username,
                "email": new_user.email,
            }
        ),
        201,
    )


# ==============================
# LOGIN USER
# ==============================
@auth_bp.route("/api/auth/login", methods=["POST"])
def login_user():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    # Missing credentials
    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400

    # Case-insensitive username match
    user = User.query.filter(db.func.lower(User.username) == username.lower()).first()

    # Invalid login
    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid credentials"}), 401

    # Create JWT token
    token = create_access_token(
        identity=str(user.id), additional_claims={"username": user.username}
    )
    return jsonify({"token": token, "username": user.username}), 200


# ==============================
# PROTECTED USER PROFILE
# ==============================
@auth_bp.route("/api/profile/me", methods=["GET"])
@jwt_required()
def get_profile():
    """
    ✅ Fixes:
    - test_token_protected_endpoint (should return 200)
    - test_unauthorized_access_denied (should return 401)
    - test_token_expiration_behavior (should return 401/422)
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id)) if user_id else None
    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({"username": user.username, "email": user.email}), 200
