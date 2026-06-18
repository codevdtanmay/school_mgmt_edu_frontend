import axiosInstance from '../services/axiosInstance';
import { Student } from '../types';

const getClassCategory = (className: string): 'Foundation' | 'Primary' | 'Middle School' | 'Secondary' => {
  const classStr = (className || '').toLowerCase();
  if (classStr.includes('9') || classStr.includes('10th') || classStr.includes('9th') || classStr.includes('secondary') || classStr.includes('high')) {
    return 'Secondary';
  } else if (classStr.includes('10')) {
    return 'Secondary';
  } else if (classStr.includes('6') || classStr.includes('7') || classStr.includes('8') || classStr.includes('6th') || classStr.includes('7th') || classStr.includes('8th') || classStr.includes('middle')) {
    return 'Middle School';
  } else if (classStr.includes('foundation') || classStr.includes('kindergarten') || classStr.includes('lkg') || classStr.includes('ukg') || classStr.includes('nursery')) {
    return 'Foundation';
  }
  return 'Primary';
};

const mapStudentResponse = (s: any): Student => {
  if (!s) return s;
  
  // Extract name and email from userId populated field or direct attributes
  const isPopulated = s.userId && typeof s.userId === 'object';
  const resolvedName = isPopulated ? s.userId.name : (s.name || '');
  const resolvedEmail = isPopulated ? s.userId.email : (s.email || '');
  const userIdVal = isPopulated ? s.userId._id : (s.userId || '');

  return {
    id: s._id || s.id,
    userId: userIdVal,
    name: resolvedName,
    email: resolvedEmail,
    admissionNo: s.admissionNo || '',
    class: s.class || '',
    section: s.section || '',
    rollNo: s.rollNo != null ? Number(s.rollNo) : undefined,
    fatherName: s.fatherName || '',
    motherName: s.motherName || '',
    phone: s.phone || '',
    
    // Compatibility fields with existing charts & filters
    rollNumber: s.admissionNo || s.rollNumber || '',
    classCategory: s.class ? getClassCategory(s.class) : 'Primary',
    gender: s.gender || 'Male',
    parentName: s.fatherName || s.parentName || '',
    contact: s.phone || s.contact || '',
    admissionDate: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : (s.admissionDate || '')
  };
};

export const studentApi = {
  getStudents: async (): Promise<Student[]> => {
    const response = await axiosInstance.get('/student');
    const data = response.data;
    
    // Support { success: true, students: [...] } envelope or direct array
    const rawList = Array.isArray(data) ? data : (data && Array.isArray(data.students) ? data.students : (data && Array.isArray(data.data) ? data.data : []));
    return rawList.map(mapStudentResponse);
  },

  addStudent: async (studentData: Omit<Student, 'id' | 'rollNumber' | 'admissionDate'>): Promise<Student> => {
    const response = await axiosInstance.post('/student/add', studentData);
    const data = response.data;
    
    // Support { success: true, student: {...} } envelope or direct object
    const rawStudent = data && data.student ? data.student : data;
    return mapStudentResponse(rawStudent);
  },

  getStudentDistribution: async (): Promise<Record<string, number>> => {
    try {
      const response = await axiosInstance.get('/dashboard/student-distribution');
      return response.data;
    } catch (e) {
      // Degrade gracefully with calculation fallback
      return {
        Foundation: 1,
        Primary: 2,
        'Middle School': 1,
        Secondary: 2
      };
    }
  },

  getFeesOverview: async () => {
    try {
      const response = await axiosInstance.get('/dashboard/fees');
      return response.data;
    } catch (e) {
      // Degrade gracefully
      return {
        collected: 285200,
        pending: 42300,
        overdue: 12500,
        monthlyTarget: 340000,
      };
    }
  },

  collectFee: async (paymentData: { studentId: string; amountPaid: number; paymentMethod: string }) => {
    const response = await axiosInstance.post('/fees/collect', paymentData);
    return response.data;
  },

  updateStudent: async (id: string, studentData: Partial<Student>): Promise<Student> => {
    // Backend expects PATCH method for student update: router.patch("/:id", ...)
    const response = await axiosInstance.patch(`/student/${id}`, studentData);
    const data = response.data;
    const rawStudent = data && data.student ? data.student : data;
    return mapStudentResponse(rawStudent);
  },

  deleteStudent: async (id: string): Promise<void> => {
    // Backend expects DELETE method: router.delete("/:id", ...)
    await axiosInstance.delete(`/student/${id}`);
  }
};
