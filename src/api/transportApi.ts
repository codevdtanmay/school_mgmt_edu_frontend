import axiosInstance from '../services/axiosInstance';
import { Transport } from '../types';

const LOCAL_STORAGE_KEY = 'school_transport_records';

const MOCK_TRANSPORTS: Transport[] = [];

const getLocalTransports = (): Transport[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_TRANSPORTS));
    return MOCK_TRANSPORTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return MOCK_TRANSPORTS;
  }
};

const setLocalTransports = (list: Transport[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
};

export const transportApi = {
  getTransports: async (): Promise<Transport[]> => {
    try {
      const response = await axiosInstance.get('/transport');
      const data = response.data;
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.transports) ? data.transports : (data && Array.isArray(data.data) ? data.data : []));
      if (list.length > 0) {
        setLocalTransports(list);
        return list;
      }
      return getLocalTransports();
    } catch (e) {
      console.warn('Backend transport list failed or offline. Using local storage.', e);
      return getLocalTransports();
    }
  },

  addTransport: async (transportData: Omit<Transport, 'id'>): Promise<Transport> => {
    try {
      const response = await axiosInstance.post('/transport', transportData);
      const data = response.data;
      const raw = data && data.transport ? data.transport : data;
      
      if (raw) {
        const mapped: Transport = {
          id: raw._id || raw.id,
          studentId: raw.studentId,
          name: transportData.name, // hold on to name/email passed as part of UI state mapping
          email: transportData.email,
          admissionNo: transportData.admissionNo,
          className: transportData.className,
          routeName: raw.routeName || transportData.routeName,
          pickupPoint: raw.pickupPoint || transportData.pickupPoint,
          monthlyCharge: raw.monthlyCharge != null ? Number(raw.monthlyCharge) : transportData.monthlyCharge,
          joiningDate: raw.joiningDate || transportData.joiningDate,
          status: raw.status || transportData.status || 'Active'
        };
        
        const local = getLocalTransports();
        local.push(mapped);
        setLocalTransports(local);
        return mapped;
      }
      throw new Error('Invalid response');
    } catch (e) {
      console.warn('Backend transport add failed. Falling back to local state.', e);
      const newRecord: Transport = {
        id: `t-${Date.now()}`,
        ...transportData
      };
      const local = getLocalTransports();
      local.push(newRecord);
      setLocalTransports(local);
      return newRecord;
    }
  },

  updateTransport: async (id: string, transportData: Partial<Transport>): Promise<Transport> => {
    try {
      const response = await axiosInstance.put(`/transport/${id}`, transportData);
      const data = response.data;
      const raw = data && data.transport ? data.transport : data;
      
      if (raw || data.success) {
        const local = getLocalTransports();
        const index = local.findIndex(t => t.id === id);
        const current = index !== -1 ? local[index] : {} as any;
        
        const updated: Transport = {
          id: id,
          studentId: raw?.studentId || transportData.studentId || current.studentId,
          name: transportData.name || current.name,
          email: transportData.email || current.email,
          admissionNo: transportData.admissionNo || current.admissionNo,
          className: transportData.className || current.className,
          routeName: raw?.routeName || transportData.routeName || current.routeName,
          pickupPoint: raw?.pickupPoint || transportData.pickupPoint || current.pickupPoint,
          monthlyCharge: raw?.monthlyCharge != null ? Number(raw.monthlyCharge) : (transportData.monthlyCharge != null ? transportData.monthlyCharge : current.monthlyCharge),
          joiningDate: raw?.joiningDate || transportData.joiningDate || current.joiningDate,
          status: raw?.status || transportData.status || current.status || 'Active'
        };
        
        if (index !== -1) {
          local[index] = updated;
          setLocalTransports(local);
        }
        return updated;
      }
      throw new Error('Invalid response');
    } catch (e) {
      console.warn('Backend transport update failed. Falling back to local state.', e);
      const local = getLocalTransports();
      const index = local.findIndex(t => t.id === id);
      if (index !== -1) {
        local[index] = { ...local[index], ...transportData };
        setLocalTransports(local);
        return local[index];
      }
      return { id, ...transportData } as Transport;
    }
  },

  deleteTransport: async (id: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/transport/${id}`);
    } catch (e) {
      console.warn('Backend transport delete failed or missing endpoint.', e);
    }
    // Update local storage regardless
    const local = getLocalTransports();
    const updated = local.filter(t => t.id !== id);
    setLocalTransports(updated);
  }
};
