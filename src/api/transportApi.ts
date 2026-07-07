import axiosInstance from '../services/axiosInstance';
import { Transport } from '../types';




export const transportApi = {
  getTransports: async (): Promise<Transport[]> => {
  const response = await axiosInstance.get("/transport");
  const data = response.data;

  return Array.isArray(data)
    ? data
    : data?.transports || data?.data || [];
},

  addTransport: async (
  transportData: Omit<Transport, "id">
): Promise<Transport> => {
  const response = await axiosInstance.post("/transport", transportData);

  const raw = response.data.transport || response.data;

  return {
    id: raw._id || raw.id,
    studentId: raw.studentId,
    name: transportData.name,
    email: transportData.email,
    admissionNo: transportData.admissionNo,
    className: transportData.className,
    routeName: raw.routeName,
    pickupPoint: raw.pickupPoint,
    monthlyCharge: Number(raw.monthlyCharge),
    joiningDate: raw.joiningDate,
    status: raw.status,
  };
},
   

updateTransport: async (
  id: string,
  transportData: Partial<Transport>
): Promise<Transport> => {
  const response = await axiosInstance.put(`/transport/${id}`, transportData);

  return response.data.transport;
},

  deleteTransport: async (id: string): Promise<void> => {
  await axiosInstance.delete(`/transport/${id}`);
},}