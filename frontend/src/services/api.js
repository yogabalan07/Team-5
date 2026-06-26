import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Token added to request:', token.substring(0, 20) + '...');
        } else {
            console.log('No token found in localStorage');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
    (response) => {
        console.log('Response received:', response.status);
        return response;
    },
    (error) => {
        console.error('API Error:', error.response?.status, error.response?.data);
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('Unauthorized - redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;