// This is a simplified implementation that demonstrates how to work with Google Sheets
// In a production app, you would want to use the Google Sheets API with proper authentication

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

// Mock data
const mockStudents: Student[] = [
  { id: 'S1001', name: 'Marco Rossi', courses: ['C001', 'C003'] },
  { id: 'S1002', name: 'Giulia Bianchi', courses: ['C001', 'C002'] },
  { id: 'S1003', name: 'Alessandro Verdi', courses: ['C002', 'C003'] },
  { id: 'S1004', name: 'Francesca Russo', courses: ['C001'] },
  { id: 'S1005', name: 'Lorenzo Bruno', courses: ['C002'] },
  { id: 'S1006', name: 'Sofia Esposito', courses: ['C003'] },
  { id: 'S1007', name: 'Matteo Ferrari', courses: ['C001', 'C002', 'C003'] },
  { id: 'S1008', name: 'Elena Romano', courses: ['C001'] },
];

const mockCourses = [
  { id: 'C001', name: 'Programmazione Web', totalStudents: 5 },
  { id: 'C002', name: 'Intelligenza Artificiale', totalStudents: 4 },
  { id: 'C003', name: 'Architettura dei Calcolatori', totalStudents: 4 },
];

const mockAttendance: AttendanceRecord[] = [
  // We'll add to this when marking attendance
];

class GoogleSheetsAPI {
  private isAuthenticated = false;
  private syncQueue: AttendanceRecord[] = [];
  private isOnline = true;
  private sheetId: string | null = null;

  constructor() {
    // Try to load sheet ID from localStorage
    this.sheetId = localStorage.getItem('googleSheetId');
    this.isAuthenticated = localStorage.getItem('googleSheetConnected') === 'true';
  }

  // Simple method to check if we're connected to a Google Sheet
  isConnected(): boolean {
    return this.isAuthenticated && !!this.sheetId;
  }

  async authenticate(): Promise<boolean> {
    // In a real app, this would initiate OAuth flow
    // For demo purposes, we'll just check if we have a sheet ID in localStorage
    this.sheetId = localStorage.getItem('googleSheetId');
    this.isAuthenticated = !!this.sheetId;
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.isAuthenticated);
      }, 1000);
    });
  }

  async getCourses(): Promise<typeof mockCourses> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    // In a real app, this would fetch courses from the Google Sheet
    // For now, we'll continue to use the mock data but with a simulated delay
    return new Promise(resolve => {
      setTimeout(() => {
        // Calculate additional course information based on attendance data
        const courses = mockCourses.map(course => {
          const courseAttendance = mockAttendance.filter(record => 
            record.courseId === course.id && record.present
          );
          
          // Get unique dates when attendance was taken for this course
          const attendanceDates = [...new Set(courseAttendance.map(record => record.date))];
          const lastScanned = attendanceDates.sort().pop();
          
          // Calculate attendance rate
          const totalCourseStudents = mockStudents.filter(s => s.courses.includes(course.id)).length;
          const attendanceRate = totalCourseStudents > 0
            ? Math.round((courseAttendance.length / (totalCourseStudents * attendanceDates.length || 1)) * 100)
            : 0;
          
          return {
            ...course,
            lastScanned: lastScanned ? new Date(lastScanned).toLocaleDateString() : undefined,
            attendanceRate,
            nextClass: this.getNextClassDate(),
          };
        });
        
        resolve(courses);
      }, 500);
    });
  }

  async getStudents(courseId?: string): Promise<Student[]> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    if (courseId) {
      return mockStudents.filter(student => student.courses.includes(courseId));
    }
    return mockStudents;
  }

  async findStudentById(studentId: string): Promise<Student | null> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    const student = mockStudents.find(s => s.id === studentId);
    return student || null;
  }

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

    // In a real app, this would update the Google Sheet
    mockAttendance.push(attendanceRecord);
    return true;
  }

  async syncQueuedAttendance(): Promise<boolean> {
    if (!this.isOnline || !this.isAuthenticated) {
      return false;
    }

    // Process the queue
    const success = await this.processQueue();
    if (success) {
      this.syncQueue = [];
    }
    return success;
  }

  private async processQueue(): Promise<boolean> {
    // In a real app, this would batch update the Google Sheet
    mockAttendance.push(...this.syncQueue);
    return true;
  }

  getQueueSize(): number {
    return this.syncQueue.length;
  }

  setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  async getAttendanceStats(courseId: string): Promise<any[]> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    // Get all attendance records for this course
    const courseAttendance = mockAttendance.filter(record => record.courseId === courseId);
    
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

  private getNextClassDate(): string {
    // Generate a random future date for demonstration
    const today = new Date();
    const daysToAdd = Math.floor(Math.random() * 7) + 1;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate.toLocaleDateString();
  }

  getSheetId(): string | null {
    return this.sheetId;
  }

  setSheetId(id: string): void {
    this.sheetId = id;
    localStorage.setItem('googleSheetId', id);
  }
}

export default new GoogleSheetsAPI();
