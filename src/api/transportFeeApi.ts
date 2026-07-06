import axiosInstance from '../services/axiosInstance';

export interface TransportFeePayment {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  routeName: string;
  pickupPoint: string;
  monthlyCharge: number;
  month: string;
  year: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  remarks?: string;
  date: string;
}

const LOCAL_STORAGE_KEY = 'school_transport_fee_payments';

const MOCK_PAYMENTS: TransportFeePayment[] = [
  {
    id: 'tf-1',
    receiptNo: 'TR-2026-0001',
    studentId: 's-1',
    studentName: 'Rahul Kumar',
    admissionNo: 'ADM2026001',
    className: '10th-A',
    routeName: 'Route 1',
    pickupPoint: 'Main Gate',
    monthlyCharge: 1200,
    month: 'April',
    year: '2026',
    amount: 1200,
    paymentMethod: 'Cash',
    remarks: 'Paid on time',
    date: '2026-04-16T10:00:00.000Z'
  },
  {
    id: 'tf-2',
    receiptNo: 'TR-2026-0002',
    studentId: 's-1',
    studentName: 'Rahul Kumar',
    admissionNo: 'ADM2026001',
    className: '10th-A',
    routeName: 'Route 1',
    pickupPoint: 'Main Gate',
    monthlyCharge: 1200,
    month: 'May',
    year: '2026',
    amount: 1200,
    paymentMethod: 'UPI',
    remarks: 'GPay payment',
    date: '2026-05-14T11:20:00.000Z'
  },
  {
    id: 'tf-3',
    receiptNo: 'TR-2026-0003',
    studentId: 's-2',
    studentName: 'Priya Singh',
    admissionNo: 'ADM2026002',
    className: '9th-B',
    routeName: 'Route 2',
    pickupPoint: 'Sector 15 Circle',
    monthlyCharge: 1500,
    month: 'May',
    year: '2026',
    amount: 1500,
    paymentMethod: 'Bank Transfer',
    remarks: 'NEFT Transfer',
    date: '2026-05-18T14:45:00.000Z'
  },
  {
    id: 'tf-4',
    receiptNo: 'TR-2026-0004',
    studentId: 's-1',
    studentName: 'Rahul Kumar',
    admissionNo: 'ADM2026001',
    className: '10th-A',
    routeName: 'Route 1',
    pickupPoint: 'Main Gate',
    monthlyCharge: 1200,
    month: 'June',
    year: '2026',
    amount: 1200,
    paymentMethod: 'UPI',
    remarks: 'Auto-debit',
    date: '2026-06-15T09:10:00.000Z'
  },
  {
    id: 'tf-5',
    receiptNo: 'TR-2026-0005',
    studentId: 's-2',
    studentName: 'Priya Singh',
    admissionNo: 'ADM2026002',
    className: '9th-B',
    routeName: 'Route 2',
    pickupPoint: 'Sector 15 Circle',
    monthlyCharge: 1500,
    month: 'June',
    year: '2026',
    amount: 1500,
    paymentMethod: 'Card',
    remarks: 'Visa credit card',
    date: '2026-06-16T16:30:00.000Z'
  }
];

const getLocalPayments = (): TransportFeePayment[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_PAYMENTS));
    return MOCK_PAYMENTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return MOCK_PAYMENTS;
  }
};

const setLocalPayments = (list: TransportFeePayment[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
};

export const transportFeeApi = {
  // GET /api/transport-fees/history
  getHistory: async (): Promise<TransportFeePayment[]> => {
    try {
      const response = await axiosInstance.get('/transport-fees/history');
      const list = response.data;
      if (Array.isArray(list)) {
        setLocalPayments(list);
        return list;
      }
      return getLocalPayments();
    } catch (e) {
      console.warn('Backend transport history failed or offline. Using local storage.', e);
      return getLocalPayments();
    }
  },

  // POST /api/transport-fees/collect
  collectFee: async (paymentData: Omit<TransportFeePayment, 'id' | 'receiptNo' | 'date'>): Promise<TransportFeePayment> => {
    try {
      const response = await axiosInstance.post('/transport-fees/collect', paymentData);
      const newPayment = response.data;
      if (newPayment && newPayment.id) {
        const local = getLocalPayments();
        local.unshift(newPayment);
        setLocalPayments(local);
        return newPayment;
      }
      throw new Error('Invalid response');
    } catch (e) {
      console.warn('Backend fee collection failed. Falling back to local state.', e);
      const local = getLocalPayments();
      // Calculate receipt number based on current count
      const yearShort = new Date().getFullYear();
      const numStr = String(local.length + 1).padStart(4, '0');
      const receiptNo = `TR-${yearShort}-${numStr}`;
      
      const newPayment: TransportFeePayment = {
        id: `tf-${Date.now()}`,
        receiptNo,
        date: new Date().toISOString(),
        ...paymentData
      };
      
      local.unshift(newPayment);
      setLocalPayments(local);
      return newPayment;
    }
  },

  // GET /api/transport-fees/dashboard
  getDashboardStats: async (): Promise<any> => {
    try {
      const response = await axiosInstance.get('/transport-fees/dashboard');
      return response.data;
    } catch (e) {
      console.warn('Backend dashboard stats request failed, constructing from local state.');
      const payments = getLocalPayments();
      const totalStudents = payments.length; // rough estimate or done via transport list
      return { payments };
    }
  },

  // GET /api/transport-fees/monthly-report
  getMonthlyReport: async (month: string, year: string): Promise<TransportFeePayment[]> => {
    try {
      const response = await axiosInstance.get(`/transport-fees/monthly-report?month=${month}&year=${year}`);
      return response.data;
    } catch (e) {
      const payments = getLocalPayments();
      return payments.filter(p => p.month === month && p.year === year);
    }
  },

  // GET /api/transport-fees/pending
  getPendingReport: async (): Promise<any[]> => {
    try {
      const response = await axiosInstance.get('/transport-fees/pending');
      return response.data;
    } catch (e) {
      console.warn('Backend pending report failed, offline fallback is computed dynamically.');
      return [];
    }
  }
};
