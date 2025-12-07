from extensions import db
from datetime import datetime


class LoyaltyLedger(db.Model):
    __tablename__ = "loyalty_ledger"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey("group_orders.id"),nullable=True)
    type = db.Column(db.String(20), nullable=False)
    points = db.Column(db.Integer,nullable=False)
    amount_cents = db.Column(db.Integer, default=0)
    meta = db.Column(db.JSON, default={})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User",backref="ledger_entries")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "order_id": self.order_id,
            "type": self.type,
            "points": self.points,
            "amount_cents": self.amount_cents,
            "meta": self.meta,
            "created_at": self.created_at.isoformat()
        }