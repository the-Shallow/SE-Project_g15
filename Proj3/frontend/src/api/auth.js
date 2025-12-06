// frontend/src/api/auth.js
import API from "./axios";

/**
 * Signup a new user.
 * Sends a POST request to the backend to register a user.
 *
 * @param {string} username - The name of the user.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} The response data from the backend.
 * @throws Will throw an error if the signup fails.
 */
export const signupUser = async (username, email, password) => {
  try {
    const response = await API.post("/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Signup error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Login an existing user.
 * Sends a POST request to the backend to authenticate a user.
 * Stores the token and username in localStorage if login is successful.
 *
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} The response data from the backend, including token.
 * @throws Will throw an error object containing message from the server if login fails.
 */
export const loginUser = async (username, password) => {
  try {
    const response = await API.post("/auth/login", { username, password });

    // Save token and username if present
    if (response?.data?.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
    }
    return response.data;
  } catch (error) {
    const err = error.response?.data || { message: error.message };
    throw err;
  }
};
