import axiosInstance from '../services/axiosInstance';
import { Student } from '../types';

export const studentApi = {
getStudents: async (): Promise<Student[]> => {
  const response = await axiosInstance.get('/student');

  const students = response.data.students.map((student: any) => ({
    id: student._id,
    name: student.userId?.name,
    email: student.userId?.email,
    admissionNo: student.admissionNo,
    class: student.class,
    section: student.section,
    rollNo: student.rollNo,
    fatherName: student.fatherName,
    motherName: student.motherName,
    phone: student.phone,
    parentName: student.fatherName,
  }));

  console.log("MAPPED STUDENTS:", students);

  return students;
},

  addStudent: async (studentData: Omit<Student, 'id' | 'rollNumber' | 'admissionDate'>): Promise<Student> => {
    const response = await axiosInstance.post('/student/add', studentData);
    return response.data;
  },

  getStudentDistribution: async (): Promise<Record<string, number>> => {
    const response = await axiosInstance.get('/dashboard/student-distribution');
    return response.data;
  },

  getFeesOverview: async () => {
    const response = await axiosInstance.get('/dashboard/fees');
    return response.data;
  },

  collectFee: async (paymentData: { studentId: string; amountPaid: number; paymentMethod: string }) => {
    const response = await axiosInstance.post('/fees/collect', paymentData);
    return response.data;
  },

  updateStudent: async (id: string, studentData: Partial<Student>): Promise<Student> => {
    const response = await axiosInstance.patch(`/student/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/student/${id}`);
  }
};
