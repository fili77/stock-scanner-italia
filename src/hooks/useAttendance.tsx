
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import googleSheetsAPI, { Student } from '@/utils/googleSheetsAPI';

export type ScanStatus = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

export const useAttendance = (selectedCourseId?: string) => {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [queueSize, setQueueSize] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      googleSheetsAPI.setOnlineStatus(true);
      if (googleSheetsAPI.getQueueSize() > 0) {
        syncQueuedAttendance();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      googleSheetsAPI.setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialize online status
    googleSheetsAPI.setOnlineStatus(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync queued attendance records when back online
  const syncQueuedAttendance = useCallback(async () => {
    try {
      const success = await googleSheetsAPI.syncQueuedAttendance();
      if (success) {
        toast({
          title: 'Sync Complete',
          description: 'All queued attendance records have been synced.',
        });
      }
      setQueueSize(googleSheetsAPI.getQueueSize());
    } catch (error) {
      console.error('Error syncing attendance:', error);
      toast({
        title: 'Sync Failed',
        description: 'Could not sync attendance records. Will try again later.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Check queue size periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueSize(googleSheetsAPI.getQueueSize());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Mark attendance for a student
  const markAttendance = useCallback(async (studentId: string) => {
    if (!selectedCourseId) {
      toast({
        title: 'No Course Selected',
        description: 'Please select a course before scanning.',
        variant: 'destructive',
      });
      setStatus('error');
      return false;
    }

    try {
      setStatus('processing');
      
      // Find student info
      const student = await googleSheetsAPI.findStudentById(studentId);
      
      if (!student) {
        toast({
          title: 'Student Not Found',
          description: `No student found with ID ${studentId}.`,
          variant: 'destructive',
        });
        setStatus('error');
        return false;
      }
      
      // Check if student is enrolled in the selected course
      if (!student.courses.includes(selectedCourseId)) {
        toast({
          title: 'Not Enrolled',
          description: `${student.name} is not enrolled in this course.`,
          variant: 'destructive',
        });
        setStatus('error');
        return false;
      }
      
      // Mark attendance
      const today = new Date().toISOString().split('T')[0];
      const success = await googleSheetsAPI.markAttendance(studentId, selectedCourseId, today);
      
      if (success) {
        setLastScannedStudent(student);
        setStatus('success');
        toast({
          title: 'Attendance Marked',
          description: `${student.name} marked present.`,
        });
        
        // Update queue size if offline
        if (!isOnline) {
          setQueueSize(googleSheetsAPI.getQueueSize());
        }
        
        return true;
      } else {
        setStatus('error');
        toast({
          title: 'Failed to Mark Attendance',
          description: 'Please try again.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setStatus('error');
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return false;
    }
  }, [selectedCourseId, isOnline, toast]);

  return {
    status,
    setStatus,
    lastScannedStudent,
    markAttendance,
    queueSize,
    isOnline,
    syncQueuedAttendance,
  };
};
