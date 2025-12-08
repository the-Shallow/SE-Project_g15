from app import app
from extensions import db
from models.restaurant import Restaurant
from models.menu_item import MenuItem

def seed_restaurants():
    restaurants = [
        Restaurant(
            id=1,
            name="Pizza Palace",
            rating=4.5,
            location="Downtown",
            offers="20% off on orders above $30",
            image="🍕",
            reward_multiplier=1.5
        ),
        Restaurant(
            id=2,
            name="Burger Barn",
            rating=4.3,
            location="Midtown",
            offers="Free delivery on first order",
            image="🍔",
            reward_multiplier=1.0
        ),
        Restaurant(
            id=3,
            name="Sushi Station",
            rating=4.7,
            location="Uptown",
            offers="Buy 2 Get 1 Free on rolls",
            image="🍣",
            reward_multiplier=1.5
        ),
        Restaurant(
            id=4,
            name="Taco Town",
            rating=4.4,
            location="West Side",
            offers="Happy Hour: 3-6 PM",
            image="🌮",
            reward_multiplier=1.0
        )
    ]

    db.session.add_all(restaurants)
    db.session.commit()

    menu_items = [
        # Pizza Palace
        MenuItem(id=1, restaurant_id=1, name="Margherita Pizza", price=12.99, description="Classic tomato and mozzarella"),
        MenuItem(id=2, restaurant_id=1, name="Pepperoni Pizza", price=14.99, description="Loaded with pepperoni"),
        MenuItem(id=3, restaurant_id=1, name="Veggie Supreme", price=13.99, description="Fresh vegetables and cheese"),

        # Burger Barn
        MenuItem(id=4, restaurant_id=2, name="Classic Burger", price=9.99, description="Beef patty with lettuce and tomato"),
        MenuItem(id=5, restaurant_id=2, name="Cheese Burger", price=10.99, description="Double cheese goodness"),
        MenuItem(id=6, restaurant_id=2, name="Veggie Burger", price=8.99, description="Plant-based patty"),

        # Sushi Station
        MenuItem(id=7, restaurant_id=3, name="California Roll", price=11.99, description="Crab, avocado, cucumber"),
        MenuItem(id=8, restaurant_id=3, name="Spicy Tuna Roll", price=13.99, description="Fresh tuna with spicy mayo"),
        MenuItem(id=9, restaurant_id=3, name="Dragon Roll", price=15.99, description="Eel and avocado"),

        # Taco Town
        MenuItem(id=10, restaurant_id=4, name="Beef Tacos", price=8.99, description="Three seasoned beef tacos"),
        MenuItem(id=11, restaurant_id=4, name="Chicken Tacos", price=8.99, description="Grilled chicken tacos"),
        MenuItem(id=12, restaurant_id=4, name="Fish Tacos", price=9.99, description="Crispy fish tacos"),
    ]

    db.session.add_all(menu_items)
    db.session.commit()

    print("✔ Restaurants + Menu Items Seeded Successfully!")


if __name__ == "__main__":
    with app.app_context():
        seed_restaurants()
