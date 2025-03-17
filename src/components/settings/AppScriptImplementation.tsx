
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AppScriptImplementation = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apps Script Implementation</CardTitle>
        <CardDescription>
          Guide for implementing the API in Google Apps Script
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          Paste this code in your Google Apps Script editor (Extensions &gt; Apps Script in your Google Sheet):
        </p>
        
        <div className="bg-muted p-3 rounded-md overflow-auto max-h-60 whitespace-pre text-xs font-mono">
{`function doGet(e) {
  // Handle GET requests
  var action = e.parameter.action;
  var result = {};
  
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
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Handle POST requests
  var action = e.parameter.action;
  var result = { success: false };
  
  if (action === "markAttendance") {
    var data = JSON.parse(e.postData.contents);
    result = markStudentAttendance(data.studentId, data.courseId, data.date);
  } else if (action === "syncAttendance") {
    var data = JSON.parse(e.postData.contents);
    result = syncAttendanceRecords(data.records);
  } else if (action === "addCourse") {
    if (e.postData && e.postData.contents) {
      var data = JSON.parse(e.postData.contents);
      result = addCourse(data.id, data.name, data.teacher);
    } else {
      result = addCourse(e.parameter.id, e.parameter.name, e.parameter.teacher);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getStudentsList(courseId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Studenti");
  var data = sheet.getDataRange().getValues();
  var students = [];
  
  // Skip header row
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
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
  
  return students;
}

function getCoursesList() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Corsi");
  var data = sheet.getDataRange().getValues();
  var courses = [];
  
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
  
  Logger.log("Courses found: " + JSON.stringify(courses));
  return courses;
}

function addCourse(courseId, courseName, teacherName) {
  try {
    Logger.log("Adding course: " + courseId + ", " + courseName + ", " + teacherName);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Corsi");
    
    if (!sheet) {
      // Create the Corsi sheet if it doesn't exist
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
  var data = sheet.getDataRange().getValues();
  
  // Skip header row
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] === studentId) {
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
  
  return { found: false };
}

function markStudentAttendance(studentId, courseId, date) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Presenze");
  
  if (!sheet) {
    // Create the Presenze sheet if it doesn't exist
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
  
  return { success: true };
}

function syncAttendanceRecords(records) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Presenze");
  
  if (!sheet) {
    // Create the Presenze sheet if it doesn't exist
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
  
  return { success: true };
}`}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Struttura del foglio consigliata:</h3>
          <div className="bg-muted p-3 rounded-md">
            <h4 className="text-xs font-medium mb-1">Foglio "Studenti":</h4>
            <code className="text-xs">
              ID Studente | Nome | Cognome | Corsi (separati da virgola)
            </code>
          </div>
          <div className="bg-muted p-3 rounded-md">
            <h4 className="text-xs font-medium mb-1">Foglio "Corsi":</h4>
            <code className="text-xs">
              ID Corso | Nome Corso | Docente | Totale Studenti
            </code>
          </div>
          <div className="bg-muted p-3 rounded-md">
            <h4 className="text-xs font-medium mb-1">Foglio "Presenze":</h4>
            <code className="text-xs">
              ID Studente | ID Corso | Data | Presente
            </code>
          </div>
        </div>
        
        <div className="rounded-md bg-blue-50 p-4 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <p className="text-sm">
            Dopo aver creato lo script, pubblica come app web:
          </p>
          <ol className="list-decimal list-inside text-xs mt-2 ml-2 space-y-1">
            <li>Clicca "Deploy" &gt; "New deployment"</li>
            <li>Seleziona "Web app"</li>
            <li>Configura "Execute as: Me" e "Who has access: Anyone"</li>
            <li>Clicca "Deploy" e autorizza le richieste</li>
            <li>Copia l'URL generato e incollalo sopra</li>
          </ol>
        </div>
        
        <div className="rounded-md bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
          <p className="text-sm font-medium">Importante:</p>
          <p className="text-xs mt-1">
            Assicurati di abilitare CORS nello script aggiungendo questo header alla risposta:
          </p>
          <code className="text-xs block mt-2 bg-yellow-100 dark:bg-yellow-900 p-2 rounded">
            .setHeader('Access-Control-Allow-Origin', '*')
          </code>
          <p className="text-xs mt-2">
            Se l'app non riesce a comunicare con il foglio, puoi verificare gli errori nella console
            degli sviluppatori del browser (F12 &gt; Console).
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
