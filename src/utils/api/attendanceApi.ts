
// Attendance API operations
import { ApiClient } from './apiClient';
import { AttendanceRecord } from './models';
import { mockAttendanceRecords, mockStudents } from './mockData';

export class AttendanceApi extends ApiClient {
  private syncQueue: AttendanceRecord[] = [];

  async markAttendance(studentId: string, courseId: string, date: string): Promise<boolean> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    const attendanceRecord: AttendanceRecord = {
      studentId,
      courseId,
      date,
      present: true
    };

    if (!this.isOnline) {
      // Add to queue for later sync
      this.syncQueue.push(attendanceRecord);
      return true;
    }

    // If not authenticated, just simulate success
    if (!this.isAuthenticated) {
      return true;
    }

    try {
      // Use the Apps Script URL to record attendance
      const url = new URL(this.appsScriptUrl as string);
      url.searchParams.append('action', 'markAttendance');
      url.searchParams.append('studentId', studentId);
      url.searchParams.append('courseId', courseId);
      url.searchParams.append('date', date);
      
      console.log("Sending attendance data to Google Apps Script:", url.toString());
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error("Error marking attendance:", error);
      // Add to queue for later sync
      this.syncQueue.push(attendanceRecord);
      return true;
    }
  }

  async syncQueuedAttendance(): Promise<boolean> {
    if (!this.isOnline || !this.isAuthenticated) {
      return false;
    }

    // Nothing to sync
    if (this.syncQueue.length === 0) {
      return true;
    }

    try {
      // Use the Apps Script URL to sync queued records
      const response = await fetch(
        `${this.appsScriptUrl}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'syncAttendance',
            records: this.syncQueue
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        this.syncQueue = [];
      }
      return result.success;
    } catch (error) {
      console.error("Error syncing attendance:", error);
      return false;
    }
  }

  getQueueSize(): number {
    return this.syncQueue.length;
  }

  async getAttendanceStats(courseId: string): Promise<any[]> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    // If not authenticated or offline, use mock data
    if (!this.isAuthenticated || !this.isOnline) {
      // Get all attendance records for this course
      const courseAttendance = mockAttendanceRecords.filter(record => record.courseId === courseId);
      
      // Get unique dates when attendance was taken
      const dates = [...new Set(courseAttendance.map(record => record.date))];
      
      // Get total number of students in this course
      const totalStudents = mockStudents.filter(s => s.courses.includes(courseId)).length;
      
      // Calculate attendance stats for each date
      return dates.map(date => {
        const attendanceCount = courseAttendance.filter(record => 
          record.date === date && record.present
        ).length;
        
        return {
          date: new Date(date).toLocaleDateString(),
          count: attendanceCount,
          percentage: Math.round((attendanceCount / totalStudents) * 100)
        };
      });
    }

    try {
      // Use the Apps Script URL to fetch real data
      const response = await fetch(
        `${this.appsScriptUrl}?action=getAttendanceStats&courseId=${encodeURIComponent(courseId)}`,
        { mode: 'cors' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure proper date formatting
      return data.map((item: any) => ({
        ...item,
        date: new Date(item.date as string).toLocaleDateString(),
      }));
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      // Fallback to mock data using the same code as above
      const courseAttendance = mockAttendanceRecords.filter(record => record.courseId === courseId);
      const dates = [...new Set(courseAttendance.map(record => record.date))];
      const totalStudents = mockStudents.filter(s => s.courses.includes(courseId)).length;
      
      return dates.map(date => {
        const attendanceCount = courseAttendance.filter(record => 
          record.date === date && record.present
        ).length;
        
        return {
          date: new Date(date).toLocaleDateString(),
          count: attendanceCount,
          percentage: Math.round((attendanceCount / totalStudents) * 100)
        };
      });
    }
  }
}
