import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const deliveryAPI = {
  /**
   * Predict delivery ETA
   * @param {number} distanceKm - Distance in kilometers
   * @param {number} numStops - Number of delivery stops
   * @param {number} trafficFactor - Traffic multiplier (optional)
   * @returns {Promise} ETA prediction data
   */
  predictETA: async (distanceKm, numStops = 1, trafficFactor = 1.0) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/delivery/predict-eta`,
        {
          distance_km: distanceKm,
          num_stops: numStops,
          traffic_factor: trafficFactor
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error predicting ETA:', error);
      throw error;
    }
  },

  /**
   * Predict ETA with automatic rush hour adjustment
   * @param {number} distanceKm - Distance in kilometers
   * @param {number} numStops - Number of delivery stops
   * @returns {Promise} ETA prediction with rush hour adjustment
   */
  predictETAWithRushHour: async (distanceKm, numStops = 1) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/delivery/predict-eta-with-rush-hour`,
        {
          distance_km: distanceKm,
          num_stops: numStops
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error predicting ETA with rush hour:', error);
      throw error;
    }
  },

  /**
   * Cluster delivery locations using ML
   * @param {Array} locations - Array of {lat, lng, group_id, group_name}
   * @param {number} maxDistanceKm - Maximum distance between clustered points
   * @param {number} minClusterSize - Minimum points to form a cluster
   */
  clusterLocations: async (locations, maxDistanceKm = 2.0, minClusterSize = 2) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/delivery/cluster-locations`,
        {
          locations: locations,
          max_distance_km: maxDistanceKm,
          min_cluster_size: minClusterSize
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error clustering locations:', error);
      throw error;
    }
  },

  /**
   * Find which cluster a specific group belongs to
   * @param {number} groupId - The group to find
   * @param {Array} allLocations - All available locations
   */
  findMyCluster: async (groupId, allLocations) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/delivery/find-my-cluster`,
        {
          group_id: groupId,
          all_locations: allLocations
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error finding cluster:', error);
      throw error;
    }
  },

  /**
   * Health check for delivery service
   * @returns {Promise} Service health status
   */
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_URL}/delivery/health`);
      return response.data;
    } catch (error) {
      console.error('Delivery service health check failed:', error);
      throw error;
    }
  }
};

export default deliveryAPI;