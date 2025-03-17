
import React from 'react';

export const ScriptCodeBlock = () => {
  return (
    <div className="bg-muted p-3 rounded-md overflow-auto max-h-60 whitespace-pre text-xs font-mono">
{`function doGet(e) {
  // Handle GET requests
  var action = e.parameter.action;
  var result = {};
  
  Logger.log("Received GET request with action: " + action);
  Logger.log("Parameters: " + JSON.stringify(e.parameter));
  
  if (action === "getStudents") {
    result = getStudentsList(e.parameter.courseId);
  } else if (action === "getCourses") {
    result = getCoursesList();
  } else if (action === "findStudent") {
    result = findStudentById(e.parameter.studentId);
  } else if (action === "addCourse") {
    // Handle add course in GET request
    result = addCourse(e.parameter.id, e.parameter.name, e.parameter.teacher);
  } else if (action === "markAttendance") {
    // Handle mark attendance in GET request
    result = markStudentAttendance(e.parameter.studentId, e.parameter.courseId, e.parameter.date);
  } else if (action === "getAttendanceStats") {
    result = getAttendanceStats(e.parameter.courseId);
  }
  
  var output = ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  output.setHeader('Access-Control-Allow-Origin', '*');
  return output;
}

function doPost(e) {
  // Handle POST requests
  var result = { success: false, message: "Invalid request" };
  
  Logger.log("Received POST request");
  
  try {
    if (e.postData && e.postData.contents) {
      var data = JSON.parse(e.postData.contents);
      Logger.log("POST data: " + JSON.stringify(data));
      
      if (data.action === "markAttendance") {
        result = markStudentAttendance(data.studentId, data.courseId, data.date);
      } else if (data.action === "syncAttendance") {
        result = syncAttendanceRecords(data.records);
      } else if (data.action === "addCourse") {
        result = addCourse(data.id, data.name, data.teacher);
      }
    } else if (e.parameter && e.parameter.action) {
      // Fallback for URL parameters in POST
      Logger.log("POST parameters: " + JSON.stringify(e.parameter));
      
      if (e.parameter.action === "addCourse") {
        result = addCourse(e.parameter.id, e.parameter.name, e.parameter.teacher);
      } else if (e.parameter.action === "markAttendance") {
        result = markStudentAttendance(e.parameter.studentId, e.parameter.courseId, e.parameter.date);
      }
    }
  } catch (error) {
    result.message = "Error: " + error.toString();
    Logger.log("Error in doPost: " + error.toString());
  }
  
  var output = ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  output.setHeader('Access-Control-Allow-Origin', '*');
  return output;
}

function getStudentsList(courseId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Studenti");
  
  if (!sheet) {
    Logger.log("Studenti sheet not found");
    return [];
  }
  
  var data = sheet.getDataRange().getValues();
  var students = [];
  
  Logger.log("Found " + data.length + " rows in Studenti sheet");
  
  // Skip header row
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] && row[0] !== "") {
      var student = {
        id: row[0],
        name: row[1] + " " + row[2],
        courses: row[3].split(",").map(function(course) { return course.trim(); })
      };
      
      // If courseId is provided, filter students
      if (courseId && student.courses.indexOf(courseId) !== -1) {
        students.push(student);
      } else if (!courseId) {
        students.push(student);
      }
    }
  }
  
  Logger.log("Returning " + students.length + " students");
  return students;
}

function getCoursesList() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Corsi");
  
  if (!sheet) {
    Logger.log("Corsi sheet not found, creating it");
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Corsi");
    sheet.appendRow(["ID Corso", "Nome Corso", "Docente", "Totale Studenti"]);
    return [];
  }
  
  var data = sheet.getDataRange().getValues();
  var courses = [];
  
  Logger.log("Found " + data.length + " rows in Corsi sheet");
  
  // Skip header row
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] && row[0] !== "") {
      courses.push({
        id: row[0],
        name: row[1],
        teacher: row[2],
        totalStudents: row[3] || 0
      });
    }
  }
  
  Logger.log("Returning " + courses.length + " courses");
  return courses;
}

function addCourse(courseId, courseName, teacherName) {
  try {
    Logger.log("Adding course: " + courseId + ", " + courseName + ", " + teacherName);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Corsi");
    
    if (!sheet) {
      // Create the Corsi sheet if it doesn't exist
      Logger.log("Corsi sheet not found, creating it");
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Corsi");
      sheet.appendRow(["ID Corso", "Nome Corso", "Docente", "Totale Studenti"]);
    }
    
    // Add the new course to the sheet
    sheet.appendRow([
      courseId,
      courseName,
      teacherName,
      0  // Initial totalStudents value
    ]);
    
    Logger.log("Course added successfully");
    return { success: true, message: "Course added successfully" };
  } catch(error) {
    Logger.log("Error adding course: " + error.toString());
    return { success: false, message: "Error: " + error.toString() };
  }
}

function findStudentById(studentId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Studenti");
  
  if (!sheet) {
    Logger.log("Studenti sheet not found");
    return { found: false };
  }
  
  var data = sheet.getDataRange().getValues();
  
  Logger.log("Searching for student with ID: " + studentId);
  
  // Skip header row
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] === studentId) {
      Logger.log("Student found");
      return {
        found: true,
        student: {
          id: row[0],
          name: row[1] + " " + row[2],
          courses: row[3].split(",").map(function(course) { return course.trim(); })
        }
      };
    }
  }
  
  Logger.log("Student not found");
  return { found: false };
}

function markStudentAttendance(studentId, courseId, date) {
  try {
    Logger.log("Marking attendance: Student=" + studentId + ", Course=" + courseId + ", Date=" + date);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Presenze");
    
    if (!sheet) {
      // Create the Presenze sheet if it doesn't exist
      Logger.log("Presenze sheet not found, creating it");
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Presenze");
      sheet.appendRow(["ID Studente", "ID Corso", "Data", "Presente"]);
    }
    
    // Add attendance record
    sheet.appendRow([
      studentId,
      courseId,
      date,
      "presente"
    ]);
    
    Logger.log("Attendance marked successfully");
    return { success: true, message: "Attendance marked successfully" };
  } catch(error) {
    Logger.log("Error marking attendance: " + error.toString());
    return { success: false, message: "Error: " + error.toString() };
  }
}

function syncAttendanceRecords(records) {
  try {
    Logger.log("Syncing " + records.length + " attendance records");
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Presenze");
    
    if (!sheet) {
      // Create the Presenze sheet if it doesn't exist
      Logger.log("Presenze sheet not found, creating it");
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Presenze");
      sheet.appendRow(["ID Studente", "ID Corso", "Data", "Presente"]);
    }
    
    // Add all records
    for (var i = 0; i < records.length; i++) {
      var record = records[i];
      sheet.appendRow([
        record.studentId,
        record.courseId,
        record.date,
        "presente"
      ]);
    }
    
    Logger.log("All attendance records synced successfully");
    return { success: true, message: "All records synced successfully" };
  } catch(error) {
    Logger.log("Error syncing attendance records: " + error.toString());
    return { success: false, message: "Error: " + error.toString() };
  }
}

function getAttendanceStats(courseId) {
  try {
    Logger.log("Getting attendance stats for course: " + courseId);
    var presenceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Presenze");
    var studentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Studenti");
    
    if (!presenceSheet || !studentSheet) {
      Logger.log("Required sheets not found");
      return [];
    }
    
    var presenceData = presenceSheet.getDataRange().getValues();
    var studentData = studentSheet.getDataRange().getValues();
    
    // Count students in this course
    var totalStudents = 0;
    for (var i = 1; i < studentData.length; i++) {
      var courses = studentData[i][3].split(",").map(function(course) { return course.trim(); });
      if (courses.indexOf(courseId) !== -1) {
        totalStudents++;
      }
    }
    
    // Get all attendance records for this course
    var courseAttendance = [];
    for (var i = 1; i < presenceData.length; i++) {
      var row = presenceData[i];
      if (row[1] === courseId) {
        courseAttendance.push({
          studentId: row[0],
          courseId: row[1],
          date: row[2],
          present: row[3] === "presente"
        });
      }
    }
    
    // Get unique dates when attendance was taken
    var dateMap = {};
    for (var i = 0; i < courseAttendance.length; i++) {
      dateMap[courseAttendance[i].date] = true;
    }
    var dates = Object.keys(dateMap);
    
    // Calculate stats for each date
    var stats = [];
    for (var i = 0; i < dates.length; i++) {
      var date = dates[i];
      var attendanceCount = 0;
      
      for (var j = 0; j < courseAttendance.length; j++) {
        if (courseAttendance[j].date === date && courseAttendance[j].present) {
          attendanceCount++;
        }
      }
      
      stats.push({
        date: date,
        count: attendanceCount,
        percentage: Math.round((attendanceCount / totalStudents) * 100) || 0
      });
    }
    
    Logger.log("Returning stats for " + stats.length + " dates");
    return stats;
  } catch(error) {
    Logger.log("Error getting attendance stats: " + error.toString());
    return [];
  }
}`}
    </div>
  );
};
