import axiosInstance from '../services/axiosInstance';
import { Notice, Activity, DashboardStats } from '../types';

export const noticeApi = {
  getRecentNotices: async (): Promise<Notice[]> => {
    const response = await axiosInstance.get('/notices/recent');
    return response.data;
  },

  createNotice: async (noticeData: { title: string; content: string; priority: string; publishedBy: string }): Promise<Notice> => {
    const response = await axiosInstance.post('/notices', noticeData);
    return response.data;
  }
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await axiosInstance.get('/dashboard/stats');
    return response.data;
  },

  getActivities: async (): Promise<Activity[]> => {
    const response = await axiosInstance.get('/dashboard/activities');
    return response.data;
  }
};
