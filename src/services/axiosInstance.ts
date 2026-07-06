import axios from 'axios';

// Base Axios service setup pointing to the live API backend
const axiosInstance = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Automatically append the JWT (raw token) for secure endpoints


export default axiosInstance;
