import api from './axios';

/**
 * Fetch all orders for a specific group.
 * @param {string} groupId - The ID of the group.
 * @returns {Promise<Object[]>} - List of orders in the group.
 */
export const getGroupOrders = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/orders`);
  return response.data;
};

/**
 * Add or update an order for the current user in a specific group.
 * @param {string} groupId - The ID of the group.
 * @param {Object} orderData - Order details including items and nextOrderTime.
 * @returns {Promise<Object>} - Response from the server.
 */
export const placeGroupOrder = async (groupId, orderData) => {
  // orderData: { items: [...], nextOrderTime: 'ISO string' }
  console.log('Placing group order with data:', orderData);
  const response = await api.post(`/groups/${groupId}/orders`, orderData);
  return response.data;
};

/**
 * Delete the current user's order in a specific group.
 * @param {string} groupId - The ID of the group.
 * @returns {Promise<Object>} - Response from the server.
 */
export const deleteGroupOrder = async (groupId) => {
  const response = await api.delete(`/groups/${groupId}/orders`);
  return response.data;
};

/**
 * Place an immediate order for a specific group.
 * @param {string} groupId - The ID of the group.
 * @param {Array} items - Items to order immediately.
 * @returns {Promise<Object>} - Response from the server.
 */
export const placeImmediateOrder = async (groupId, items) => {
  return api.post(`/groups/${groupId}/orders/immediate`, { items });
};

/**
 * Fetch all past orders of the current user.
 * @returns {Promise<Object[]>} - List of past orders for the user.
 */
export const getPastOrders = async () => {
  const response = await api.get('/profile/orders');
  return response.data;
};
