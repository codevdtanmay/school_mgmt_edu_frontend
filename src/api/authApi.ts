import axiosInstance from '../services/axiosInstance';

export const authApi = {
  login: async (credentials: any) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },
  
  getCurrentUser: async () => {
    // Under real systems, this decodes JWT or queries matching profile
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  }
};
