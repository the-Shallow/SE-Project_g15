from datetime import datetime
from extensions import db

class Coupon(db.Model):
    __tablename__ = "coupons"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(32), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey("restaurants.id"),nullable=True)
    type = db.Column(db.String(20), nullable=False)
    value = db.Column(db.Float, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def is_valid(self):
        return not self.used and datetime.utcnow() < self.expires_at
    
    def to_dict(self):
        return {
            "code":self.code,
            "type":self.type,
            "value":self.value,
            "restaurant_id":self.restaurant_id,
            "expires_at":self.expires_at.isoformat(),
            "used": self.used,
        }