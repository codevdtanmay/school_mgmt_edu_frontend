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


export default axiosInstance;
