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

const mapTransportPaymentResponse = (p: any): TransportFeePayment => {
  if (!p) return p;
  
  const s = p.studentId || {};
  const t = p.transportId || {};
  
  const isStudentPopulated = s && typeof s === 'object';
  const isUserPopulated = s.userId && typeof s.userId === 'object';
  const isTransportPopulated = t && typeof t === 'object';
  
  const resolvedName = isUserPopulated ? s.userId.name : (p.studentName || p.name || '');
  const resolvedAdmissionNo = isStudentPopulated ? s.admissionNo : (p.admissionNo || '');
  const resolvedClassName = isStudentPopulated ? `${s.class || ''}-${s.section || ''}` : (p.className || '');
  
  const resolvedRouteName = isTransportPopulated ? t.routeName : (p.routeName || '');
  const resolvedPickupPoint = isTransportPopulated ? t.pickupPoint : (p.pickupPoint || '');
  const resolvedMonthlyCharge = isTransportPopulated ? t.monthlyCharge : (p.monthlyCharge || 0);

  return {
    id: p._id || p.id,
    receiptNo: p.receiptNo || '',
    studentId: isStudentPopulated ? (s._id || s.id || p.studentId) : p.studentId,
    studentName: resolvedName,
    admissionNo: resolvedAdmissionNo,
    className: resolvedClassName,
    routeName: resolvedRouteName,
    pickupPoint: resolvedPickupPoint,
    monthlyCharge: resolvedMonthlyCharge,
    month: p.month ? String(p.month) : '',
    year: p.year ? String(p.year) : '',
    amount: p.amount != null ? Number(p.amount) : 0,
    paymentMethod: p.paymentMethod || 'Cash',
    remarks: p.remarks || '',
    date: p.paymentDate || p.date || new Date().toISOString()
  };
};

export const transportFeeApi = {
  // GET /api/transport-fees/history
  getHistory: async (): Promise<TransportFeePayment[]> => {
    try {
      const response = await axiosInstance.get('/transport-fees/history');
      const data = response.data;
      const list = data && Array.isArray(data.payments) ? data.payments : (Array.isArray(data) ? data : []);
      if (list.length > 0) {
        const mapped = list.map(mapTransportPaymentResponse);
        setLocalPayments(mapped);
        return mapped;
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
      const monthMap: Record<string, number> = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
        'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
      };
      
      let monthNum = new Date().getMonth() + 1;
      if (paymentData.month && monthMap[paymentData.month]) {
        monthNum = monthMap[paymentData.month];
      } else if (paymentData.month && !isNaN(Number(paymentData.month))) {
        monthNum = Number(paymentData.month);
      }
      
      const payload = {
        studentId: paymentData.studentId,
        month: monthNum,
        year: Number(paymentData.year) || new Date().getFullYear(),
        paymentMethod: paymentData.paymentMethod,
        remarks: paymentData.remarks
      };

      const response = await axiosInstance.post('/transport-fees/collect', payload);
      const data = response.data;
      const rawPayment = data && data.payment ? data.payment : data;
      
      if (rawPayment) {
        const mapped = mapTransportPaymentResponse(rawPayment);
        const local = getLocalPayments();
        local.unshift(mapped);
        setLocalPayments(local);
        return mapped;
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
      return { payments };
    }
  },

  // GET /api/transport-fees/monthly-report
  getMonthlyReport: async (month: string, year: string): Promise<TransportFeePayment[]> => {
    try {
      const monthMap: Record<string, number> = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
        'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
      };
      const monthNum = monthMap[month] || new Date().getMonth() + 1;
      const response = await axiosInstance.get(`/transport-fees/monthly-report?month=${monthNum}&year=${year}`);
      const data = response.data;
      const list = data && Array.isArray(data.payments) ? data.payments : (Array.isArray(data) ? data : []);
      return list.map(mapTransportPaymentResponse);
    } catch (e) {
      const payments = getLocalPayments();
      return payments.filter(p => p.month === month && p.year === year);
    }
  },

  // GET /api/transport-fees/pending
  getPendingReport: async (): Promise<any[]> => {
    try {
      const response = await axiosInstance.get('/transport-fees/pending');
      const data = response.data;
      if (data && Array.isArray(data.pending)) {
        return data.pending;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (e) {
      console.warn('Backend pending report failed, offline fallback is computed dynamically.');
      return [];
    }
  }
};
