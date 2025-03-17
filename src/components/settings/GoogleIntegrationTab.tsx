import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import googleSheetsAPI from '@/utils/googleSheetsAPI';
import { AppScriptImplementation } from './AppScriptImplementation';
import { SheetSettings } from './SheetSettings';

export const GoogleIntegrationTab = ({
  appsScriptUrl,
  setAppsScriptUrl,
  isConnected,
  setIsConnected,
  presenceValue,
  setPresenceValue,
  dateFormat,
  setDateFormat,
  autoCreate,
  setAutoCreate
}) => {
  const { toast } = useToast();
  const [showFullScript, setShowFullScript] = useState(false);

  const connectToGoogleSheets = () => {
    if (!appsScriptUrl) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Apps Script URL",
        variant: "destructive"
      });
      return;
    }

    // Set the Apps Script URL in the API
    googleSheetsAPI.setAppsScriptUrl(appsScriptUrl);
    setIsConnected(true);

    toast({
      title: "Connected",
      description: "Successfully connected to Google Sheets via Apps Script. You can now use the app to record attendance."
    });
  };

  const disconnectFromGoogleSheets = () => {
    googleSheetsAPI.setAppsScriptUrl('');
    setIsConnected(false);
    setAppsScriptUrl('');

    toast({
      title: "Disconnected",
      description: "Disconnected from Google Sheets."
    });
  };

  const saveSheetSettings = () => {
    localStorage.setItem('presenceValue', presenceValue);
    localStorage.setItem('dateFormat', dateFormat);
    localStorage.setItem('autoCreate', autoCreate.toString());

    toast({
      title: "Settings Updated",
      description: "Sheet settings updated",
    });
  };

  const copyScriptToClipboard = () => {
    const scriptCode = `function doGet(e) {
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

    navigator.clipboard.writeText(scriptCode);
    toast({
      title: "Script copiato",
      description: "Lo script Apps Script è stato copiato negli appunti. Incollalo nell'editor di Google Apps Script.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Alert>
        <AlertTitle>Google Sheets Apps Script Integration</AlertTitle>
        <AlertDescription>
          This app connects to your Google Sheet using Google Apps Script.
          Enter your Apps Script Web App URL below to connect your sheet.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Google Sheets Integration</CardTitle>
          <CardDescription>
            Connect to your Google Sheets document to track attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apps-script-url">Apps Script Web App URL</Label>
            <div className="flex gap-2">
              <Input 
                id="apps-script-url" 
                placeholder="Enter your Google Apps Script URL" 
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(appsScriptUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Example: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
            </p>
          </div>
          
          {isConnected ? (
            <div className="rounded-md bg-primary/10 p-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Connected</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your app is currently connected to a Google Sheet via Apps Script
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-muted p-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center flex-shrink-0">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Not Connected</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your Apps Script URL and click Connect to authorize access
                  </p>
                </div>
              </div>
            </div>
          )}

          <a 
            href="https://docs.google.com/spreadsheets/create" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary flex items-center hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Create a new Google Sheet
          </a>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isConnected ? (
            <Button variant="outline" onClick={disconnectFromGoogleSheets}>Disconnect</Button>
          ) : (
            <Button variant="outline" disabled>Disconnect</Button>
          )}
          {isConnected ? (
            <Button disabled>Already Connected</Button>
          ) : (
            <Button onClick={connectToGoogleSheets}>Connect</Button>
          )}
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Apps Script Code</CardTitle>
          <CardDescription>
            Copia questo script nell'editor di Google Apps Script
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Istruzioni:</p>
            <ol className="list-decimal list-inside text-xs mt-2 ml-2 space-y-1">
              <li>Nel tuo foglio Google, vai su "Extensions" &gt; "Apps Script"</li>
              <li>Nell'editor di Apps Script, seleziona tutto il codice esistente e cancellalo</li>
              <li>Clicca sul pulsante "Copia Script" qui sotto</li>
              <li>Incolla il codice nell'editor di Apps Script</li>
              <li>Salva il file (Ctrl+S o Cmd+S)</li>
              <li>Pubblica come app web seguendo le istruzioni sotto</li>
            </ol>
          </div>
          
          <div className="flex justify-center">
            <Button onClick={copyScriptToClipboard} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copia Script
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-destructive">IMPORTANTE:</p>
            <p>NON aggiungere import o export al codice in Apps Script perché non supporta questa sintassi.</p>
          </div>
        </CardContent>
      </Card>
      
      <SheetSettings
        presenceValue={presenceValue}
        setPresenceValue={setPresenceValue}
        dateFormat={dateFormat}
        setDateFormat={setDateFormat}
        autoCreate={autoCreate}
        setAutoCreate={setAutoCreate}
        onSave={saveSheetSettings}
      />

      <Card>
        <CardHeader>
          <CardTitle>Istruzioni per la Pubblicazione</CardTitle>
          <CardDescription>
            Dopo aver copiato lo script, pubblica come app web
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <p className="text-sm font-medium mb-2">
              Dopo aver creato lo script, pubblica come app web:
            </p>
            <ol className="list-decimal list-inside text-xs mt-2 ml-2 space-y-1">
              <li>Clicca "Deploy" &gt; "New deployment"</li>
              <li>Seleziona "Web app"</li>
              <li>Configura "Execute as: Me" e "Who has access: Anyone"</li>
              <li>Clicca "Deploy" e autorizza le richieste</li>
              <li>Copia l'URL generato e incollalo sopra nella sezione "Apps Script Web App URL"</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
