"""
ETA Predictor Module
Predicts delivery ETAs based on distance, stops, and traffic conditions
"""
from datetime import datetime, timedelta

class ETAPredictor:
    """Predicts delivery ETAs using distance and traffic factors"""
    
    def __init__(self):
        # Configuration constants
        self.base_speed_kmh = 25  # Average delivery speed in km/h
        self.prep_time_mins = 15   # Restaurant preparation time
        self.stop_time_mins = 3    # Time per delivery stop
    
    def predict_eta(self, distance_km, num_stops=1, traffic_factor=1.0):
        """
        Predict delivery ETA
        
        Args:
            distance_km (float): Total delivery distance in kilometers
            num_stops (int): Number of delivery stops
            traffic_factor (float): Traffic multiplier (1.0 = normal, >1.0 = slower)
        
        Returns:
            dict: ETA information including time, breakdown, and confidence
        """
        # Calculate travel time accounting for traffic
        travel_time_hours = (distance_km / self.base_speed_kmh) * traffic_factor
        travel_time_mins = travel_time_hours * 60
        
        # Calculate total time
        total_time_mins = (
            self.prep_time_mins + 
            travel_time_mins + 
            (num_stops * self.stop_time_mins)
        )
        
        # Calculate ETA timestamp
        eta_time = datetime.now() + timedelta(minutes=total_time_mins)
        
        return {
            'eta': eta_time.isoformat(),
            'total_minutes': int(total_time_mins),
            'breakdown': {
                'prep_time': self.prep_time_mins,
                'travel_time': int(travel_time_mins),
                'stop_time': num_stops * self.stop_time_mins
            },
            'confidence': 'high' if traffic_factor == 1.0 else 'medium',
            'traffic_status': self._get_traffic_status(traffic_factor)
        }
    
    def _get_traffic_status(self, traffic_factor):
        """Convert traffic factor to human-readable status"""
        if traffic_factor <= 1.0:
            return 'normal'
        elif traffic_factor <= 1.3:
            return 'moderate'
        else:
            return 'heavy'
    
    def adjust_for_time_of_day(self, base_eta, hour=None):
        """
        Adjust ETA based on time of day (rush hours)
        
        Args:
            base_eta (dict): Base ETA prediction
            hour (int): Hour of day (0-23), defaults to current hour
        
        Returns:
            dict: Adjusted ETA with time-of-day factor applied
        """
        if hour is None:
            hour = datetime.now().hour
        
        # Define rush hour multipliers
        if 7 <= hour <= 9 or 17 <= hour <= 19:
            # Morning/evening rush hour
            traffic_factor = 1.3
        elif 11 <= hour <= 13:
            # Lunch rush
            traffic_factor = 1.2
        else:
            # Normal hours
            traffic_factor = 1.0
        
        # Recalculate with traffic factor
        adjusted_travel = base_eta['breakdown']['travel_time'] * traffic_factor
        adjusted_total = (
            base_eta['breakdown']['prep_time'] + 
            adjusted_travel + 
            base_eta['breakdown']['stop_time']
        )
        
        adjusted_eta_time = datetime.now() + timedelta(minutes=adjusted_total)
        
        return {
            'eta': adjusted_eta_time.isoformat(),
            'total_minutes': int(adjusted_total),
            'breakdown': {
                'prep_time': base_eta['breakdown']['prep_time'],
                'travel_time': int(adjusted_travel),
                'stop_time': base_eta['breakdown']['stop_time']
            },
            'confidence': 'medium',
            'traffic_status': self._get_traffic_status(traffic_factor),
            'adjusted_for_rush_hour': traffic_factor > 1.0
        }