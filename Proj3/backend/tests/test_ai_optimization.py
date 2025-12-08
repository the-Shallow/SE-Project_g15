"""
AI Optimization Test Suite
---------------------------
Comprehensive tests for:
✅ ETAPredictor (delivery time estimation)
✅ DemandClusterer (DBSCAN clustering)
✅ Real-world scenarios
"""

import pytest
from datetime import datetime, timedelta
from ai_optimization.eta_predictor import ETAPredictor
from ai_optimization.clustering import DemandClusterer


# ==================== FIXTURES ====================

@pytest.fixture
def eta_predictor():
    """Fixture providing ETAPredictor instance"""
    return ETAPredictor()


@pytest.fixture
def demand_clusterer():
    """Fixture providing DemandClusterer instance"""
    return DemandClusterer(max_distance_km=2.0, min_cluster_size=2)


@pytest.fixture
def sample_locations():
    """Sample delivery locations for testing"""
    return [
        {'lat': 35.7796, 'lng': -78.6382, 'group_id': 1, 'group_name': 'Pizza Lovers'},
        {'lat': 35.7806, 'lng': -78.6392, 'group_id': 2, 'group_name': 'Sushi Station'},
        {'lat': 35.7801, 'lng': -78.6387, 'group_id': 3, 'group_name': 'Burger Fans'}
    ]


# ==================== ETA PREDICTOR TESTS ====================

def test_eta_basic_prediction(eta_predictor):
    """1️⃣ Should predict basic ETA correctly"""
    result = eta_predictor.predict_eta(distance_km=5.0, num_stops=1)
    
    assert 'eta' in result
    assert 'total_minutes' in result
    assert 'breakdown' in result
    assert result['confidence'] == 'high'
    assert result['traffic_status'] == 'normal'


def test_eta_breakdown_components(eta_predictor):
    """2️⃣ Should include all time components in breakdown"""
    result = eta_predictor.predict_eta(distance_km=10.0, num_stops=2)
    
    assert 'prep_time' in result['breakdown']
    assert 'travel_time' in result['breakdown']
    assert 'stop_time' in result['breakdown']
    
    # Verify calculations
    assert result['breakdown']['prep_time'] == 15
    assert result['breakdown']['stop_time'] == 6  # 2 stops * 3 mins


def test_eta_traffic_factor_normal(eta_predictor):
    """3️⃣ Should handle normal traffic (1.0 factor)"""
    result = eta_predictor.predict_eta(distance_km=5.0, num_stops=1, traffic_factor=1.0)
    
    assert result['traffic_status'] == 'normal'
    assert result['confidence'] == 'high'


def test_eta_traffic_factor_moderate(eta_predictor):
    """4️⃣ Should handle moderate traffic (1.0-1.3 factor)"""
    result = eta_predictor.predict_eta(distance_km=5.0, num_stops=1, traffic_factor=1.2)
    
    assert result['traffic_status'] == 'moderate'
    assert result['confidence'] == 'medium'


def test_eta_traffic_factor_heavy(eta_predictor):
    """5️⃣ Should handle heavy traffic (>1.3 factor)"""
    result = eta_predictor.predict_eta(distance_km=5.0, num_stops=1, traffic_factor=2.0)
    
    assert result['traffic_status'] == 'heavy'
    assert result['confidence'] == 'medium'


def test_eta_multiple_stops(eta_predictor):
    """6️⃣ Should calculate time for multiple delivery stops"""
    result = eta_predictor.predict_eta(distance_km=10.0, num_stops=5)
    
    # 5 stops * 3 mins = 15 mins
    assert result['breakdown']['stop_time'] == 15


def test_eta_long_distance(eta_predictor):
    """7️⃣ Should handle long distance deliveries"""
    result = eta_predictor.predict_eta(distance_km=50.0, num_stops=1)
    
    # 50km at 25 km/h = 2 hours = 120 mins travel time
    assert result['breakdown']['travel_time'] >= 100


def test_eta_short_distance(eta_predictor):
    """8️⃣ Should handle short distance deliveries"""
    result = eta_predictor.predict_eta(distance_km=1.0, num_stops=1)
    
    # 1km at 25 km/h = 0.04 hours = 2.4 mins
    assert result['breakdown']['travel_time'] <= 5


def test_eta_rush_hour_morning(eta_predictor):
    """9️⃣ Should adjust for morning rush hour (7-9 AM)"""
    base_eta = eta_predictor.predict_eta(distance_km=5.0, num_stops=1)
    adjusted = eta_predictor.adjust_for_time_of_day(base_eta, hour=8)
    
    assert adjusted['traffic_status'] in ['moderate', 'heavy']
    assert adjusted['adjusted_for_rush_hour'] == True
    assert adjusted['total_minutes'] > base_eta['total_minutes']


def test_eta_rush_hour_evening(eta_predictor):
    """🔟 Should adjust for evening rush hour (5-7 PM)"""
    base_eta = eta_predictor.predict_eta(distance_km=5.0, num_stops=1)
    adjusted = eta_predictor.adjust_for_time_of_day(base_eta, hour=18)
    
    assert adjusted['adjusted_for_rush_hour'] == True
    assert adjusted['total_minutes'] > base_eta['total_minutes']


def test_eta_lunch_rush(eta_predictor):
    """1️⃣1️⃣ Should adjust for lunch rush (11 AM - 1 PM)"""
    base_eta = eta_predictor.predict_eta(distance_km=5.0, num_stops=1)
    adjusted = eta_predictor.adjust_for_time_of_day(base_eta, hour=12)
    
    assert adjusted['adjusted_for_rush_hour'] == True


def test_eta_off_peak_hours(eta_predictor):
    """1️⃣2️⃣ Should not adjust for off-peak hours"""
    base_eta = eta_predictor.predict_eta(distance_km=5.0, num_stops=1)
    adjusted = eta_predictor.adjust_for_time_of_day(base_eta, hour=15)
    
    assert adjusted['adjusted_for_rush_hour'] == False


def test_eta_default_hour_current_time(eta_predictor):
    """1️⃣3️⃣ Should use current hour if not specified"""
    base_eta = eta_predictor.predict_eta(distance_km=5.0, num_stops=1)
    adjusted = eta_predictor.adjust_for_time_of_day(base_eta)
    
    assert 'eta' in adjusted
    assert 'adjusted_for_rush_hour' in adjusted


def test_eta_zero_distance_edge_case(eta_predictor):
    """1️⃣4️⃣ Should handle zero distance (pickup only)"""
    result = eta_predictor.predict_eta(distance_km=0.0, num_stops=1)
    
    # Should only have prep time + stop time
    assert result['breakdown']['travel_time'] == 0
    assert result['total_minutes'] == 18  # 15 prep + 3 stop


def test_eta_single_stop_minimum(eta_predictor):
    """1️⃣5️⃣ Should handle minimum of 1 stop"""
    result = eta_predictor.predict_eta(distance_km=5.0, num_stops=1)
    
    assert result['breakdown']['stop_time'] >= 3


# ==================== DEMAND CLUSTERER TESTS ====================

def test_cluster_empty_locations(demand_clusterer):
    """1️⃣6️⃣ Should handle empty location list"""
    result = demand_clusterer.cluster_deliveries([])
    
    assert result == []


def test_cluster_single_location(demand_clusterer):
    """1️⃣7️⃣ Should create single cluster for one location"""
    locations = [
        {'lat': 35.7796, 'lng': -78.6382, 'group_id': 1, 'group_name': 'Solo Group'}
    ]
    
    result = demand_clusterer.cluster_deliveries(locations)
    
    assert len(result) == 1
    assert result[0]['size'] == 1
    assert result[0]['radius_km'] == 0


def test_cluster_basic_clustering(demand_clusterer, sample_locations):
    """1️⃣8️⃣ Should cluster nearby locations correctly"""
    result = demand_clusterer.cluster_deliveries(sample_locations)
    
    assert len(result) > 0
    assert all('cluster_id' in c for c in result)
    assert all('groups' in c for c in result)
    assert all('center' in c for c in result)


def test_cluster_center_calculation(demand_clusterer, sample_locations):
    """1️⃣9️⃣ Should calculate cluster center (centroid)"""
    result = demand_clusterer.cluster_deliveries(sample_locations)
    
    for cluster in result:
        assert 'lat' in cluster['center']
        assert 'lng' in cluster['center']
        assert isinstance(cluster['center']['lat'], float)
        assert isinstance(cluster['center']['lng'], float)


def test_cluster_size_tracking(demand_clusterer, sample_locations):
    """2️⃣0️⃣ Should track cluster size correctly"""
    result = demand_clusterer.cluster_deliveries(sample_locations)
    
    total_groups = sum(c['size'] for c in result)
    assert total_groups == len(sample_locations)


def test_cluster_radius_calculation(demand_clusterer):
    """2️⃣1️⃣ Should calculate cluster radius"""
    locations = [
        {'lat': 35.7796, 'lng': -78.6382, 'group_id': 1, 'group_name': 'Group 1'},
        {'lat': 35.7800, 'lng': -78.6385, 'group_id': 2, 'group_name': 'Group 2'}
    ]
    
    result = demand_clusterer.cluster_deliveries(locations)
    
    for cluster in result:
        assert 'radius_km' in cluster
        assert cluster['radius_km'] >= 0


def test_cluster_custom_max_distance():
    """2️⃣2️⃣ Should respect custom max distance parameter"""
    clusterer = DemandClusterer(max_distance_km=5.0, min_cluster_size=2)
    
    assert clusterer.max_distance_km == 5.0
    assert abs(clusterer.epsilon_degrees - 5.0 / 111.0) < 0.001


def test_cluster_custom_min_size():
    """2️⃣3️⃣ Should respect custom minimum cluster size"""
    clusterer = DemandClusterer(max_distance_km=2.0, min_cluster_size=3)
    
    assert clusterer.min_cluster_size == 3


def test_cluster_statistics_empty():
    """2️⃣4️⃣ Should return zero statistics for empty clusters"""
    clusterer = DemandClusterer()
    stats = clusterer.get_cluster_statistics([])
    
    assert stats['total_clusters'] == 0
    assert stats['total_locations'] == 0
    assert stats['avg_cluster_size'] == 0
    assert stats['largest_cluster_size'] == 0
    assert stats['noise_points'] == 0


def test_cluster_statistics_basic(demand_clusterer, sample_locations):
    """2️⃣5️⃣ Should calculate statistics correctly"""
    clusters = demand_clusterer.cluster_deliveries(sample_locations)
    stats = demand_clusterer.get_cluster_statistics(clusters)
    
    assert 'total_clusters' in stats
    assert 'total_locations' in stats
    assert 'avg_cluster_size' in stats
    assert 'largest_cluster_size' in stats
    assert stats['total_locations'] == len(sample_locations)


def test_cluster_statistics_percentage(demand_clusterer, sample_locations):
    """2️⃣6️⃣ Should calculate clustered percentage"""
    clusters = demand_clusterer.cluster_deliveries(sample_locations)
    stats = demand_clusterer.get_cluster_statistics(clusters)
    
    assert 'clustered_percentage' in stats
    assert 0 <= stats['clustered_percentage'] <= 100


def test_cluster_noise_detection(demand_clusterer):
    """2️⃣7️⃣ Should detect noise points (outliers)"""
    # Locations far apart
    locations = [
        {'lat': 35.7796, 'lng': -78.6382, 'group_id': 1, 'group_name': 'Group 1'},
        {'lat': 36.0000, 'lng': -79.0000, 'group_id': 2, 'group_name': 'Far Group'}
    ]
    
    result = demand_clusterer.cluster_deliveries(locations)
    
    # Should have is_noise field
    assert all('is_noise' in c for c in result)


def test_cluster_multiple_groups():
    """2️⃣8️⃣ Should handle many locations efficiently"""
    clusterer = DemandClusterer(max_distance_km=3.0, min_cluster_size=2)
    
    # Create 10 locations
    locations = []
    for i in range(10):
        locations.append({
            'lat': 35.77 + (i * 0.001),
            'lng': -78.63 + (i * 0.001),
            'group_id': i,
            'group_name': f'Group {i}'
        })
    
    result = clusterer.cluster_deliveries(locations)
    
    assert len(result) > 0
    total_groups = sum(c['size'] for c in result)
    assert total_groups == 10


def test_cluster_wide_area_distribution():
    """2️⃣9️⃣ Should handle wide geographic distribution"""
    clusterer = DemandClusterer(max_distance_km=1.0, min_cluster_size=2)
    
    # Locations spread across a wide area
    locations = [
        {'lat': 35.0, 'lng': -78.0, 'group_id': 1, 'group_name': 'North'},
        {'lat': 36.0, 'lng': -78.0, 'group_id': 2, 'group_name': 'South'},
        {'lat': 35.5, 'lng': -77.0, 'group_id': 3, 'group_name': 'East'},
        {'lat': 35.5, 'lng': -79.0, 'group_id': 4, 'group_name': 'West'}
    ]
    
    result = clusterer.cluster_deliveries(locations)
    
    # Should create multiple clusters or noise points
    assert len(result) >= 1


def test_cluster_identical_locations():
    """3️⃣0️⃣ Should handle identical locations (same address)"""
    clusterer = DemandClusterer(max_distance_km=2.0, min_cluster_size=2)
    
    # Three groups at same location
    locations = [
        {'lat': 35.7796, 'lng': -78.6382, 'group_id': 1, 'group_name': 'Group 1'},
        {'lat': 35.7796, 'lng': -78.6382, 'group_id': 2, 'group_name': 'Group 2'},
        {'lat': 35.7796, 'lng': -78.6382, 'group_id': 3, 'group_name': 'Group 3'}
    ]
    
    result = clusterer.cluster_deliveries(locations)
    
    # Should cluster all together
    assert len(result) >= 1


# ==================== INTEGRATION TESTS ====================

def test_integration_eta_with_clustering(eta_predictor, demand_clusterer):
    """3️⃣1️⃣ Integration: ETA calculation for clustered deliveries"""
    locations = [
        {'lat': 35.7796, 'lng': -78.6382, 'group_id': 1, 'group_name': 'Group 1'},
        {'lat': 35.7801, 'lng': -78.6387, 'group_id': 2, 'group_name': 'Group 2'},
        {'lat': 35.7806, 'lng': -78.6392, 'group_id': 3, 'group_name': 'Group 3'}
    ]
    
    clusters = demand_clusterer.cluster_deliveries(locations)
    
    # Calculate ETA for delivering to all groups in first cluster
    if clusters:
        num_groups = clusters[0]['size']
        eta = eta_predictor.predict_eta(
            distance_km=5.0,
            num_stops=num_groups
        )
        
        assert eta['breakdown']['stop_time'] == num_groups * 3
        assert eta['total_minutes'] > 0


def test_integration_stats_and_eta(eta_predictor, demand_clusterer, sample_locations):
    """3️⃣2️⃣ Integration: Statistics with ETA estimation"""
    clusters = demand_clusterer.cluster_deliveries(sample_locations)
    stats = demand_clusterer.get_cluster_statistics(clusters)
    
    # Use largest cluster for ETA calculation
    if stats['largest_cluster_size'] > 0:
        eta = eta_predictor.predict_eta(
            distance_km=10.0,
            num_stops=stats['largest_cluster_size']
        )
        
        assert eta['total_minutes'] > 0
        assert eta['breakdown']['stop_time'] == stats['largest_cluster_size'] * 3


def test_real_world_scenario_lunch_rush():
    """3️⃣3️⃣ Real-world: Lunch rush with clustered orders"""
    predictor = ETAPredictor()
    clusterer = DemandClusterer(max_distance_km=1.5, min_cluster_size=2)
    
    # Campus lunch scenario
    locations = [
        {'lat': 35.7796, 'lng': -78.6382, 'group_id': 1, 'group_name': 'Engineering'},
        {'lat': 35.7800, 'lng': -78.6385, 'group_id': 2, 'group_name': 'Library'},
        {'lat': 35.7798, 'lng': -78.6383, 'group_id': 3, 'group_name': 'Student Union'}
    ]
    
    clusters = clusterer.cluster_deliveries(locations)
    assert len(clusters) > 0
    
    # Calculate ETA with lunch rush adjustment
    base_eta = predictor.predict_eta(distance_km=3.0, num_stops=len(locations))
    rush_eta = predictor.adjust_for_time_of_day(base_eta, hour=12)
    
    assert rush_eta['total_minutes'] > base_eta['total_minutes']
    assert rush_eta['traffic_status'] in ['moderate', 'heavy']