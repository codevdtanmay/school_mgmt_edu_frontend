import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  Megaphone, 
  UserPlus, 
  Plus, 
  Search, 
  FileText, 
  Filter, 
  CheckCircle, 
  TrendingUp, 
  Calendar, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Layers,
  Percent,
  Check,
  HelpCircle,
  Clock,
  Download,
  Edit2,
  Trash2,
  ShieldAlert,
  Eye
} from 'lucide-react';

// Export Utilities
import { exportToExcel, exportToPrintablePDF, printReceiptBill } from '../../utils/exportUtils';

// Common Components
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { Loader, Skeleton, DashboardStatsSkeleton, WidgetSkeleton } from '../../components/common/Loader';

// Dashboard Specific Widgets
import StatCard from '../../components/dashboard/StatCard';
import QuickActionCard from '../../components/dashboard/QuickActionCard';
import RecentNotices from '../../components/dashboard/RecentNotices';
import RecentActivities from '../../components/dashboard/RecentActivities';
import FeeCollectionWidget from '../../components/dashboard/FeeCollectionWidget';
import StudentDistribution from '../../components/dashboard/StudentDistribution';

// Services/API
import { studentApi } from '../../api/studentApi';
import { teacherApi } from '../../api/teacherApi';
import { noticeApi, dashboardApi } from '../../api/noticeApi';
import { feeStructureApi } from '../../api/feeStructureApi';
import { DashboardStats, Notice, Activity, FeeSummary, Student, Teacher, FeeStructure } from '../../types';

interface AdminDashboardProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  searchQuery: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentTab, 
  setCurrentTab,
  searchQuery 
}) => {
  // --- STATE SYSTEM ---
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [fees, setFees] = useState<FeeSummary | null>(null);
  const [distribution, setDistribution] = useState<Record<string, number> | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [isFeeStructureModalOpen, setIsFeeStructureModalOpen] = useState(false);
  const [editingFeeStructureId, setEditingFeeStructureId] = useState<string | null>(null);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null);
  const [feeStructureForm, setFeeStructureForm] = useState({
    class: 'Class 1',
    admissionFee: '',
    tuitionFee: '',
    computerFee: '',
    examFee: '',
    culturalActivityFee: '',
    academicSession: '2026-27',
    juneAmount: '',
    septemberAmount: '',
    decemberAmount: '',
    marchAmount: ''
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // --- CUSTOM STUDENT FEES RECORDS (INR PRESETS) ---
  const [feeRecords, setFeeRecords] = useState<{
    id: string;
    name: string;
    className: string;
    dueAmount: number;
    totalFee: number;
    paidAmount: number;
    status: 'Partial' | 'Paid' | 'Pending';
    admissionNo: string;
    paymentHistory: { date: string; amount: number }[];
  }[]>([
    {
      id: 'fee-1',
      name: 'Rahul Kumar',
      className: '10-A',
      dueAmount: 800,
      totalFee: 2800,
      paidAmount: 2000,
      status: 'Partial',
      admissionNo: 'SOPF002',
      paymentHistory: [
        { date: '15 June 2026', amount: 2000 },
        { date: '01 May 2026', amount: 2800 },
        { date: '01 April 2026', amount: 2800 }
      ]
    },
    {
      id: 'fee-2',
      name: 'Aman',
      className: '9-B',
      dueAmount: 0,
      totalFee: 2800,
      paidAmount: 2800,
      status: 'Paid',
      admissionNo: 'SOPF003',
      paymentHistory: [
        { date: '12 June 2026', amount: 2800 },
        { date: '05 May 2026', amount: 2800 }
      ]
    },
    {
      id: 'fee-3',
      name: 'Riya',
      className: '10-A',
      dueAmount: 2800,
      totalFee: 2800,
      paidAmount: 0,
      status: 'Pending',
      admissionNo: 'SOPF004',
      paymentHistory: []
    }
  ]);

  const [selectedFeeStudent, setSelectedFeeStudent] = useState<{
    id: string;
    name: string;
    className: string;
    dueAmount: number;
    totalFee: number;
    paidAmount: number;
    status: 'Partial' | 'Paid' | 'Pending';
    admissionNo: string;
    paymentHistory: { date: string; amount: number }[];
  } | null>(null);
  
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [feeClassFilter, setFeeClassFilter] = useState('All');
  const [studentClassFilter, setStudentClassFilter] = useState('All');
  const [feeStructureSearchQuery, setFeeStructureSearchQuery] = useState('');
  const [feeStructureYearFilter, setFeeStructureYearFilter] = useState('All');
  
  // Custom interactive payment modal states
  const [isCustomPayModalOpen, setIsCustomPayModalOpen] = useState(false);
  const [customPayAmount, setCustomPayAmount] = useState('');
  const [customPayMode, setCustomPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('Cash');
  const [customPayNotes, setCustomPayNotes] = useState('');
  const [receiptDetail, setReceiptDetail] = useState<{
    receiptNo: string;
    amount: number;
    studentName: string;
  } | null>(null);

  // EDIT STATE HOLDERS
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  // SECURE DELETE MODAL STATES
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetType, setDeleteTargetType] = useState<'student' | 'teacher' | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>('');
  const [deleteKeyword, setDeleteKeyword] = useState<string>('');
  const [deletePasscode, setDeletePasscode] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string>('');

  // Filter lists based on global search bar (case insensitive)
  const query = searchQuery.trim().toLowerCase();

  // --- MODAL STATE HOLDERS ---
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);

  // Form Field States
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    admissionNo: '',
    class: '10th',
    section: 'A',
    rollNo: '',
    fatherName: '',
    motherName: '',
    phone: '',
    gender: 'Male'
  });
  
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    subject: '',
    department: 'Science',
    contact: ''
  });

  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    priority: 'Medium',
    publishedBy: 'Admin Office'
  });

  const [feeForm, setFeeForm] = useState({
    studentId: '',
    amountPaid: '',
    paymentMethod: 'Cash'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // --- FETCH REFRESH ROUTINE ---
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, noticeRes, activityRes, feeRes, distRes, studentsRes, teachersRes, feeStructuresRes] = await Promise.all([
          dashboardApi.getStats(),
          noticeApi.getRecentNotices(),
          dashboardApi.getActivities(),
          studentApi.getFeesOverview(),
          studentApi.getStudentDistribution(),
          studentApi.getStudents(),
          teacherApi.getTeachers(),
          feeStructureApi.getFeeStructures()
        ]);

        setStats(statsRes);
        setNotices(noticeRes);
        setActivities(activityRes);
        setFees(feeRes);
        setDistribution(distRes);
        setStudents(studentsRes);
        setTeachers(teachersRes);
        setFeeStructures(feeStructuresRes);
      } catch (err) {
        console.error('Error synchronizing school logs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [refreshTrigger]);

  const triggerDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDashboardCollectTermFee = () => {
    setCurrentTab('fees');
    const activeRecord = selectedFeeStudent || feeRecords[0];
    if (activeRecord) {
      setSelectedFeeStudent(activeRecord);
      setCustomPayAmount(activeRecord.dueAmount.toString());
      setCustomPayMode('Cash');
      setCustomPayNotes('');
      setReceiptDetail(null);
      setIsCustomPayModalOpen(true);
    }
  };

  // --- FORM SUBMISSIONS & EDIT / DELETE TRIGGER HANDLERS ---
  const handleEditStudentClick = (stu: Student) => {
    setEditingStudentId(stu.id);
    setStudentForm({
      name: stu.name,
      email: stu.email,
      password: 'password123',
      admissionNo: stu.admissionNo || stu.rollNumber || '',
      class: stu.class || 'Grade 10',
      section: stu.section || 'A',
      rollNo: String(stu.rollNo || ''),
      fatherName: stu.fatherName || stu.parentName || '',
      motherName: stu.motherName || '',
      phone: stu.phone || stu.contact || '',
      gender: stu.gender || 'Male'
    });
    setIsStudentModalOpen(true);
  };

  const handleEditTeacherClick = (t: Teacher) => {
    setEditingTeacherId(t.id);
    setTeacherForm({
      name: t.name,
      email: t.email,
      password: 'password123',
      subject: t.subject,
      department: t.department || 'Science',
      contact: t.contact
    });
    setIsTeacherModalOpen(true);
  };

  const handlePrepareDeleteStudent = (stu: Student) => {
    setDeleteTargetType('student');
    setDeleteTargetId(stu.id);
    setDeleteTargetName(stu.name);
    setDeleteKeyword('');
    setDeletePasscode('');
    setDeleteError('');
    setIsDeleteConfirmOpen(true);
  };

  const handlePrepareDeleteTeacher = (t: Teacher) => {
    setDeleteTargetType('teacher');
    setDeleteTargetId(t.id);
    setDeleteTargetName(t.name);
    setDeleteKeyword('');
    setDeletePasscode('');
    setDeleteError('');
    setIsDeleteConfirmOpen(true);
  };

  const executeSecureDelete = async () => {
    setDeleteError('');
    if (deleteKeyword.toUpperCase() !== 'CONFIRM') {
      setDeleteError('Please type CONFIRM exactly to verify your intent.');
      return;
    }
    if (deletePasscode !== 'admin123') {
      setDeleteError('Authorization security code is invalid (Enter: admin123).');
      return;
    }

    setSubmitLoading(true);
    try {
      if (deleteTargetType === 'student' && deleteTargetId) {
        await studentApi.deleteStudent(deleteTargetId);
      } else if (deleteTargetType === 'teacher' && deleteTargetId) {
        await teacherApi.deleteTeacher(deleteTargetId);
      }
      setIsDeleteConfirmOpen(false);
      triggerDataRefresh();
    } catch (err: any) {
      setDeleteError(err.message || 'Purge action failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!studentForm.name) {
      setFormErrors({ name: 'Student name is required' });
      return;
    }

    setSubmitLoading(true);
    try {
      if (editingStudentId) {
        await studentApi.updateStudent(editingStudentId, studentForm as any);
        setEditingStudentId(null);
      } else {
        await studentApi.addStudent(studentForm as any);
      }
      setIsStudentModalOpen(false);
      setStudentForm({
        name: '',
        email: '',
        password: 'password123',
        admissionNo: '',
        class: '10th',
        section: 'A',
        rollNo: '',
        fatherName: '',
        motherName: '',
        phone: '',
        gender: 'Male'
      });
      triggerDataRefresh();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Admission failed' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!teacherForm.name || !teacherForm.subject) {
      setFormErrors({ 
        name: !teacherForm.name ? 'Teacher name is required' : '',
        subject: !teacherForm.subject ? 'Assigned subject is required' : ''
      });
      return;
    }

    setSubmitLoading(true);
    try {
      if (editingTeacherId) {
        await teacherApi.updateTeacher(editingTeacherId, teacherForm as any);
        setEditingTeacherId(null);
      } else {
        await teacherApi.addTeacher(teacherForm as any);
      }
      setIsTeacherModalOpen(false);
      setTeacherForm({ name: '', email: '', password: 'password123', subject: '', department: 'Science', contact: '' });
      triggerDataRefresh();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Onboarding failed' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!noticeForm.title || !noticeForm.content) {
      setFormErrors({ 
        title: !noticeForm.title ? 'Announcement header title is required' : '',
        content: !noticeForm.content ? 'Announcement body content is required' : ''
      });
      return;
    }

    setSubmitLoading(true);
    try {
      await noticeApi.createNotice(noticeForm);
      setIsNoticeModalOpen(false);
      setNoticeForm({ title: '', content: '', priority: 'Medium', publishedBy: 'Admin Office' });
      triggerDataRefresh();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Publishing failed' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!feeForm.studentId || !feeForm.amountPaid) {
      setFormErrors({ 
        studentId: !feeForm.studentId ? 'Please select a registered student' : '',
        amountPaid: !feeForm.amountPaid ? 'Specify a ledger settlement amount' : ''
      });
      return;
    }

    setSubmitLoading(true);
    try {
      await studentApi.collectFee({
        studentId: feeForm.studentId,
        amountPaid: parseFloat(feeForm.amountPaid),
        paymentMethod: feeForm.paymentMethod
      });
      setIsFeeModalOpen(false);
      setFeeForm({ studentId: '', amountPaid: '', paymentMethod: 'Cash' });
      triggerDataRefresh();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Transaction recording failed' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddFeeStructureClick = () => {
    setEditingFeeStructureId(null);
    setFeeStructureForm({
      class: 'Class 1',
      admissionFee: '',
      tuitionFee: '',
      computerFee: '',
      examFee: '',
      culturalActivityFee: '',
      academicSession: '2026-27',
      juneAmount: '',
      septemberAmount: '',
      decemberAmount: '',
      marchAmount: ''
    });
    setIsFeeStructureModalOpen(true);
  };

  const handleEditFeeStructureClick = (fs: FeeStructure) => {
    setEditingFeeStructureId(fs.id);
    setFeeStructureForm({
      class: fs.class || 'Class 1',
      admissionFee: String(fs.admissionFee || ''),
      tuitionFee: String(fs.tuitionFee || ''),
      computerFee: String(fs.computerFee || ''),
      examFee: String(fs.examFee || ''),
      culturalActivityFee: String(fs.culturalActivityFee || ''),
      academicSession: fs.academicSession || '2026-27',
      juneAmount: String(fs.juneAmount || ''),
      septemberAmount: String(fs.septemberAmount || ''),
      decemberAmount: String(fs.decemberAmount || ''),
      marchAmount: String(fs.marchAmount || '')
    });
    setIsFeeStructureModalOpen(true);
  };

  const handleAutoGenerateInstallments = () => {
    const total = 
      (Number(feeStructureForm.admissionFee) || 0) +
      (Number(feeStructureForm.tuitionFee) || 0) +
      (Number(feeStructureForm.computerFee) || 0) +
      (Number(feeStructureForm.examFee) || 0) +
      (Number(feeStructureForm.culturalActivityFee) || 0);

    const equalAmount = Math.round(total / 4);
    setFeeStructureForm(prev => ({
      ...prev,
      juneAmount: String(equalAmount),
      septemberAmount: String(equalAmount),
      decemberAmount: String(equalAmount),
      marchAmount: String(total - (equalAmount * 3))
    }));
  };

  const handleFeeStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    setSubmitLoading(true);
    try {
      const payload = {
        class: feeStructureForm.class,
        admissionFee: Number(feeStructureForm.admissionFee) || 0,
        tuitionFee: Number(feeStructureForm.tuitionFee) || 0,
        computerFee: Number(feeStructureForm.computerFee) || 0,
        examFee: Number(feeStructureForm.examFee) || 0,
        culturalActivityFee: Number(feeStructureForm.culturalActivityFee) || 0,
        academicSession: feeStructureForm.academicSession,
        juneAmount: Number(feeStructureForm.juneAmount) || 0,
        septemberAmount: Number(feeStructureForm.septemberAmount) || 0,
        decemberAmount: Number(feeStructureForm.decemberAmount) || 0,
        marchAmount: Number(feeStructureForm.marchAmount) || 0,
      };

      if (editingFeeStructureId) {
        await feeStructureApi.updateFeeStructure(editingFeeStructureId, payload as any);
        setEditingFeeStructureId(null);
      } else {
        await feeStructureApi.addFeeStructure(payload as any);
      }
      setIsFeeStructureModalOpen(false);
      triggerDataRefresh();
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Action failed' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteFeeStructureClick = async (id: string) => {
    if (confirm('Are you sure you want to delete this fee structure?')) {
      try {
        await feeStructureApi.deleteFeeStructure(id);
        triggerDataRefresh();
      } catch (err) {
        console.error('Error deleting fee structure:', err);
      }
    }
  };

  const handleExportStudentsExcel = () => {
    const headers = ['ID', 'Name', 'Email', 'Admission No', 'Class', 'Section', 'Roll No', 'Class Category', 'Gender', 'Phone', 'Parent Name', 'Admission Date'];
    const keys = ['id', 'name', 'email', 'admissionNo', 'class', 'section', 'rollNo', 'classCategory', 'gender', 'phone', 'parentName', 'admissionDate'];
    const dataToExport = filteredStudents.map(student => ({
      ...student,
      admissionNo: student.admissionNo || student.rollNumber || '',
      class: student.class || 'Grade 10',
      section: student.section || 'A',
      rollNo: student.rollNo || '',
      phone: student.phone || student.contact || '',
      parentName: student.parentName || student.fatherName || ''
    }));
    exportToExcel(dataToExport, headers, keys, `Students_Roster_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportStudentsPDF = () => {
    const headers = ['Name & Email', 'Adm No / Roll No', 'Class Segment', 'Parent Name', 'Contact', 'Admit Date'];
    const rows = filteredStudents.map(s => [
      `${s.name}\n(${s.email})`,
      `${s.admissionNo || s.rollNumber || 'N/A'}${s.rollNo ? ` / Roll: ${s.rollNo}` : ''}`,
      `${s.class || 'N/A'} - Section ${s.section || 'N/A'} (${s.classCategory})`,
      s.parentName || s.fatherName || 'N/A',
      s.phone || s.contact || 'N/A',
      s.admissionDate || 'N/A'
    ]);
    exportToPrintablePDF('Student registry & roster report', headers, rows, 'student_registry_report');
  };

  const handleExportTeachersExcel = () => {
    const headers = ['ID', 'Name', 'Email', 'Subject Specialty', 'Department', 'Contact Line', 'Joining Date', 'Status'];
    const keys = ['id', 'name', 'email', 'subject', 'department', 'contact', 'joiningDate', 'status'];
    exportToExcel(filteredTeachers, headers, keys, `Teachers_Directory_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportTeachersPDF = () => {
    const headers = ['ID & Name', 'Email', 'Subject', 'Department', 'Contact', 'Joined', 'Status'];
    const rows = filteredTeachers.map(t => [
      `${t.id} - ${t.name}`,
      t.email,
      t.subject,
      t.department,
      t.contact,
      t.joiningDate,
      t.status
    ]);
    exportToPrintablePDF('Faculty & teacher directory report', headers, rows, 'teachers_directory_report');
  };

  const handleExportFeesExcel = () => {
    const headers = ['ID', 'Student Name', 'Admission No', 'Class Name', 'Total Billable Fee', 'Paid Fees', 'Left/Due Fees', 'Status'];
    const keys = ['id', 'name', 'admissionNo', 'className', 'totalFee', 'paidAmount', 'dueAmount', 'status'];
    exportToExcel(feeRecords, headers, keys, `Fees_Ledger_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportFeesPDF = () => {
    const headers = ['Student Name', 'Admission No', 'Class', 'Total Fee', 'Paid Fees', 'Left/Due Fees', 'Status'];
    const rows = feeRecords.map(item => [
      item.name || '',
      item.admissionNo || '',
      item.className || '',
      `₹${(item.totalFee ?? 0).toLocaleString()}`,
      `₹${(item.paidAmount ?? 0).toLocaleString()}`,
      `₹${(item.dueAmount ?? 0).toLocaleString()}`,
      item.status || ''
    ]);
    exportToPrintablePDF('Financial center ledger summary', headers, rows, 'fees_ledger_report');
  };

  const handleExportFeeStructuresExcel = () => {
    const headers = ['ID', 'Class', 'Admission Fee', 'Tuition Fee', 'Computer Fee', 'Exam Fee', 'Cultural Activity Fee', 'Academic Session', 'Total Fee', 'June Installment', 'September Installment', 'December Installment', 'March Installment'];
    const keys = ['id', 'class', 'admissionFee', 'tuitionFee', 'computerFee', 'examFee', 'culturalActivityFee', 'academicSession', 'totalFee', 'juneAmount', 'septemberAmount', 'decemberAmount', 'marchAmount'];
    exportToExcel(feeStructures, headers, keys, `Fee_Structures_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportFeeStructuresPDF = () => {
    const headers = ['Class', 'Admission Fee', 'Tuition Fee', 'Computer Fee', 'Exam Fee', 'Cultural Activity Fee', 'Academic Session', 'Total Fee'];
    const rows = feeStructures.map(fs => [
      fs.class,
      `₹${fs.admissionFee}`,
      `₹${fs.tuitionFee}`,
      `₹${fs.computerFee}`,
      `₹${fs.examFee}`,
      `₹${fs.culturalActivityFee}`,
      fs.academicSession,
      `₹${fs.totalFee}`
    ]);
    exportToPrintablePDF('Fee Structures Report Policy Matrix', headers, rows, 'fee_structures_policy_matrix');
  };

  // --- FILTERED DIRECTORIES ---
  const filteredStudents = (Array.isArray(students) ? students : []).filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(query) ||
      (s.email || '').toLowerCase().includes(query) ||
      (s.admissionNo || s.rollNumber || '').toLowerCase().includes(query) ||
      (s.classCategory || '').toLowerCase().includes(query) ||
      (s.class || '').toLowerCase().includes(query);

    const matchesClass = studentClassFilter === 'All' || s.class === studentClassFilter;
    return matchesSearch && matchesClass;
  });

  const filteredTeachers = (Array.isArray(teachers) ? teachers : []).filter(t => 
    (t.name || '').toLowerCase().includes(query) ||
    (t.email || '').toLowerCase().includes(query) ||
    (t.subject || '').toLowerCase().includes(query) ||
    (t.department || '').toLowerCase().includes(query)
  );

  const filteredFeeStructures = (Array.isArray(feeStructures) ? feeStructures : []).filter(fs => {
    const matchesSearch = !feeStructureSearchQuery || (fs.class || '').toLowerCase().includes(feeStructureSearchQuery.toLowerCase());
    const matchesYear = feeStructureYearFilter === 'All' || fs.academicSession === feeStructureYearFilter;
    return matchesSearch && matchesYear;
  });

  const academicSessionOptions = Array.from(new Set((Array.isArray(feeStructures) ? feeStructures : []).map(fs => fs.academicSession))).filter(Boolean);

  // Render Skeleton while initial loading is active
  if (loading && !stats) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-96 font-medium" />
        </div>
        <DashboardStatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-none font-sans">
              {currentTab === 'dashboard' ? 'Administrative Dashboard' : 
               currentTab === 'students' ? 'Student Registry & Roster' :
               currentTab === 'teachers' ? 'Faculty Directories' :
               currentTab === 'fees' ? 'Financial Center' :
               currentTab === 'fee-structure' ? 'Fee Structure Policy Matrix' :
               currentTab === 'notices' ? 'Bulletin Bullet Board' : 
               currentTab.toUpperCase() + ' panel'}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-blue-50 border border-blue-200/50 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {currentTab === 'fee-structure' ? 'AY 2026-27' : 'AY 2025-26'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            {currentTab === 'dashboard' 
              ? 'Welcome back. Monitoring activity at The School of Pansy Flowers.' 
              : currentTab === 'fee-structure'
              ? 'Configure standard grade-wise default tuition, assessments, and operational levies.'
              : `Manage operational parameters under The School of Pansy Flowers ${currentTab} directory.`}
          </p>
        </div>

        {/* Dynamic header button if suitable directory */}
        {currentTab === 'students' && (
          <Button onClick={() => setIsStudentModalOpen(true)} leftIcon={<Plus size={16} />}>
            Admit Student
          </Button>
        )}
        {currentTab === 'teachers' && (
          <Button onClick={() => setIsTeacherModalOpen(true)} leftIcon={<Plus size={16} />}>
            Onboard Faculty
          </Button>
        )}
        {currentTab === 'notices' && (
          <Button onClick={() => setIsNoticeModalOpen(true)} leftIcon={<Plus size={16} />}>
            Publish Notice
          </Button>
        )}
        {currentTab === 'fees' && (
          <Button onClick={() => setIsFeeModalOpen(true)} leftIcon={<Plus size={16} />}>
            Record Payment
          </Button>
        )}
        {currentTab === 'fee-structure' && (
          <Button onClick={handleAddFeeStructureClick} leftIcon={<Plus size={16} />}>
            Add Fee Structure
          </Button>
        )}
      </div>

      {/* --- RENDER TARGET TAB CONDITIONAL --- */}
      {currentTab === 'dashboard' ? (
        <div className="space-y-6 md:space-y-8">
          
          {/* 1. DIRECTIVE ANALYTICS COUNTS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <StatCard 
              title="Total Students"
              value={stats?.totalStudents || 0}
              growth={stats?.studentsGrowth}
              icon={<Users size={18} />}
              iconBgClass="bg-blue-50 text-blue-600 border border-blue-100"
            />
            <StatCard 
              title="Total Teachers"
              value={stats?.totalTeachers || 0}
              growth={stats?.teachersGrowth}
              icon={<GraduationCap size={18} />}
              iconBgClass="bg-purple-50 text-purple-600 border border-purple-100"
            />
            <StatCard 
              title="Fees Collected"
              value={`₹${(stats?.feesCollected || 0).toLocaleString()}`}
              growth={stats?.feesGrowth}
              icon={<DollarSign size={18} />}
              iconBgClass="bg-emerald-50 text-emerald-600 border border-emerald-100"
            />
            <StatCard 
              title="Active Notices"
              value={stats?.activeNotices || 0}
              icon={<Megaphone size={18} />}
              iconBgClass="bg-amber-50 text-amber-600 border border-amber-100"
            />
          </section>

          {/* 2. DENTED QUICK LAUNCH WORKFLOW ACTIONS */}
          <section className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 md:p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4 select-none">
              Command Suite & Fast Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionCard
                title="Admit Student"
                description="Formulate standard registry records, profile parameters & group levels."
                actionText="Admit New Student"
                icon={UserPlus}
                onClick={() => setIsStudentModalOpen(true)}
                accentBgClass="bg-blue-50/70 border border-blue-100/50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                accentTextClass="text-blue-600"
              />
              <QuickActionCard
                title="Onboard Teacher"
                description="Register faculty members, designate specific subject streams & contact lines."
                actionText="Onboard Teacher"
                icon={GraduationCap}
                onClick={() => setIsTeacherModalOpen(true)}
                accentBgClass="bg-purple-50/70 border border-purple-100/50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                accentTextClass="text-purple-600"
              />
              <QuickActionCard
                title="Collect Tuition"
                description="Book term collections, generate automated audit invoices & tracking logs."
                actionText="Collect Term Fee"
                icon={DollarSign}
                onClick={handleDashboardCollectTermFee}
                accentBgClass="bg-emerald-50/70 border border-emerald-100/50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                accentTextClass="text-emerald-700"
              />
              <QuickActionCard
                title="Publish Bulletin"
                description="Distribute bulletin notices with assigned priority parameters."
                actionText="Publish Alert"
                icon={Megaphone}
                onClick={() => setIsNoticeModalOpen(true)}
                accentBgClass="bg-amber-50/70 border border-amber-100/50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white"
                accentTextClass="text-amber-700"
              />
            </div>
          </section>

          {/* 3. MIDDLE SECTION DUAL ANALYTICS LAYOUTS */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-full">
              <FeeCollectionWidget fees={fees} loading={loading} />
            </div>
            <div className="h-full">
              <StudentDistribution distribution={distribution} loading={loading} />
            </div>
          </section>

          {/* 4. RECENT BULLET BULLETIN AND TIMELINE FEED */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentNotices notices={notices} loading={loading} />
            </div>
            <div>
              <RecentActivities activities={activities} loading={loading} />
            </div>
          </section>
        </div>
      ) : null}

      {/* --- DIRECTORY TAB: STUDENTS --- */}
      {currentTab === 'students' && (
        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:max-w-xl">
              <div className="relative w-full sm:max-w-xs">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Search registered students..."
                  className="w-full text-xs font-semibold pl-9 pr-4 py-2 border border-slate-200 focus:border-blue-500 rounded-lg outline-hidden"
                  disabled
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">Class:</span>
                <select
                  value={studentClassFilter}
                  onChange={(e) => setStudentClassFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 cursor-pointer outline-hidden min-w-[110px]"
                >
                  <option value="All">All Classes</option>
                  <option value="Nursery">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="3rd">3rd</option>
                  <option value="4th">4th</option>
                  <option value="5th">5th</option>
                  <option value="6th">6th</option>
                  <option value="7th">7th</option>
                  <option value="8th">8th</option>
                  <option value="9th">9th</option>
                  <option value="10th">10th</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-400 mr-2 hidden md:inline">
                Showing {filteredStudents.length} overall matches
              </span>
              <button
                onClick={handleExportStudentsExcel}
                title="Export list to Excel (.csv)"
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-600 hover:text-slate-800 transition-all select-none active:scale-95 cursor-pointer shadow-xs"
              >
                <Download size={13} className="text-emerald-600" />
                Excel
              </button>
              <button
                onClick={handleExportStudentsPDF}
                title="Print list or Save as PDF"
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-600 hover:text-slate-800 transition-all select-none active:scale-95 cursor-pointer shadow-xs"
              >
                <FileText size={13} className="text-indigo-600" />
                PDF Report
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-700 select-none">
                  <th className="p-4 px-6">Student Name</th>
                  <th className="p-4">Admission No</th>
                  <th className="p-4">Parent Name</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Section</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No matching student catalogs detected.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stu) => (
                    <tr key={stu.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 px-6">
                        <div>
                          <p className="font-extrabold text-slate-900">{stu.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{stu.email}</p>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-500">
                        {stu.admissionNo || stu.rollNumber || 'N/A'}
                      </td>
                      <td className="p-4 text-slate-700 font-bold">{stu.parentName}</td>
                      <td className="p-4">
                        <Badge 
                          variant={
                            stu.classCategory === 'Secondary' ? 'info' :
                            stu.classCategory === 'Primary' ? 'success' :
                            stu.classCategory === 'Middle School' ? 'warning' : 'primary'
                          } 
                          size="sm"
                        >
                          {stu.class || stu.classCategory || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-600 font-semibold">{stu.section || 'N/A'}</td>
                      <td className="p-4 text-slate-505">{stu.phone || stu.contact || 'N/A'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditStudentClick(stu)}
                            title="Edit Student Roster Details"
                            className="p-1.5 cursor-pointer rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all select-none active:scale-95"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handlePrepareDeleteStudent(stu)}
                            title="Delete Student Record"
                            className="p-1.5 cursor-pointer rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-all select-none active:scale-95"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* --- DIRECTORY TAB: TEACHERS --- */}
      {currentTab === 'teachers' && (
        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
            <span className="text-xs font-semibold text-slate-505 select-none font-sans">
              The School of Pansy Flowers Academic Stream & Board Officers
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportTeachersExcel}
                title="Export list to Excel (.csv)"
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-600 hover:text-slate-800 transition-all select-none active:scale-95 cursor-pointer shadow-xs"
              >
                <Download size={13} className="text-emerald-600" />
                Excel
              </button>
              <button
                onClick={handleExportTeachersPDF}
                title="Print list or Save as PDF"
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-600 hover:text-slate-800 transition-all select-none active:scale-95 cursor-pointer shadow-xs"
              >
                <FileText size={13} className="text-indigo-600" />
                PDF Report
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-700 select-none">
                  <th className="p-4 px-6">ID & FACULTY STREAM</th>
                  <th className="p-4">SUBJECT EXPERTISE</th>
                  <th className="p-4">DEPARTMENT</th>
                  <th className="p-4">CONTACT LINE</th>
                  <th className="p-4">JOINING DATE</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No matching teacher faculties onboarded.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 px-6 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold flex-shrink-0">
                          {t.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{t.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{t.email}</p>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{t.subject}</td>
                      <td className="p-4 font-bold text-slate-400 uppercase tracking-wider">{t.department}</td>
                      <td className="p-4 text-slate-505 font-medium">{t.contact}</td>
                      <td className="p-4 font-semibold text-slate-500">{t.joiningDate}</td>
                      <td className="p-4">
                        <Badge variant={t.status === 'Active' ? 'success' : 'warning'} size="sm">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditTeacherClick(t)}
                            title="Edit Faculty Details"
                            className="p-1.5 cursor-pointer rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all select-none active:scale-95"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handlePrepareDeleteTeacher(t)}
                            title="Delete Faculty Record"
                            className="p-1.5 cursor-pointer rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-all select-none active:scale-95"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* --- FINANCIAL TABS VIEW --- */}
      {currentTab === 'fees' && (() => {
        const activeRecord = selectedFeeStudent || feeRecords[0];

        // Match student's class to fee structure or build dynamic fallback based on totalFee
        const getMatchingStructureForClass = (studentClass: string, totalFee: number) => {
          const cleanedClass = (studentClass || '').trim().toLowerCase();
          let match = (feeStructures || []).find(fs => (fs.class || '').toLowerCase() === cleanedClass);
          if (match) return match;
          const numPart = cleanedClass.match(/\d+/);
          if (numPart) {
            match = (feeStructures || []).find(fs => (fs.class || '').toLowerCase().includes(numPart[0]));
            if (match) return match;
          }
          match = (feeStructures || []).find(fs => 
            (fs.class || '').toLowerCase().includes(cleanedClass) || 
            cleanedClass.includes((fs.class || '').toLowerCase())
          );
          if (match) return match;

          // Default fallback split into 4 quarters
          const parts = Math.floor(totalFee / 4);
          return {
            id: `fallback-fs-${cleanedClass}`,
            class: studentClass || 'General',
            admissionFee: 0,
            tuitionFee: totalFee,
            computerFee: 0,
            examFee: 0,
            culturalActivityFee: 0,
            totalFee: totalFee,
            academicSession: '2026-27',
            juneAmount: parts,
            septemberAmount: parts,
            decemberAmount: parts,
            marchAmount: totalFee - parts * 3
          };
        };

        // Determine installment statuses based on recorded cumulative paidAmount
        const getInstallmentStatuses = (paidAmount: number, fs: any) => {
          const J = fs.juneAmount || 0;
          const S = fs.septemberAmount || 0;
          const D = fs.decemberAmount || 0;
          const M = fs.marchAmount || 0;

          let tempPaid = paidAmount;

          const juneStatus = tempPaid >= J ? 'Paid' : tempPaid > 0 ? 'Partial' : 'Pending';
          const junePaid = Math.min(tempPaid, J);
          tempPaid = Math.max(0, tempPaid - J);

          const septemberStatus = tempPaid >= S ? 'Paid' : tempPaid > 0 ? 'Partial' : 'Pending';
          const septemberPaid = Math.min(tempPaid, S);
          tempPaid = Math.max(0, tempPaid - S);

          const decemberStatus = tempPaid >= D ? 'Paid' : tempPaid > 0 ? 'Partial' : 'Pending';
          const decemberPaid = Math.min(tempPaid, D);
          tempPaid = Math.max(0, tempPaid - D);

          const marchStatus = tempPaid >= M ? 'Paid' : tempPaid > 0 ? 'Partial' : 'Pending';
          const marchPaid = Math.min(tempPaid, M);

          return {
            juneStatus,
            junePaid,
            septemberStatus,
            septemberPaid,
            decemberStatus,
            decemberPaid,
            marchStatus,
            marchPaid
          };
        };
        
        // Filter student fees list
        const filteredFeeRecords = feeRecords.filter(record => {
          const matchesSearch = record.name.toLowerCase().includes(feeSearchQuery.toLowerCase()) || 
                                record.admissionNo.toLowerCase().includes(feeSearchQuery.toLowerCase());
          const matchesClass = feeClassFilter === 'All' || record.className === feeClassFilter;
          return matchesSearch && matchesClass;
        });

        // Trigger action to open payment dialog
        const handleOpenPayModal = (record: typeof feeRecords[0]) => {
          setSelectedFeeStudent(record);
          setCustomPayAmount(record.dueAmount.toString());
          setCustomPayMode('Cash');
          setCustomPayNotes('');
          setReceiptDetail(null);
          setIsCustomPayModalOpen(true);
        };

        // Complete the payment flow
        const handleSavePaymentSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const amountFloat = parseFloat(customPayAmount);
          if (isNaN(amountFloat) || amountFloat <= 0) {
            alert('Please specify a valid payment amount.');
            return;
          }

          // Generate custom unique Receipt Number
          const randomSuffix = Math.floor(100 + Math.random() * 900);
          const customReceiptNo = `REC-2026-00${randomSuffix}`;

          // Update localized states
          const updatedRecords = feeRecords.map(item => {
            if (item.id === activeRecord.id) {
              const newPaid = item.paidAmount + amountFloat;
              const newDue = Math.max(0, item.totalFee - newPaid);
              let newStatus: 'Paid' | 'Partial' | 'Pending' = 'Partial';
              if (newDue === 0) newStatus = 'Paid';
              else if (newPaid === 0) newStatus = 'Pending';
              
              // Prepend new item to mock history list
              const currentDay = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
              return {
                ...item,
                paidAmount: newPaid,
                dueAmount: newDue,
                status: newStatus,
                paymentHistory: [{ date: currentDay, amount: amountFloat }, ...item.paymentHistory]
              };
            }
            return item;
          });

          setFeeRecords(updatedRecords);
          
          // Select the updated record to keep views fresh
          const updatedActive = updatedRecords.find(item => item.id === activeRecord.id);
          if (updatedActive) {
            setSelectedFeeStudent(updatedActive);
          }

          // Update system state dashboard summary
          if (fees) {
            setFees({
              ...fees,
              collected: fees.collected + amountFloat,
              pending: Math.max(0, fees.pending - amountFloat)
            });
          }

          // Log dynamic activity event in ERP list
          const newSystemEvent: Activity = {
            id: `ac-${Date.now()}`,
            activity: `Fee collected from ${activeRecord.name} (₹${amountFloat.toLocaleString()}) via ${customPayMode}`,
            user: 'Finance Terminal 1',
            time: 'Just Now',
            type: 'fee'
          };
          setActivities(prev => [newSystemEvent, ...prev]);

          // Transition to Payment Successful template state
          setReceiptDetail({
            receiptNo: customReceiptNo,
            amount: amountFloat,
            studentName: activeRecord.name
          });
        };

        return (
          <div className="space-y-6 animate-fadeIn select-none">
            
            {/* Main Section Header */}
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Fee Management</h2>
              <p className="text-[11px] text-slate-450 font-semibold tracking-wide">
                Perform student lookup, assess active tuition margins & book settlements in real time.
              </p>
            </div>

            {/* Top Toolbar Control Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 border border-slate-100 rounded-xl shadow-xs">
              <div className="relative w-full sm:flex-1">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Student..."
                  value={feeSearchQuery}
                  onChange={(e) => setFeeSearchQuery(e.target.value)}
                  className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-150 rounded-lg focus:bg-white focus:border-blue-500 outline-hidden transition-all placeholder:text-slate-405 text-slate-700"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-44">
                  <select
                    value={feeClassFilter}
                    onChange={(e) => setFeeClassFilter(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 border border-slate-155 rounded-lg outline-none cursor-pointer focus:bg-white focus:border-blue-500 text-slate-700"
                  >
                    <option value="All">Class: All Filter</option>
                    <option value="10-A">Class: 10-A</option>
                    <option value="9-B">Class: 9-B</option>
                  </select>
                </div>

                <button
                  onClick={handleExportFeesExcel}
                  title="Export fees ledger block to Excel (.csv)"
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-600 hover:text-slate-800 transition-all select-none active:scale-95 cursor-pointer shadow-xs"
                >
                  <Download size={13} className="text-emerald-500" />
                  <span>Excel</span>
                </button>
                
                <button
                  onClick={handleExportFeesPDF}
                  title="Print fees ledger or Save as PDF"
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-600 hover:text-slate-800 transition-all select-none active:scale-95 cursor-pointer shadow-xs"
                >
                  <FileText size={13} className="text-indigo-500" />
                  <span>PDF Ledger</span>
                </button>
              </div>
            </div>

            {/* Split Screen Master-Detail Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              
              {/* Left Column: Fees Directory Ledger Table */}
              <Card className="lg:col-span-3 p-0 pb-2 border border-slate-100 overflow-hidden shadow-xs hover:shadow-sm transition-all bg-white rounded-xl">
                <div className="p-4 border-b border-slate-50">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Tuition Status Roster</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-55/40 text-slate-500 border-b border-slate-100 font-extrabold">
                        <th className="p-3.5 px-5">Name</th>
                        <th className="p-3.5">Class</th>
                        <th className="p-3.5">Due Amount</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-bold">
                      {filteredFeeRecords.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-slate-400 text-xs font-semibold">
                            No ledger matches found in directories.
                          </td>
                        </tr>
                      ) : (
                        filteredFeeRecords.map((item) => {
                          const isActive = activeRecord?.id === item.id;
                          return (
                            <tr 
                              key={item.id} 
                              onClick={() => setSelectedFeeStudent(item)}
                              className={`cursor-pointer transition-all ${
                                isActive 
                                  ? 'bg-blue-50/50 text-blue-900 border-l-2 border-blue-600' 
                                  : 'hover:bg-slate-50 text-slate-658 border-l-2 border-transparent'
                              }`}
                            >
                              <td className="p-3.5 px-5">
                                <div className="flex items-center gap-2">
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    item.status === 'Paid' ? 'bg-emerald-500' :
                                    item.status === 'Partial' ? 'bg-amber-500' : 'bg-red-500'
                                  }`} />
                                  <span className="font-extrabold">{item.name}</span>
                                </div>
                              </td>
                              <td className="p-3.5 text-slate-500 font-semibold">{item.className}</td>
                              <td className="p-3.5 text-slate-900">₹{(item.dueAmount ?? 0).toLocaleString()}</td>
                              <td className="p-3.5">
                                <Badge 
                                  variant={
                                    item.status === 'Paid' ? 'success' :
                                    item.status === 'Partial' ? 'warning' : 'danger'
                                  }
                                  size="sm"
                                >
                                  {item.status}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Right Column: Selected Student's Detailed Profile Ledger */}
              {activeRecord && (
                <Card className="lg:col-span-2 p-5 bg-white border border-slate-100 rounded-xl shadow-xs space-y-6">
                  
                  {/* Student core metadata header */}
                  <div className="pb-4 border-b border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Selected Ledger Details</p>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{activeRecord.name}</h3>
                    <div className="flex flex-col gap-1 mt-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                      <div className="flex justify-between">
                        <span className="text-slate-450 font-semibold">Admission No:</span>
                        <span className="font-extrabold text-slate-800">{activeRecord.admissionNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-450 font-semibold">Class:</span>
                        <span className="font-extrabold text-slate-800">{activeRecord.className}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Current Month billing details */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Current Month</h4>
                    <div className="space-y-2 bg-slate-50/40 p-4 border border-slate-100/54 rounded-xl text-xs">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-bold">Total Fee</span>
                        <span className="font-black text-slate-900">₹{(activeRecord.totalFee ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 py-2">
                        <span className="text-slate-500 font-bold">Paid Amount</span>
                        <span className="font-black text-emerald-600">₹{(activeRecord.paidAmount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b border-dash-y border-slate-100 py-2">
                        <span className="text-slate-500 font-bold">Due Amount</span>
                        <span className="font-black text-red-500 text-sm">₹{(activeRecord.dueAmount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-500 font-bold">Status</span>
                        <span className="font-extrabold">
                          <Badge 
                            variant={
                              activeRecord.status === 'Paid' ? 'success' :
                              activeRecord.status === 'Partial' ? 'warning' : 'danger'
                            }
                            size="sm"
                          >
                            {activeRecord.status}
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1.5: Student Installment Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Installment Plan breakdown</h4>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50/20 p-2 border border-slate-100/50 rounded-xl">
                      {(() => {
                        const matchingFS = getMatchingStructureForClass(activeRecord.className || activeRecord.class, activeRecord.totalFee);
                        const inst = getInstallmentStatuses(activeRecord.paidAmount, matchingFS);
                        return (
                          <>
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase">June</span>
                              <div className="flex items-center justify-between gap-1.5 mt-1.5">
                                <span className="font-extrabold text-slate-800 text-xs">₹{(matchingFS?.juneAmount || 0).toLocaleString()}</span>
                                <Badge variant={inst.juneStatus === 'Paid' ? 'success' : inst.juneStatus === 'Partial' ? 'warning' : 'danger'} size="xs">
                                  {inst.juneStatus}
                                </Badge>
                              </div>
                            </div>
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase">Sept</span>
                              <div className="flex items-center justify-between gap-1.5 mt-1.5">
                                <span className="font-extrabold text-slate-800 text-xs">₹{(matchingFS?.septemberAmount || 0).toLocaleString()}</span>
                                <Badge variant={inst.septemberStatus === 'Paid' ? 'success' : inst.septemberStatus === 'Partial' ? 'warning' : 'danger'} size="xs">
                                  {inst.septemberStatus}
                                </Badge>
                              </div>
                            </div>
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase">Dec</span>
                              <div className="flex items-center justify-between gap-1.5 mt-1.5">
                                <span className="font-extrabold text-slate-800 text-xs">₹{(matchingFS?.decemberAmount || 0).toLocaleString()}</span>
                                <Badge variant={inst.decemberStatus === 'Paid' ? 'success' : inst.decemberStatus === 'Partial' ? 'warning' : 'danger'} size="xs">
                                  {inst.decemberStatus}
                                </Badge>
                              </div>
                            </div>
                            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase">March</span>
                              <div className="flex items-center justify-between gap-1.5 mt-1.5">
                                <span className="font-extrabold text-slate-800 text-xs">₹{(matchingFS?.marchAmount || 0).toLocaleString()}</span>
                                <Badge variant={inst.marchStatus === 'Paid' ? 'success' : inst.marchStatus === 'Partial' ? 'warning' : 'danger'} size="xs">
                                  {inst.marchStatus}
                                </Badge>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Section 2: Settlement Payment History timeline */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Payment History</h4>
                    <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                      {activeRecord.paymentHistory.length === 0 ? (
                        <p className="text-[10px] text-slate-400 bg-slate-50 p-4 text-center rounded-lg font-semibold border border-dashed text-slate-505">
                          No historical ledger payments archived.
                        </p>
                      ) : (
                        activeRecord.paymentHistory.map((item, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between text-xs p-2.5 bg-slate-50 border border-slate-100/70 rounded-lg hover:border-slate-200 transition-colors"
                          >
                            <span className="text-slate-500 font-bold">{item.date}</span>
                            <span className="font-black text-slate-800">₹{(item.amount ?? 0).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Operational Button */}
                  <div className="pt-2 select-none">
                    <Button 
                      fullWidth 
                      disabled={activeRecord.dueAmount <= 0}
                      onClick={() => handleOpenPayModal(activeRecord)}
                      leftIcon={<DollarSign size={15} />}
                    >
                      {activeRecord.dueAmount <= 0 ? 'Fully Settlement Completed' : 'Pay Fee'}
                    </Button>
                  </div>

                </Card>
              )}

            </div>

            {/* CUSTOM PAY INTERACTIVE DIALOG MODAL */}
            {isCustomPayModalOpen && (
              <Modal
                isOpen={isCustomPayModalOpen}
                onClose={() => setIsCustomPayModalOpen(false)}
                title={receiptDetail ? "Transaction successful" : "Pay Fee"}
                footer={null}
              >
                {!receiptDetail ? (
                  /* STEP 1: FILL FORM INFORMATION */
                  <form onSubmit={handleSavePaymentSubmit} className="space-y-4 animate-fadeIn">
                    
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Student</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">{activeRecord.name}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Current Due</p>
                      <p className="text-sm font-black text-red-500 mt-0.5">₹{(activeRecord?.dueAmount ?? 0).toLocaleString()}</p>
                    </div>

                    {/* Quick Installment Select Buttons */}
                    {(() => {
                      const matchingFS = getMatchingStructureForClass(activeRecord.className || activeRecord.class, activeRecord.totalFee);
                      const inst = getInstallmentStatuses(activeRecord.paidAmount, matchingFS);
                      
                      const juneRemaining = Math.max(0, (matchingFS?.juneAmount || 0) - inst.junePaid);
                      const septemberRemaining = Math.max(0, (matchingFS?.septemberAmount || 0) - inst.septemberPaid);
                      const decemberRemaining = Math.max(0, (matchingFS?.decemberAmount || 0) - inst.decemberPaid);
                      const marchRemaining = Math.max(0, (matchingFS?.marchAmount || 0) - inst.marchPaid);

                      const hasDueInstallments = juneRemaining > 0 || septemberRemaining > 0 || decemberRemaining > 0 || marchRemaining > 0;

                      if (!hasDueInstallments) return null;

                      return (
                        <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <label className="text-[9px] font-black tracking-wider text-slate-400 uppercase">Installment Quick Select</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {juneRemaining > 0 && (
                              <button
                                type="button"
                                onClick={() => setCustomPayAmount(juneRemaining.toString())}
                                className="text-left p-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 rounded-lg flex flex-col justify-between transition-all active:scale-97 cursor-pointer"
                              >
                                <span className="text-[9px] font-bold text-slate-400 uppercase">June Term</span>
                                <span className="text-xs font-black text-blue-600 mt-0.5">₹{juneRemaining.toLocaleString()}</span>
                              </button>
                            )}
                            {septemberRemaining > 0 && (
                              <button
                                type="button"
                                onClick={() => setCustomPayAmount(septemberRemaining.toString())}
                                className="text-left p-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 rounded-lg flex flex-col justify-between transition-all active:scale-97 cursor-pointer"
                              >
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Sept Term</span>
                                <span className="text-xs font-black text-indigo-600 mt-0.5">₹{septemberRemaining.toLocaleString()}</span>
                              </button>
                            )}
                            {decemberRemaining > 0 && (
                              <button
                                type="button"
                                onClick={() => setCustomPayAmount(decemberRemaining.toString())}
                                className="text-left p-2 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 rounded-lg flex flex-col justify-between transition-all active:scale-97 cursor-pointer"
                              >
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Dec Term</span>
                                <span className="text-xs font-black text-purple-600 mt-0.5">₹{decemberRemaining.toLocaleString()}</span>
                              </button>
                            )}
                            {marchRemaining > 0 && (
                              <button
                                type="button"
                                onClick={() => setCustomPayAmount(marchRemaining.toString())}
                                className="text-left p-2 bg-white border border-slate-200 hover:border-pink-300 hover:bg-pink-50/20 rounded-lg flex flex-col justify-between transition-all active:scale-97 cursor-pointer"
                              >
                                <span className="text-[9px] font-bold text-slate-400 uppercase">March Term</span>
                                <span className="text-xs font-black text-pink-600 mt-0.5">₹{marchRemaining.toLocaleString()}</span>
                              </button>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setCustomPayAmount(activeRecord.dueAmount.toString())}
                            className="w-full text-center mt-1.5 p-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Select Full Outstanding (₹{activeRecord.dueAmount.toLocaleString()})
                          </button>
                        </div>
                      );
                    })()}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Amount Paid</label>
                      <input
                        type="number"
                        required
                        value={customPayAmount}
                        onChange={(e) => setCustomPayAmount(e.target.value)}
                        placeholder="Enter amount to pay"
                        max={activeRecord.dueAmount}
                        min="1"
                        className="w-full text-xs font-bold px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode</label>
                      <select
                        value={customPayMode}
                        onChange={(e) => setCustomPayMode(e.target.value as any)}
                        className="w-full text-xs font-bold px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-blue-500 text-slate-700"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Notes</label>
                      <input
                        type="text"
                        value={customPayNotes}
                        onChange={(e) => setCustomPayNotes(e.target.value)}
                        placeholder="Any payment references or check numbers"
                        className="w-full text-xs font-medium px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                      <Button variant="outline" size="sm" type="button" onClick={() => setIsCustomPayModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" type="submit">
                        Save Payment
                      </Button>
                    </div>

                  </form>
                ) : (
                  /* STEP 2: PAYMENT SUCCESSFUL RECEIPT PANEL */
                  <div className="space-y-6 text-center py-4 animate-fadeIn select-none">
                    
                    {/* Circle Success Icons */}
                    <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <CheckCircle size={22} className="animate-pulse" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-900">Payment Successful</h4>
                      <p className="text-[11px] text-slate-400 font-semibold">
                        Your transaction reference has been verified and settled in ledger!
                      </p>
                    </div>

                    {/* Receipt visual paper box */}
                    <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-3.5 text-xs text-left max-w-sm mx-auto shadow-inner">
                      
                      <div className="flex justify-between border-b border-slate-150 pb-2">
                        <span className="text-slate-400 font-semibold">Receipt No:</span>
                        <span className="font-extrabold font-mono text-slate-800">{receiptDetail.receiptNo}</span>
                      </div>

                      <div className="flex justify-between border-b border-slate-150 pb-2">
                        <span className="text-slate-400 font-semibold">Student Name:</span>
                        <span className="font-extrabold text-slate-800">{receiptDetail.studentName}</span>
                      </div>

                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400 font-semibold">Amount Paid:</span>
                        <span className="font-black text-emerald-600 text-sm">₹{(receiptDetail?.amount ?? 0).toLocaleString()}</span>
                      </div>

                    </div>

                    {/* Printer and downloader action wrappers */}
                    <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          printReceiptBill({
                            receiptNo: receiptDetail.receiptNo,
                            studentName: receiptDetail.studentName,
                            amount: receiptDetail.amount,
                            paymentMode: customPayMode,
                            className: activeRecord.className,
                            admissionNo: activeRecord.admissionNo,
                            dueAmountRemaining: activeRecord.dueAmount,
                            totalFee: activeRecord.totalFee,
                            paidAmountTotal: activeRecord.paidAmount
                          });
                        }}
                        className="flex-1 py-2 border rounded-lg text-xs font-bold font-sans text-slate-700 bg-white hover:bg-slate-50 border-slate-200 transition-all shadow-xs active:scale-98 cursor-pointer"
                      >
                        Download / Save PDF
                      </button>
                      <button
                        onClick={() => {
                          printReceiptBill({
                            receiptNo: receiptDetail.receiptNo,
                            studentName: receiptDetail.studentName,
                            amount: receiptDetail.amount,
                            paymentMode: customPayMode,
                            className: activeRecord.className,
                            admissionNo: activeRecord.admissionNo,
                            dueAmountRemaining: activeRecord.dueAmount,
                            totalFee: activeRecord.totalFee,
                            paidAmountTotal: activeRecord.paidAmount
                          });
                        }}
                        className="flex-1 py-2 border rounded-lg text-xs font-bold font-sans text-slate-755 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-700 transition-all shadow-xs active:scale-98 cursor-pointer"
                      >
                        Print Receipt
                      </button>
                    </div>

                    {/* Done dismiss control button */}
                    <div className="pt-2">
                      <button
                        onClick={() => setIsCustomPayModalOpen(false)}
                        className="w-full text-xs font-extrabold text-white py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 transition-colors active:scale-95"
                      >
                        Done & Close
                      </button>
                    </div>

                  </div>
                )}
              </Modal>
            )}

          </div>
        );
      })()}

      {/* --- CORE BULLETIN NOTICES TAB --- */}
      {currentTab === 'fee-structure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: Matrix table with Search & Filters */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="overflow-hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4 select-none">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:max-w-xl">
                  {/* Search bar */}
                  <div className="relative w-full sm:max-w-xs">
                    <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={feeStructureSearchQuery}
                      onChange={(e) => setFeeStructureSearchQuery(e.target.value)}
                      placeholder="Search class (e.g. Class 1)..."
                      className="w-full text-xs font-semibold pl-9 pr-4 py-2 border border-slate-200 focus:border-blue-500 rounded-lg outline-hidden"
                    />
                  </div>
                  {/* Year Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">Session:</span>
                    <select
                      value={feeStructureYearFilter}
                      onChange={(e) => setFeeStructureYearFilter(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:border-blue-500 cursor-pointer outline-hidden min-w-[110px]"
                    >
                      <option value="All">All Years</option>
                      <option value="2026-27">2026-27</option>
                      <option value="2025-26">2025-26</option>
                      {academicSessionOptions.filter(y => y !== '2026-27' && y !== '2025-26').map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Export actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportFeeStructuresExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-755 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer text-emerald-700"
                  >
                    <Download size={14} /> <span className="hidden sm:inline">Export Excel</span>
                  </button>
                  <button
                    onClick={handleExportFeeStructuresPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-755 hover:bg-blue-100 border border-blue-200/60 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer text-blue-700"
                  >
                    <FileText size={14} /> <span className="hidden sm:inline">Export PDF</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-wider font-sans">
                      <th className="py-3 px-4 font-black">Class</th>
                      <th className="py-3 px-4 font-black">Admission Fee</th>
                      <th className="py-3 px-4 font-black">Tuition Fee</th>
                      <th className="py-3 px-4 font-black">Computer Fee</th>
                      <th className="py-3 px-4 font-black">Exam Fee</th>
                      <th className="py-3 px-4 font-black">Cultural Activity Fee</th>
                      <th className="py-3 px-4 font-black text-slate-900">Total Fee</th>
                      <th className="py-3 px-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700 font-sans">
                    {filteredFeeStructures.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-bold select-none">
                          No fee structures match the current criteria. Click "Add Fee Structure" to establish policy.
                        </td>
                      </tr>
                    ) : (
                      filteredFeeStructures.map((fs) => {
                        const displayStructure = selectedFeeStructure || filteredFeeStructures[0] || null;
                        const isSelected = displayStructure ? displayStructure.id === fs.id : false;
                        return (
                          <tr 
                            key={fs.id} 
                            onClick={() => setSelectedFeeStructure(fs)}
                            className={`transition-all duration-150 cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-50/50 hover:bg-blue-50/70 border-l-2 border-l-blue-600' 
                                : 'hover:bg-slate-50/70 border-l-2 border-l-transparent'
                            }`}
                          >
                            <td className="py-3 px-4 font-extrabold text-slate-900">
                              <span className="flex items-center gap-1.5">
                                {fs.class}
                                {isSelected && <Badge variant="primary" size="sm">Selected</Badge>}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">₹{(fs.admissionFee || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-emerald-600 font-bold">₹{(fs.tuitionFee || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-slate-600">₹{(fs.computerFee || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-slate-600">₹{(fs.examFee || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-slate-600">₹{(fs.culturalActivityFee || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 font-black text-slate-950 text-sm">
                              ₹{(fs.totalFee || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedFeeStructure(fs)}
                                  className="p-1 px-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="View details breakdown"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={() => handleEditFeeStructureClick(fs)}
                                  className="p-1 px-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Policy"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteFeeStructureClick(fs.id)}
                                  className="p-1 px-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Policy"
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
            </Card>
          </div>

          {/* Right panel: Details Panel */}
          <div className="lg:col-span-4 space-y-4">
            {(() => {
              const displayStructure = selectedFeeStructure || filteredFeeStructures[0] || null;
              if (displayStructure) {
                return (
                  <Card className="border border-slate-100 shadow-sm bg-white overflow-hidden p-0">
                    <div className="p-4 bg-slate-900 text-white select-none">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Selected Structure</span>
                        <span className="text-xs bg-blue-600 px-2.5 py-0.5 rounded-full font-black text-white text-[9px] uppercase tracking-wide">
                          {displayStructure.academicSession}
                        </span>
                      </div>
                      <h3 className="text-lg font-black mt-1 font-sans">{displayStructure.class}</h3>
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Fee Breakdown */}
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 leading-none">Fee Breakdown</h4>
                        <div className="space-y-2 font-mono text-xs text-slate-600">
                          <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2">
                            <span className="font-medium text-slate-500">Admission Fee</span>
                            <span className="font-extrabold text-slate-800">₹{(displayStructure.admissionFee || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2">
                            <span className="font-medium text-slate-500">Tuition Fee</span>
                            <span className="font-extrabold text-slate-800">₹{(displayStructure.tuitionFee || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2">
                            <span className="font-medium text-slate-500">Computer Fee</span>
                            <span className="font-extrabold text-slate-800">₹{(displayStructure.computerFee || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2">
                            <span className="font-medium text-slate-500">Exam Fee</span>
                            <span className="font-extrabold text-slate-800">₹{(displayStructure.examFee || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2">
                            <span className="font-medium text-slate-500">Cultural Activity Fee</span>
                            <span className="font-extrabold text-slate-800">₹{(displayStructure.culturalActivityFee || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 font-sans text-sm font-black text-slate-900 select-none">
                            <span>Total Fee</span>
                            <span className="text-emerald-600 text-base">₹{(displayStructure.totalFee || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Installment Plan */}
                      <div className="pt-3 border-t border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 leading-none">Installment Plan</h4>
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              <span className="text-xs font-bold text-slate-800">June</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-xs font-black text-slate-905">₹{(displayStructure.juneAmount || 0).toLocaleString()}</span>
                              <Badge variant={displayStructure.juneStatus === 'Paid' ? 'success' : 'warning'} size="sm">
                                {displayStructure.juneStatus || 'Pending'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              <span className="text-xs font-bold text-slate-800">September</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-xs font-black text-slate-905">₹{(displayStructure.septemberAmount || 0).toLocaleString()}</span>
                              <Badge variant={displayStructure.septemberStatus === 'Paid' ? 'success' : 'warning'} size="sm">
                                {displayStructure.septemberStatus || 'Pending'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                              <span className="text-xs font-bold text-slate-800">December</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-xs font-black text-slate-905">₹{(displayStructure.decemberAmount || 0).toLocaleString()}</span>
                              <Badge variant={displayStructure.decemberStatus === 'Paid' ? 'success' : 'warning'} size="sm">
                                {displayStructure.decemberStatus || 'Pending'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                              <span className="text-xs font-bold text-slate-800">March</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-xs font-black text-slate-905">₹{(displayStructure.marchAmount || 0).toLocaleString()}</span>
                              <Badge variant={displayStructure.marchStatus === 'Paid' ? 'success' : 'warning'} size="sm">
                                {displayStructure.marchStatus || 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              }
              return (
                <div className="h-full min-h-[300px] border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-slate-50/30">
                  <div className="p-3 bg-slate-100 text-slate-400 rounded-full mb-2">
                    <Eye size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-450">Select any class structure from the ledger to view the installment plan breakups.</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- CORE BULLETIN NOTICES TAB --- */}
      {currentTab === 'notices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notices.map((n) => (
            <Card key={n.id} hoverEffect className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-extrabold text-slate-900">{n.title}</h4>
                <Badge 
                  variant={
                    n.priority === 'High' ? 'danger' :
                    n.priority === 'Medium' ? 'warning' : 'primary'
                  } 
                  size="sm"
                >
                  {n.priority}
                </Badge>
              </div>
              <p className="text-xs text-slate-505 leading-relaxed">{n.content}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-3 border-t border-slate-105">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {n.date}
                </span>
                <span className="text-blue-600">Pub: {n.publishedBy}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* --- MOCK COMPLETED ATTENDANCE / RESULTS PAGES --- */}
      {['attendance', 'results', 'settings'].includes(currentTab) && (
        <Card className="p-10 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 capitalize">The School of Pansy Flowers {currentTab} module ready</h4>
            <p className="text-xs text-slate-505 leading-relaxed max-w-md mx-auto mt-2">
              This panel is fully compiled, styled, and ready for additional database configurations. Connect the backend via Axios endpoints matching `src/api` directories.
            </p>
          </div>
        </Card>
      )}

      {/* =========================================
                     MODALS FORM POPUPS
         ========================================= */}

      {/* 1. ADMIT STUDENT MODAL */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => { setIsStudentModalOpen(false); setEditingStudentId(null); }}
        title={editingStudentId ? 'Edit Student Registry Details' : 'Admit New Student Registry'}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setIsStudentModalOpen(false); setEditingStudentId(null); }}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="student-admit-form" isLoading={submitLoading}>
              {editingStudentId ? 'Save Changes' : 'Save Student Admission'}
            </Button>
          </div>
        }
      >
        <form id="student-admit-form" onSubmit={handleStudentSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="FULL NAME"
              placeholder="e.g. Lillian Thorne"
              value={studentForm.name}
              onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="GENDER"
              placeholder="Male / Female / Other"
              value={studentForm.gender}
              onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
              required
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">User Portal Login Credentials</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="LOGIN EMAIL"
                type="email"
                placeholder="lillian@pansy.edu"
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                required
              />
              <Input
                label="PORTAL PASSWORD"
                type="password"
                placeholder="password123"
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="ADMISSION NO"
              placeholder="SOPF1092"
              value={studentForm.admissionNo}
              onChange={(e) => setStudentForm({ ...studentForm, admissionNo: e.target.value })}
              required
            />
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 tracking-wide select-none">
                CLASS
              </label>
              <div className="relative flex items-center w-full">
                <select
                  className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg transition-all duration-200 outline-hidden cursor-pointer"
                  value={studentForm.class}
                  onChange={(e) => setStudentForm({ ...studentForm, class: e.target.value })}
                  required
                >
                  <option value="Nursery">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="3rd">3rd</option>
                  <option value="4th">4th</option>
                  <option value="5th">5th</option>
                  <option value="6th">6th</option>
                  <option value="7th">7th</option>
                  <option value="8th">8th</option>
                  <option value="9th">9th</option>
                  <option value="10th">10th</option>
                </select>
              </div>
            </div>
            <Input
              label="SECTION"
              placeholder="A"
              value={studentForm.section}
              onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="ROLL NO"
              type="number"
              placeholder="15"
              value={studentForm.rollNo}
              onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
              required
            />
            <Input
              label="PHONE / CONTACT"
              placeholder="+91 95550 99999"
              value={studentForm.phone}
              onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="FATHER'S NAME"
              placeholder="David Thorne"
              value={studentForm.fatherName}
              onChange={(e) => setStudentForm({ ...studentForm, fatherName: e.target.value })}
              required
            />
            <Input
              label="MOTHER'S NAME"
              placeholder="Mary Thorne"
              value={studentForm.motherName}
              onChange={(e) => setStudentForm({ ...studentForm, motherName: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* 2. ONBOARD TEACHER MODAL */}
      <Modal
        isOpen={isTeacherModalOpen}
        onClose={() => { setIsTeacherModalOpen(false); setEditingTeacherId(null); }}
        title={editingTeacherId ? 'Edit Faculty Details' : 'Onboard Faculty Officer'}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setIsTeacherModalOpen(false); setEditingTeacherId(null); }}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="teacher-onboard-form" isLoading={submitLoading}>
              {editingTeacherId ? 'Save Changes' : 'Onboard Faculty'}
            </Button>
          </div>
        }
      >
        <form id="teacher-onboard-form" onSubmit={handleTeacherSubmit} className="space-y-4">
          <Input
            label="FULL NAME"
            placeholder="Dr. Julian Vance"
            value={teacherForm.name}
            onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-105 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">User Portal Login Credentials</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="LOGIN EMAIL"
                type="email"
                placeholder="clara.rivers@pansy.edu"
                value={teacherForm.email}
                onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                required
              />
              <Input
                label="PORTAL PASSWORD"
                type="password"
                placeholder="password123"
                value={teacherForm.password}
                onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SUBJECT STREAM SPECIALTY"
              placeholder="e.g. Advanced Chemistry"
              value={teacherForm.subject}
              onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
              error={formErrors.subject}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700 mb-1.5">DEPARTMENT DELEGATION</label>
              <select
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white border-slate-200 outline-none hover:border-slate-300"
                value={teacherForm.department}
                onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
              >
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Humanities">Humanities</option>
                <option value="Languages">Languages</option>
                <option value="Fine Arts">Fine Arts</option>
              </select>
            </div>
          </div>
          <Input
            label="CONTACT NUMBER"
            placeholder="+1 (555) 987-6543"
            value={teacherForm.contact}
            onChange={(e) => setTeacherForm({ ...teacherForm, contact: e.target.value })}
            required
          />
        </form>
      </Modal>

      {/* 3. TUITION COLLECTION MODAL */}
      <Modal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        title="Tuition Collection Settlement"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFeeModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="fee-collection-form" isLoading={submitLoading}>
              Collect Payment
            </Button>
          </div>
        }
      >
        <form id="fee-collection-form" onSubmit={handleFeeSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">SELECT STUDENT ACCOUNT</label>
            <select
              className="w-full px-3 py-2 text-xs border rounded-lg bg-white border-slate-200 outline-none hover:border-slate-300"
              value={feeForm.studentId}
              onChange={(e) => setFeeForm({ ...feeForm, studentId: e.target.value })}
            >
              <option value="">-- Choose registered student --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
              ))}
            </select>
            {formErrors.studentId && <p className="text-[10px] font-bold text-red-505">{formErrors.studentId}</p>}
          </div>

          <Input
            label="COLLECTED AMOUNT ($)"
            type="number"
            placeholder="1250"
            value={feeForm.amountPaid}
            onChange={(e) => setFeeForm({ ...feeForm, amountPaid: e.target.value })}
            error={formErrors.amountPaid}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">PAYMENT ROUTING METHOD</label>
            <select
              className="w-full px-3 py-2 text-xs border rounded-lg bg-white border-slate-200 outline-none hover:border-slate-300"
              value={feeForm.paymentMethod}
              onChange={(e) => setFeeForm({ ...feeForm, paymentMethod: e.target.value })}
            >
              <option value="Cash">Cash Vault</option>
              <option value="Card Gateway">Online Card Gateway</option>
              <option value="Bank Check">Clearing House Check</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* 4. GENERAL BULLETIN NOTICES MODAL */}
      <Modal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        title="Draft Bulletin Board Notice"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNoticeModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="bulletin-board-notice-form" isLoading={submitLoading}>
              Publish Announcement
            </Button>
          </div>
        }
      >
        <form id="bulletin-board-notice-form" onSubmit={handleNoticeSubmit} className="space-y-4">
          <Input
            label="BULLETIN HEADER TITLE"
            placeholder="e.g. Standard Winter Break Schedule"
            value={noticeForm.title}
            onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
            error={formErrors.title}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">ALERT CONTENT BODY</label>
            <textarea
              className="w-full p-3.5 text-xs border rounded-lg bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 outline-none min-h-32 leading-relaxed text-slate-800"
              placeholder="Provide a detailed announcement statement..."
              value={noticeForm.content}
              onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
              required
            />
            {formErrors.content && <p className="text-[10px] font-bold text-red-500">{formErrors.content}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">PRIORITY LEVEL</label>
              <select
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white border-slate-200 outline-none hover:border-slate-300"
                value={noticeForm.priority}
                onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
              >
                <option value="High">High Priority (Red)</option>
                <option value="Medium">Medium Priority (Yellow)</option>
                <option value="Low">Low Priority (Blue)</option>
              </select>
            </div>
            <Input
              label="PUBLISHED BY AUTHORITY"
              value={noticeForm.publishedBy}
              onChange={(e) => setNoticeForm({ ...noticeForm, publishedBy: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* FEE STRUCTURE MODAL */}
      <Modal
        isOpen={isFeeStructureModalOpen}
        onClose={() => { setIsFeeStructureModalOpen(false); setEditingFeeStructureId(null); }}
        title={editingFeeStructureId ? 'Edit Fee Structure Policy' : 'Add Fee Structure Policy'}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setIsFeeStructureModalOpen(false); setEditingFeeStructureId(null); }}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="fee-structure-form" isLoading={submitLoading}>
              Save Strategy
            </Button>
          </div>
        }
      >
        {(() => {
          const currentModalTotal =
            (Number(feeStructureForm.admissionFee) || 0) +
            (Number(feeStructureForm.tuitionFee) || 0) +
            (Number(feeStructureForm.computerFee) || 0) +
            (Number(feeStructureForm.examFee) || 0) +
            (Number(feeStructureForm.culturalActivityFee) || 0);

          return (
            <form id="fee-structure-form" onSubmit={handleFeeStructureSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 tracking-wide select-none uppercase">
                    Class Name
                  </label>
                  <select
                    className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg transition-all duration-200 cursor-pointer outline-hidden"
                    value={feeStructureForm.class}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, class: e.target.value })}
                    required
                  >
                    <option value="Class 1">Class 1</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Class 4">Class 4</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Nursery">Nursery</option>
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                  </select>
                </div>
                
                <Input
                  label="ACADEMIC SESSION"
                  placeholder="e.g. 2026-27"
                  value={feeStructureForm.academicSession}
                  onChange={(e) => setFeeStructureForm({ ...feeStructureForm, academicSession: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="ADMISSION FEE (₹)"
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={feeStructureForm.admissionFee}
                  onChange={(e) => setFeeStructureForm({ ...feeStructureForm, admissionFee: e.target.value })}
                  required
                />
                <Input
                  label="TUITION FEE (₹)"
                  type="number"
                  min="0"
                  placeholder="e.g. 1000"
                  value={feeStructureForm.tuitionFee}
                  onChange={(e) => setFeeStructureForm({ ...feeStructureForm, tuitionFee: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="COMPUTER FEE (₹)"
                  type="number"
                  min="0"
                  placeholder="e.g. 300"
                  value={feeStructureForm.computerFee}
                  onChange={(e) => setFeeStructureForm({ ...feeStructureForm, computerFee: e.target.value })}
                  required
                />
                <Input
                  label="EXAM FEE (₹)"
                  type="number"
                  min="0"
                  placeholder="e.g. 200"
                  value={feeStructureForm.examFee}
                  onChange={(e) => setFeeStructureForm({ ...feeStructureForm, examFee: e.target.value })}
                  required
                />
                <Input
                  label="CULTURAL ACTIVITY FEE (₹)"
                  type="number"
                  min="0"
                  placeholder="e.g. 100"
                  value={feeStructureForm.culturalActivityFee}
                  onChange={(e) => setFeeStructureForm({ ...feeStructureForm, culturalActivityFee: e.target.value })}
                  required
                />
              </div>

              {/* Dynamic summation display box */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between select-none">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Automatically Calculated Total Fee</span>
                  <p className="text-[10px] text-slate-500 font-bold">Admission + Tuition + Computer + Exam + Cultural Activity</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600 font-sans">
                    ₹{currentModalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Installments Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide select-none">Quarterly Installments</h4>
                  <button
                    type="button"
                    onClick={handleAutoGenerateInstallments}
                    className="text-[10px] px-2.5 py-1 text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-lg font-black transition-all cursor-pointer active:scale-95 uppercase tracking-wide"
                  >
                    Auto Generate Installments
                  </button>
                </div>

                <p className="text-[11px] text-slate-450 leading-relaxed font-semibold select-none">
                  Divide total fee equally into June, September, December & March amounts.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Input
                    label="JUNE AMOUNT (₹)"
                    type="number"
                    min="0"
                    placeholder="June"
                    value={feeStructureForm.juneAmount}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, juneAmount: e.target.value })}
                    required
                  />
                  <Input
                    label="SEPTEMBER AMOUNT (₹)"
                    type="number"
                    min="0"
                    placeholder="September"
                    value={feeStructureForm.septemberAmount}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, septemberAmount: e.target.value })}
                    required
                  />
                  <Input
                    label="DECEMBER AMOUNT (₹)"
                    type="number"
                    min="0"
                    placeholder="December"
                    value={feeStructureForm.decemberAmount}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, decemberAmount: e.target.value })}
                    required
                  />
                  <Input
                    label="MARCH AMOUNT (₹)"
                    type="number"
                    min="0"
                    placeholder="March"
                    value={feeStructureForm.marchAmount}
                    onChange={(e) => setFeeStructureForm({ ...feeStructureForm, marchAmount: e.target.value })}
                    required
                  />
                </div>
              </div>

              {formErrors.submit && (
                <p className="text-xs font-bold text-red-500 animate-pulse">{formErrors.submit}</p>
              )}
            </form>
          );
        })()}
      </Modal>

      {/* 5. SECURE DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Security Confirmation: Permanent Record Deletion"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              onClick={executeSecureDelete} 
              isLoading={submitLoading}
            >
              Verify & Delete Record Permanently
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-600 select-none">
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3 text-red-705">
            <ShieldAlert size={20} className="flex-shrink-0 text-red-650" />
            <div>
              <p className="font-extrabold tracking-wide uppercase text-[10px] text-red-800">Critical Action Warning</p>
              <p className="mt-1 leading-relaxed">
                You are about to delete the {deleteTargetType} profile for <strong className="font-sans font-black text-slate-900">{deleteTargetName}</strong>. This actions removes student or faculty access, schedules, and active credentials permanently.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase">
              Type <span className="text-red-600 font-extrabold font-mono text-sm leading-none bg-red-50 px-1 border border-red-100 rounded">CONFIRM</span> to verify deletion intent:
            </label>
            <Input
              placeholder="CONFIRM"
              value={deleteKeyword}
              onChange={(e) => setDeleteKeyword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase">
              Admin Authorization Passcode:
            </label>
            <Input
              type="password"
              placeholder="Enter passcode (Hint: admin123)"
              value={deletePasscode}
              onChange={(e) => setDeletePasscode(e.target.value)}
              required
            />
          </div>

          {deleteError && (
            <p className="text-xs font-bold text-red-500 animate-pulse">
              ⚠️ {deleteError}
            </p>
          )}

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 leading-relaxed text-[11px]">
            <span className="font-bold text-slate-700">Access Level Verified:</span> Principal Office Administrator (Root Level). General users are not permitted to update or delete student or teacher assets.
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default AdminDashboard;