
// Course API operations
import { ApiClient } from './apiClient';
import { Course } from './models';
import { mockCourses } from './mockData';

export class CourseApi extends ApiClient {
  async getCourses(): Promise<Course[]> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    // If not authenticated or offline, return mock data
    if (!this.isAuthenticated || !this.isOnline) {
      console.log("Using mock course data");
      return mockCourses;
    }

    try {
      // Use the Apps Script URL to fetch real data
      const response = await fetch(
        `${this.appsScriptUrl}?action=getCourses`,
        { 
          mode: 'no-cors',
          method: 'GET'
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching courses:", error);
      // Fallback to mock data
      return mockCourses;
    }
  }

  async addCourse(courseData: { id: string; name: string; teacher: string }): Promise<boolean> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    // Se non siamo autenticati o siamo offline, usiamo dati di test
    if (!this.isAuthenticated || !this.isOnline) {
      console.log("Using mock data - adding course to mock data");
      try {
        // Aggiungiamo il corso ai dati di test
        mockCourses.push({
          id: courseData.id,
          name: courseData.name,
          teacher: courseData.teacher,
          totalStudents: 0
        });
        return true;
      } catch (error) {
        console.error("Error adding course to mock data:", error);
        return false;
      }
    }

    try {
      console.log("Sending course data to Google Apps Script:", courseData);
      console.log("URL:", this.appsScriptUrl);
      
      return await this.fetchWithNoCors('', 'POST', {
        action: 'addCourse',
        courseData: {
          id: courseData.id,
          name: courseData.name,
          teacher: courseData.teacher
        }
      });
    } catch (error) {
      console.error("Error adding course:", error);
      return false;
    }
  }
}
