
// Mock data for offline mode
import { Student, Course, AttendanceRecord } from './models';

// Mock data for attendance records
export const mockAttendanceRecords: AttendanceRecord[] = [
  { studentId: 'S1001', courseId: 'C001', date: '2023-05-01', present: true },
  { studentId: 'S1002', courseId: 'C001', date: '2023-05-01', present: true },
  { studentId: 'S1003', courseId: 'C002', date: '2023-05-01', present: true },
  { studentId: 'S1001', courseId: 'C001', date: '2023-05-02', present: true },
  { studentId: 'S1004', courseId: 'C001', date: '2023-05-02', present: true },
  { studentId: 'S1005', courseId: 'C002', date: '2023-05-02', present: true },
  { studentId: 'S1006', courseId: 'C003', date: '2023-05-02', present: true },
  { studentId: 'S1007', courseId: 'C001', date: '2023-05-03', present: true },
  { studentId: 'S1008', courseId: 'C001', date: '2023-05-03', present: true },
];

// Fallback mock data in case the API isn't configured
export const mockStudents: Student[] = [
  { id: 'S1001', name: 'Marco Rossi', courses: ['C001', 'C003'] },
  { id: 'S1002', name: 'Giulia Bianchi', courses: ['C001', 'C002'] },
  { id: 'S1003', name: 'Alessandro Verdi', courses: ['C002', 'C003'] },
  { id: 'S1004', name: 'Francesca Russo', courses: ['C001'] },
  { id: 'S1005', name: 'Lorenzo Bruno', courses: ['C002'] },
  { id: 'S1006', name: 'Sofia Esposito', courses: ['C003'] },
  { id: 'S1007', name: 'Matteo Ferrari', courses: ['C001', 'C002', 'C003'] },
  { id: 'S1008', name: 'Elena Romano', courses: ['C001'] },
];

export const mockCourses: Course[] = [
  { id: 'C001', name: 'Programmazione Web', teacher: 'Mario Rossi', totalStudents: 5 },
  { id: 'C002', name: 'Intelligenza Artificiale', teacher: 'Laura Bianchi', totalStudents: 4 },
  { id: 'C003', name: 'Architettura dei Calcolatori', teacher: 'Giovanni Verdi', totalStudents: 4 },
];
