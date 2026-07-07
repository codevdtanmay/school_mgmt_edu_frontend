import axiosInstance from '../services/axiosInstance';

export interface FeeHistoryItem {
  id: string;
  receiptNo: string;
  studentId: string;
  name: string;
  admissionNo: string;
  className: string;
  amount: number;
  paymentMethod: string;
  date: string;
}

const LOCAL_STORAGE_KEY = 'school_fee_history_records';

const MOCK_FEE_HISTORY: FeeHistoryItem[] = [
  {
    id: 'f-1',
    receiptNo: 'REC-00012',
    studentId: 's-1',
    name: 'Rahul Kumar',
    admissionNo: 'ADM2026001',
    className: '10th-A',
    amount: 1000,
    paymentMethod: 'Cash',
    date: '2026-06-12'
  },
  {
    id: 'f-2',
    receiptNo: 'REC-00008',
    studentId: 's-2',
    name: 'Priya Singh',
    admissionNo: 'ADM2026002',
    className: '9th-B',
    amount: 2800,
    paymentMethod: 'UPI',
    date: '2026-05-05'
  },
  {
    id: 'f-3',
    receiptNo: 'REC-00003',
    studentId: 's-3',
    name: 'Amit Sharma',
    admissionNo: 'ADM2026003',
    className: '8th-A',
    amount: 1200,
    paymentMethod: 'Bank Transfer',
    date: '2026-04-10'
  }
];

const getLocalFeeHistory = (): FeeHistoryItem[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_FEE_HISTORY));
    return MOCK_FEE_HISTORY;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return MOCK_FEE_HISTORY;
  }
};

const setLocalFeeHistory = (list: FeeHistoryItem[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
};

const mapPaymentResponse = (p: any): FeeHistoryItem => {
  const s = p.studentId || {};
  const isStudentPopulated = s && typeof s === 'object';
  const isUserPopulated = s.userId && typeof s.userId === 'object';
  
  const resolvedName = isUserPopulated ? s.userId.name : (p.studentName || p.name || '');
  const resolvedAdmissionNo = isStudentPopulated ? s.admissionNo : (p.admissionNo || '');
  const resolvedClassName = isStudentPopulated ? `${s.class || ''}-${s.section || ''}` : (p.className || '');
  
  return {
    id: p._id || p.id,
    receiptNo: p.receiptNo || '',
    studentId: isStudentPopulated ? (s._id || s.id || p.studentId) : p.studentId,
    name: resolvedName,
    admissionNo: resolvedAdmissionNo,
    className: resolvedClassName,
    amount: p.amount != null ? Number(p.amount) : 0,
    paymentMethod: p.paymentMethod || 'Cash',
    date: p.paymentDate || p.date || ''
  };
};

export const feeApi = {
  getFeeHistory: async (params?: {
    month?: number | string;
    year?: number | string;
    paymentMethod?: string;
    studentId?: string;
  }) => {
    try {
      let historyList: any[] = [];
      let totalCol = 0;
      let totalPay = 0;

      if (params?.studentId) {
        // Fetch specific student payment history using backend endpoint: GET /fees/student/:id/history
        const response = await axiosInstance.get(`/fees/student/${params.studentId}/history`);
        const data = response.data;
        if (data && Array.isArray(data.history)) {
          historyList = data.history.map((h: any) => ({
            ...h,
            studentName: data.studentName,
            admissionNo: data.admissionNo
          }));
        }
      } else {
        // Fetch monthly fee report using backend endpoint: GET /fees/monthly-report
        const monthMap: Record<string, number> = {
          'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
          'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        
        let monthNum = new Date().getMonth() + 1;
        let yearNum = new Date().getFullYear();

        if (params?.month && params.month !== 'All') {
          if (typeof params.month === 'number') {
            monthNum = params.month;
          } else if (typeof params.month === 'string' && monthMap[params.month]) {
            monthNum = monthMap[params.month];
          } else if (!isNaN(Number(params.month))) {
            monthNum = Number(params.month);
          }
        }
        
        if (params?.year && params.year !== 'All') {
          yearNum = Number(params.year);
        }

        const response = await axiosInstance.get('/fees/monthly-report', {
          params: { month: monthNum, year: yearNum }
        });
        const data = response.data;
        if (data && Array.isArray(data.payments)) {
          historyList = data.payments;
          totalCol = data.totalCollection || 0;
          totalPay = data.totalTransactions || 0;
        }
      }

      // Filter by paymentMethod if specified
      if (params?.paymentMethod && params.paymentMethod !== 'All') {
        historyList = historyList.filter(h => h.paymentMethod === params.paymentMethod);
      }

      const mappedHistory = historyList.map(mapPaymentResponse);
      const computedCollection = totalCol || mappedHistory.reduce((sum, item) => sum + item.amount, 0);
      const computedPayments = totalPay || mappedHistory.length;

      return {
        history: mappedHistory,
        totalCollection: computedCollection,
        totalPayments: computedPayments
      };
    } catch (e) {
      console.warn('Backend fee history query failed. Using local storage.', e);
      let list = getLocalFeeHistory();

      if (params) {
        if (params.studentId) {
          list = list.filter(item => item.studentId === params.studentId);
        }
        if (params.paymentMethod && params.paymentMethod !== 'All') {
          list = list.filter(item => item.paymentMethod.toLowerCase() === params.paymentMethod?.toLowerCase());
        }
        if (params.month && params.month !== 'All') {
          const monthMap: Record<string, number> = {
            'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
            'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
          };
          
          let monthIndex = -1;
          if (typeof params.month === 'number') {
            monthIndex = params.month - 1;
          } else if (typeof params.month === 'string') {
            if (monthMap[params.month] !== undefined) {
              monthIndex = monthMap[params.month];
            } else {
              monthIndex = parseInt(params.month) - 1;
            }
          }

          if (monthIndex >= 0 && monthIndex < 12) {
            list = list.filter(item => {
              const d = new Date(item.date);
              return d.getMonth() === monthIndex;
            });
          }
        }
        if (params.year && params.year !== 'All') {
          list = list.filter(item => {
            const d = new Date(item.date);
            return d.getFullYear() === Number(params.year);
          });
        }
      }

      const totalCollection = list.reduce((acc, item) => acc + item.amount, 0);
      return {
        history: list,
        totalCollection,
        totalPayments: list.length
      };
    }
  },

  addLocalPayment: (payment: Omit<FeeHistoryItem, 'id' | 'receiptNo' | 'date'>) => {
    const list = getLocalFeeHistory();
    const newPayment: FeeHistoryItem = {
      id: `pay-${Date.now()}`,
      receiptNo: `REC-000${list.length + 13}`,
      date: new Date().toISOString().split('T')[0],
      ...payment
    };
    list.unshift(newPayment);
    setLocalFeeHistory(list);
    return newPayment;
  }
};
