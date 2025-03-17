
// Common data models for the API

export type Student = {
  id: string;
  name: string;
  courses: string[];
};

export type AttendanceRecord = {
  studentId: string;
  courseId: string;
  date: string;
  present: boolean;
};

export type Course = {
  id: string;
  name: string;
  teacher?: string;
  totalStudents?: number;
};

// Extend this file with other shared types as needed
