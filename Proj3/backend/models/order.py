from datetime import datetime
from extensions import db


class GroupOrder(db.Model):
    __tablename__ = "group_orders"

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    items = db.relationship(
        "GroupOrderItem", backref="order", lazy=True, cascade="all, delete-orphan"
    )

    __table_args__ = (
        db.UniqueConstraint("group_id", "username", name="unique_group_order"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "groupId": self.group_id,
            "username": self.username,
            "items": [item.to_dict() for item in self.items],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class GroupOrderItem(db.Model):
    __tablename__ = "group_order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("group_orders.id"), nullable=False)
    menu_item_id = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, default=1)
    special_instructions = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "menuItemId": self.menu_item_id,
            "quantity": self.quantity,
            "specialInstructions": self.special_instructions,
        }
