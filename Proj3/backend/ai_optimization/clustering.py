"""
Demand Clustering Module
Uses DBSCAN machine learning algorithm to cluster nearby delivery locations
"""
from sklearn.cluster import DBSCAN
import numpy as np
from geopy.distance import geodesic

class DemandClusterer:
    """
    Clusters nearby delivery locations using DBSCAN (Density-Based Spatial Clustering)
    This is a real machine learning algorithm that finds dense regions in space
    """
    
    def __init__(self, max_distance_km=2.0, min_cluster_size=2):
        """
        Initialize the clusterer
        
        Args:
            max_distance_km (float): Maximum distance between points in a cluster
            min_cluster_size (int): Minimum number of points to form a cluster
        """
        self.max_distance_km = max_distance_km
        self.min_cluster_size = min_cluster_size
        
        # Convert km to approximate degrees (rough conversion: 1 degree ≈ 111 km)
        self.epsilon_degrees = max_distance_km / 111.0
    
    def cluster_deliveries(self, locations):
        """
        Cluster delivery locations using DBSCAN machine learning algorithm
        
        Args:
            locations (list): List of dicts with 'lat', 'lng', 'group_id', 'group_name'
                Example: [
                    {'lat': 35.7796, 'lng': -78.6382, 'group_id': 1, 'group_name': 'Pizza Lovers'},
                    {'lat': 35.7806, 'lng': -78.6392, 'group_id': 2, 'group_name': 'Sushi Station'}
                ]
        
        Returns:
            list: Clusters with grouped locations and metadata
                Example: [
                    {
                        'cluster_id': 0,
                        'groups': [location1, location2],
                        'center': {'lat': 35.7801, 'lng': -78.6387},
                        'size': 2,
                        'radius_km': 0.5
                    }
                ]
        """
        if not locations:
            return []
        
        if len(locations) == 1:
            # Single location is its own cluster
            return [{
                'cluster_id': 0,
                'groups': locations,
                'center': {'lat': locations[0]['lat'], 'lng': locations[0]['lng']},
                'size': 1,
                'radius_km': 0
            }]
        
        # Extract coordinates for DBSCAN
        coords = np.array([[loc['lat'], loc['lng']] for loc in locations])
        
        # Apply DBSCAN machine learning clustering
        # eps: maximum distance between two samples for them to be in same cluster
        # min_samples: minimum number of samples in a cluster
        clustering = DBSCAN(
            eps=self.epsilon_degrees,
            min_samples=self.min_cluster_size,
            metric='euclidean'
        ).fit(coords)
        
        # Group locations by cluster label
        clusters_dict = {}
        for idx, label in enumerate(clustering.labels_):
            if label not in clusters_dict:
                clusters_dict[label] = []
            clusters_dict[label].append(locations[idx])
        
        # Build result with cluster metadata
        result = []
        for label, group_locs in clusters_dict.items():
            # Calculate cluster center (centroid)
            center_lat = np.mean([loc['lat'] for loc in group_locs])
            center_lng = np.mean([loc['lng'] for loc in group_locs])
            
            # Calculate cluster radius (max distance from center)
            radius_km = self._calculate_cluster_radius(
                (center_lat, center_lng),
                group_locs
            )
            
            cluster_info = {
                'cluster_id': int(label),
                'groups': group_locs,
                'center': {
                    'lat': float(center_lat),
                    'lng': float(center_lng)
                },
                'size': len(group_locs),
                'radius_km': round(radius_km, 2),
                'is_noise': label == -1  # DBSCAN marks outliers as -1
            }
            
            result.append(cluster_info)
        
        return result
    
    def _calculate_cluster_radius(self, center, locations):
        """
        Calculate the radius of a cluster (max distance from center to any point)
        
        Args:
            center (tuple): (lat, lng) of cluster center
            locations (list): List of location dicts
        
        Returns:
            float: Radius in kilometers
        """
        if not locations:
            return 0
        
        max_distance = 0
        for loc in locations:
            distance = geodesic(center, (loc['lat'], loc['lng'])).kilometers
            max_distance = max(max_distance, distance)
        
        return max_distance
    
    def get_cluster_statistics(self, clusters):
        """
        Get statistics about the clustering results
        
        Args:
            clusters (list): Output from cluster_deliveries()
        
        Returns:
            dict: Statistics about clusters
        """
        if not clusters:
            return {
                'total_clusters': 0,
                'total_locations': 0,
                'avg_cluster_size': 0,
                'largest_cluster_size': 0,
                'noise_points': 0
            }
        
        total_locations = sum(c['size'] for c in clusters)
        noise_points = sum(c['size'] for c in clusters if c['is_noise'])
        valid_clusters = [c for c in clusters if not c['is_noise']]
        
        return {
            'total_clusters': len(valid_clusters),
            'total_locations': total_locations,
            'avg_cluster_size': round(np.mean([c['size'] for c in valid_clusters]), 1) if valid_clusters else 0,
            'largest_cluster_size': max([c['size'] for c in valid_clusters], default=0),
            'noise_points': noise_points,
            'clustered_percentage': round((total_locations - noise_points) / total_locations * 100, 1) if total_locations > 0 else 0
        }