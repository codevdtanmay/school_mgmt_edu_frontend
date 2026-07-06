import axiosInstance from '../services/axiosInstance';
import { Transport } from '../types';

const LOCAL_STORAGE_KEY = 'school_transport_records';

const MOCK_TRANSPORTS: Transport[] = [
  {
    id: 't-1',
    studentId: 's-1',
    name: 'Rahul Kumar',
    email: 'rahul@example.com',
    admissionNo: 'ADM2026001',
    className: '10th-A',
    routeName: 'Route 1',
    pickupPoint: 'Main Gate',
    monthlyCharge: 1200,
    joiningDate: '2026-04-15',
    status: 'Active'
  },
  {
    id: 't-2',
    studentId: 's-2',
    name: 'Priya Singh',
    email: 'priya@example.com',
    admissionNo: 'ADM2026002',
    className: '9th-B',
    routeName: 'Route 2',
    pickupPoint: 'Sector 15 Circle',
    monthlyCharge: 1500,
    joiningDate: '2026-05-10',
    status: 'Active'
  },
  {
    id: 't-3',
    studentId: 's-3',
    name: 'Amit Sharma',
    email: 'amit@example.com',
    admissionNo: 'ADM2026003',
    className: '8th-A',
    routeName: 'Route 1',
    pickupPoint: 'Town Hall',
    monthlyCharge: 1200,
    joiningDate: '2026-06-01',
    status: 'Inactive'
  }
];

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
      const newRecord = response.data;
      if (newRecord && newRecord.id) {
        const local = getLocalTransports();
        local.push(newRecord);
        setLocalTransports(local);
        return newRecord;
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
      const updated = response.data;
      if (updated && updated.id) {
        const local = getLocalTransports();
        const index = local.findIndex(t => t.id === id);
        if (index !== -1) {
          local[index] = { ...local[index], ...updated };
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
