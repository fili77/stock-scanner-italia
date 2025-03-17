
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
      const url = `${this.appsScriptUrl}?action=getCourses`;
      console.log("Fetching courses from:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Courses data received:", data);
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
      
      // Create URL with query parameters instead of using formData
      const url = new URL(this.appsScriptUrl as string);
      url.searchParams.append('action', 'addCourse');
      url.searchParams.append('id', courseData.id);
      url.searchParams.append('name', courseData.name);
      url.searchParams.append('teacher', courseData.teacher);
      
      console.log("Request URL:", url.toString());
      
      // Make a GET request to the Apps Script (more compatible with Apps Script)
      const response = await fetch(url.toString());
      
      console.log("Response received:", response);
      
      if (!response.ok) {
        console.error("Error response:", await response.text());
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Response data:", result);
      
      return result.success === true;
    } catch (error) {
      console.error("Error adding course:", error);
      return false;
    }
  }
}
