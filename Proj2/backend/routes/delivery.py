"""
Delivery Routes
API endpoints for AI-powered delivery optimization
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from ai_optimization.eta_predictor import ETAPredictor

delivery_bp = Blueprint('delivery', __name__)

# Initialize ETA predictor (reuse across requests)
eta_predictor = ETAPredictor()


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


@delivery_bp.route('/predict-eta-with-rush-hour', methods=['POST'])
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


@delivery_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Delivery Optimization',
        'features': ['eta_prediction']
    }), 200