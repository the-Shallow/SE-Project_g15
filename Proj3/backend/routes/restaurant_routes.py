from flask import Blueprint, jsonify
from models import Restaurant, MenuItem

bp = Blueprint("restaurants", __name__, url_prefix="/restaurants")

# GET all restaurants
@bp.route("", methods=["GET"])
def get_restaurants():
    restaurants = Restaurant.query.all()
    return jsonify([r.to_dict() for r in restaurants]), 200


# GET single restaurant by ID
@bp.route("/<int:restaurant_id>", methods=["GET"])
def get_restaurant(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    return jsonify(restaurant.to_dict()), 200


# GET menu for a restaurant
@bp.route("/<int:restaurant_id>/menu", methods=["GET"])
def get_restaurant_menu(restaurant_id):
    items = MenuItem.query.filter_by(restaurant_id=restaurant_id).all()
    return jsonify([i.to_dict() for i in items]), 200
