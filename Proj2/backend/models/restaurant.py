from extensions import db

class Restaurant(db.Model):
    __tablename__ = "restaurants"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    rating = db.Column(db.Float, default=0)
    location = db.Column(db.String(255))
    offers = db.Column(db.String(255))
    image = db.Column(db.String(10))
    reward_multiplier = db.Column(db.Float, default=1.0)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "rating": self.rating,
            "location": self.location,
            "offers": self.offers,
            "image": self.image,
            "reward_multiplier": self.reward_multiplier
        }
