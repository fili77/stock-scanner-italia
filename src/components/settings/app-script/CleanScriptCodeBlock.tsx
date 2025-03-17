
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CleanScriptCodeBlock = () => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  // Script code as pure vanilla JavaScript - compatible with Google Apps Script
  // No import/export statements, no ES6 module syntax
  const scriptCode = `// QUESTO È UN CODICE VANILLA JAVASCRIPT - NON MODIFICARE
// NON AGGIUNGERE IMPORT O EXPORT - Apps Script non supporta questa sintassi

function doGet(e) {
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
    result = addCourse(e.parameter.id, e.parameter.name, e.parameter.teacher);
  } else if (action === "markAttendance") {
    result = markStudentAttendance(e.parameter.studentId, e.parameter.courseId, e.parameter.date);
  } else if (action === "getAttendanceStats") {
    result = getAttendanceStats(e.parameter.courseId);
  }
  
  var output = ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
  
  output.setHeader('Access-Control-Allow-Origin', '*');
  return output;
}

function doPost(e) {
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
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0] && row[0] !== "") {
      var student = {
        id: row[0],
        name: row[1] + " " + row[2],
        courses: row[3].split(",").map(function(course) { return course.trim(); })
      };
      
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
      Logger.log("Corsi sheet not found, creating it");
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Corsi");
      sheet.appendRow(["ID Corso", "Nome Corso", "Docente", "Totale Studenti"]);
    }
    
    sheet.appendRow([
      courseId,
      courseName,
      teacherName,
      0
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
      Logger.log("Presenze sheet not found, creating it");
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Presenze");
      sheet.appendRow(["ID Studente", "ID Corso", "Data", "Presente"]);
    }
    
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
      Logger.log("Presenze sheet not found, creating it");
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Presenze");
      sheet.appendRow(["ID Studente", "ID Corso", "Data", "Presente"]);
    }
    
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
    
    var totalStudents = 0;
    for (var i = 1; i < studentData.length; i++) {
      var courses = studentData[i][3].split(",").map(function(course) { return course.trim(); });
      if (courses.indexOf(courseId) !== -1) {
        totalStudents++;
      }
    }
    
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
    
    var dateMap = {};
    for (var i = 0; i < courseAttendance.length; i++) {
      dateMap[courseAttendance[i].date] = true;
    }
    var dates = Object.keys(dateMap);
    
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
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    toast({
      title: "Script copiato",
      description: "Lo script è stato copiato negli appunti",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Script Apps Script da copiare:</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={copyToClipboard}
          className="flex items-center gap-1"
        >
          {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          {copied ? "Copiato!" : "Copia Script"}
        </Button>
      </div>
      
      <div className="bg-gray-950 text-gray-200 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-96 whitespace-pre text-xs font-mono relative border border-yellow-400">
        <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-950 p-1.5 text-xs font-bold">
          ⚠️ IMPORTANTE: Copia SOLO il codice sotto, NON modificarlo. Apps Script non supporta import/export!
        </div>
        <pre className="mt-7">{scriptCode}</pre>
      </div>
      
      <div className="rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs">
        <p className="font-bold flex items-center gap-1">
          <span className="text-red-600 text-base">⚠️</span>
          Risolvere l'errore "Cannot use import statement outside a module":
        </p>
        <ol className="list-decimal list-inside mt-1 space-y-1">
          <li>Il codice Apps Script deve essere puro JavaScript, NO import/export</li>
          <li>Clicca sul pulsante "Copia Script" sopra</li>
          <li>Nel tuo Google Sheet, vai su "Extensions" &gt; "Apps Script"</li>
          <li>Cancella TUTTO il codice esistente nell'editor Apps Script</li>
          <li>Incolla il codice copiato ESATTAMENTE come fornito</li>
          <li>Salva (Ctrl+S o Cmd+S)</li>
          <li>Apps Script deve contenere solo funzioni JavaScript, no imports</li>
        </ol>
      </div>
    </div>
  );
};
