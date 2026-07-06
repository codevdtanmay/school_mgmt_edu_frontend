import axiosInstance from '../services/axiosInstance';

export interface TransferCertificate {
  id: string;
  tcNumber: string;
  studentId: string;
  name: string;
  admissionNo: string;
  fatherName: string;
  motherName: string;
  className: string;
  section: string;
  joiningDate: string;
  category: string;
  reason: string;
  lastAttendanceDate: string;
  conduct: string;
  promotedTo: string;
  remarks: string;
  issuedBy: string;
  issueDate: string;
  status: 'Issued' | 'Cancelled';
}

const LOCAL_STORAGE_KEY = 'school_transfer_certificates_list';

const MOCK_TCS: TransferCertificate[] = [
  {
    id: 'tc-1',
    tcNumber: 'TC-2026-0001',
    studentId: 's-1',
    name: 'Rahul Kumar',
    admissionNo: 'ADM2026001',
    fatherName: 'Sanjay Kumar',
    motherName: 'Meena Devi',
    className: '10th Class',
    section: 'A',
    joiningDate: '2022-04-05',
    category: 'OBC',
    reason: 'Higher Education',
    lastAttendanceDate: '2026-05-15',
    conduct: 'Excellent',
    promotedTo: 'Class 11',
    remarks: 'A disciplined and bright student throughout the tenure.',
    issuedBy: 'Principal',
    issueDate: '2026-06-15',
    status: 'Issued'
  },
  {
    id: 'tc-2',
    tcNumber: 'TC-2026-0002',
    studentId: 's-2',
    name: 'Priya Singh',
    admissionNo: 'ADM2026002',
    fatherName: 'Rajesh Singh',
    motherName: 'Kiran Singh',
    className: '9th Class',
    section: 'B',
    joiningDate: '2023-04-10',
    category: 'General',
    reason: 'Parent Request',
    lastAttendanceDate: '2026-04-30',
    conduct: 'Very Good',
    promotedTo: 'Class 10',
    remarks: 'Requested transfer due to parent relocation.',
    issuedBy: 'Principal',
    issueDate: '2026-05-20',
    status: 'Cancelled'
  }
];

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
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
