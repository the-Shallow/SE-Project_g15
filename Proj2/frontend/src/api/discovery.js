import api from './axios';

/**
 * Get pools near user's location
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} radius - Search radius in km (default: 5)
 * @param {number} restaurantId - Optional restaurant filter
 * @returns {Promise<Array>} Array of nearby pools with distance
 */
export const getNearbyPools = async (latitude, longitude, radius = 5, restaurantId = null) => {
  const params = { 
    lat: latitude, 
    lon: longitude, 
    radius 
  };
  
  if (restaurantId) {
    params.restaurant_id = restaurantId;
  }
  
  const response = await api.get('/discovery/nearby-pools', { params });
  return response.data;
};

/**
 * Update user's current GPS location
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @returns {Promise<Object>} Success response
 */
export const updateUserLocation = async (latitude, longitude) => {
  const response = await api.put('/discovery/update-location', {
    latitude,
    longitude
  });
  return response.data;
};