from datetime import datetime, timezone
from extensions import db


class Group(db.Model):
    __tablename__ = "groups"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    organizer = db.Column(db.String(100), nullable=False)
    # restaurant_id = db.Column(db.Integer, nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey("restaurants.id"))
    delivery_type = db.Column(db.String(50), nullable=False)
    delivery_location = db.Column(db.String(200), nullable=False)
    max_members = db.Column(db.Integer, default=10)
    next_order_time = db.Column(db.DateTime(timezone=True), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    members = db.relationship(
        "GroupMember", backref="group", lazy=True, cascade="all, delete-orphan"
    )
    polls = db.relationship(
        "Poll", backref="group", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "organizer": self.organizer,
            "restaurant_id": self.restaurant_id,
            "deliveryType": self.delivery_type,
            "deliveryLocation": self.delivery_location,
            "maxMembers": self.max_members,
            "members": [m.username for m in self.members],
            "nextOrderTime": (
                self.next_order_time.isoformat() if self.next_order_time else None
            ),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class GroupMember(db.Model):
    __tablename__ = "group_members"

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("group_id", "username", name="unique_group_member"),
    )
