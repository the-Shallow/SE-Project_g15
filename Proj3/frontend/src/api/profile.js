import API from "./axios";

/**
 * Fetch the current user's profile information.
 * @returns {Promise<Object>} - The user's profile data.
 */
export const fetchProfile = async () => {
  const response = await API.get("/profile");
  return response.data;
};

/**
 * Update the current user's profile information.
 * @param {Object} profileData - Profile fields to update.
 * @param {Object} [config={}] - Optional Axios config (e.g., headers).
 * @returns {Promise<Object>} - Updated profile data from the server.
 */
export const updateProfile = async (profileData, config = {}) => {
  const response = await API.put("/profile", profileData, config);
  return response.data;
};
