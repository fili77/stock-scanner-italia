
// Student API operations
import { ApiClient } from './apiClient';
import { Student } from './models';
import { mockStudents } from './mockData';

export class StudentApi extends ApiClient {
  async getStudents(courseId?: string): Promise<Student[]> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    // If not authenticated or offline, return mock data
    if (!this.isAuthenticated || !this.isOnline) {
      console.log("Using mock student data");
      if (courseId) {
        return mockStudents.filter(student => student.courses.includes(courseId));
      }
      return mockStudents;
    }

    try {
      // Use the Apps Script URL to fetch real data
      const url = courseId 
        ? `${this.appsScriptUrl}?action=getStudents&courseId=${encodeURIComponent(courseId)}`
        : `${this.appsScriptUrl}?action=getStudents`;
      
      const response = await fetch(url, { mode: 'cors' });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching students:", error);
      // Fallback to mock data
      if (courseId) {
        return mockStudents.filter(student => student.courses.includes(courseId));
      }
      return mockStudents;
    }
  }

  async findStudentById(studentId: string): Promise<Student | null> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    // If not authenticated or offline, use mock data
    if (!this.isAuthenticated || !this.isOnline) {
      const student = mockStudents.find(s => s.id === studentId);
      return student || null;
    }

    try {
      // Use the Apps Script URL to fetch the student
      const response = await fetch(
        `${this.appsScriptUrl}?action=findStudent&studentId=${encodeURIComponent(studentId)}`,
        { mode: 'cors' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.found ? data.student : null;
    } catch (error) {
      console.error("Error finding student:", error);
      // Fallback to mock data
      const student = mockStudents.find(s => s.id === studentId);
      return student || null;
    }
  }
}
