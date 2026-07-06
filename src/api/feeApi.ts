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

export const feeApi = {
  getFeeHistory: async (params?: {
    month?: number | string;
    year?: number | string;
    paymentMethod?: string;
    studentId?: string;
  }) => {
    try {
      const response = await axiosInstance.get("/fees/history", {
        params
      });
      const data = response.data;
      if (data && (Array.isArray(data.history) || Array.isArray(data))) {
        const historyList = Array.isArray(data.history) ? data.history : data;
        return {
          history: historyList,
          totalCollection: data.totalCollection !== undefined ? data.totalCollection : historyList.reduce((acc: number, item: any) => acc + (item.amount || 0), 0),
          totalPayments: data.totalPayments !== undefined ? data.totalPayments : historyList.length
        };
      }
      throw new Error('Fallback to local storage');
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
