
import React, { useState } from 'react';
import Header from '@/components/Header';
import CourseSelector from '@/components/CourseSelector';
import ManualAttendance from '@/components/ManualAttendance';
import AttendanceSheet from '@/components/AttendanceSheet';
import { useQuery } from '@tanstack/react-query';
import googleSheetsAPI from '@/utils/googleSheetsAPI';

const ManualAttendancePage = () => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  
  // Ottieni i dati del corso selezionato
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => googleSheetsAPI.getCourses(),
  });
  
  const selectedCourse = courses.find(course => course.id === selectedCourseId);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Gestione Manuale Presenze</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Seleziona Corso</h2>
            <CourseSelector 
              onCourseSelect={(courseId) => setSelectedCourseId(courseId)} 
              selectedCourseId={selectedCourseId}
            />
          </div>
          
          {selectedCourseId && (
            <ManualAttendance 
              selectedCourseId={selectedCourseId}
            />
          )}
        </div>
        
        {selectedCourseId && selectedCourse && (
          <AttendanceSheet 
            courseId={selectedCourseId}
            courseName={selectedCourse.name}
          />
        )}
      </main>
    </div>
  );
};

export default ManualAttendancePage;
