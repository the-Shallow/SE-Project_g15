import axios from 'axios';

/**
 * Axios instance configured for the FoodPool backend API.
 * Sets default baseURL, JSON content-type, and attaches JWT token if available.
 */
const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Flask backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor to attach JWT token from localStorage to every request.
 */
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

/**
 * Response interceptor to log and propagate errors from API requests.
 */
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;
