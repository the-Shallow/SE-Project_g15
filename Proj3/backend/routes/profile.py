from flask import Blueprint
from controllers.profile_controller import get_profile, update_profile, get_past_orders
from flask_jwt_extended import jwt_required

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")


# Old route (for frontend)
@profile_bp.route("", methods=["GET"])
@jwt_required()
def profile_get_legacy():
    return get_profile()


@profile_bp.route("", methods=["PUT"])
@jwt_required()
def profile_update_legacy():
    return update_profile()


# New route (for tests and future API consistency)
@profile_bp.route("/me", methods=["GET"])
@jwt_required()
def profile_get():
    return get_profile()


@profile_bp.route("/me", methods=["PUT"])
@jwt_required()
def profile_update():
    return update_profile()


@profile_bp.route("/orders", methods=["GET"])
@jwt_required()
def profile_orders():
    return get_past_orders()
