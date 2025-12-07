from extensions import db, bcrypt
from datetime import datetime
# db = SQLAlchemy()
# bcrypt = Bcrypt()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

    # Profile fields
    full_name = db.Column(db.String(150), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)

    # Address fields
    street = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    pincode = db.Column(db.String(20), nullable=True)
    loyalty_points = db.Column(db.Integer, default=0)

    tier = db.Column(db.String(20), default="Bronze")
    streak_count = db.Column(db.Integer,default=0)
    last_order_date = db.Column(db.DateTime)
    
    # Location fields for proximity discovery
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    location_updated_at = db.Column(db.DateTime, nullable=True)

    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password, password)

    def update_streak(self):
        now = datetime.utcnow().date()
        if not self.last_order_date:
            self.streak_count = 1
        else:
            delta = (now - self.last_order_date.date()).days
            if delta == 1:
                self.streak_count += 1
            elif delta > 1:
                self.streak_count = 1
        self.last_order_date = datetime.utcnow()

    def  tier_multiplier(self):
        tiers = {
            "Bronze":1.00,
            "Silver":1.10,
            "Gold":1.20
        }
        return tiers.get(self.tier,1.00)
