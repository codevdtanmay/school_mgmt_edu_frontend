// src/api/feeApi.ts

import axiosInstance from "../services/axiosInstance";

export const feeApi = {
  getAllFees: async () => {
    const response = await axiosInstance.get("/fees");
    return response.data.fees;
  },

  collectFee: async (data: {
    studentId: string;
    amountPaid: number;
    paymentMethod: string;
  }) => {
    const response = await axiosInstance.post("/fees/collect", data);
    return response.data;
  }
};