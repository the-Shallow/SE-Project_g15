# routes/_init_.py
from flask import Blueprint

bp = Blueprint('api', __name__, url_prefix='/api')

from . import health, groups, polls, auth_routes, profile, orders, delivery

# Register the auth blueprint with the main API blueprint
bp.register_blueprint(auth_routes.auth_bp, url_prefix='/auth')
bp.register_blueprint(profile.profile_bp, url_prefix='/profile')
bp.register_blueprint(delivery.delivery_bp, url_prefix='/delivery')
# bp.register_blueprint(orders.orders_bp, url_prefix='/orders')

_all_ = ['bp']
