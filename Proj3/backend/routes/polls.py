from flask import request, jsonify
from extensions import db
from models import Poll, PollOption, PollVote
from . import bp


# Get group polls
@bp.route("/groups/<int:group_id>/polls", methods=["GET"])
def get_group_polls(group_id):
    try:
        polls = Poll.query.filter_by(group_id=group_id).all()
        return jsonify([p.to_dict() for p in polls]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Create poll
@bp.route("/groups/<int:group_id>/polls", methods=["POST"])
def create_poll(group_id):
    try:
        data = request.json
        new_poll = Poll(
            group_id=group_id, question=data["question"], created_by=data["createdBy"]
        )
        db.session.add(new_poll)
        db.session.flush()

        for opt_text in data["options"]:
            option = PollOption(poll_id=new_poll.id, text=opt_text)
            db.session.add(option)

        db.session.commit()
        return jsonify(new_poll.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


# Vote on poll
@bp.route("/polls/<int:poll_id>/vote", methods=["POST"])
def vote_on_poll(poll_id):
    try:
        data = request.json
        username = data["username"]
        option_id = data["option_id"]

        existing_vote = PollVote.query.filter_by(
            poll_id=poll_id, username=username
        ).first()
        if existing_vote:
            db.session.delete(existing_vote)

        vote = PollVote(poll_id=poll_id, option_id=option_id, username=username)
        db.session.add(vote)
        db.session.commit()

        poll = Poll.query.get(poll_id)
        return jsonify(poll.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
