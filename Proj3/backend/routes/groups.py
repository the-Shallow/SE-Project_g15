from flask import request, jsonify
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt
from extensions import db
from models import Group, GroupMember
from . import bp
from .orders import parse_iso_utc
from datetime import timezone


# Get all groups
@bp.route("/groups", methods=["GET"])
def get_all_groups():
    try:
        groups = Group.query.all()
        return jsonify([g.to_dict() for g in groups]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Get user's groups - NOW WITH JWT
@bp.route("/groups/my-groups", methods=["GET"])
@jwt_required()
def get_user_groups():
    try:
        claims = get_jwt()
        username = claims.get("username")  # Get username from JWT token

        member_records = GroupMember.query.filter_by(username=username).all()
        group_ids = [m.group_id for m in member_records]
        groups = Group.query.filter(Group.id.in_(group_ids)).all()
        return jsonify([g.to_dict() for g in groups]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Get specific group
@bp.route("/groups/<int:group_id>", methods=["GET"])
@jwt_required()
def get_group_detail(group_id):
    try:
        group = Group.query.get_or_404(group_id)
        return jsonify(group.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 404


# Create group - NOW WITH JWT
@bp.route("/groups", methods=["POST"])
@jwt_required()
def create_group():
    try:
        claims = get_jwt()
        username = claims.get("username")  # Get organizer from JWT token

        data = request.json
        new_group = Group(
            name=data["name"],
            organizer=username,  # Use authenticated user
            restaurant_id=data["restaurant_id"],
            delivery_type=data["deliveryType"],
            delivery_location=data["deliveryLocation"],
            next_order_time=parse_iso_utc(data["nextOrderTime"]),
            max_members=data.get("maxMembers", 10),
        )
        db.session.add(new_group)
        db.session.flush()

        member = GroupMember(group_id=new_group.id, username=username)
        db.session.add(member)
        db.session.commit()

        return jsonify(new_group.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


# Update group
@bp.route("/groups/<int:group_id>", methods=["PUT"])
@jwt_required()
def update_group(group_id):
    try:
        claims = get_jwt()
        username = claims.get("username")

        group = Group.query.get_or_404(group_id)

        # Only organizer can update
        if group.organizer != username:
            return jsonify({"error": "Only organizer can update group"}), 403

        data = request.json

        if "name" in data:
            group.name = data["name"]
        if "restaurant_id" in data:
            group.restaurant_id = data["restaurant_id"]
        if "deliveryLocation" in data:
            group.delivery_location = data["deliveryLocation"]
        if "nextOrderTime" in data:
            group.next_order_time = parse_iso_utc(data["nextOrderTime"])
        if "maxMembers" in data:
            group.max_members = data["maxMembers"]

        group.updated_at = datetime.utcnow().replace(tzinfo=timezone.utc)
        db.session.commit()

        return jsonify(group.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


# Join group - NOW WITH JWT
@bp.route("/groups/<int:group_id>/join", methods=["POST"])
@jwt_required()
def join_group(group_id):
    try:
        claims = get_jwt()
        username = claims.get("username")  # Get username from JWT

        group = Group.query.get_or_404(group_id)

        existing = GroupMember.query.filter_by(
            group_id=group_id, username=username
        ).first()
        if existing:
            return jsonify({"error": "Already a member"}), 400

        current_members = GroupMember.query.filter_by(group_id=group_id).count()
        if current_members >= group.max_members:
            return jsonify({"error": "Group is full"}), 400

        member = GroupMember(group_id=group_id, username=username)
        db.session.add(member)
        db.session.commit()

        return jsonify(group.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


# Leave group - NOW WITH JWT
@bp.route("/groups/<int:group_id>/leave", methods=["POST"])
@jwt_required()
def leave_group(group_id):
    try:
        claims = get_jwt()
        username = claims.get("username")  # Get username from JWT

        group = Group.query.get_or_404(group_id)

        # Prevent organizer from leaving
        if group.organizer == username:
            return (
                jsonify(
                    {"error": "Organizer cannot leave group. Delete the group instead."}
                ),
                400,
            )

        member = GroupMember.query.filter_by(
            group_id=group_id, username=username
        ).first()
        if not member:
            return jsonify({"error": "Not a member"}), 404

        db.session.delete(member)
        db.session.commit()

        return jsonify({"message": "Left group successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
