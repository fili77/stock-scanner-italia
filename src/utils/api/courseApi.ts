
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

  async getNextAvailableCourseId(): Promise<string> {
    try {
      // Get all existing courses
      const courses = await this.getCourses();
      
      // Extract numeric IDs and find the highest one
      const numericIds = courses.map(course => {
        const match = course.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      });
      
      // Get the highest ID and add 1, or start with 1 if no courses exist
      const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
      
      // Format the ID as "C{number}"
      return `C${nextId}`;
    } catch (error) {
      console.error("Error getting next available course ID:", error);
      // Fallback to a timestamp-based ID if something goes wrong
      return `C${new Date().getTime().toString().slice(-5)}`;
    }
  }

  async addCourse(courseData: { id: string; name: string; teacher: string }): Promise<boolean> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    // If we're not authenticated or offline, use mock data
    if (!this.isAuthenticated || !this.isOnline) {
      console.log("Using mock data - adding course to mock data");
      try {
        // Add the course to mock data
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
      
      // Create the URL with the action parameter
      const url = `${this.appsScriptUrl}?action=addCourse`;
      console.log("Request URL:", url);

      // Create the form data for the request
      const formData = new URLSearchParams();
      formData.append('id', courseData.id);
      formData.append('name', courseData.name);
      formData.append('teacher', courseData.teacher);
      
      console.log("Form data:", formData.toString());
      
      // Make a POST request to the Apps Script
      const response = await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });
      
      console.log("Response received:", response);
      
      // Since we're using no-cors mode, we can't access the response status
      // We'll assume success if the request didn't throw an error
      return true;
    } catch (error) {
      console.error("Error adding course:", error);
      return false;
    }
  }
}
