"""
Discovery routes for proximity-based pool search
"""
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime, timezone
from extensions import db
from models import Group, GroupMember, User
from utils.distance import calculate_distance
from . import bp


@bp.route("/discovery/nearby-pools", methods=["GET"])
@jwt_required()
def get_nearby_pools():
    """
    Get pools near user's location
    Query params: lat, lon, radius (km), restaurant_id (optional)
    """
    try:
        claims = get_jwt()
        username = claims.get("username")
        
        # Get parameters
        lat = request.args.get('lat', type=float)
        lon = request.args.get('lon', type=float)
        radius = request.args.get('radius', type=float, default=5.0)
        restaurant_id = request.args.get('restaurant_id', type=int)
        
        if lat is None or lon is None:
            return jsonify({"error": "Latitude and longitude required"}), 400
        
        # Get all active groups
        query = Group.query.filter(
            Group.next_order_time > datetime.now(timezone.utc),
            Group.visibility == 'public'
        )
        
        if restaurant_id:
            query = query.filter(Group.restaurant_id == restaurant_id)
        
        groups = query.all()
        
        # Filter by distance and enrich with distance data
        nearby_pools = []
        for group in groups:
            # Skip if group doesn't have location
            if not group.latitude or not group.longitude:
                continue
            
            # Calculate distance
            distance = calculate_distance(lat, lon, group.latitude, group.longitude)
            
            # Only include if within radius
            if distance <= radius:
                pool_data = group.to_dict()
                pool_data['distance_km'] = distance
                
                # Check if user is already a member
                is_member = any(m.username == username for m in group.members)
                pool_data['is_member'] = is_member
                
                nearby_pools.append(pool_data)
        
        # Sort by distance (closest first)
        nearby_pools.sort(key=lambda x: x['distance_km'])
        
        return jsonify(nearby_pools), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/discovery/update-location", methods=["PUT"])
@jwt_required()
def update_user_location():
    """
    Update user's current GPS location
    Body: { latitude: float, longitude: float }
    """
    try:
        claims = get_jwt()
        username = claims.get("username")
        
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        data = request.json
        user.latitude = data.get('latitude')
        user.longitude = data.get('longitude')
        user.location_updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return jsonify({
            "message": "Location updated successfully",
            "latitude": user.latitude,
            "longitude": user.longitude
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500