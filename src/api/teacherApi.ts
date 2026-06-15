import axiosInstance from '../services/axiosInstance';
import { Teacher } from '../types';

export const teacherApi = {
  getTeachers: async (): Promise<Teacher[]> => {
    const response = await axiosInstance.get('/teachers');
    return response.data;
  },

  addTeacher: async (teacherData: Omit<Teacher, 'id' | 'joiningDate' | 'status'>): Promise<Teacher> => {
    const response = await axiosInstance.post('/teachers', teacherData);
    return response.data;
  },

  updateTeacher: async (id: string, teacherData: Partial<Teacher>): Promise<Teacher> => {
    const response = await axiosInstance.put(`/teachers/${id}`, teacherData);
    return response.data;
  },

  deleteTeacher: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/teachers/${id}`);
  }
};
