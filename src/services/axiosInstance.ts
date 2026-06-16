import axios from 'axios';
import { Student, Teacher, Notice, Activity, DashboardStats, FeeSummary, FeeStructure } from '../types';

const enableMock = true; // Easily flip to false to connect to a real live backend API!

// --- SEED DATA & IN-MEMORY LOCALSTORAGE DATABASE ---
const STORAGE_PREFIX = 'pansy_erp_v3_';

const defaultStudents: Student[] = [
  { id: 'st-1', name: 'Rahul Kumar', email: 'rahul.k@pansy.edu', rollNumber: 'SOPF002', class: '10th', classCategory: 'Secondary', gender: 'Male', parentName: 'Karan Kumar', contact: '+91 98765 43210', admissionDate: '2025-07-15' },
  { id: 'st-2', name: 'Aman Sharma', email: 'aman.s@pansy.edu', rollNumber: 'SOPF003', class: '9th', classCategory: 'Secondary', gender: 'Male', parentName: 'Rajesh Sharma', contact: '+91 98765 43211', admissionDate: '2025-08-10' },
  { id: 'st-3', name: 'Riya Sen', email: 'riya.s@pansy.edu', rollNumber: 'SOPF004', class: '8th', classCategory: 'Middle School', gender: 'Female', parentName: 'Vikram Sen', contact: '+91 98765 43212', admissionDate: '2025-09-02' },
  { id: 'st-4', name: 'Prisha Patel', email: 'prisha.p@pansy.edu', rollNumber: 'SOPF005', class: '3rd', classCategory: 'Primary', gender: 'Female', parentName: 'Amit Patel', contact: '+91 98765 43213', admissionDate: '2025-09-05' },
  { id: 'st-5', name: 'Arjun Singh', email: 'arjun.s@pansy.edu', rollNumber: 'SOPF006', class: '10th', classCategory: 'Secondary', gender: 'Male', parentName: 'Sanjay Singh', contact: '+91 98765 43214', admissionDate: '2025-09-08' },
  { id: 'st-6', name: 'Ananya Roy', email: 'ananya.r@pansy.edu', rollNumber: 'SOPF007', class: '2nd', classCategory: 'Primary', gender: 'Female', parentName: 'Carlos Roy', contact: '+91 98765 43215', admissionDate: '2025-09-10' },
];

const defaultTeachers: Teacher[] = [
  { id: 'tc-1', name: 'Dr. Clara Rivers', email: 'clara.rivers@pansy.edu', subject: 'Advanced Physics', department: 'Science', contact: '+91 95550 12345', joiningDate: '2023-01-15', status: 'Active' },
  { id: 'tc-2', name: 'Prof. Julian Vance', email: 'julian.vance@pansy.edu', subject: 'World History', department: 'Humanities', contact: '+91 95550 54321', joiningDate: '2022-08-20', status: 'Active' },
  { id: 'tc-3', name: 'Sonia Sharma', email: 'sonia.s@pansy.edu', subject: 'Mathematics & Algebra', department: 'Mathematics', contact: '+91 95550 67890', joiningDate: '2024-03-10', status: 'Active' },
  { id: 'tc-4', name: 'Raj Kumar', email: 'raj.k@pansy.edu', subject: 'English Literature', department: 'Languages', contact: '+91 95550 09876', joiningDate: '2021-11-05', status: 'On Leave' },
];

const defaultNotices: Notice[] = [
  { id: 'nt-1', title: 'Annual Cultural Festival "Pansy Fest 2026"', content: 'Dear teachers and students, the prep for our grand Pansy Fest 2026 commences next Monday. Please submit your entries for solo and group performances directly.', date: '2026-06-12', priority: 'High', publishedBy: 'Admin Office' },
  { id: 'nt-2', title: 'Mid-Term Examinations Schedule', content: 'The mid-term evaluation calendar for academic portion 2025-26 has been uploaded. Reviews will begin starting July 1st, 2026.', date: '2026-06-10', priority: 'High', publishedBy: 'Vice Principal' },
  { id: 'nt-3', title: 'New Computer Lab Maintenance', content: 'The junior computer lab will remain closed for bi-weekly hardware servicing this Thursday from 10:00 AM to 2:00 PM.', date: '2026-06-08', priority: 'Medium', publishedBy: 'Tech Desk' },
  { id: 'nt-4', title: 'Inter-School Soccer Championship', content: 'Congratulations to our junior soccer team for reaching the state finals. The decisive match is scheduled on June 22nd, 3:00 PM.', date: '2026-06-05', priority: 'Low', publishedBy: 'Sports Dept' },
];

const defaultActivities: Activity[] = [
  { id: 'ac-1', activity: 'New Student Admitted: Rahul Kumar (Secondary)', user: 'Admin Office', time: '10 Mins Ago', type: 'student' },
  { id: 'ac-2', activity: 'Quarterly Fees collected for Prisha Patel (₹12,500)', user: 'Finance Terminal 3', time: '1 Hour Ago', type: 'fee' },
  { id: 'ac-3', activity: 'Published high priority notice "Pansy Fest 2026"', user: 'Admin Office', time: '3 Hours Ago', type: 'notice' },
  { id: 'ac-4', activity: 'Onboarded Dr. Clara Rivers to Science Dept', user: 'HR Portal', time: '1 Day Ago', type: 'teacher' },
  { id: 'ac-5', activity: 'Quarterly Fees collected for Aman Sharma (₹12,500)', user: 'Online Gateway', time: '2 Days Ago', type: 'fee' },
];

const defaultFees: FeeSummary = {
  collected: 285200,
  pending: 42300,
  overdue: 12500,
  monthlyTarget: 340000,
};

const defaultFeeStructures: FeeStructure[] = [
  {
    id: 'fs-1',
    class: 'Class 1',
    admissionFee: 500,
    tuitionFee: 1000,
    computerFee: 300,
    examFee: 200,
    culturalActivityFee: 0,
    academicSession: '2026-27',
    totalFee: 2000,
    juneAmount: 500,
    septemberAmount: 500,
    decemberAmount: 500,
    marchAmount: 500,
    juneStatus: 'Paid',
    septemberStatus: 'Pending',
    decemberStatus: 'Pending',
    marchStatus: 'Pending'
  },
  {
    id: 'fs-2',
    class: 'Class 2',
    admissionFee: 500,
    tuitionFee: 1200,
    computerFee: 300,
    examFee: 200,
    culturalActivityFee: 0,
    academicSession: '2026-27',
    totalFee: 2200,
    juneAmount: 550,
    septemberAmount: 550,
    decemberAmount: 550,
    marchAmount: 550,
    juneStatus: 'Paid',
    septemberStatus: 'Pending',
    decemberStatus: 'Pending',
    marchStatus: 'Pending'
  },
];

// Database helper functions wrapped with localStorage
const getDBValue = <T>(key: string, defaultValue: T): T => {
  const value = localStorage.getItem(STORAGE_PREFIX + key);
  return value ? JSON.parse(value) : defaultValue;
};

const setDBValue = <T>(key: string, value: T): void => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
};

const defaultUsers = [
  { id: 'admin-1', name: 'Tanmay Principal', email: 'admin@pansy.edu', password: 'password123', role: 'admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', department: 'Principal Office' },
  { id: 'teacher-1', name: 'Prof. Clara Rivers', email: 'teacher@pansy.edu', password: 'password123', role: 'teacher', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', department: 'Science Department' },
  { id: 'student-1', name: 'Rahul Kumar', email: 'student@pansy.edu', password: 'password123', role: 'student', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', className: 'Grade 10-A' }
];

// Initialize database if empty
if (!localStorage.getItem(STORAGE_PREFIX + 'students')) {
  setDBValue('students', defaultStudents);
  setDBValue('teachers', defaultTeachers);
  setDBValue('notices', defaultNotices);
  setDBValue('activities', defaultActivities);
  setDBValue('fees', defaultFees);
  setDBValue('fee_structures', defaultFeeStructures);
  setDBValue('users', defaultUsers);
}

if (!localStorage.getItem(STORAGE_PREFIX + 'fee_structures')) {
  setDBValue('fee_structures', defaultFeeStructures);
}

if (!localStorage.getItem(STORAGE_PREFIX + 'users')) {
  setDBValue('users', defaultUsers);
}

// Custom Mock Request Handler with Axios Adapter Standard Shape
const handleMockRequest = (config: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const url = config.url || '';
    const method = (config.method || 'GET').toUpperCase();
    const data = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : null;

    // Fetch live localStorage states
    const students = getDBValue<Student[]>('students', defaultStudents);
    const teachers = getDBValue<Teacher[]>('teachers', defaultTeachers);
    const notices = getDBValue<Notice[]>('notices', defaultNotices);
    const activities = getDBValue<Activity[]>('activities', defaultActivities);
    const fees = getDBValue<FeeSummary>('fees', defaultFees);
    const feeStructures = getDBValue<FeeStructure[]>('fee_structures', defaultFeeStructures);

    // Simulated latency: 450ms for realistic premium skeletal animations
    setTimeout(() => {
      // Helper to resolve with standard Axios response structure
      const resolveResponse = (status: number, responseData: any) => {
        resolve({
          data: responseData,
          status,
          statusText: 'OK',
          headers: {},
          config,
        });
      };

      // Helper to reject with standard Axios error structure
      const rejectError = (status: number, errorMessage: string) => {
        reject({
          config,
          response: {
            status,
            statusText: status === 401 ? 'Unauthorized' : 'Bad Request',
            headers: {},
            data: { message: errorMessage }
          }
        });
      };

      // 1. LOGIN API
      if (url.includes('/auth/login') && method === 'POST') {
        const { email, password } = data || {};
        if (!email || !password) {
          return rejectError(400, 'Email and password are required');
        }
        if (password.length < 6) {
          return rejectError(400, 'Password must be at least 6 characters');
        }

        const usersList = getDBValue<any[]>('users', defaultUsers);
        const matchedUser = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (matchedUser && matchedUser.password === password) {
          return resolveResponse(200, {
            success: true,
            token: `mock-jwt-${matchedUser.role}-token-pansy-flowers`,
            user: {
              id: matchedUser.id,
              name: matchedUser.name,
              email: matchedUser.email,
              role: matchedUser.role,
              avatar: matchedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
              department: matchedUser.department || 'Academic Board Office',
              className: matchedUser.className || 'Grade 10-A'
            }
          });
        }

        return rejectError(401, 'Invalid credentials. Try: admin@pansy.edu / password123 or check your newly added accounts.');
      }

      // 2. DASHBOARD STATS API
      if (url.includes('/dashboard/stats') && method === 'GET') {
        const totalStu = students.length;
        const totalTea = teachers.length;
        const activeNot = notices.length;
        
        const stats: DashboardStats = {
          totalStudents: totalStu,
          totalTeachers: totalTea,
          feesCollected: fees.collected,
          activeNotices: activeNot,
          studentsGrowth: 12.4,
          teachersGrowth: 5.8,
          feesGrowth: 18.2
        };
        return resolveResponse(200, stats);
      }

      // 3. NOTICES API
      if (url.includes('/notices/recent') && method === 'GET') {
        return resolveResponse(200, notices);
      }

      if (url.includes('/notices') && method === 'POST') {
        const newNotice: Notice = {
          id: `nt-${Date.now()}`,
          title: data.title || 'Untitled Notification',
          content: data.content || '',
          date: new Date().toISOString().split('T')[0],
          priority: data.priority || 'Medium',
          publishedBy: data.publishedBy || 'Admin Desk'
        };
        const updated = [newNotice, ...notices];
        setDBValue('notices', updated);
        
        // Log activity
        const newActivity: Activity = {
          id: `ac-${Date.now()}`,
          activity: `Notice Published: "${newNotice.title}"`,
          user: newNotice.publishedBy,
          time: 'Just Now',
          type: 'notice'
        };
        setDBValue('activities', [newActivity, ...activities]);

        return resolveResponse(200, newNotice);
      }

      // 4. RECENT ACTIVITIES API
      if (url.includes('/dashboard/activities') && method === 'GET') {
        return resolveResponse(200, activities);
      }

      // 5. FEES OVERVIEW GET/POST API
      if (url.includes('/dashboard/fees') && method === 'GET') {
        return resolveResponse(200, fees);
      }

      if (url.includes('/fees/collect') && method === 'POST') {
        const { studentId, amountPaid, paymentMethod } = data || {};
        if (!amountPaid || Number(amountPaid) <= 0) {
          return rejectError(400, 'Invalid payment amount specified.');
        }
        
        const feeAmount = Number(amountPaid);
        const updatedFees: FeeSummary = {
          ...fees,
          collected: fees.collected + feeAmount,
          pending: Math.max(0, fees.pending - feeAmount),
        };
        setDBValue('fees', updatedFees);

        // Find student details
        const std = students.find(s => s.id === studentId) || { name: 'Unknown Student' };

        // Log unique Activity
        const newActivity: Activity = {
          id: `ac-${Date.now()}`,
          activity: `Fee collected from ${std.name} (₹${feeAmount.toLocaleString()}) via ${paymentMethod || 'Cash'}`,
          user: 'Finance Terminal 1',
          time: 'Just Now',
          type: 'fee'
        };
        setDBValue('activities', [newActivity, ...activities]);

        return resolveResponse(200, updatedFees);
      }

      // 6. STUDENT DISTRIBUTION API
      if (url.includes('/dashboard/student-distribution') && method === 'GET') {
        const distribution = {
          Foundation: students.filter(s => s.classCategory === 'Foundation').length,
          Primary: students.filter(s => s.classCategory === 'Primary').length,
          'Middle School': students.filter(s => s.classCategory === 'Middle School').length,
          Secondary: students.filter(s => s.classCategory === 'Secondary').length,
        };
        return resolveResponse(200, distribution);
      }

      // STUDENT UPDATE / DELETE
      if (url.includes('/students/') || (url.includes('/students') && (method === 'PUT' || method === 'DELETE'))) {
        const parts = url.split('/');
        const idFromUrl = parts[parts.length - 1];
        const studentId = idFromUrl && idFromUrl !== 'students' ? idFromUrl : data?.id;

        if (method === 'PUT') {
          const sIndex = students.findIndex(s => s.id === studentId);
          if (sIndex === -1) {
            return rejectError(404, 'Student record not found');
          }
          
          let category: 'Foundation' | 'Primary' | 'Middle School' | 'Secondary' = students[sIndex].classCategory;
          if (data.class) {
            const classStr = data.class.toLowerCase();
            if (classStr.includes('9') || classStr.includes('10th') || classStr.includes('9th') || classStr.includes('secondary') || classStr.includes('high')) {
              category = 'Secondary';
            } else if (classStr.includes('10')) {
              category = 'Secondary';
            } else if (classStr.includes('6') || classStr.includes('7') || classStr.includes('8') || classStr.includes('6th') || classStr.includes('7th') || classStr.includes('8th') || classStr.includes('middle')) {
              category = 'Middle School';
            } else if (classStr.includes('foundation') || classStr.includes('kindergarten') || classStr.includes('lkg') || classStr.includes('ukg') || classStr.includes('nursery')) {
              category = 'Foundation';
            } else {
              category = 'Primary';
            }
          }

          const updatedStudent: Student = {
            ...students[sIndex],
            ...data,
            id: studentId,
            classCategory: category,
            rollNumber: data.admissionNo || students[sIndex].rollNumber || data.rollNumber,
            parentName: data.fatherName || data.parentName || students[sIndex].parentName,
            contact: data.phone || data.contact || students[sIndex].contact,
          };
          
          const copyStudents = [...students];
          copyStudents[sIndex] = updatedStudent;
          setDBValue('students', copyStudents);

          // Update user record too
          if (updatedStudent.userId) {
            const usersList = getDBValue<any[]>('users', defaultUsers);
            const uIndex = usersList.findIndex(u => u.id === updatedStudent.userId);
            if (uIndex !== -1) {
              usersList[uIndex] = {
                ...usersList[uIndex],
                name: updatedStudent.name,
                email: updatedStudent.email,
                password: data.password || usersList[uIndex].password,
                className: updatedStudent.class ? `${updatedStudent.class}-${updatedStudent.section || 'A'}` : usersList[uIndex].className
              };
              setDBValue('users', usersList);
            }
          }

          return resolveResponse(200, updatedStudent);
        }

        if (method === 'DELETE') {
          const sIndex = students.findIndex(s => s.id === studentId);
          if (sIndex === -1) {
            return rejectError(404, 'Student record not found');
          }
          const studentToDelete = students[sIndex];
          const copyStudents = students.filter(s => s.id !== studentId);
          setDBValue('students', copyStudents);

          // Delete corresponding user
          if (studentToDelete.userId) {
            const usersList = getDBValue<any[]>('users', defaultUsers);
            const filteredUsers = usersList.filter(u => u.id !== studentToDelete.userId);
            setDBValue('users', filteredUsers);
          }

          return resolveResponse(200, { success: true });
        }
      }

      // 7. STUDENTS LIST & CREATION
      if (url.includes('/students') && method === 'GET') {
        return resolveResponse(200, students);
      }

      if (url.includes('/students') && method === 'POST') {
        // Create User record first
        const userId = `usr-${Date.now()}`;
        const usersList = getDBValue<any[]>('users', defaultUsers);

        const emailResolved = data.email || `${data.name.toLowerCase().replace(/\s+/g, '.')}@pansy.edu`;
        const newUserEntry = {
          id: userId,
          name: data.name,
          email: emailResolved,
          password: data.password || 'password123',
          role: 'student',
          avatar: data.gender === 'Female' 
            ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
            : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
          className: data.class ? `${data.class}-${data.section || 'A'}` : 'Grade 10-A'
        };

        usersList.push(newUserEntry);
        setDBValue('users', usersList);

        // Derive Class Category for structural alignment / charts
        let category: 'Foundation' | 'Primary' | 'Middle School' | 'Secondary' = 'Primary';
        const classStr = (data.class || '').toLowerCase();
        if (classStr.includes('9') || classStr.includes('10th') || classStr.includes('9th') || classStr.includes('secondary') || classStr.includes('high')) {
          category = 'Secondary';
        } else if (classStr.includes('10')) {
          category = 'Secondary';
        } else if (classStr.includes('6') || classStr.includes('7') || classStr.includes('8') || classStr.includes('6th') || classStr.includes('7th') || classStr.includes('8th') || classStr.includes('middle')) {
          category = 'Middle School';
        } else if (classStr.includes('foundation') || classStr.includes('kindergarten') || classStr.includes('lkg') || classStr.includes('ukg') || classStr.includes('nursery')) {
          category = 'Foundation';
        }

        const newStudent: Student = {
          id: `st-${Date.now()}`,
          userId: userId,
          name: data.name,
          email: emailResolved,
          admissionNo: data.admissionNo || `SOPF${Math.floor(1000 + Math.random() * 9000)}`,
          class: data.class || '10th',
          section: data.section || 'A',
          rollNo: Number(data.rollNo) || Math.floor(1 + Math.random() * 50),
          fatherName: data.fatherName || data.parentName || 'Unknown',
          motherName: data.motherName || 'Unknown',
          phone: data.phone || data.contact || '+91 95550 00000',

          // Compatibility fields
          rollNumber: data.admissionNo || `SOPF${Math.floor(1000 + Math.random() * 9000)}`,
          classCategory: category,
          gender: data.gender || 'Male',
          parentName: data.fatherName || data.parentName || 'Unknown',
          contact: data.phone || data.contact || '+91 95550 00000',
          admissionDate: new Date().toISOString().split('T')[0],
        };

        const updated = [newStudent, ...students];
        setDBValue('students', updated);

        // Log activity
        const newAct: Activity = {
          id: `ac-${Date.now()}`,
          activity: `Admitted Student: ${newStudent.name} (${newStudent.classCategory})`,
          user: 'Admin Office',
          time: 'Just Now',
          type: 'student',
        };
        setDBValue('activities', [newAct, ...activities]);

        return resolveResponse(200, newStudent);
      }

      // TEACHER UPDATE / DELETE
      if (url.includes('/teachers/') || (url.includes('/teachers') && (method === 'PUT' || method === 'DELETE'))) {
        const parts = url.split('/');
        const idFromUrl = parts[parts.length - 1];
        const teacherId = idFromUrl && idFromUrl !== 'teachers' ? idFromUrl : data?.id;

        if (method === 'PUT') {
          const tIndex = teachers.findIndex(t => t.id === teacherId);
          if (tIndex === -1) {
            return rejectError(404, 'Teacher record not found');
          }

          const updatedTeacher: Teacher = {
            ...teachers[tIndex],
            ...data,
            id: teacherId,
          };

          const copyTeachers = [...teachers];
          copyTeachers[tIndex] = updatedTeacher;
          setDBValue('teachers', copyTeachers);

          // Update corresponding user record
          if (updatedTeacher.userId) {
            const usersList = getDBValue<any[]>('users', defaultUsers);
            const uIndex = usersList.findIndex(u => u.id === updatedTeacher.userId);
            if (uIndex !== -1) {
              usersList[uIndex] = {
                ...usersList[uIndex],
                name: updatedTeacher.name,
                email: updatedTeacher.email,
                password: data.password || usersList[uIndex].password,
                department: updatedTeacher.department
              };
              setDBValue('users', usersList);
            }
          }

          return resolveResponse(200, updatedTeacher);
        }

        if (method === 'DELETE') {
          const tIndex = teachers.findIndex(t => t.id === teacherId);
          if (tIndex === -1) {
            return rejectError(404, 'Teacher record not found');
          }
          const teacherToDelete = teachers[tIndex];
          const copyTeachers = teachers.filter(t => t.id !== teacherId);
          setDBValue('teachers', copyTeachers);

          // Delete corresponding user
          if (teacherToDelete.userId) {
            const usersList = getDBValue<any[]>('users', defaultUsers);
            const filteredUsers = usersList.filter(u => u.id !== teacherToDelete.userId);
            setDBValue('users', filteredUsers);
          }

          return resolveResponse(200, { success: true });
        }
      }

      // 8. TEACHERS LIST & CREATION
      if (url.includes('/teachers') && method === 'GET') {
        return resolveResponse(200, teachers);
      }

      if (url.includes('/teachers') && method === 'POST') {
        // Create User record first
        const userId = `usr-${Date.now()}`;
        const usersList = getDBValue<any[]>('users', defaultUsers);

        const emailResolved = data.email || `${data.name.toLowerCase().replace(/\s+/g, '.')}@pansy.edu`;
        const newUserEntry = {
          id: userId,
          name: data.name,
          email: emailResolved,
          password: data.password || 'password123',
          role: 'teacher',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
          department: data.department || 'Science Department'
        };

        usersList.push(newUserEntry);
        setDBValue('users', usersList);

        const newTeacher: Teacher = {
          id: `tc-${Date.now()}`,
          userId: userId,
          name: data.name,
          email: emailResolved,
          password: data.password || 'password123',
          subject: data.subject || 'Substitute',
          department: data.department || 'General',
          contact: data.contact || '+91 95550 00000',
          joiningDate: new Date().toISOString().split('T')[0],
          status: 'Active',
        };

        const updated = [newTeacher, ...teachers];
        setDBValue('teachers', updated);

        // Log activity
        const newAct: Activity = {
          id: `ac-${Date.now()}`,
          activity: `Onboarded Teacher: ${newTeacher.name} to ${newTeacher.department}`,
          user: 'HR Portal',
          time: 'Just Now',
          type: 'teacher',
        };
        setDBValue('activities', [newAct, ...activities]);

        return resolveResponse(200, newTeacher);
      }

      // --- FEE STRUCTURES API ---
      if (url.includes('/fee-structures') && method === 'GET') {
        return resolveResponse(200, feeStructures);
      }

      if (url.includes('/fee-structures') && method === 'POST') {
        const id = `fs-${Date.now()}`;
        const total = (Number(data.admissionFee) || 0) + 
                      (Number(data.tuitionFee) || 0) + 
                      (Number(data.computerFee) || 0) + 
                      (Number(data.examFee) || 0) + 
                      (Number(data.culturalActivityFee) || 0);
        const newFS: FeeStructure = {
          id,
          class: data.class || 'Nursery',
          admissionFee: Number(data.admissionFee) || 0,
          tuitionFee: Number(data.tuitionFee) || 0,
          computerFee: Number(data.computerFee) || 0,
          examFee: Number(data.examFee) || 0,
          culturalActivityFee: Number(data.culturalActivityFee) || 0,
          academicSession: data.academicSession || '2026-27',
          totalFee: total,
          juneAmount: Number(data.juneAmount) || 0,
          septemberAmount: Number(data.septemberAmount) || 0,
          decemberAmount: Number(data.decemberAmount) || 0,
          marchAmount: Number(data.marchAmount) || 0,
          juneStatus: data.juneStatus || 'Pending',
          septemberStatus: data.septemberStatus || 'Pending',
          decemberStatus: data.decemberStatus || 'Pending',
          marchStatus: data.marchStatus || 'Pending'
        };
        const updated = [...feeStructures, newFS];
        setDBValue('fee_structures', updated);
        return resolveResponse(200, newFS);
      }

      if (url.includes('/fee-structures/') && method === 'PUT') {
        const parts = url.split('/');
        const fsId = parts[parts.length - 1];
        const idx = feeStructures.findIndex(f => f.id === fsId);
        if (idx !== -1) {
          const total = (Number(data.admissionFee) || 0) + 
                        (Number(data.tuitionFee) || 0) + 
                        (Number(data.computerFee) || 0) + 
                        (Number(data.examFee) || 0) + 
                        (Number(data.culturalActivityFee) || 0);
          const updatedFS: FeeStructure = {
            ...feeStructures[idx],
            ...data,
            admissionFee: Number(data.admissionFee) || 0,
            tuitionFee: Number(data.tuitionFee) || 0,
            computerFee: Number(data.computerFee) || 0,
            examFee: Number(data.examFee) || 0,
            culturalActivityFee: Number(data.culturalActivityFee) || 0,
            totalFee: total,
            juneAmount: Number(data.juneAmount) || 0,
            septemberAmount: Number(data.septemberAmount) || 0,
            decemberAmount: Number(data.decemberAmount) || 0,
            marchAmount: Number(data.marchAmount) || 0,
          };
          const copyFS = [...feeStructures];
          copyFS[idx] = updatedFS;
          setDBValue('fee_structures', copyFS);
          return resolveResponse(200, updatedFS);
        }
        return rejectError(404, 'Fee structure not found');
      }

      if (url.includes('/fee-structures/') && method === 'DELETE') {
        const parts = url.split('/');
        const fsId = parts[parts.length - 1];
        const copyFS = feeStructures.filter(f => f.id !== fsId);
        setDBValue('fee_structures', copyFS);
        return resolveResponse(200, { success: true });
      }

      // Catch-all response for anything else
      return resolveResponse(200, { success: true });
    }, 450);
  });
};

// Set up the base Axios instance
const axiosInstance = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: enableMock ? (config) => handleMockRequest(config) : undefined,
});

// Attach authorization headers automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('school_erp_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;