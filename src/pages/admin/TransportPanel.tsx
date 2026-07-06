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
  FileCheck
} from 'lucide-react';
import { Transport, Student } from '../../types';
import { transportApi } from '../../api/transportApi';
import { exportToExcel, exportToPrintablePDF } from '../../utils/exportUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

interface TransportPanelProps {
  allStudents: Student[];
  refreshTrigger: number;
  triggerDataRefresh: () => void;
  assignStudentIdPreset?: string | null;
  onClearPreset?: () => void;
}

export const TransportPanel: React.FC<TransportPanelProps> = ({
  allStudents,
  refreshTrigger,
  triggerDataRefresh,
  assignStudentIdPreset,
  onClearPreset
}) => {
  // Core States
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [routeFilter, setRouteFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReportResultOpen, setIsReportResultOpen] = useState(false);

  // Active records to modify
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null);
  const [deletingTransport, setDeletingTransport] = useState<Transport | null>(null);

  // Form Fields
  const [formStudentId, setFormStudentId] = useState('');
  const [formRouteName, setFormRouteName] = useState('Route 1');
  const [formPickupPoint, setFormPickupPoint] = useState('');
  const [formMonthlyCharge, setFormMonthlyCharge] = useState('1150');
  const [formJoiningDate, setFormJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Monthly Report Parameters
  const [reportMonth, setReportMonth] = useState('July');
  const [reportYear, setReportYear] = useState('2026');

  // Classes list for filters
  const classesList = [
    'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'
  ];

  // Standard pre-defined routes
  const standardRoutes = ['Route 1', 'Route 2', 'Route 3', 'Route 4'];

  // Load Transports
  const loadTransportsData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transportApi.getTransports();
      setTransports(res);
      if (res.length > 0) {
        setSelectedTransport(res[0]);
      }
    } catch (e) {
      console.error('Failed to load transport details:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransportsData();
  }, [loadTransportsData, refreshTrigger]);

  // Handle Preset Student assignment from external trigger (Student Module Integration)
  useEffect(() => {
    if (assignStudentIdPreset) {
      const matchedStudent = allStudents.find(s => s.id === assignStudentIdPreset);
      if (matchedStudent) {
        setFormStudentId(assignStudentIdPreset);
        setFormRouteName('Route 1');
        setFormPickupPoint('');
        setFormMonthlyCharge('1150');
        setFormJoiningDate(new Date().toISOString().split('T')[0]);
        setFormStatus('Active');
        setFormErrors({});
        setIsAddModalOpen(true);
      }
    }
  }, [assignStudentIdPreset, allStudents]);

  // Close Add Modal & notify parent
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    if (onClearPreset) {
      onClearPreset();
    }
  };

  // Compute Statistics Cards
  const stats = useMemo(() => {
    const activeRecords = transports.filter(t => t.status === 'Active');
    const totalStudents = transports.length;
    const monthlyCollection = activeRecords.reduce((acc, t) => acc + (t.monthlyCharge || 0), 0);
    const uniqueRoutes = Array.from(new Set(transports.map(t => t.routeName))).length;
    const averageCharge = activeRecords.length > 0 
      ? Math.round(activeRecords.reduce((acc, t) => acc + (t.monthlyCharge || 0), 0) / activeRecords.length)
      : 0;

    return {
      totalStudents,
      monthlyCollection,
      activeRoutes: uniqueRoutes,
      averageCharge
    };
  }, [transports]);

  // Filtered Transports List
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

  // Handle Selection click
  const handleSelectRow = (t: Transport) => {
    setSelectedTransport(t);
  };

  // Open Edit Modal
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

  // Open Delete Confirm
  const handleDeleteClick = (t: Transport, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingTransport(t);
    setIsDeleteConfirmOpen(true);
  };

  // Delete Action Execute
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

  // Submit Add
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

  // Submit Edit
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

  // Export to CSV / Excel
  const handleExportExcel = () => {
    const headers = ['Student Name', 'Admission No', 'Class', 'Route', 'Pickup Point', 'Monthly Charge (₹)', 'Joining Date', 'Status'];
    const keys = ['name', 'admissionNo', 'className', 'routeName', 'pickupPoint', 'monthlyCharge', 'joiningDate', 'status'];
    exportToExcel(filteredTransports, headers, keys, `Transport_Roster_${new Date().toISOString().split('T')[0]}`);
  };

  // Export to Printable PDF Layout
  const handleExportPDF = () => {
    const headers = ['Student Name / Adm No', 'Class', 'Route Detail', 'Pickup Point', 'Monthly (₹)', 'Joined', 'Status'];
    const rows = filteredTransports.map(t => [
      `${t.name}\nAdm: ${t.admissionNo}`,
      t.className || 'N/A',
      t.routeName,
      t.pickupPoint,
      `₹${t.monthlyCharge}`,
      t.joiningDate,
      t.status
    ]);
    exportToPrintablePDF('Transport Operations & Roster Registry', headers, rows, 'transport_operations_report');
  };

  // Report Popup Submit & Generation
  const handleGenerateReport = () => {
    setIsReportModalOpen(false);
    setIsReportResultOpen(true);
  };

  // Export Monthly Report Excel
  const handleExportReportExcel = () => {
    const headers = ['Student Name', 'Class', 'Route', 'Monthly Charge (₹)', 'Status'];
    const keys = ['name', 'className', 'routeName', 'monthlyCharge', 'status'];
    exportToExcel(transports, headers, keys, `Transport_Report_${reportMonth}_${reportYear}`);
  };

  // Export Monthly Report PDF
  const handleExportReportPDF = () => {
    const headers = ['Student Name', 'Class', 'Route Name', 'Monthly Charge (₹)'];
    const rows = transports.map(t => [
      t.name,
      t.className,
      t.routeName,
      `₹${t.monthlyCharge}`
    ]);
    exportToPrintablePDF(`Transport Monthly Roster - ${reportMonth} ${reportYear}`, headers, rows, 'transport_monthly_report');
  };

  // Filter students that do NOT already have transport assigned
  const unassignedStudents = useMemo(() => {
    const assignedIds = new Set(transports.map(t => t.studentId));
    return allStudents.filter(s => !assignedIds.has(s.id));
  }, [allStudents, transports]);

  return (
    <div className="space-y-6">
      
      {/* --- STATISTICS CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <Card hoverEffect className="flex items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-xl">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block">Transport Students</span>
            <span className="text-2xl font-extrabold text-slate-800 leading-tight block mt-1">{stats.totalStudents}</span>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-xl">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block">Monthly Collection</span>
            <span className="text-2xl font-extrabold text-slate-800 leading-tight block mt-1">₹{(stats.monthlyCollection).toLocaleString()}</span>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-xl">
          <div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
            <RouteIcon size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block">Active Routes</span>
            <span className="text-2xl font-extrabold text-slate-800 leading-tight block mt-1">{stats.activeRoutes}</span>
          </div>
        </Card>

        <Card hoverEffect className="flex items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-xl">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <MapPin size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none block">Average Charge</span>
            <span className="text-2xl font-extrabold text-slate-800 leading-tight block mt-1">₹{(stats.averageCharge).toLocaleString()}</span>
          </div>
        </Card>
      </div>

      {/* --- TOOLBAR CONTROLS --- */}
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">Class:</span>
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">Route:</span>
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">Status:</span>
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
            <button
              onClick={handleExportExcel}
              className="p-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer active:scale-95 shadow-3xs"
              title="Export Excel (CSV)"
            >
              <FileSpreadsheet size={16} />
            </button>
            <button
              onClick={handleExportPDF}
              className="p-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer active:scale-95 shadow-3xs"
              title="Print PDF Directory"
            >
              <FileText size={16} />
            </button>
            <Button 
              size="sm" 
              onClick={() => setIsReportModalOpen(true)}
              variant="outline"
              leftIcon={<Printer size={14} />}
            >
              Report
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                setFormStudentId('');
                setFormRouteName('Route 1');
                setFormPickupPoint('');
                setFormMonthlyCharge('1150');
                setFormJoiningDate(new Date().toISOString().split('T')[0]);
                setFormStatus('Active');
                setFormErrors({});
                setIsAddModalOpen(true);
              }}
              leftIcon={<Plus size={14} />}
            >
              Assign
            </Button>
          </div>
        </div>
      </div>

      {/* --- CONTENT LAYOUT (SPLIT PANEL) --- */}
      {loading ? (
        <Card className="p-10 select-none">
          <div className="flex flex-col items-center justify-center space-y-4">
            <LoaderIcon size={36} className="animate-spin text-blue-600" />
            <p className="text-xs text-slate-500 font-bold">Synchronizing Transport Roster Registry...</p>
          </div>
        </Card>
      ) : filteredTransports.length === 0 ? (
        <Card className="p-12 text-center select-none space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200/50">
            <Bus size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">No transport students found.</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mt-2">
              There are no matching transport records found. Try modifying your filter criteria or assign a student transport route.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Table Container (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-0 overflow-hidden border border-slate-200/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest select-none">
                      <th className="p-4">Student</th>
                      <th className="p-4">Admission No</th>
                      <th className="p-4">Class</th>
                      <th className="p-4">Route</th>
                      <th className="p-4">Pickup Point</th>
                      <th className="p-4">Monthly (₹)</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredTransports.map((t) => {
                      const isSelected = selectedTransport?.id === t.id;
                      return (
                        <tr 
                          key={t.id} 
                          onClick={() => handleSelectRow(t)}
                          className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/40 font-semibold' : ''}`}
                        >
                          <td className="p-4">
                            <div className="font-extrabold text-slate-800">{t.name}</div>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-500">{t.admissionNo}</td>
                          <td className="p-4 text-slate-600 font-bold">{t.className}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">{t.routeName}</span>
                          </td>
                          <td className="p-4 text-slate-500 truncate max-w-[120px]">{t.pickupPoint}</td>
                          <td className="p-4 font-extrabold text-slate-700">₹{t.monthlyCharge}</td>
                          <td className="p-4">
                            <Badge variant={t.status === 'Active' ? 'success' : 'slate'} size="xs">
                              {t.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleSelectRow(t)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={(e) => handleEditClick(t, e)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Transport"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(t, e)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Transport"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Details Side Panel (1/3 width on desktop) */}
          <div className="lg:col-span-1">
            {selectedTransport ? (
              <Card className="sticky top-6 border border-slate-200/80 p-5 space-y-6 shadow-xs select-none">
                
                {/* Header Profile Summary */}
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <Bus size={22} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-800 truncate leading-tight">{selectedTransport.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                      Class {selectedTransport.className}
                    </span>
                  </div>
                </div>

                {/* Main Details Body */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 text-xs">
                    <h5 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-1 mb-1.5">Roster Audit</h5>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Admission No:</span>
                      <span className="font-bold text-slate-700 font-mono">{selectedTransport.admissionNo}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Email Account:</span>
                      <span className="font-bold text-slate-700 select-all truncate max-w-[150px]" title={selectedTransport.email}>{selectedTransport.email}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Route Assignment:</span>
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-bold text-[10px] uppercase">{selectedTransport.routeName}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Pickup point:</span>
                      <span className="font-bold text-slate-700 max-w-[150px] truncate" title={selectedTransport.pickupPoint}>{selectedTransport.pickupPoint}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Monthly Charge:</span>
                      <span className="font-extrabold text-emerald-600">₹{selectedTransport.monthlyCharge}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Joining Date:</span>
                      <span className="font-bold text-slate-700">{selectedTransport.joiningDate}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Status:</span>
                      <Badge variant={selectedTransport.status === 'Active' ? 'success' : 'slate'} size="xs">
                        {selectedTransport.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Operations Actions Footer */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => handleEditClick(selectedTransport, e)}
                    leftIcon={<Edit2 size={12} />}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={(e) => handleDeleteClick(selectedTransport, e)}
                    leftIcon={<Trash2 size={12} />}
                  >
                    Remove
                  </Button>
                </div>

              </Card>
            ) : (
              <Card className="sticky top-6 border-dashed border-slate-200 p-8 text-center text-slate-400 select-none space-y-2">
                <Eye size={20} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold">Select a row to audit transport roster details.</p>
              </Card>
            )}
          </div>

        </div>
      )}

      {/* =========================================
                     MODALS POPUPS
         ========================================= */}

      {/* 1. ASSIGN/ADD TRANSPORT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="Assign Student Transport Service"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCloseAddModal}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="transport-add-form">
              Save Assignment
            </Button>
          </div>
        }
      >
        <form id="transport-add-form" onSubmit={handleAddSubmit} className="space-y-4 select-none">
          
          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 tracking-wide">
              SELECT STUDENT <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full px-3.5 py-2 text-sm text-slate-900 bg-white border ${formErrors.studentId ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/10'} focus:ring-4 rounded-lg transition-all outline-hidden cursor-pointer`}
              value={formStudentId}
              onChange={(e) => {
                setFormStudentId(e.target.value);
                setFormErrors(prev => ({ ...prev, studentId: '' }));
              }}
              disabled={!!assignStudentIdPreset}
              required
            >
              <option value="">-- Choose student from directory --</option>
              {assignStudentIdPreset ? (
                allStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.admissionNo || s.rollNumber || 'No Adm'}) - {s.class || 'N/A'}
                  </option>
                ))
              ) : (
                unassignedStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.admissionNo || s.rollNumber || 'No Adm'}) - {s.class || 'N/A'}
                  </option>
                ))
              )}
            </select>
            {formErrors.studentId && <p className="text-xs text-red-500 font-semibold">{formErrors.studentId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide">
                ROUTE NAME <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg transition-all outline-hidden cursor-pointer"
                value={formRouteName}
                onChange={(e) => setFormRouteName(e.target.value)}
                required
              >
                {standardRoutes.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <Input
              label="MONTHLY CHARGE (₹)"
              placeholder="e.g. 1150"
              type="number"
              value={formMonthlyCharge}
              onChange={(e) => {
                setFormMonthlyCharge(e.target.value);
                setFormErrors(prev => ({ ...prev, monthlyCharge: '' }));
              }}
              error={formErrors.monthlyCharge}
              required
            />
          </div>

          <Input
            label="PICKUP POINT"
            placeholder="e.g. Sector 23 Crossroad, Mandir Gate"
            value={formPickupPoint}
            onChange={(e) => {
              setFormPickupPoint(e.target.value);
              setFormErrors(prev => ({ ...prev, pickupPoint: '' }));
            }}
            error={formErrors.pickupPoint}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="JOINING DATE"
              type="date"
              value={formJoiningDate}
              onChange={(e) => setFormJoiningDate(e.target.value)}
              required
            />

            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide">
                STATUS
              </label>
              <select
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg transition-all outline-hidden cursor-pointer"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

        </form>
      </Modal>

      {/* 2. EDIT TRANSPORT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modify Assigned Transport Details"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="transport-edit-form">
              Save Changes
            </Button>
          </div>
        }
      >
        <form id="transport-edit-form" onSubmit={handleEditSubmit} className="space-y-4 select-none">
          
          <div className="w-full flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Student</span>
            <span className="text-sm font-extrabold text-slate-800">{editingTransport?.name} ({editingTransport?.admissionNo})</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide">
                ROUTE NAME <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg transition-all outline-hidden cursor-pointer"
                value={formRouteName}
                onChange={(e) => setFormRouteName(e.target.value)}
                required
              >
                {standardRoutes.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <Input
              label="MONTHLY CHARGE (₹)"
              placeholder="e.g. 1150"
              type="number"
              value={formMonthlyCharge}
              onChange={(e) => {
                setFormMonthlyCharge(e.target.value);
                setFormErrors(prev => ({ ...prev, monthlyCharge: '' }));
              }}
              error={formErrors.monthlyCharge}
              required
            />
          </div>

          <Input
            label="PICKUP POINT"
            placeholder="e.g. Sector 23 Crossroad"
            value={formPickupPoint}
            onChange={(e) => {
              setFormPickupPoint(e.target.value);
              setFormErrors(prev => ({ ...prev, pickupPoint: '' }));
            }}
            error={formErrors.pickupPoint}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="JOINING DATE"
              type="date"
              value={formJoiningDate}
              onChange={(e) => setFormJoiningDate(e.target.value)}
              required
            />

            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide">
                STATUS
              </label>
              <select
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg transition-all outline-hidden cursor-pointer"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

        </form>
      </Modal>

      {/* 3. DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="De-assign Student Transport"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-center select-none py-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Delete Transport?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to completely de-assign transport and delete route data for this student?
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 inline-block px-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Student</span>
            <span className="text-sm font-extrabold text-slate-800 block mt-0.5">{deletingTransport?.name}</span>
          </div>
        </div>
      </Modal>

      {/* 4. GENERATE REPORT MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Configure Monthly Transport Roster Report"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleGenerateReport}>
              Generate Report
            </Button>
          </div>
        }
      >
        <div className="space-y-4 select-none">
          <p className="text-xs text-slate-505 leading-relaxed">
            Select the designated month and academic calendar year to compile cumulative transport rosters.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide">
                REPORT MONTH
              </label>
              <select
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg transition-all outline-hidden cursor-pointer"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <Input
              label="REPORT YEAR"
              type="number"
              placeholder="e.g. 2026"
              value={reportYear}
              onChange={(e) => setReportYear(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

      {/* 5. REPORT RESULT VIEW MODAL (DIRECTOR'S LAYOUT) */}
      <Modal
        isOpen={isReportResultOpen}
        onClose={() => setIsReportResultOpen(false)}
        title={`Transport Roster Audit Report - ${reportMonth} ${reportYear}`}
        size="lg"
        footer={
          <div className="flex justify-between w-full select-none">
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={handleExportReportExcel} leftIcon={<FileSpreadsheet size={14} />}>
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportReportPDF} leftIcon={<FileText size={14} />}>
                PDF
              </Button>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setIsReportResultOpen(false)}>
                Close
              </Button>
              <Button size="sm" onClick={handleExportReportPDF} leftIcon={<Printer size={14} />}>
                Print
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 select-none max-h-[60vh] overflow-y-auto pr-1">
          
          <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">The School of Pansy Flowers</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Changotola, Balaghat, MP</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Report Format</span>
              <span className="text-xs font-black text-blue-600 block mt-0.5">TRANSPORT ROSTER STATS</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="p-3">Student</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Route</th>
                  <th className="p-3 text-right">Monthly Charge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {transports.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{t.name}</td>
                    <td className="p-3 font-semibold text-slate-500">{t.className}</td>
                    <td className="p-3 text-slate-600">{t.routeName}</td>
                    <td className="p-3 text-right font-extrabold text-slate-700">₹{t.monthlyCharge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Students</span>
              <span className="text-lg font-extrabold text-slate-800 block mt-0.5">{stats.totalStudents}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Monthly Charges</span>
              <span className="text-lg font-black text-emerald-600 block mt-0.5">₹{(stats.monthlyCollection).toLocaleString()}</span>
            </div>
          </div>

        </div>
      </Modal>

    </div>
  );
};
export default TransportPanel;
