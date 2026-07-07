import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Bus, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  X, 
  ChevronRight,
  Route as RouteIcon,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  Loader as LoaderIcon,
  CheckCircle,
  FileCheck,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ChevronDown,
  ArrowUpDown,
  History
} from 'lucide-react';
import { Transport, Student } from '../../types';
import { transportApi } from '../../api/transportApi';
import { transportFeeApi, TransportFeePayment } from '../../api/transportFeeApi';
import { exportToExcel, exportToPrintablePDF } from '../../utils/exportUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { formatDate } from '../../utils/dateFormatter';

interface TransportPanelProps {
  allStudents: Student[];
  refreshTrigger: number;
  triggerDataRefresh: () => void;
  assignStudentIdPreset?: string | null;
  onClearPreset?: () => void;
  activeSubTab?: string;
  setActiveSubTab?: (tab: string) => void;
}

export const TransportPanel: React.FC<TransportPanelProps> = ({
  allStudents,
  refreshTrigger,
  triggerDataRefresh,
  assignStudentIdPreset,
  onClearPreset,
  activeSubTab,
  setActiveSubTab
}) => {
  // --- SUB-TAB COORDINATOR ---
  const [currentTab, setCurrentTab] = useState<string>('transport-students');

  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (setActiveSubTab) {
      setActiveSubTab(tab);
    }
  };

  // --- CORE DATA STATES ---
  const [transports, setTransports] = useState<Transport[]>([]);
  const [payments, setPayments] = useState<TransportFeePayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);

  // --- GENERAL CONSTANTS ---
  const classesList = [
    'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'
  ];
  const standardRoutes = ['Route 1', 'Route 2', 'Route 3', 'Route 4'];
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const yearsList = ['2026', '2025'];

  // Current Calendar Settings (default filters/collection)
  const currentCalendarMonth = monthsList[new Date().getMonth()];
  const currentCalendarYear = String(new Date().getFullYear());

  // --- GENERAL SEARCH & FILTER STATES ---
  // Subtab 1: Transport Students
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [routeFilter, setRouteFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Subtab 2: Transport Fee Collection
  const [colSearchQuery, setColSearchQuery] = useState('');
  const [colRouteFilter, setColRouteFilter] = useState('All');
  const [colClassFilter, setColClassFilter] = useState('All');
  const [colStatusFilter, setColStatusFilter] = useState('All');
  const [colMonthFilter, setColMonthFilter] = useState(currentCalendarMonth);
  const [colYearFilter, setColYearFilter] = useState(currentCalendarYear);

  // Subtab 3: Payment History
  const [histSearchQuery, setHistSearchQuery] = useState('');
  const [histRouteFilter, setHistRouteFilter] = useState('All');
  const [histMonthFilter, setHistMonthFilter] = useState('All');
  const [histYearFilter, setHistYearFilter] = useState('All');
  const [histMethodFilter, setHistMethodFilter] = useState('All');

  // Subtab 5: Reports Panel States
  const [reportType, setReportType] = useState<'monthly' | 'pending' | 'route' | 'student'>('monthly');
  const [repMonth, setRepMonth] = useState(currentCalendarMonth);
  const [repYear, setRepYear] = useState(currentCalendarYear);
  const [repRoute, setRepRoute] = useState('Route 1');
  const [repStudentSearch, setRepStudentSearch] = useState('');

  // --- PAGINATION & SORTING STATES ---
  const [histSortField, setHistSortField] = useState<'studentName' | 'amount' | 'date' | 'month' | 'routeName'>('date');
  const [histSortOrder, setHistSortOrder] = useState<'asc' | 'desc'>('desc');
  const [histPage, setHistPage] = useState(1);
  const [histLimit, setHistLimit] = useState(10);

  const [colPage, setColPage] = useState(1);
  const [colLimit, setColLimit] = useState(10);

  const [studPage, setStudPage] = useState(1);
  const [studLimit, setStudLimit] = useState(10);

  // --- MODALS & FORM STATES ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Form Fields: Add/Edit Transport
  const [formStudentId, setFormStudentId] = useState('');
  const [formRouteName, setFormRouteName] = useState('Route 1');
  const [formPickupPoint, setFormPickupPoint] = useState('');
  const [formMonthlyCharge, setFormMonthlyCharge] = useState('1150');
  const [formJoiningDate, setFormJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Active records to modify
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null);
  const [deletingTransport, setDeletingTransport] = useState<Transport | null>(null);

  // Form Fields: Collect Fee
  const [feeStudent, setFeeStudent] = useState<Transport | null>(null);
  const [feeMonth, setFeeMonth] = useState(currentCalendarMonth);
  const [feeYear, setFeeYear] = useState(currentCalendarYear);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeMethod, setFeeMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('Cash');
  const [feeRemarks, setFeeRemarks] = useState('');
  const [collectLoading, setCollectLoading] = useState(false);
  const [collectSuccessMessage, setCollectSuccessMessage] = useState('');

  // Active Receipt to view/print
  const [activeReceipt, setActiveReceipt] = useState<TransportFeePayment | null>(null);

  // --- LOAD SYSTEM DATA ---
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const transList = await transportApi.getTransports();
      setTransports(transList);
      if (transList.length > 0) {
        setSelectedTransport(transList[0]);
      }
      
      const histList = await transportFeeApi.getHistory();
      setPayments(histList);
    } catch (e) {
      console.error('Failed to load transport module rosters or transaction ledgers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, refreshTrigger]);

  // Handle Preset Student assignment from external trigger (Student Profile Integration)
  useEffect(() => {
    if (!assignStudentIdPreset) return;

    setFormStudentId(assignStudentIdPreset);
    setFormRouteName("Route 1");
    setFormPickupPoint("");
    setFormMonthlyCharge("1150");
    setFormJoiningDate(new Date().toISOString().split("T")[0]);
    setFormStatus("Active");
    setFormErrors({});
    setIsAddModalOpen(true);
}, [assignStudentIdPreset]);

const matchedStudent = useMemo(
    () =>
        allStudents.find(
            s => s.id === formStudentId
        ),
    [allStudents, formStudentId]
);

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    if (onClearPreset) {
      onClearPreset();
    }
  };

  // --- BUSINESS RULE HELPER METHODS ---
  const getStudentHistory = (studentId: string) => {
    return payments.filter(p => p.studentId === studentId);
  };

  const getStudentLastPaidMonth = (studentId: string): string => {
    const studentPays = getStudentHistory(studentId);
    if (studentPays.length === 0) return 'Never Paid';
    
    // Sort payments by date desc to get the last one
    const sorted = [...studentPays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return `${sorted[0].month} ${sorted[0].year}`;
  };

  const checkStudentPaymentStatus = (studentId: string, month: string, year: string): 'Paid' | 'Pending' => {
    const hasPaid = payments.some(
      p => p.studentId === studentId && p.month === month && p.year === year
    );
    return hasPaid ? 'Paid' : 'Pending';
  };

  // --- STATS COMPUTATION FOR DASHBOARD ---
  const dashboardStats = useMemo(() => {
    const activeTransports = transports.filter(t => t.status === 'Active');
    const totalTransportStudents = activeTransports.length;

    // Filter today's payments
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCollection = payments
      .filter(p => p.date.split('T')[0] === todayStr)
      .reduce((sum, p) => sum + p.amount, 0);

    // Filter current month payments
    const currentMonthCollection = payments
      .filter(p => p.month === currentCalendarMonth && p.year === currentCalendarYear)
      .reduce((sum, p) => sum + p.amount, 0);

    // Pending collection for current calendar month
    const totalExpectedCurrentMonth = activeTransports.reduce((sum, t) => sum + (t.monthlyCharge || 0), 0);
    const pendingCollection = Math.max(0, totalExpectedCurrentMonth - currentMonthCollection);

    return {
      totalTransportStudents,
      todayCollection,
      currentMonthCollection,
      pendingCollection
    };
  }, [transports, payments, currentCalendarMonth, currentCalendarYear]);

  // --- TAB 1: TRANSPORT STUDENTS FILTERED LIST ---
  const filteredTransports = useMemo(() => {
    return transports.filter(t => {
      const matchesSearch = !searchQuery ||
        (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.admissionNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.routeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.pickupPoint || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = classFilter === 'All' || (t.className || '').startsWith(classFilter);
      const matchesRoute = routeFilter === 'All' || t.routeName === routeFilter;
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;

      return matchesSearch && matchesClass && matchesRoute && matchesStatus;
    });
  }, [transports, searchQuery, classFilter, routeFilter, statusFilter]);

  // Paginated transports
  const paginatedTransports = useMemo(() => {
    const start = (studPage - 1) * studLimit;
    return filteredTransports.slice(start, start + studLimit);
  }, [filteredTransports, studPage, studLimit]);

  // --- TAB 2: TRANSPORT FEE COLLECTION FILTERED LIST ---
  const feeCollectionRoster = useMemo(() => {
    // Only display active students using transport
    const activeTransports = transports.filter(t => t.status === 'Active');
    
    return activeTransports.map(t => {
      const status = checkStudentPaymentStatus(t.studentId, colMonthFilter, colYearFilter);
      const lastPaidMonth = getStudentLastPaidMonth(t.studentId);
      
      return {
        transport: t,
        lastPaidMonth,
        status
      };
    }).filter(row => {
      const t = row.transport;
      const matchesSearch = !colSearchQuery ||
        (t.name || '').toLowerCase().includes(colSearchQuery.toLowerCase()) ||
        (t.admissionNo || '').toLowerCase().includes(colSearchQuery.toLowerCase());
      
      const matchesRoute = colRouteFilter === 'All' || t.routeName === colRouteFilter;
      const matchesClass = colClassFilter === 'All' || (t.className || '').startsWith(colClassFilter);
      const matchesStatus = colStatusFilter === 'All' || row.status === colStatusFilter;

      return matchesSearch && matchesRoute && matchesClass && matchesStatus;
    });
  }, [transports, payments, colSearchQuery, colRouteFilter, colClassFilter, colStatusFilter, colMonthFilter, colYearFilter]);

  // Paginated fee collection roster
  const paginatedFeeRoster = useMemo(() => {
    const start = (colPage - 1) * colLimit;
    return feeCollectionRoster.slice(start, start + colLimit);
  }, [feeCollectionRoster, colPage, colLimit]);

  // --- TAB 3: PAYMENT HISTORY FILTERED & SORTED LIST ---
  const processedPayments = useMemo(() => {
    let list = [...payments];

    // Search (Student name, Admission No, Receipt Number)
    if (histSearchQuery.trim()) {
      const q = histSearchQuery.toLowerCase();
      list = list.filter(p => 
        (p.studentName || '').toLowerCase().includes(q) ||
        (p.admissionNo || '').toLowerCase().includes(q) ||
        (p.receiptNo || '').toLowerCase().includes(q)
      );
    }

    // Route filter
    if (histRouteFilter !== 'All') {
      list = list.filter(p => p.routeName === histRouteFilter);
    }

    // Month filter
    if (histMonthFilter !== 'All') {
      list = list.filter(p => p.month === histMonthFilter);
    }

    // Year filter
    if (histYearFilter !== 'All') {
      list = list.filter(p => p.year === histYearFilter);
    }

    // Payment Method filter
    if (histMethodFilter !== 'All') {
      list = list.filter(p => p.paymentMethod === histMethodFilter);
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (histSortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (histSortField === 'studentName') {
        comparison = (a.studentName || '').localeCompare(b.studentName || '');
      } else if (histSortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (histSortField === 'month') {
        comparison = monthsList.indexOf(a.month) - monthsList.indexOf(b.month);
      } else if (histSortField === 'routeName') {
        comparison = (a.routeName || '').localeCompare(b.routeName || '');
      }

      return histSortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [payments, histSearchQuery, histRouteFilter, histMonthFilter, histYearFilter, histMethodFilter, histSortField, histSortOrder]);

  const paginatedPayments = useMemo(() => {
    const start = (histPage - 1) * histLimit;
    return processedPayments.slice(start, start + histLimit);
  }, [processedPayments, histPage, histLimit]);

  // --- EXPORT METADATA CHANGER ---
  const handleExportPaymentsExcel = () => {
    const headers = ['Receipt No', 'Student', 'Route Name', 'Month', 'Year', 'Amount Paid (₹)', 'Payment Method', 'Payment Date'];
    const keys = ['receiptNo', 'studentName', 'routeName', 'month', 'year', 'amount', 'paymentMethod', 'date'];
    
    const formattedList = processedPayments.map(p => ({
      ...p,
      date: formatDate(p.date)
    }));

    exportToExcel(formattedList, headers, keys, `Transport_Payments_Audit_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPaymentsPDF = () => {
    const headers = ['Receipt No', 'Student Name / Adm', 'Route Name', 'Month/Year', 'Amount Paid', 'Method', 'Date'];
    const rows = processedPayments.map(p => [
      p.receiptNo,
      `${p.studentName}\n(${p.admissionNo})`,
      p.routeName,
      `${p.month} ${p.year}`,
      `₹${p.amount}`,
      p.paymentMethod,
      formatDate(p.date)
    ]);

    exportToPrintablePDF('Transport Fee Collection Ledgers & Receipts history', headers, rows, 'transport_payments_report');
  };

  // --- ACTIONS: STUDENT ASSIGNMENT ---
  const handleSelectRow = (t: Transport) => {
    setSelectedTransport(t);
  };

  const handleEditClick = (t: Transport, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTransport(t);
    setFormStudentId(t.studentId);
    setFormRouteName(t.routeName);
    setFormPickupPoint(t.pickupPoint);
    setFormMonthlyCharge(String(t.monthlyCharge));
    setFormJoiningDate(t.joiningDate);
    setFormStatus(t.status);
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (t: Transport, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingTransport(t);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransport) return;
    try {
      await transportApi.deleteTransport(deletingTransport.id);
      setTransports(prev => prev.filter(t => t.id !== deletingTransport.id));
      if (selectedTransport?.id === deletingTransport.id) {
        setSelectedTransport(null);
      }
      setIsDeleteConfirmOpen(false);
      setDeletingTransport(null);
      triggerDataRefresh();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formStudentId) errors.studentId = 'Please select a student';
    if (!formPickupPoint.trim()) errors.pickupPoint = 'Pickup point is required';
    if (!formMonthlyCharge || Number(formMonthlyCharge) <= 0) errors.monthlyCharge = 'Enter a valid monthly charge';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const matchedStudent = allStudents.find(s => s.id === formStudentId);
    if (!matchedStudent) return;

    const transportData = {
      studentId: formStudentId,
      name: matchedStudent.name,
      email: matchedStudent.email || `${matchedStudent.name.toLowerCase().replace(/\s/g, '')}@pansy.edu`,
      admissionNo: matchedStudent.admissionNo || matchedStudent.rollNumber || 'N/A',
      className: matchedStudent.class ? `${matchedStudent.class}-${matchedStudent.section || 'A'}` : 'General',
      routeName: formRouteName,
      pickupPoint: formPickupPoint,
      monthlyCharge: Number(formMonthlyCharge),
      joiningDate: formJoiningDate,
      status: formStatus
    };

    try {
      const newRec = await transportApi.addTransport(transportData);
      setTransports(prev => [...prev, newRec]);
      setSelectedTransport(newRec);
      handleCloseAddModal();
      triggerDataRefresh();
    } catch (err) {
      console.error('Add failed:', err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransport) return;

    const errors: Record<string, string> = {};
    if (!formPickupPoint.trim()) errors.pickupPoint = 'Pickup point is required';
    if (!formMonthlyCharge || Number(formMonthlyCharge) <= 0) errors.monthlyCharge = 'Enter a valid monthly charge';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const transportData = {
      routeName: formRouteName,
      pickupPoint: formPickupPoint,
      monthlyCharge: Number(formMonthlyCharge),
      joiningDate: formJoiningDate,
      status: formStatus
    };

    try {
      const updated = await transportApi.updateTransport(editingTransport.id, transportData);
      setTransports(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
      if (selectedTransport?.id === updated.id) {
        setSelectedTransport({ ...selectedTransport, ...updated });
      }
      setIsEditModalOpen(false);
      setEditingTransport(null);
      triggerDataRefresh();
    } catch (err) {
      console.error('Edit failed:', err);
    }
  };

  // --- ACTIONS: FEE COLLECTION ---
  const handleOpenCollectFee = (studentTransport: Transport) => {
    setFeeStudent(studentTransport);
    setFeeMonth(currentCalendarMonth);
    setFeeYear(currentCalendarYear);
    setFeeAmount(String(studentTransport.monthlyCharge));
    setFeeMethod('Cash');
    setFeeRemarks('');
    setCollectSuccessMessage('');
    setIsCollectFeeOpen(true);
  };

  const handleCollectFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeStudent) return;
    
    setCollectLoading(true);
    try {
      const feeData = {
        studentId: feeStudent.studentId,
        studentName: feeStudent.name || '',
        admissionNo: feeStudent.admissionNo || '',
        className: feeStudent.className || '',
        routeName: feeStudent.routeName,
        pickupPoint: feeStudent.pickupPoint,
        monthlyCharge: feeStudent.monthlyCharge,
        month: feeMonth,
        year: feeYear,
        amount: Number(feeAmount),
        paymentMethod: feeMethod,
        remarks: feeRemarks.trim() || undefined
      };

      const collectedRecord = await transportFeeApi.collectFee(feeData);
      
      // Update state
      setPayments(prev => [collectedRecord, ...prev]);
      
      // Toast notification & trigger auto receipt
      setCollectSuccessMessage('Transport Fee Collected Successfully');
      setActiveReceipt(collectedRecord);
      
      // Auto-close of collection modal shortly, and popup Receipt View
      setTimeout(() => {
        setIsCollectFeeOpen(false);
        setIsReceiptOpen(true);
        setCollectSuccessMessage('');
      }, 1000);

      triggerDataRefresh();
    } catch (err) {
      console.error('Failed to collect transport fee:', err);
      alert('An error occurred during fee processing. Please try again.');
    } finally {
      setCollectLoading(false);
    }
  };

  // --- PRINTER UTILITIES ---
  const triggerPrintReceipt = (receipt: TransportFeePayment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipts.');
      return;
    }
    const dateStr = formatDate(receipt.date);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt.receiptNo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              padding: 40px;
              max-width: 550px;
              margin: 40px auto;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            }
            .header-box {
              text-align: center;
              border-bottom: 2px dashed #cbd5e1;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .school-name {
              font-size: 20px;
              font-weight: 800;
              color: #1e3a8a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0;
            }
            .address-tag {
              font-size: 11px;
              color: #64748b;
              margin: 4px 0 0 0;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .receipt-badge {
              display: inline-block;
              background-color: #eff6ff;
              border: 1px solid #bfdbfe;
              color: #1d4ed8;
              font-size: 12px;
              font-weight: 700;
              padding: 6px 16px;
              border-radius: 9999px;
              margin-top: 12px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #f1f5f9;
              font-size: 13px;
            }
            .detail-label {
              color: #64748b;
              font-weight: 500;
            }
            .detail-value {
              color: #0f172a;
              font-weight: 700;
            }
            .amount-card {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 16px;
              border-radius: 8px;
              margin-top: 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .amount-label {
              font-size: 13px;
              font-weight: 700;
              color: #1e3a8a;
            }
            .amount-value {
              font-size: 22px;
              font-weight: 900;
              color: #059669;
            }
            .footer-notes {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              margin-top: 30px;
              border-top: 1px solid #e2e8f0;
              padding-top: 16px;
              line-height: 1.5;
            }
            @media print {
              body {
                border: none;
                box-shadow: none;
                margin: 0;
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <h1 class="school-name">The School of Pansy Flowers</h1>
            <p class="address-tag">Changotola, Balaghat, MP • Student Transport Service</p>
            <div class="receipt-badge">TRANSPORT SERVICE RECEIPT: ${receipt.receiptNo}</div>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Student Name</span>
            <span class="detail-value">${receipt.studentName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Admission Number</span>
            <span class="detail-value">${receipt.admissionNo}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Class & Section</span>
            <span class="detail-value">${receipt.className}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Designated Route</span>
            <span class="detail-value">${receipt.routeName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Pickup Point</span>
            <span class="detail-value">${receipt.pickupPoint}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Billing Cycle (Month/Year)</span>
            <span class="detail-value">${receipt.month} ${receipt.year}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Mode</span>
            <span class="detail-value">${receipt.paymentMethod}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Transaction Timestamp</span>
            <span class="detail-value">${dateStr}</span>
          </div>
          ${receipt.remarks ? `
          <div class="detail-row">
            <span class="detail-label">Remarks</span>
            <span class="detail-value">${receipt.remarks}</span>
          </div>` : ''}

          <div class="amount-card">
            <span class="amount-label">TOTAL AMOUNT PAID</span>
            <span class="amount-value">₹${receipt.amount}</span>
          </div>

          <div class="footer-notes">
            <p>Thank you for using our transport services. Please keep this copy for your audits.</p>
            <p>© The School of Pansy Flowers ERP System</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Filter students that do NOT already have transport assigned
const unassignedStudents = useMemo(() => {
    const assignedIds = new Set(
        transports.map(t => t.studentId)
    );

    return allStudents.filter(s => {
        if (s.id === formStudentId) {
            return true;
        }

        return !assignedIds.has(s.id);
    });
}, [allStudents, transports, formStudentId]);

  // --- TAB 5: REPORTS GENERATION LOGIC & ROSTERS ---
  const reportRoster = useMemo(() => {
    if (reportType === 'monthly') {
      return payments.filter(p => p.month === repMonth && p.year === repYear);
    } else if (reportType === 'pending') {
      // Find active transport students who have NOT paid for the selected month & year
      const activeTransports = transports.filter(t => t.status === 'Active');
      return activeTransports.filter(t => {
        const isPaid = payments.some(
          p => p.studentId === t.studentId && p.month === repMonth && p.year === repYear
        );
        return !isPaid;
      });
    } else if (reportType === 'route') {
      // Group active students and collections by route
      const routesList = [...standardRoutes];
      return routesList.map(route => {
        const routeTransports = transports.filter(t => t.routeName === route && t.status === 'Active');
        const routeCollections = payments
          .filter(p => p.routeName === route && p.month === repMonth && p.year === repYear)
          .reduce((sum, p) => sum + p.amount, 0);
        
        return {
          route,
          studentsCount: routeTransports.length,
          collection: routeCollections
        };
      });
    } else if (reportType === 'student') {
      if (!repStudentSearch.trim()) return [];
      const q = repStudentSearch.toLowerCase();
      return payments.filter(p => 
        (p.studentName || '').toLowerCase().includes(q) ||
        (p.admissionNo || '').toLowerCase().includes(q)
      );
    }
    return [];
  }, [reportType, transports, payments, repMonth, repYear, repStudentSearch]);

  const handleExportReportExcel = () => {
    let headers: string[] = [];
    let keys: string[] = [];
    let titleStr = '';

    if (reportType === 'monthly') {
      headers = ['Student Name', 'Admission No', 'Route Name', 'Amount (₹)', 'Payment Date'];
      keys = ['studentName', 'admissionNo', 'routeName', 'amount', 'date'];
      titleStr = `Monthly_Report_${repMonth}_${repYear}`;
    } else if (reportType === 'pending') {
      headers = ['Student Name', 'Admission No', 'Class', 'Route Name', 'Monthly Charge (₹)'];
      keys = ['name', 'admissionNo', 'className', 'routeName', 'monthlyCharge'];
      titleStr = `Pending_Transport_Report_${repMonth}_${repYear}`;
    } else if (reportType === 'route') {
      headers = ['Route Name', 'Active Students Count', 'Month Collection (₹)'];
      keys = ['route', 'studentsCount', 'collection'];
      titleStr = `Route_Analysis_Report_${repMonth}_${repYear}`;
    } else {
      headers = ['Receipt No', 'Month/Year', 'Amount (₹)', 'Payment Method', 'Payment Date'];
      keys = ['receiptNo', 'month', 'amount', 'paymentMethod', 'date'];
      titleStr = `Student_Ledger_Report`;
    }

    const formatted = reportRoster.map(item => {
      if (item.date) {
        return { ...item, date: formatDate(item.date) };
      }
      return item;
    });

    exportToExcel(formatted, headers, keys, titleStr);
  };

  const handleExportReportPDF = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let titleStr = '';

    if (reportType === 'monthly') {
      headers = ['Student Name', 'Admission No', 'Route Name', 'Amount', 'Payment Date'];
      rows = reportRoster.map((item: any) => [
        item.studentName,
        item.admissionNo,
        item.routeName,
        `₹${item.amount}`,
        formatDate(item.date)
      ]);
      titleStr = `Monthly Transport Collection Report: ${repMonth} ${repYear}`;
    } else if (reportType === 'pending') {
      headers = ['Student Name', 'Admission No', 'Class', 'Route Name', 'Monthly Charge'];
      rows = reportRoster.map((item: any) => [
        item.name,
        item.admissionNo,
        item.className || 'N/A',
        item.routeName,
        `₹${item.monthlyCharge}`
      ]);
      titleStr = `Pending Transport Students Report: ${repMonth} ${repYear}`;
    } else if (reportType === 'route') {
      headers = ['Route Name', 'Active Students Using Service', 'Collections Raised'];
      rows = reportRoster.map((item: any) => [
        item.route,
        `${item.studentsCount} Students`,
        `₹${item.collection}`
      ]);
      titleStr = `Route Wise Performance Report: ${repMonth} ${repYear}`;
    } else {
      headers = ['Receipt No', 'Month/Year', 'Amount Paid', 'Payment Method', 'Payment Date'];
      rows = reportRoster.map((item: any) => [
        item.receiptNo,
        `${item.month} ${item.year}`,
        `₹${item.amount}`,
        item.paymentMethod,
        formatDate(item.date)
      ]);
      titleStr = `Individual Student Payment History Ledger`;
    }

    exportToPrintablePDF(titleStr, headers, rows, 'transport_report');
  };

  return (
    <div className="space-y-6">
      
      {/* =========================================
                     TOP BAR NAVIGATION
         ========================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Bus className="text-blue-600 h-5 w-5" />
            Transport Services Hub
          </h2>
          <p className="text-xs text-slate-450 mt-1 font-semibold">
            Manage route registrations, track independent transport collections, process receipts, and audit ledgers.
          </p>
        </div>

        {/* Secondary Navigation Rail */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start lg:self-auto shadow-2xs border border-slate-200/50">
          <button
            onClick={() => handleTabChange('transport-students')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'transport-students'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            Transport Students
          </button>
          <button
            onClick={() => handleTabChange('transport-fee-collection')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'transport-fee-collection'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            Fee Collection
          </button>
          <button
            onClick={() => handleTabChange('transport-payment-history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'transport-payment-history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            Payment History
          </button>
          <button
            onClick={() => handleTabChange('transport-dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'transport-dashboard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50/50'
            }`}
          >
            Dashboard & Reports
          </button>
        </div>
      </div>

      {/* =========================================
                     RENDER TAB 4: DASHBOARD
         ========================================= */}
      {currentTab === 'transport-dashboard' && (
        <div className="space-y-6">
          {/* --- KPI STATS CARDS --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
            <Card hoverEffect className="flex items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-xl shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                <Users size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Commuters</span>
                <span className="text-xl font-extrabold text-slate-800 mt-0.5 block">{dashboardStats.totalTransportStudents} Students</span>
              </div>
            </Card>

            <Card hoverEffect className="flex items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-xl shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Today's Collections</span>
                <span className="text-xl font-extrabold text-slate-800 mt-0.5 block">₹{(dashboardStats.todayCollection).toLocaleString()}</span>
              </div>
            </Card>

            <Card hoverEffect className="flex items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-xl shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0 border border-violet-100 border-dashed">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Monthly Collection</span>
                <span className="text-xl font-extrabold text-slate-800 mt-0.5 block">₹{(dashboardStats.currentMonthCollection).toLocaleString()}</span>
              </div>
            </Card>

            <Card hoverEffect className="flex items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-xl shadow-2xs">
              <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100">
                <AlertTriangle size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Outstanding Balance</span>
                <span className="text-xl font-extrabold text-slate-800 mt-0.5 block">₹{(dashboardStats.pendingCollection).toLocaleString()}</span>
              </div>
            </Card>
          </div>

          {/* --- GRAPHICS & CHARTS PANEL --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
            {/* Monthly Trend - Custom SVG */}
            <Card className="bg-white border border-slate-200 p-5 rounded-xl">
              <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-blue-600" />
                Monthly Revenue Performance (2026)
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mb-6">Cumulative transport collections aggregated by billing cycle.</p>
              
              {/* Responsive SVG Bar Chart */}
              <div className="h-[200px] w-full flex items-end justify-between px-2 pt-2 border-b border-slate-200">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m) => {
                  // Compute payment volume
                  const monthName = m === 'Jan' ? 'January' : m === 'Feb' ? 'February' : m === 'Mar' ? 'March' : m === 'Apr' ? 'April' : m === 'May' ? 'May' : m === 'Jun' ? 'June' : 'July';
                  const total = payments
                    .filter(p => p.month === monthName)
                    .reduce((sum, p) => sum + p.amount, 0);
                  
                  const maxCol = Math.max(...['January', 'February', 'March', 'April', 'May', 'June', 'July'].map(mo => 
                    payments.filter(p => p.month === mo).reduce((sum, p) => sum + p.amount, 0)
                  )) || 1;

                  const percentHeight = Math.max(8, (total / maxCol) * 85);

                  return (
                    <div key={m} className="flex flex-col items-center flex-1 group">
                      <span className="text-[10px] font-extrabold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                        ₹{total}
                      </span>
                      <div 
                        style={{ height: `${percentHeight}%` }} 
                        className="w-8 bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all duration-300 relative"
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity rounded-t-md" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 mt-2">{m}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Route wise distribution - Horizontal Bar List */}
            <Card className="bg-white border border-slate-200 p-5 rounded-xl">
              <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <RouteIcon size={16} className="text-violet-600" />
                Route Wise Commuter Density & Yield
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mb-6">Total raised billing amounts and active registered commuters by route.</p>

              <div className="space-y-4">
                {standardRoutes.map(route => {
                  const routeCommuters = transports.filter(t => t.routeName === route && t.status === 'Active');
                  const routeRevenue = payments.filter(p => p.routeName === route).reduce((sum, p) => sum + p.amount, 0);
                  const maxRevenue = Math.max(...standardRoutes.map(r => payments.filter(p => p.routeName === r).reduce((sum, p) => sum + p.amount, 0))) || 1;
                  
                  const barPercent = Math.max(5, (routeRevenue / maxRevenue) * 100);

                  return (
                    <div key={route} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{route} ({routeCommuters.length} Active Students)</span>
                        <span>₹{routeRevenue.toLocaleString()}</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${barPercent}%` }} 
                          className="h-full bg-violet-500 rounded-full transition-all duration-500" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* --- AD-HOC REPORTS GENERATION STATION --- */}
          <Card className="bg-white border border-slate-200 p-6 rounded-xl">
            <h3 className="text-sm font-extrabold text-slate-800 mb-2 flex items-center gap-2">
              <FileCheck className="text-blue-600" />
              Dynamic Report Compiler
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Compile, filter, preview, and instantly download customized school transport audit reports.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-slate-100 pb-5">
              {/* Type Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report Subject</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="monthly">Monthly Collection</option>
                  <option value="pending">Pending Commuters</option>
                  <option value="route">Route Performance</option>
                  <option value="student">Student Ledger</option>
                </select>
              </div>

              {/* Dynamic Inputs based on type */}
              {reportType !== 'student' ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Month</label>
                    <select
                      value={repMonth}
                      onChange={(e) => setRepMonth(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                    >
                      {monthsList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Year</label>
                    <select
                      value={repYear}
                      onChange={(e) => setRepYear(e.target.value)}
                      className="px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                    >
                      {yearsList.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search Student Name or Adm No</label>
                  <input
                    type="text"
                    value={repStudentSearch}
                    onChange={(e) => setRepStudentSearch(e.target.value)}
                    placeholder="Enter student name or admission number..."
                    className="px-3.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg text-xs font-semibold text-slate-700 outline-hidden"
                  />
                </div>
              )}

              {/* Exports Trigger */}
              <div className="flex items-end gap-2">
                <Button 
                  onClick={handleExportReportExcel} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-slate-700"
                  leftIcon={<FileSpreadsheet size={14} className="text-emerald-600" />}
                >
                  Excel
                </Button>
                <Button 
                  onClick={handleExportReportPDF} 
                  size="sm" 
                  className="flex-1"
                  leftIcon={<Printer size={14} />}
                >
                  Print / PDF
                </Button>
              </div>
            </div>

            {/* Roster Preview Grid */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                  Live Report Preview ({reportRoster.length} matches)
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">Report output displays current filters only</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                    {reportType === 'monthly' && (
                      <tr className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Admission No</th>
                        <th className="p-3">Route</th>
                        <th className="p-3">Amount Paid</th>
                        <th className="p-3">Payment Date</th>
                      </tr>
                    )}
                    {reportType === 'pending' && (
                      <tr className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Admission No</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">Route</th>
                        <th className="p-3">Monthly Charge</th>
                      </tr>
                    )}
                    {reportType === 'route' && (
                      <tr className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="p-3">Route Name</th>
                        <th className="p-3">Active Commuters</th>
                        <th className="p-3">Total Monthly Collection</th>
                      </tr>
                    )}
                    {reportType === 'student' && (
                      <tr className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="p-3">Receipt No</th>
                        <th className="p-3">Service Month</th>
                        <th className="p-3">Amount Paid</th>
                        <th className="p-3">Payment Method</th>
                        <th className="p-3">Date</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {reportRoster.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs font-bold text-slate-400">
                          No matching records found. Refine your query.
                        </td>
                      </tr>
                    ) : (
                      reportRoster.map((item: any, idx) => (
                        <tr key={idx} className="hover:bg-slate-55/50">
                          {reportType === 'monthly' && (
                            <>
                              <td className="p-3 font-bold text-slate-800">{item.studentName}</td>
                              <td className="p-3 text-slate-650 font-mono">{item.admissionNo}</td>
                              <td className="p-3 text-slate-500">{item.routeName}</td>
                              <td className="p-3 font-bold text-slate-800">₹{item.amount}</td>
                              <td className="p-3 text-slate-400 font-medium">
                                {formatDate(item.date)}
                              </td>
                            </>
                          )}
                          {reportType === 'pending' && (
                            <>
                              <td className="p-3 font-bold text-slate-800">{item.name}</td>
                              <td className="p-3 text-slate-650 font-mono">{item.admissionNo}</td>
                              <td className="p-3 text-slate-500">{item.className || 'N/A'}</td>
                              <td className="p-3 text-slate-500">{item.routeName}</td>
                              <td className="p-3 font-bold text-rose-600">₹{item.monthlyCharge}</td>
                            </>
                          )}
                          {reportType === 'route' && (
                            <>
                              <td className="p-3 font-bold text-slate-800">{item.route}</td>
                              <td className="p-3 text-slate-650 font-medium">{item.studentsCount} Active Students</td>
                              <td className="p-3 font-bold text-emerald-600">₹{item.collection}</td>
                            </>
                          )}
                          {reportType === 'student' && (
                            <>
                              <td className="p-3 font-bold text-slate-850 font-mono">{item.receiptNo}</td>
                              <td className="p-3 text-slate-650 font-medium">{item.month} {item.year}</td>
                              <td className="p-3 font-extrabold text-slate-850">₹{item.amount}</td>
                              <td className="p-3 text-slate-500 font-bold">{item.paymentMethod}</td>
                              <td className="p-3 text-slate-400">
                                {formatDate(item.date)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================
                 RENDER TAB 1: TRANSPORT STUDENTS
         ========================================= */}
      {currentTab === 'transport-students' && (
        <div className="space-y-6">
          {/* --- SEARCH & FILTERS --- */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-3xs select-none">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Student name, Admission No, Route..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg text-xs font-semibold text-slate-700 outline-hidden transition-all duration-200 placeholder:text-slate-400"
              />
            </div>

            {/* Filters Group */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Class:</span>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 cursor-pointer outline-hidden min-w-[90px]"
                >
                  <option value="All">All Grades</option>
                  {classesList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Route Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Route:</span>
                <select
                  value={routeFilter}
                  onChange={(e) => setRouteFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 cursor-pointer outline-hidden min-w-[90px]"
                >
                  <option value="All">All Routes</option>
                  {standardRoutes.map(rt => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 cursor-pointer outline-hidden min-w-[95px]"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button 
                  onClick={() => {
                    setSearchQuery('');
                    setClassFilter('All');
                    setRouteFilter('All');
                    setStatusFilter('All');
                  }} 
                  variant="outline" 
                  size="xs" 
                  className="text-slate-650"
                >
                  Reset
                </Button>
                <Button 
                  onClick={() => setIsAddModalOpen(true)} 
                  size="xs" 
                  leftIcon={<Plus size={13} />}
                >
                  Add Student
                </Button>
              </div>
            </div>
          </div>

          {/* --- STUDENT ROSTER TABLE --- */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider sticky top-0">
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Admission No</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Route</th>
                    <th className="p-4">Pickup Point</th>
                    <th className="p-4 text-right">Monthly Charge</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-xs font-bold text-slate-400">
                        <LoaderIcon className="animate-spin inline-block mr-2 text-blue-500" size={16} /> Loading Transport Roster...
                      </td>
                    </tr>
                  ) : filteredTransports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-xs font-bold text-slate-450">
                        No students are currently matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransports.map((t) => {
                      const isSelected = selectedTransport?.id === t.id;
                      return (
                        <tr 
                          key={t.id} 
                          onClick={() => handleSelectRow(t)}
                          className={`group hover:bg-slate-50/50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/20' : ''}`}
                        >
                          <td className="p-4 font-bold text-slate-800">{t.name}</td>
                          <td className="p-4 font-mono text-slate-500 font-semibold">{t.admissionNo}</td>
                          <td className="p-4 font-semibold text-slate-600">{t.className}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-750 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                              <RouteIcon size={10} />
                              {t.routeName}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">{t.pickupPoint}</td>
                          <td className="p-4 text-right font-black text-slate-800">₹{t.monthlyCharge}</td>
                          <td className="p-4 text-center">
                            <Badge variant={t.status === 'Active' ? 'success' : 'neutral'}>
                              {t.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {t.status === 'Active' && (
                                <button
                                  onClick={() => handleOpenCollectFee(t)}
                                  className="text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-md transition-all shadow-3xs cursor-pointer"
                                >
                                  Collect Fee
                                </button>
                              )}
                              <button
                                onClick={(e) => handleEditClick(t, e)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-50 cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(t, e)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-50 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredTransports.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between select-none">
                <div className="text-xs text-slate-450 font-semibold">
                  Showing <span className="font-bold text-slate-700">{Math.min(filteredTransports.length, (studPage - 1) * studLimit + 1)}</span> to{' '}
                  <span className="font-bold text-slate-700">{Math.min(filteredTransports.length, studPage * studLimit)}</span> of{' '}
                  <span className="font-bold text-slate-700">{filteredTransports.length}</span> students
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={studLimit}
                    onChange={(e) => {
                      setStudLimit(Number(e.target.value));
                      setStudPage(1);
                    }}
                    className="px-2 py-1 border border-slate-200 hover:border-slate-300 rounded text-xs font-bold text-slate-650 cursor-pointer"
                  >
                    {[10, 20, 50, 100].map(lim => (
                      <option key={lim} value={lim}>{lim} per page</option>
                    ))}
                  </select>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => setStudPage(p => Math.max(1, p - 1))}
                    disabled={studPage === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => setStudPage(p => Math.min(Math.ceil(filteredTransports.length / studLimit), p + 1))}
                    disabled={studPage * studLimit >= filteredTransports.length}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
                 RENDER TAB 2: FEE COLLECTION
         ========================================= */}
      {currentTab === 'transport-fee-collection' && (
        <div className="space-y-6">
          {/* --- SEARCH & FILTERS --- */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex flex-col gap-4 shadow-3xs select-none">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={colSearchQuery}
                  onChange={(e) => setColSearchQuery(e.target.value)}
                  placeholder="Search student Name, Admission No..."
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg text-xs font-semibold text-slate-700 outline-hidden placeholder:text-slate-400"
                />
              </div>

              {/* Route */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Route:</span>
                <select
                  value={colRouteFilter}
                  onChange={(e) => setColRouteFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 cursor-pointer outline-hidden"
                >
                  <option value="All">All Routes</option>
                  {standardRoutes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Class */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Class:</span>
                <select
                  value={colClassFilter}
                  onChange={(e) => setColClassFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 cursor-pointer outline-hidden"
                >
                  <option value="All">All Classes</option>
                  {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Status:</span>
                <select
                  value={colStatusFilter}
                  onChange={(e) => setColStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 cursor-pointer outline-hidden"
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Reset */}
              <div className="flex justify-end items-center">
                <Button 
                  onClick={() => {
                    setColSearchQuery('');
                    setColRouteFilter('All');
                    setColClassFilter('All');
                    setColStatusFilter('All');
                    setColMonthFilter(currentCalendarMonth);
                    setColYearFilter(currentCalendarYear);
                  }} 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-slate-750 font-bold"
                >
                  Reset Filters
                </Button>
              </div>
            </div>

            {/* Billing Month/Year Selector line */}
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
              <span className="text-xs font-black text-slate-800 tracking-wide">Target Billing Period:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Month</span>
                <select
                  value={colMonthFilter}
                  onChange={(e) => setColMonthFilter(e.target.value)}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border-none rounded text-xs font-black cursor-pointer outline-hidden"
                >
                  {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Year</span>
                <select
                  value={colYearFilter}
                  onChange={(e) => setColYearFilter(e.target.value)}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border-none rounded text-xs font-black cursor-pointer outline-hidden"
                >
                  {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <span className="text-[10px] font-bold text-slate-400 ml-auto">
                * Collection and status indicators are compiled dynamically for <strong className="text-blue-650">{colMonthFilter} {colYearFilter}</strong>.
              </span>
            </div>
          </div>

          {/* --- FEE COLLECTION ROSTER TABLE --- */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider sticky top-0">
                    <th className="p-4">Student</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Route</th>
                    <th className="p-4 text-right">Monthly Charge</th>
                    <th className="p-4 text-center">Last Paid Month</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-xs font-bold text-slate-400">
                        <LoaderIcon className="animate-spin inline-block mr-2 text-blue-500" size={16} /> Loading Collection ledgers...
                      </td>
                    </tr>
                  ) : feeCollectionRoster.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-xs font-bold text-slate-400">
                        No active commuters found matching selection query.
                      </td>
                    </tr>
                  ) : (
                    paginatedFeeRoster.map((row) => {
                      const t = row.transport;
                      const isCurrentMonthPaid = row.status === 'Paid' && colMonthFilter === currentCalendarMonth && colYearFilter === currentCalendarYear;
                      
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div>
                              <div className="font-extrabold text-slate-800">{t.name}</div>
                              <div className="text-[10px] text-slate-450 font-mono mt-0.5">Adm: {t.admissionNo}</div>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-550">{t.className}</td>
                          <td className="p-4 text-slate-650 font-medium">{t.routeName}</td>
                          <td className="p-4 text-right font-black text-slate-800">₹{t.monthlyCharge}</td>
                          <td className="p-4 text-center font-bold text-slate-500">{row.lastPaidMonth}</td>
                          <td className="p-4 text-center">
                            {row.status === 'Paid' ? (
                              isCurrentMonthPaid ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                                  Current Month Paid
                                </span>
                              ) : (
                                <Badge variant="success">Paid</Badge>
                              )
                            ) : (
                              <Badge variant="danger">Pending</Badge>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {row.status === 'Paid' ? (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                Receipt Raised
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenCollectFee(t)}
                                className="text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-all shadow-3xs cursor-pointer active:scale-97"
                              >
                                Collect Fee
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {feeCollectionRoster.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between select-none">
                <div className="text-xs text-slate-450 font-semibold">
                  Showing <span className="font-bold text-slate-700">{Math.min(feeCollectionRoster.length, (colPage - 1) * colLimit + 1)}</span> to{' '}
                  <span className="font-bold text-slate-700">{Math.min(feeCollectionRoster.length, colPage * colLimit)}</span> of{' '}
                  <span className="font-bold text-slate-700">{feeCollectionRoster.length}</span> students
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={colLimit}
                    onChange={(e) => {
                      setColLimit(Number(e.target.value));
                      setColPage(1);
                    }}
                    className="px-2 py-1 border border-slate-200 hover:border-slate-300 rounded text-xs font-bold text-slate-650 cursor-pointer"
                  >
                    {[10, 20, 50, 100].map(lim => (
                      <option key={lim} value={lim}>{lim} per page</option>
                    ))}
                  </select>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => setColPage(p => Math.max(1, p - 1))}
                    disabled={colPage === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => setColPage(p => Math.min(Math.ceil(feeCollectionRoster.length / colLimit), p + 1))}
                    disabled={colPage * colLimit >= feeCollectionRoster.length}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
                 RENDER TAB 3: PAYMENT HISTORY
         ========================================= */}
      {currentTab === 'transport-payment-history' && (
        <div className="space-y-6">
          {/* --- SEARCH & FILTERS --- */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex flex-col gap-4 shadow-3xs select-none">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={histSearchQuery}
                  onChange={(e) => setHistSearchQuery(e.target.value)}
                  placeholder="Search Name, Adm, Receipt No..."
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg text-xs font-semibold text-slate-700 outline-hidden placeholder:text-slate-400"
                />
              </div>

              {/* Route */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Route:</span>
                <select
                  value={histRouteFilter}
                  onChange={(e) => setHistRouteFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 cursor-pointer outline-hidden"
                >
                  <option value="All">All Routes</option>
                  {standardRoutes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Month */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Month:</span>
                <select
                  value={histMonthFilter}
                  onChange={(e) => setHistMonthFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 cursor-pointer outline-hidden"
                >
                  <option value="All">All Months</option>
                  {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Method */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Method:</span>
                <select
                  value={histMethodFilter}
                  onChange={(e) => setHistMethodFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 cursor-pointer outline-hidden"
                >
                  <option value="All">All Methods</option>
                  {['Cash', 'UPI', 'Card', 'Bank Transfer'].map(met => <option key={met} value={met}>{met}</option>)}
                </select>
              </div>

              {/* Reset */}
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    setHistSearchQuery('');
                    setHistRouteFilter('All');
                    setHistMonthFilter('All');
                    setHistYearFilter('All');
                    setHistMethodFilter('All');
                  }} 
                  variant="outline" 
                  size="sm" 
                  className="flex-grow text-slate-750 font-bold"
                >
                  Reset
                </Button>
                <Button 
                  onClick={handleExportPaymentsPDF} 
                  size="sm" 
                  className="px-3"
                  title="Export PDF / Print list"
                >
                  <Printer size={14} />
                </Button>
                <Button 
                  onClick={handleExportPaymentsExcel} 
                  variant="outline"
                  size="sm" 
                  className="px-3"
                  title="Export CSV"
                >
                  <FileSpreadsheet size={14} className="text-emerald-600" />
                </Button>
              </div>
            </div>
          </div>

          {/* --- TRANSACTION ROSTER TABLE --- */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider sticky top-0">
                    <th className="p-4">
                      <button 
                        onClick={() => {
                          setHistSortField('date');
                          setHistSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                      >
                        Receipt No
                        <ArrowUpDown size={10} />
                      </button>
                    </th>
                    <th className="p-4">
                      <button 
                        onClick={() => {
                          setHistSortField('studentName');
                          setHistSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                      >
                        Student Name
                        <ArrowUpDown size={10} />
                      </button>
                    </th>
                    <th className="p-4">
                      <button 
                        onClick={() => {
                          setHistSortField('routeName');
                          setHistSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                      >
                        Route Name
                        <ArrowUpDown size={10} />
                      </button>
                    </th>
                    <th className="p-4">
                      <button 
                        onClick={() => {
                          setHistSortField('month');
                          setHistSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                      >
                        Service Month
                        <ArrowUpDown size={10} />
                      </button>
                    </th>
                    <th className="p-4 text-right">
                      <button 
                        onClick={() => {
                          setHistSortField('amount');
                          setHistSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                        }}
                        className="flex items-center gap-1 justify-end w-full hover:text-slate-700 cursor-pointer"
                      >
                        Amount Paid
                        <ArrowUpDown size={10} />
                      </button>
                    </th>
                    <th className="p-4 text-center">Payment Method</th>
                    <th className="p-4 text-center">Payment Date</th>
                    <th className="p-4 text-center">Receipt Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-xs font-bold text-slate-400">
                        <LoaderIcon className="animate-spin inline-block mr-2 text-blue-500" size={16} /> Loading Transaction ledger histories...
                      </td>
                    </tr>
                  ) : processedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-xs font-bold text-slate-400">
                        No transactions found matching selection criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-blue-800">{p.receiptNo}</td>
                        <td className="p-4">
                          <div>
                            <div className="font-extrabold text-slate-800">{p.studentName}</div>
                            <div className="text-[10px] text-slate-450 font-mono">Adm: {p.admissionNo} • {p.className}</div>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-650">{p.routeName}</td>
                        <td className="p-4 font-bold text-slate-600">{p.month} {p.year}</td>
                        <td className="p-4 text-right font-black text-slate-800">₹{p.amount}</td>
                        <td className="p-4 text-center font-bold text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4 text-center text-slate-450 font-semibold">
                          {formatDate(p.date)}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setActiveReceipt(p);
                                setIsReceiptOpen(true);
                              }}
                              className="text-[10px] font-black text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              View Receipt
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              onClick={() => triggerPrintReceipt(p)}
                              className="text-[10px] font-black text-slate-600 hover:text-slate-800 cursor-pointer"
                            >
                              Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {processedPayments.length > 0 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between select-none">
                <div className="text-xs text-slate-450 font-semibold">
                  Showing <span className="font-bold text-slate-700">{Math.min(processedPayments.length, (histPage - 1) * histLimit + 1)}</span> to{' '}
                  <span className="font-bold text-slate-700">{Math.min(processedPayments.length, histPage * histLimit)}</span> of{' '}
                  <span className="font-bold text-slate-700">{processedPayments.length}</span> receipts
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={histLimit}
                    onChange={(e) => {
                      setHistLimit(Number(e.target.value));
                      setHistPage(1);
                    }}
                    className="px-2 py-1 border border-slate-200 hover:border-slate-300 rounded text-xs font-bold text-slate-650 cursor-pointer"
                  >
                    {[10, 20, 50, 100].map(lim => (
                      <option key={lim} value={lim}>{lim} per page</option>
                    ))}
                  </select>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => setHistPage(p => Math.max(1, p - 1))}
                    disabled={histPage === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => setHistPage(p => Math.min(Math.ceil(processedPayments.length / histLimit), p + 1))}
                    disabled={histPage * histLimit >= processedPayments.length}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
                     MODALS FORM POPUPS
         ========================================= */}

      {/* 1. COLLECT FEE FORM MODAL */}
      <Modal
        isOpen={isCollectFeeOpen}
        onClose={() => setIsCollectFeeOpen(false)}
        title="Collect Transport Fee"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsCollectFeeOpen(false)}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleCollectFeeSubmit}
              isLoading={collectLoading}
            >
              Collect Fee
            </Button>
          </div>
        }
      >
        {feeStudent && (
          <form onSubmit={handleCollectFeeSubmit} className="space-y-4 font-sans select-none">
            {collectSuccessMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded-lg text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600 animate-bounce" size={16} />
                {collectSuccessMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="w-full flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Name</label>
                <input
                  type="text"
                  disabled
                  value={feeStudent.name}
                  className="px-3.5 py-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg outline-hidden"
                />
              </div>
              <div className="w-full flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Admission Number</label>
                <input
                  type="text"
                  disabled
                  value={feeStudent.admissionNo}
                  className="px-3.5 py-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="w-full flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Route</label>
                <input
                  type="text"
                  disabled
                  value={feeStudent.routeName}
                  className="px-3.5 py-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg outline-hidden"
                />
              </div>
              <div className="w-full flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pickup Point</label>
                <input
                  type="text"
                  disabled
                  value={feeStudent.pickupPoint}
                  className="px-3.5 py-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg outline-hidden"
                />
              </div>
              <div className="w-full flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Monthly Charge</label>
                <input
                  type="text"
                  disabled
                  value={`₹${feeStudent.monthlyCharge}`}
                  className="px-3.5 py-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg outline-hidden font-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="w-full flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Billing Month</label>
                <select
                  value={feeMonth}
                  onChange={(e) => setFeeMonth(e.target.value)}
                  className="px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg outline-hidden cursor-pointer"
                >
                  {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="w-full flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Billing Year</label>
                <select
                  value={feeYear}
                  onChange={(e) => setFeeYear(e.target.value)}
                  className="px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg outline-hidden cursor-pointer"
                >
                  {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="w-full flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Amount To Collect (₹)</label>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  className="px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg outline-hidden font-bold"
                  required
                />
              </div>
              <div className="w-full flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Payment Method</label>
                <select
                  value={feeMethod}
                  onChange={(e) => setFeeMethod(e.target.value as any)}
                  className="px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg outline-hidden cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="w-full flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Remarks (Optional)</label>
              <input
                type="text"
                value={feeRemarks}
                onChange={(e) => setFeeRemarks(e.target.value)}
                placeholder="e.g., Paid by parent, transaction ID reference..."
                className="px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg outline-hidden"
              />
            </div>
          </form>
        )}
      </Modal>

      {/* 2. RECEIPT PREVIEW MODAL */}
      <Modal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Transport Receipt View"
        footer={
          <div className="flex justify-between w-full select-none">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (activeReceipt) triggerPrintReceipt(activeReceipt);
              }}
              leftIcon={<Printer size={14} />}
            >
              Print Receipt
            </Button>
            <Button size="sm" onClick={() => setIsReceiptOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {activeReceipt && (
          <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-4 font-sans select-none">
            <div className="text-center border-b border-dashed border-slate-200 pb-4">
              <h3 className="text-sm font-black text-blue-650 uppercase tracking-wide">The School of Pansy Flowers</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Changotola, Balaghat, MP</p>
              <div className="mt-3 inline-block px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700">
                Receipt No: <span className="text-blue-600 font-mono font-black">{activeReceipt.receiptNo}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-400">Student Name</span>
                <span className="font-extrabold text-slate-800">{activeReceipt.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-400">Admission No</span>
                <span className="font-extrabold text-slate-800">{activeReceipt.admissionNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-400">Class & Section</span>
                <span className="font-extrabold text-slate-800">{activeReceipt.className}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-400">Designated Route</span>
                <span className="font-extrabold text-slate-800">{activeReceipt.routeName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-400">Pickup Location</span>
                <span className="font-extrabold text-slate-800">{activeReceipt.pickupPoint}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-400">Billing Cycle</span>
                <span className="font-extrabold text-slate-800">{activeReceipt.month} {activeReceipt.year}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-400">Payment Method</span>
                <span className="font-extrabold text-slate-800">{activeReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-400">Transaction Time</span>
                <span className="font-extrabold text-slate-800">
                  {formatDate(activeReceipt.date)}
                </span>
              </div>
              {activeReceipt.remarks && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-400">Remarks</span>
                  <span className="font-extrabold text-slate-800">{activeReceipt.remarks}</span>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center mt-4">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Paid</span>
              <span className="text-xl font-black text-emerald-600">₹{activeReceipt.amount}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. ADD TRANSPORT ASSIGNMENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="Assign Student to Route"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={handleCloseAddModal}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddSubmit}>
              Assign Route
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 font-sans select-none">
          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 tracking-wide">
              SELECT STUDENT
            </label>
            <select
              className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg transition-all outline-hidden cursor-pointer"
              value={formStudentId}
              onChange={(e) => setFormStudentId(e.target.value)}
              disabled={!!assignStudentIdPreset}
            >
              <option value="">-- Choose a Student --</option>
              {unassignedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.admissionNo || s.rollNumber || 'N/A'}) - Class {s.class || 'N/A'}
                </option>
              ))}
            </select>
            {formErrors.studentId && (
              <span className="text-[10px] text-red-500 font-bold">{formErrors.studentId}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide">
                ROUTE
              </label>
              <select
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg cursor-pointer outline-hidden"
                value={formRouteName}
                onChange={(e) => setFormRouteName(e.target.value)}
              >
                {standardRoutes.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <Input
              label="MONTHLY CHARGE (₹)"
              type="number"
              placeholder="e.g. 1200"
              value={formMonthlyCharge}
              onChange={(e) => setFormMonthlyCharge(e.target.value)}
              error={formErrors.monthlyCharge}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="PICKUP POINT"
              placeholder="e.g. Chowraha Gate"
              value={formPickupPoint}
              onChange={(e) => setFormPickupPoint(e.target.value)}
              error={formErrors.pickupPoint}
              required
            />

            <Input
              label="SERVICE START DATE"
              type="date"
              value={formJoiningDate}
              onChange={(e) => setFormJoiningDate(e.target.value)}
              required
            />
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 tracking-wide">
              SERVICE STATUS
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                <input
                  type="radio"
                  name="addStatus"
                  checked={formStatus === 'Active'}
                  onChange={() => setFormStatus('Active')}
                  className="h-4 w-4 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                Active Service
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                <input
                  type="radio"
                  name="addStatus"
                  checked={formStatus === 'Inactive'}
                  onChange={() => setFormStatus('Inactive')}
                  className="h-4 w-4 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                Suspended / Inactive
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* 4. EDIT TRANSPORT ASSIGNMENT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Commuter Roster Settings"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </div>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 font-sans select-none">
          <div className="grid grid-cols-2 gap-4">
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide">
                ROUTE
              </label>
              <select
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg cursor-pointer outline-hidden"
                value={formRouteName}
                onChange={(e) => setFormRouteName(e.target.value)}
              >
                {standardRoutes.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <Input
              label="MONTHLY CHARGE (₹)"
              type="number"
              placeholder="e.g. 1200"
              value={formMonthlyCharge}
              onChange={(e) => setFormMonthlyCharge(e.target.value)}
              error={formErrors.monthlyCharge}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="PICKUP POINT"
              placeholder="e.g. Chowraha Gate"
              value={formPickupPoint}
              onChange={(e) => setFormPickupPoint(e.target.value)}
              error={formErrors.pickupPoint}
              required
            />

            <Input
              label="SERVICE START DATE"
              type="date"
              value={formJoiningDate}
              onChange={(e) => setFormJoiningDate(e.target.value)}
              required
            />
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 tracking-wide">
              SERVICE STATUS
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                <input
                  type="radio"
                  name="editStatus"
                  checked={formStatus === 'Active'}
                  onChange={() => setFormStatus('Active')}
                  className="h-4 w-4 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                Active Service
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                <input
                  type="radio"
                  name="editStatus"
                  checked={formStatus === 'Inactive'}
                  onChange={() => setFormStatus('Inactive')}
                  className="h-4 w-4 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                Suspended / Inactive
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* 5. DELETE CONFIRMATION */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Unassign Student from Transport"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleDeleteConfirm}>
              Remove Student
            </Button>
          </div>
        }
      >
        <div className="space-y-3 font-sans select-none">
          <p className="text-xs text-slate-650 leading-relaxed">
            Are you sure you want to stop transport services for <strong className="text-slate-800">{deletingTransport?.name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex gap-2">
            <AlertTriangle className="text-amber-655 flex-shrink-0" size={16} />
            <span>This student's service route registry will be terminated. Existing historical payment records are kept safe and will not be affected.</span>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default TransportPanel;
