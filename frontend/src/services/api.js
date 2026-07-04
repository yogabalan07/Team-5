// src/services/api.js
import axios from 'axios';

// ✅ PRODUCTION ONLY - Hardcoded for Render
const API_URL = 'https://ivm-backend-5tmk.onrender.com/api';

console.log('🌐 API Base URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // ✅ Increased from 30000 to 60000 (60 seconds)
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const { config } = error;
    
    // ✅ Handle timeout errors with retry logic
    if (error.code === 'ECONNABORTED' && config && !config._retry) {
      config._retry = true;
      console.log(`🔄 Request timeout, retrying ${config.url} (attempt 1/2)...`);
      try {
        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await api.request(config);
      } catch (retryError) {
        console.error(`❌ Retry failed for ${config.url}`);
        return Promise.reject(retryError);
      }
    }
    
    // ✅ Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('🔒 Authentication error:', error.response.status);
      console.error('📝 Error details:', error.response.data);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // ✅ Handle server errors
    if (error.response?.status === 500) {
      console.error('❌ Server error:', error.response.status);
      console.error('📝 Error details:', error.response.data);
    }
    
    // ✅ Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network error - Check if backend is running');
    }
    
    return Promise.reject(error);
  }
);

export default api;
