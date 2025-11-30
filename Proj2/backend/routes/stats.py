# routes/stats.py
from flask import Blueprint
from flask_jwt_extended import jwt_required
from controllers.stats_controller import get_user_stats, compute_leaderboard

stats_bp = Blueprint("stats", __name__, url_prefix="/api/stats")


@stats_bp.route("/me", methods=["GET"])
@jwt_required()
def stats_me():
    """
    Returns stats for the logged-in user:
      GET /api/stats/me
    """
    return get_user_stats()


@stats_bp.route("/leaderboard", methods=["GET"])
def stats_leaderboard():
    """
    Public leaderboard:
      GET /api/stats/leaderboard
    """
    return compute_leaderboard()
