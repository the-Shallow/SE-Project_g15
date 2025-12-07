"""
Delivery Routes
API endpoints for AI-powered delivery optimization
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from ai_optimization.eta_predictor import ETAPredictor
from ai_optimization.clustering import DemandClusterer

delivery_bp = Blueprint('delivery', __name__)

# Initialize ETA predictor (reuse across requests)
eta_predictor = ETAPredictor()
demand_clusterer = DemandClusterer()

@delivery_bp.route('/predict-eta', methods=['POST'])
@jwt_required()
def predict_eta():
    """
    Predict delivery ETA
    
    Request body:
    {
        "distance_km": 5.0,
        "num_stops": 1,
        "traffic_factor": 1.0  (optional)
    }
    
    Returns:
    {
        "eta": "2025-11-27T15:30:00",
        "total_minutes": 35,
        "breakdown": {...},
        "confidence": "high",
        "traffic_status": "normal"
    }
    """
    try:
        data = request.json
        
        # Validate inputs
        distance_km = float(data.get('distance_km', 5.0))
        num_stops = int(data.get('num_stops', 1))
        traffic_factor = float(data.get('traffic_factor', 1.0))
        
        # Input validation
        if distance_km <= 0:
            return jsonify({'error': 'Distance must be positive'}), 400
        if num_stops < 1:
            return jsonify({'error': 'Must have at least 1 stop'}), 400
        if traffic_factor < 0.5 or traffic_factor > 3.0:
            return jsonify({'error': 'Traffic factor must be between 0.5 and 3.0'}), 400
        
        # Predict ETA
        eta_info = eta_predictor.predict_eta(distance_km, num_stops, traffic_factor)
        
        return jsonify(eta_info), 200
    
    except ValueError as e:
        return jsonify({'error': f'Invalid input: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@delivery_bp.route('/predict-eta-rush-hour', methods=['POST'])
@jwt_required()
def predict_eta_with_rush_hour():
    """
    Predict delivery ETA with automatic rush hour adjustment
    
    Request body:
    {
        "distance_km": 5.0,
        "num_stops": 1,
        "hour": 18  (optional, defaults to current hour)
    }
    """
    try:
        data = request.json
        
        distance_km = float(data.get('distance_km', 5.0))
        num_stops = int(data.get('num_stops', 1))
        hour = data.get('hour')
        
        # Get base ETA
        base_eta = eta_predictor.predict_eta(distance_km, num_stops, 1.0)
        
        # Adjust for time of day
        adjusted_eta = eta_predictor.adjust_for_time_of_day(base_eta, hour)
        
        return jsonify(adjusted_eta), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# CLUSTERING ENDPOINTS
@delivery_bp.route('/cluster-locations', methods=['POST'])
@jwt_required()
def cluster_locations():
    """
    Cluster delivery locations using DBSCAN machine learning
    
    Request body:
    {
        "locations": [
            {"lat": 35.7796, "lng": -78.6382, "group_id": 1, "group_name": "Pizza Lovers"},
            {"lat": 35.7806, "lng": -78.6392, "group_id": 2, "group_name": "Sushi Station"}
        ],
        "max_distance_km": 2.0,  // optional
        "min_cluster_size": 2    // optional
    }
    
    Returns:
    {
        "clusters": [...],
        "statistics": {...}
    }
    """
    try:
        data = request.json
        
        locations = data.get('locations', [])
        max_distance_km = float(data.get('max_distance_km', 2.0))
        min_cluster_size = int(data.get('min_cluster_size', 2))
        
        # Validate inputs
        if not locations:
            return jsonify({'error': 'No locations provided'}), 400
        
        if max_distance_km <= 0 or max_distance_km > 50:
            return jsonify({'error': 'Max distance must be between 0 and 50 km'}), 400
        
        if min_cluster_size < 2:
            return jsonify({'error': 'Min cluster size must be at least 2'}), 400
        
        # Validate location format
        for loc in locations:
            if 'lat' not in loc or 'lng' not in loc or 'group_id' not in loc:
                return jsonify({'error': 'Each location must have lat, lng, and group_id'}), 400
        
        # Create clusterer with custom parameters
        clusterer = DemandClusterer(
            max_distance_km=max_distance_km,
            min_cluster_size=min_cluster_size
        )
        
        # Perform clustering
        clusters = clusterer.cluster_deliveries(locations)
        statistics = clusterer.get_cluster_statistics(clusters)
        
        return jsonify({
            'clusters': clusters,
            'statistics': statistics,
            'parameters': {
                'max_distance_km': max_distance_km,
                'min_cluster_size': min_cluster_size
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@delivery_bp.route('/find-my-cluster', methods=['POST'])
@jwt_required()
def find_my_cluster():
    """
    Find which cluster a specific group belongs to
    
    Request body:
    {
        "group_id": 1,
        "all_locations": [...]
    }
    
    Returns cluster information for the specified group
    """
    try:
        data = request.json
        
        group_id = data.get('group_id')
        locations = data.get('all_locations', [])
        
        if not group_id:
            return jsonify({'error': 'group_id required'}), 400
        
        if not locations:
            return jsonify({'error': 'all_locations required'}), 400
        
        # Cluster all locations
        clusters = demand_clusterer.cluster_deliveries(locations)
        
        # Find the cluster containing this group
        my_cluster = None
        for cluster in clusters:
            for loc in cluster['groups']:
                if loc.get('group_id') == group_id:
                    my_cluster = cluster
                    break
            if my_cluster:
                break
        
        if not my_cluster:
            return jsonify({
                'in_cluster': False,
                'message': 'Group is not part of any cluster (isolated location)'
            }), 200
        
        return jsonify({
            'in_cluster': True,
            'cluster': my_cluster,
            'cluster_mates': [loc['group_name'] for loc in my_cluster['groups'] if loc.get('group_id') != group_id]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@delivery_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Delivery Optimization',
        'features': ['eta_prediction', 'demand_clustering']
    }), 200