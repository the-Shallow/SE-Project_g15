from flask import jsonify
from . import bp


@bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "Server is running"}), 200
