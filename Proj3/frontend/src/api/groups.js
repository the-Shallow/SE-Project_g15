import api from './axios';

/**
 * Fetch all available groups.
 * Used on the "Find Groups" page to list all groups.
 * @returns {Promise<Array>} Array of group objects.
 */
export const getAllGroups = async () => {
  const response = await api.get('/groups');
  return response.data;
};

/**
 * Fetch groups that the current user is a member of.
 * @returns {Promise<Array>} Array of user's group objects.
 */
export const getUserGroups = async () => {
  const response = await api.get(`/groups/my-groups`);
  return response.data;
};

/**
 * Fetch details for a specific group.
 * @param {string} groupId - ID of the group.
 * @returns {Promise<Object>} Group details object.
 */
export const getGroupDetails = async (groupId) => {
  const response = await api.get(`/groups/${groupId}`);
  return response.data;
};

/**
 * Create a new group.
 * @param {Object} groupData - Data for the new group (name, description, etc.).
 * @returns {Promise<Object>} Newly created group object.
 */
export const createGroup = async (groupData) => {
  const response = await api.post('/groups', groupData);
  return response.data;
};

/**
 * Update details of an existing group.
 * @param {string} groupId - ID of the group to update.
 * @param {Object} groupData - Updated group data.
 * @returns {Promise<Object>} Updated group object.
 */
export const updateGroup = async (groupId, groupData) => {
  const response = await api.put(`/groups/${groupId}`, groupData);
  return response.data;
};

/**
 * Join a group.
 * @param {string} groupId - ID of the group to join.
 * @returns {Promise<Object>} Response object from the server.
 */
export const joinGroup = async (groupId) => {
  const response = await api.post(`/groups/${groupId}/join`);
  return response.data;
};

/**
 * Leave a group.
 * @param {string} groupId - ID of the group to leave.
 * @param {string} username - Username of the member leaving the group.
 * @returns {Promise<Object>} Response object from the server.
 */
export const leaveGroup = async (groupId, username) => {
  const response = await api.post(`/groups/${groupId}/leave`, { username });
  return response.data;
};

/**
 * Get all polls for a group.
 * @param {string} groupId - ID of the group.
 * @returns {Promise<Array>} Array of poll objects.
 */
export const getGroupPolls = async (groupId) => {
  const response = await api.get(`/groups/${groupId}/polls`);
  return response.data;
};

/**
 * Create a poll within a group.
 * @param {string} groupId - ID of the group.
 * @param {Object} pollData - Poll details (question, options, etc.).
 * @returns {Promise<Object>} Newly created poll object.
 */
export const createPoll = async (groupId, pollData) => {
  const response = await api.post(`/groups/${groupId}/polls`, pollData);
  return response.data;
};

/**
 * Vote on a poll.
 * @param {string} pollId - ID of the poll.
 * @param {string} username - Username of the voter.
 * @param {string} optionId - ID of the chosen option.
 * @returns {Promise<Object>} Response object from the server.
 */
export const voteOnPoll = async (pollId, username, optionId) => {
  const response = await api.post(`/polls/${pollId}/vote`, { 
    username, 
    option_id: optionId 
  });
  return response.data;
};
