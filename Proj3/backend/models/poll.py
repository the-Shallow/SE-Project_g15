from datetime import datetime
from extensions import db


class Poll(db.Model):
    __tablename__ = "polls"

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"), nullable=False)
    question = db.Column(db.String(200), nullable=False)
    created_by = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    options = db.relationship(
        "PollOption", backref="poll", lazy=True, cascade="all, delete-orphan"
    )
    votes = db.relationship(
        "PollVote", backref="poll", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "groupId": self.group_id,
            "question": self.question,
            "createdBy": self.created_by,
            "createdOn": self.created_at.isoformat() if self.created_at else None,
            "options": [opt.to_dict() for opt in self.options],
            "votedUsers": list(set([v.username for v in self.votes])),
        }


class PollOption(db.Model):
    __tablename__ = "poll_options"

    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey("polls.id"), nullable=False)
    text = db.Column(db.String(200), nullable=False)

    def to_dict(self):
        votes_count = PollVote.query.filter_by(
            poll_id=self.poll_id, option_id=self.id
        ).count()
        return {"id": self.id, "text": self.text, "votes": votes_count}


class PollVote(db.Model):
    __tablename__ = "poll_votes"

    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey("polls.id"), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey("poll_options.id"), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    voted_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("poll_id", "username", name="unique_poll_vote"),
    )
