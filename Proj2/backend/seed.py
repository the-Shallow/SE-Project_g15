from app import create_app
from extensions import db
from models import Restaurant, MenuItem

RESTAURANTS = [
    {
        "name": "Pizza Palace",
        "rating": 4.5,
        "location": "Downtown",
        "offers": "20% off on orders above $30",
        "image": "🍕",
        "reward_multiplier": 1.5,
        "items": [
            {"name": "Margherita Pizza", "price": 12.99, "description": "Classic tomato and mozzarella"},
            {"name": "Pepperoni Pizza", "price": 14.99, "description": "Loaded with pepperoni"},
            {"name": "Veggie Supreme", "price": 13.99, "description": "Fresh vegetables and cheese"}
        ]
    },
    {
        "name": "Burger Barn",
        "rating": 4.3,
        "location": "Midtown",
        "offers": "Free delivery on first order",
        "image": "🍔",
        "reward_multiplier": 1.0,
        "items": [
            {"name": "Classic Burger", "price": 9.99, "description": "Beef patty with lettuce and tomato"},
            {"name": "Cheese Burger", "price": 10.99, "description": "Double cheese goodness"},
            {"name": "Veggie Burger", "price": 8.99, "description": "Plant-based patty"}
        ]
    },
    {
        "name": "Sushi Station",
        "rating": 4.7,
        "location": "Uptown",
        "offers": "Buy 2 Get 1 Free on rolls",
        "image": "🍣",
        "reward_multiplier": 1.5,
        "items": [
            {"name": "California Roll", "price": 11.99, "description": "Crab, avocado, cucumber"},
            {"name": "Spicy Tuna Roll", "price": 13.99, "description": "Fresh tuna with spicy mayo"},
            {"name": "Dragon Roll", "price": 15.99, "description": "Eel and avocado"}
        ]
    },
    {
        "name": "Taco Town",
        "rating": 4.4,
        "location": "West Side",
        "offers": "Happy Hour: 3–6 PM",
        "image": "🌮",
        "reward_multiplier": 1.0,
        "items": [
            {"name": "Beef Tacos", "price": 8.99, "description": "Three seasoned beef tacos"},
            {"name": "Chicken Tacos", "price": 8.99, "description": "Grilled chicken tacos"},
            {"name": "Fish Tacos", "price": 9.99, "description": "Crispy fish tacos"}
        ]
    }
]

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    for r in RESTAURANTS:
        rest = Restaurant(
            name=r["name"],
            rating=r["rating"],
            location=r["location"],
            offers=r["offers"],
            image=r["image"],
            reward_multiplier=r["reward_multiplier"]
        )
        db.session.add(rest)
        db.session.flush()

        for item in r["items"]:
            db.session.add(MenuItem(
                restaurant_id=rest.id,
                name=item["name"],
                price=item["price"],
                description=item["description"]
            ))

    db.session.commit()
    print("Restaurants & menu seeded.")
