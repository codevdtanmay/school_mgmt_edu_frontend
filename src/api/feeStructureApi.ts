import axiosInstance from '../services/axiosInstance';
import { FeeStructure } from '../types';

export const feeStructureApi = {
  getFeeStructures: async (): Promise<FeeStructure[]> => {
    const response = await axiosInstance.get('/fee-structures');
    return response.data;
  },

  addFeeStructure: async (fsData: Omit<FeeStructure, 'id' | 'totalFee'>): Promise<FeeStructure> => {
    const response = await axiosInstance.post('/fee-structures', fsData);
    return response.data;
  },

  updateFeeStructure: async (id: string, fsData: Partial<FeeStructure>): Promise<FeeStructure> => {
    const response = await axiosInstance.put(`/fee-structures/${id}`, fsData);
    return response.data;
  },

  deleteFeeStructure: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/fee-structures/${id}`);
  }
};
