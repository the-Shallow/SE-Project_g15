import api from './axios';
import {
  getGroupOrders,
  placeGroupOrder,
  deleteGroupOrder,
  placeImmediateOrder,
  getPastOrders
} from './orders';

// Mock the axios instance
jest.mock('./axios');

describe('orders API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGroupOrders', () => {
    it('fetches group orders successfully', async () => {
      const mockData = [{ id: 1, items: ['Pizza'] }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getGroupOrders(5);
      expect(api.get).toHaveBeenCalledWith('/groups/5/orders');
      expect(result).toEqual(mockData);
    });

    it('handles fetch error gracefully', async () => {
      api.get.mockRejectedValueOnce(new Error('Network Error'));
      await expect(getGroupOrders(5)).rejects.toThrow('Network Error');
    });
  });

  describe('placeGroupOrder', () => {
    it('posts order data successfully', async () => {
      const mockResponse = { success: true };
      const orderData = { items: ['Burger'], nextOrderTime: '2025-11-06T20:00:00Z' };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await placeGroupOrder(3, orderData);
      expect(api.post).toHaveBeenCalledWith('/groups/3/orders', orderData);
      expect(result).toEqual(mockResponse);
    });

    it('throws error when post fails', async () => {
      api.post.mockRejectedValueOnce(new Error('Server error'));
      await expect(placeGroupOrder(3, { items: [] })).rejects.toThrow('Server error');
    });
  });

  describe('deleteGroupOrder', () => {
    it('deletes order successfully', async () => {
      api.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteGroupOrder(8);
      expect(api.delete).toHaveBeenCalledWith('/groups/8/orders');
      expect(result).toEqual({ success: true });
    });
  });

  describe('placeImmediateOrder', () => {
    it('places immediate order with correct payload', async () => {
      const items = ['Sushi', 'Ramen'];
      const mockResponse = { id: 123, items };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await placeImmediateOrder(9, items);
      expect(api.post).toHaveBeenCalledWith('/groups/9/orders/immediate', { items });
      expect(result).toEqual({ data: mockResponse });
    });
  });

  describe('getPastOrders', () => {
    it('fetches past orders', async () => {
      const mockData = [{ id: 11, date: '2025-11-05', items: ['Tacos'] }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await getPastOrders();
      expect(api.get).toHaveBeenCalledWith('/profile/orders');
      expect(result).toEqual(mockData);
    });
  });
});
