// src/api/delivery.js

import api from './axios';

/**
 * Predict delivery ETA
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} numStops - Number of delivery stops
 * @param {number} trafficFactor - Traffic multiplier (optional)
 * @returns {Promise} ETA prediction data
 */
export const predictETA = async (distanceKm, numStops = 1, trafficFactor = 1.0) => {
  const response = await api.post('/delivery/predict-eta', {
    distance_km: distanceKm,
    num_stops: numStops,
    traffic_factor: trafficFactor
  });
  return response.data;
};

/**
 * Predict ETA with automatic rush hour adjustment
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} numStops - Number of delivery stops
 * @returns {Promise} ETA prediction with rush hour adjustment
 */
export const predictETAWithRushHour = async (distanceKm, numStops = 1) => {
  const response = await api.post('/delivery/predict-eta-rush-hour', {
    distance_km: distanceKm,
    num_stops: numStops
  });
  return response.data;
};

/**
 * Cluster delivery locations using ML
 * @param {Array} locations - Array of {lat, lng, group_id, group_name}
 * @param {number} maxDistanceKm - Maximum distance between clustered points
 * @param {number} minClusterSize - Minimum points to form a cluster
 * @returns {Promise} Clustered locations data
 */
export const clusterLocations = async (locations, maxDistanceKm = 2.0, minClusterSize = 2) => {
  const response = await api.post('/delivery/cluster-locations', {
    locations: locations,
    max_distance_km: maxDistanceKm,
    min_cluster_size: minClusterSize
  });
  return response.data;
};

/**
 * Find which cluster a specific group belongs to
 * @param {number} groupId - The group to find
 * @param {Array} allLocations - All available locations
 * @returns {Promise} Cluster information for the group
 */
export const findMyCluster = async (groupId, allLocations) => {
  const response = await api.post('/delivery/find-my-cluster', {
    group_id: groupId,
    all_locations: allLocations
  });
  return response.data;
};

/**
 * Health check for delivery service
 * @returns {Promise} Service health status
 */
export const healthCheck = async () => {
  const response = await api.get('/delivery/health');
  return response.data;
};