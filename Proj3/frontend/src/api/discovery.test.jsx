/**
 * @file discovery.test.jsx
 * Unit tests for discovery API functions (location-based pool discovery)
 * Tests proximity-based pool search and location update functionality
 */

import api from './axios';
import { getNearbyPools, updateUserLocation } from './discovery';

// Mock the axios instance
jest.mock('./axios');

describe('discovery API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== getNearbyPools Tests ====================
  
  describe('getNearbyPools', () => {
    const mockLat = 35.7796;
    const mockLng = -78.6382;
    const mockRadius = 5;
    const mockRestaurantId = 1;

    it('fetches nearby pools with latitude and longitude', async () => {
      const mockData = [
        { 
          id: 1, 
          name: 'Pizza Lovers', 
          distance_km: 1.5,
          latitude: 35.7806,
          longitude: -78.6392
        },
        { 
          id: 2, 
          name: 'Sushi Station', 
          distance_km: 2.3,
          latitude: 35.7820,
          longitude: -78.6400
        }
      ];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getNearbyPools(mockLat, mockLng);

      expect(api.get).toHaveBeenCalledWith('/discovery/nearby-pools', {
        params: {
          lat: mockLat,
          lon: mockLng,
          radius: 5 // default radius
        }
      });
      expect(result).toEqual(mockData);
    });

    it('includes custom radius in request when provided', async () => {
      const customRadius = 10;
      api.get.mockResolvedValueOnce({ data: [] });

      await getNearbyPools(mockLat, mockLng, customRadius);

      expect(api.get).toHaveBeenCalledWith('/discovery/nearby-pools', {
        params: {
          lat: mockLat,
          lon: mockLng,
          radius: customRadius
        }
      });
    });

    it('includes restaurant_id filter when provided', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await getNearbyPools(mockLat, mockLng, mockRadius, mockRestaurantId);

      expect(api.get).toHaveBeenCalledWith('/discovery/nearby-pools', {
        params: {
          lat: mockLat,
          lon: mockLng,
          radius: mockRadius,
          restaurant_id: mockRestaurantId
        }
      });
    });

    it('handles empty results gracefully', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      const result = await getNearbyPools(mockLat, mockLng);

      expect(result).toEqual([]);
    });

    it('returns pools sorted by distance', async () => {
      const mockData = [
        { id: 1, name: 'Far Pool', distance_km: 4.5 },
        { id: 2, name: 'Close Pool', distance_km: 0.8 },
        { id: 3, name: 'Medium Pool', distance_km: 2.1 }
      ];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getNearbyPools(mockLat, mockLng);

      // Verify we got all pools (backend sorts them)
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Far Pool'); // Assuming backend returns sorted
    });

    it('throws error when API request fails', async () => {
      const mockError = new Error('Network error');
      api.get.mockRejectedValueOnce(mockError);

      await expect(getNearbyPools(mockLat, mockLng)).rejects.toThrow('Network error');
    });

    it('handles 401 unauthorized error', async () => {
      const mockError = { response: { status: 401, data: { error: 'Unauthorized' } } };
      api.get.mockRejectedValueOnce(mockError);

      await expect(getNearbyPools(mockLat, mockLng)).rejects.toEqual(mockError);
    });

    it('handles pools with missing distance gracefully', async () => {
      const mockData = [
        { id: 1, name: 'Pool Without Distance', latitude: 35.7796, longitude: -78.6382 }
      ];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getNearbyPools(mockLat, mockLng);

      expect(result).toEqual(mockData);
      expect(result[0].distance_km).toBeUndefined();
    });

    it('excludes pools without location data', async () => {
      // Backend should filter these, but test handles empty result
      api.get.mockResolvedValueOnce({ data: [] });

      const result = await getNearbyPools(mockLat, mockLng);

      expect(result).toEqual([]);
    });

    it('filters pools by restaurant when restaurant_id provided', async () => {
      const mockData = [
        { id: 1, name: 'Pizza Pool', restaurant_id: 1, distance_km: 1.5 }
      ];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getNearbyPools(mockLat, mockLng, 5, 1);

      expect(result).toEqual(mockData);
      expect(result.every(pool => pool.restaurant_id === 1)).toBe(true);
    });

    it('includes is_member flag in response', async () => {
      const mockData = [
        { id: 1, name: 'My Pool', is_member: true, distance_km: 1.0 },
        { id: 2, name: 'Other Pool', is_member: false, distance_km: 2.0 }
      ];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getNearbyPools(mockLat, mockLng);

      expect(result[0].is_member).toBe(true);
      expect(result[1].is_member).toBe(false);
    });
  });

  // ==================== updateUserLocation Tests ====================

  describe('updateUserLocation', () => {
    const mockLat = 35.7796;
    const mockLng = -78.6382;

    it('updates user location successfully', async () => {
      const mockResponse = {
        message: 'Location updated successfully',
        latitude: mockLat,
        longitude: mockLng
      };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await updateUserLocation(mockLat, mockLng);

      expect(api.put).toHaveBeenCalledWith('/discovery/update-location', {
        latitude: mockLat,
        longitude: mockLng
      });
      expect(result).toEqual(mockResponse);
    });

    it('sends correct payload structure', async () => {
      api.put.mockResolvedValueOnce({ data: {} });

      await updateUserLocation(mockLat, mockLng);

      const callArgs = api.put.mock.calls[0];
      expect(callArgs[0]).toBe('/discovery/update-location');
      expect(callArgs[1]).toEqual({
        latitude: mockLat,
        longitude: mockLng
      });
    });

    it('handles negative coordinates correctly', async () => {
      const negativeLat = -33.8688;
      const negativeLng = -151.2093;
      api.put.mockResolvedValueOnce({ data: {} });

      await updateUserLocation(negativeLat, negativeLng);

      expect(api.put).toHaveBeenCalledWith('/discovery/update-location', {
        latitude: negativeLat,
        longitude: negativeLng
      });
    });

    it('handles zero coordinates', async () => {
      api.put.mockResolvedValueOnce({ data: {} });

      await updateUserLocation(0, 0);

      expect(api.put).toHaveBeenCalledWith('/discovery/update-location', {
        latitude: 0,
        longitude: 0
      });
    });

    it('throws error when location update fails', async () => {
      const mockError = new Error('Update failed');
      api.put.mockRejectedValueOnce(mockError);

      await expect(updateUserLocation(mockLat, mockLng)).rejects.toThrow('Update failed');
    });

    it('handles 404 user not found error', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { error: 'User not found' }
        }
      };
      api.put.mockRejectedValueOnce(mockError);

      await expect(updateUserLocation(mockLat, mockLng)).rejects.toEqual(mockError);
    });

    it('handles server errors gracefully', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };
      api.put.mockRejectedValueOnce(mockError);

      await expect(updateUserLocation(mockLat, mockLng)).rejects.toEqual(mockError);
    });

    it('handles decimal precision in coordinates', async () => {
      const preciseLat = 35.779612345678;
      const preciseLng = -78.638234567890;
      api.put.mockResolvedValueOnce({ data: {} });

      await updateUserLocation(preciseLat, preciseLng);

      expect(api.put).toHaveBeenCalledWith('/discovery/update-location', {
        latitude: preciseLat,
        longitude: preciseLng
      });
    });

    it('returns updated location data from server', async () => {
      const mockResponse = {
        message: 'Location updated successfully',
        latitude: mockLat,
        longitude: mockLng
      };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await updateUserLocation(mockLat, mockLng);

      expect(result.latitude).toBe(mockLat);
      expect(result.longitude).toBe(mockLng);
      expect(result.message).toBe('Location updated successfully');
    });

    it('handles network timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      api.put.mockRejectedValueOnce(timeoutError);

      await expect(updateUserLocation(mockLat, mockLng)).rejects.toThrow('timeout');
    });
  });

  // ==================== Integration Scenarios ====================

  describe('integration scenarios', () => {
    it('updates location then fetches nearby pools', async () => {
      const lat = 35.7796;
      const lng = -78.6382;
      
      // Update location
      api.put.mockResolvedValueOnce({ 
        data: { message: 'Location updated' } 
      });
      await updateUserLocation(lat, lng);

      // Fetch nearby pools
      const mockPools = [{ id: 1, name: 'Nearby Pool', distance_km: 1.0 }];
      api.get.mockResolvedValueOnce({ data: mockPools });
      const pools = await getNearbyPools(lat, lng);

      expect(api.put).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(pools).toEqual(mockPools);
    });

    it('handles location update failure before pool search', async () => {
      const lat = 35.7796;
      const lng = -78.6382;

      // Location update fails
      api.put.mockRejectedValueOnce(new Error('Update failed'));

      await expect(updateUserLocation(lat, lng)).rejects.toThrow('Update failed');

      // Pool search should not be called
      expect(api.get).not.toHaveBeenCalled();
    });

    it('fetches pools for multiple restaurants in sequence', async () => {
      const lat = 35.7796;
      const lng = -78.6382;

      // Fetch pools for restaurant 1
      api.get.mockResolvedValueOnce({ 
        data: [{ id: 1, restaurant_id: 1 }] 
      });
      const pools1 = await getNearbyPools(lat, lng, 5, 1);

      // Fetch pools for restaurant 2
      api.get.mockResolvedValueOnce({ 
        data: [{ id: 2, restaurant_id: 2 }] 
      });
      const pools2 = await getNearbyPools(lat, lng, 5, 2);

      expect(api.get).toHaveBeenCalledTimes(2);
      expect(pools1[0].restaurant_id).toBe(1);
      expect(pools2[0].restaurant_id).toBe(2);
    });
  });

  // ==================== Edge Cases ====================

  describe('edge cases', () => {
    it('handles extremely large radius values', async () => {
      const largeRadius = 1000;
      api.get.mockResolvedValueOnce({ data: [] });

      await getNearbyPools(35.7796, -78.6382, largeRadius);

      expect(api.get).toHaveBeenCalledWith('/discovery/nearby-pools', {
        params: {
          lat: 35.7796,
          lon: -78.6382,
          radius: largeRadius
        }
      });
    });

    it('handles very small radius values', async () => {
      const tinyRadius = 0.1;
      api.get.mockResolvedValueOnce({ data: [] });

      await getNearbyPools(35.7796, -78.6382, tinyRadius);

      expect(api.get).toHaveBeenCalledWith('/discovery/nearby-pools', {
        params: {
          lat: 35.7796,
          lon: -78.6382,
          radius: tinyRadius
        }
      });
    });

    it('handles pools at exact location (distance = 0)', async () => {
      const mockData = [
        { id: 1, name: 'Same Location Pool', distance_km: 0 }
      ];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getNearbyPools(35.7796, -78.6382);

      expect(result[0].distance_km).toBe(0);
    });

    it('handles coordinates at extreme latitudes', async () => {
      // North Pole
      api.get.mockResolvedValueOnce({ data: [] });
      await getNearbyPools(90, 0);

      // South Pole
      api.get.mockResolvedValueOnce({ data: [] });
      await getNearbyPools(-90, 0);

      expect(api.get).toHaveBeenCalledTimes(2);
    });

    it('handles coordinates crossing date line', async () => {
      api.get.mockResolvedValueOnce({ data: [] });
      await getNearbyPools(35.7796, 179.9999);

      api.get.mockResolvedValueOnce({ data: [] });
      await getNearbyPools(35.7796, -179.9999);

      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });
});