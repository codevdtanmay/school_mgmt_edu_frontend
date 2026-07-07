import axiosInstance from '../services/axiosInstance';

 export interface TransferCertificate {
  id: string;
  tcNumber: string;

  studentId: string;
  studentName: string;
  admissionNo: string;

  classLeaving: string;

  issueDate: string;

  reason: string;
  conduct: string;
  promotedTo: string;

  status: "Issued" | "Cancelled";
}

const LOCAL_STORAGE_KEY = 'school_transfer_certificates_list';

const MOCK_TCS: TransferCertificate[] = [];

const getLocalTCs = (): TransferCertificate[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_TCS));
    return MOCK_TCS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return MOCK_TCS;
  }
};

const setLocalTCs = (list: TransferCertificate[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
};

export const tcApi = {
  getAllTCs: async (): Promise<TransferCertificate[]> => {
    try {
      const response = await axiosInstance.get('/tc');
      const data = response.data;
      if (data && Array.isArray(data.tcs)) {
        return data.tcs;
      }
      if (Array.isArray(data)) {
        return data;
      }
      if (data && Array.isArray(data.data)) {
        return data.data;
      }
      throw new Error('Using local storage fallback');
    } catch (e) {
      console.warn('Backend /tc query failed. Using local storage.', e);
      return getLocalTCs();
    }
  },

  getTCById: async (id: string): Promise<TransferCertificate> => {
    try {
      const response = await axiosInstance.get(`/tc/${id}`);
      const data = response.data;
      if (data && data.tc) {
        return data.tc;
      }
      return data;
    } catch (e) {
      console.warn(`Backend /tc/${id} query failed. Using local storage.`, e);
      const list = getLocalTCs();
      const tc = list.find(item => item.id === id);
      if (tc) return tc;
      throw new Error('Transfer Certificate not found');
    }
  },

  generateTC: async (data: Omit<TransferCertificate, 'id' | 'tcNumber' | 'issueDate' | 'status'>): Promise<TransferCertificate> => {
    try {
      const response = await axiosInstance.post('/tc', data);
      const resData = response.data;
      if (resData && resData.tc) {
        return resData.tc;
      }
      return resData;
    } catch (e) {
      console.warn('Backend /tc creation failed. Simulating on local storage.', e);
      const list = getLocalTCs();
      
      // Check if student already has an active TC in local storage (just to raise error like backend)
      const existingActive = list.find(item => item.studentId === data.studentId && item.status === 'Issued');
      if (existingActive) {
        throw new Error('TC already exists for this student');
      }

      const tcNum = `TC-2026-000${list.length + 1}`;
      const newTC: TransferCertificate = {
        id: `tc-${Date.now()}`,
        tcNumber: tcNum,
        issueDate: new Date().toISOString().split('T')[0],
        status: 'Issued',
        ...data
      };
      
      list.unshift(newTC);
      setLocalTCs(list);
      return newTC;
    }
  },

  cancelTC: async (id: string): Promise<TransferCertificate> => {
    try {
      const response = await axiosInstance.patch(`/tc/${id}/cancel`);
      const data = response.data;
      if (data && data.tc) {
        return data.tc;
      }
      
      // If backend only returns { success: true } but doesn't return the full updated TC object, we can return local model updated
      const list = getLocalTCs();
      const index = list.findIndex(item => item.id === id);
      if (index !== -1) {
        list[index].status = 'Cancelled';
        setLocalTCs(list);
        return list[index];
      }
      return data;
    } catch (e) {
      console.warn(`Backend /tc/${id}/cancel patch failed. Doing local cancel.`, e);
      const list = getLocalTCs();
      const index = list.findIndex(item => item.id === id);
      if (index !== -1) {
        list[index].status = 'Cancelled';
        setLocalTCs(list);
        return list[index];
      }
      throw new Error('Transfer Certificate not found');
    }
  }
};
