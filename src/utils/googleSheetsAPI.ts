
// Main API file that combines all the individual APIs
import { ApiClient } from './api/apiClient';
import { StudentApi } from './api/studentApi';
import { CourseApi } from './api/courseApi';
import { AttendanceApi } from './api/attendanceApi';
import { Student, Course, AttendanceRecord } from './api/models';

// Export types for use in other components
export type { Student, Course, AttendanceRecord };

class GoogleSheetsAPI extends ApiClient {
  private studentApi: StudentApi;
  private courseApi: CourseApi;
  private attendanceApi: AttendanceApi;

  constructor() {
    super();
    this.studentApi = new StudentApi();
    this.courseApi = new CourseApi();
    this.attendanceApi = new AttendanceApi();
  }

  // Override setOnlineStatus to update all API instances
  setOnlineStatus(isOnline: boolean): void {
    super.setOnlineStatus(isOnline);
    this.studentApi.setOnlineStatus(isOnline);
    this.courseApi.setOnlineStatus(isOnline);
    this.attendanceApi.setOnlineStatus(isOnline);
  }

  // Override setAppsScriptUrl to update all API instances
  setAppsScriptUrl(url: string): void {
    super.setAppsScriptUrl(url);
    this.studentApi.setAppsScriptUrl(url);
    this.courseApi.setAppsScriptUrl(url);
    this.attendanceApi.setAppsScriptUrl(url);
  }

  // Student API methods
  async getStudents(courseId?: string): Promise<Student[]> {
    return this.studentApi.getStudents(courseId);
  }

  async findStudentById(studentId: string): Promise<Student | null> {
    return this.studentApi.findStudentById(studentId);
  }

  // Course API methods
  async getCourses(): Promise<Course[]> {
    return this.courseApi.getCourses();
  }

  async addCourse(courseData: { id: string; name: string; teacher: string }): Promise<boolean> {
    return this.courseApi.addCourse(courseData);
  }

  // Attendance API methods
  async markAttendance(studentId: string, courseId: string, date: string): Promise<boolean> {
    return this.attendanceApi.markAttendance(studentId, courseId, date);
  }

  async syncQueuedAttendance(): Promise<boolean> {
    return this.attendanceApi.syncQueuedAttendance();
  }

  getQueueSize(): number {
    return this.attendanceApi.getQueueSize();
  }

  async getAttendanceStats(courseId: string): Promise<any[]> {
    return this.attendanceApi.getAttendanceStats(courseId);
  }
}

// Create and export a singleton instance
export default new GoogleSheetsAPI();
