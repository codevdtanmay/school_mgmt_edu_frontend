import axios from 'axios';

// Base Axios service setup pointing to the live API backend
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Automatically append the JWT (raw token) for secure endpoints
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('school_erp_token');
    if (token && config.headers) {
      // Send the token directly (no "Bearer " prefix)
      config.headers.Authorization = token as string;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
