// Import the custom axios instance that delivery.js actually uses
import api from './axios';

// Import the delivery API functions using named imports
import {
  predictETA,
  predictETAWithRushHour,
  clusterLocations,
  healthCheck,
  findMyCluster
} from './delivery';

// Mock the custom axios instance (./axios), not the 'axios' package
jest.mock('./axios');

describe('Delivery API Utility Functions', () => {
  // Mock the localStorage to provide an auth token (if needed by axios interceptor)
  beforeAll(() => {
    global.localStorage = {
      getItem: jest.fn(() => 'test-auth-token'),
    };
  });

  // Clear mock history before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Test Case Group 1: predictETA ---
  describe('predictETA', () => {
    it('should successfully post with correct parameters and return data', async () => {
      const mockResponse = { data: { eta_minutes: 25 } };
      api.post.mockResolvedValue(mockResponse);

      const distance = 10;
      const stops = 2;
      const traffic = 1.5;

      const result = await predictETA(distance, stops, traffic);

      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith(
        '/delivery/predict-eta',
        {
          distance_km: distance,
          num_stops: stops,
          traffic_factor: traffic,
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors and throw the error', async () => {
      const mockError = new Error('404 Not Found');
      api.post.mockRejectedValue(mockError);

      await expect(predictETA(10)).rejects.toThrow(mockError);
    });
  });

  // --- Test Case Group 2: predictETAWithRushHour ---
  describe('predictETAWithRushHour', () => {
    it('should successfully post to rush-hour endpoint and return data', async () => {
      const mockResponse = { data: { eta_minutes: 40, rush_hour_applied: true } };
      api.post.mockResolvedValue(mockResponse);

      const distance = 15;
      const stops = 3;

      const result = await predictETAWithRushHour(distance, stops);

      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith(
        '/delivery/predict-eta-rush-hour',
        {
          distance_km: distance,
          num_stops: stops,
        }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  // --- Test Case Group 3: clusterLocations ---
  describe('clusterLocations', () => {
    it('should successfully post with location parameters', async () => {
      const mockResponse = { data: [{ cluster_id: 1, count: 5 }] };
      api.post.mockResolvedValue(mockResponse);

      const locations = [{ lat: 34, lon: -80 }];
      const maxDistance = 5;
      const minCluster = 3;

      const result = await clusterLocations(locations, maxDistance, minCluster);

      expect(api.post).toHaveBeenCalledWith(
        '/delivery/cluster-locations',
        {
          locations: locations,
          max_distance_km: maxDistance,
          min_cluster_size: minCluster,
        }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  // --- Test Case Group 4: findMyCluster ---
  describe('findMyCluster', () => {
    it('should post group and location data correctly', async () => {
      const mockResponse = { data: { cluster_id: 2 } };
      api.post.mockResolvedValue(mockResponse);

      const groupId = 42;
      const allLocations = [{ lat: 34, lon: -80 }];

      const result = await findMyCluster(groupId, allLocations);

      expect(api.post).toHaveBeenCalledWith(
        '/delivery/find-my-cluster',
        {
          group_id: groupId,
          all_locations: allLocations,
        }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  // --- Test Case Group 5: healthCheck (GET Request) ---
  describe('healthCheck', () => {
    it('should successfully make a GET request and return service status', async () => {
      const mockResponse = { data: { status: 'Service Up' } };
      api.get.mockResolvedValue(mockResponse);

      const result = await healthCheck();

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith(
        '/delivery/health'
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw an error on health check failure', async () => {
      const mockError = new Error('500 Internal Server Error');
      api.get.mockRejectedValue(mockError);

      await expect(healthCheck()).rejects.toThrow(mockError);
    });
  });
});