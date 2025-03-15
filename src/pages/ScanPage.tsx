
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Camera, CloudOff, Loader2, Check, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/Header';
import ScanButton from '@/components/ScanButton';
import barcodeScanner, { ScanResult } from '@/utils/barcodeScanner';
import googleSheetsAPI from '@/utils/googleSheetsAPI';
import { useAttendance, ScanStatus } from '@/hooks/useAttendance';

const ScanPage = () => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { status, setStatus, lastScannedStudent, markAttendance, isOnline, queueSize } = useAttendance(selectedCourse);
  
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => googleSheetsAPI.getCourses(),
  });

  // Scanner setup
  useEffect(() => {
    let scannerInitialized = false;
    
    const initializeScanner = async () => {
      if (videoRef.current && canvasRef.current) {
        try {
          await barcodeScanner.initialize(videoRef.current, canvasRef.current);
          scannerInitialized = true;
        } catch (error) {
          console.error('Failed to initialize scanner:', error);
        }
      }
    };
    
    if (status === 'scanning' && !scannerInitialized) {
      initializeScanner();
    }
    
    return () => {
      if (scannerInitialized) {
        barcodeScanner.stopScanning();
      }
    };
  }, [status]);

  const startScanning = () => {
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }
    
    setStatus('scanning');
    
    barcodeScanner.startScanning({
      onScan: handleScanResult,
      onError: (error) => {
        console.error('Scan error:', error);
        setStatus('error');
      }
    });
  };

  const stopScanning = () => {
    barcodeScanner.stopScanning();
    setStatus('idle');
  };

  const handleScanResult = async (result: ScanResult) => {
    // Stop scanning temporarily while processing this result
    barcodeScanner.stopScanning();
    
    // Process the scanned barcode
    await markAttendance(result.value);
    
    // After a delay, restart scanning for the next student
    setTimeout(() => {
      if (status !== 'error') {
        setStatus('scanning');
        barcodeScanner.startScanning({
          onScan: handleScanResult,
          onError: (error) => {
            console.error('Scan error:', error);
            setStatus('error');
          }
        });
      }
    }, 2000);
  };

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    // If currently scanning, stop and restart with new course
    if (status === 'scanning') {
      stopScanning();
      setTimeout(startScanning, 100);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-3xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Scan Attendance</h1>
          <p className="text-muted-foreground">
            Select a course and scan student ID barcodes to mark attendance
          </p>
        </div>

        {/* Course selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Select Course</label>
          <Select
            value={selectedCourse}
            onValueChange={handleCourseChange}
            disabled={isLoadingCourses || status === 'scanning' || status === 'processing'}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCourses ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-rotate text-muted-foreground" />
                </div>
              ) : (
                courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Offline warning */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <CloudOff className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <span>You're offline. Attendance will be synced when connection is restored.</span>
                  {queueSize > 0 && (
                    <span className="text-xs bg-destructive/20 px-2 py-1 rounded-full">
                      {queueSize} pending
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner viewport */}
        <div className="relative mb-8 overflow-hidden rounded-lg bg-black aspect-[4/3] shadow-md">
          {/* Camera feed */}
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover ${status === 'scanning' ? 'opacity-100' : 'opacity-0'}`}
            autoPlay
            playsInline
            muted
          />
          
          {/* Canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Scan animation overlay */}
          {status === 'scanning' && (
            <div className="scanner-overlay">
              <div className="scanner-line" />
            </div>
          )}
          
          {/* Placeholder when not scanning */}
          {status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/10 text-white">
              <Camera className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Ready to Scan</p>
              <p className="text-sm opacity-70 mt-1">Press the scan button to begin</p>
            </div>
          )}
          
          {/* Processing state */}
          {status === 'processing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
              <div className="text-center">
                <Loader2 className="h-10 w-10 mx-auto mb-4 animate-rotate" />
                <p className="text-lg font-medium">Processing...</p>
              </div>
            </div>
          )}
          
          {/* Success state */}
          <AnimatePresence>
            {status === 'success' && lastScannedStudent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-primary/90 text-white"
              >
                <div className="text-center p-4">
                  <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-bold mb-1">{lastScannedStudent.name}</p>
                  <p className="text-sm opacity-90 mb-2">ID: {lastScannedStudent.id}</p>
                  <p className="text-xs bg-white/20 px-3 py-1 rounded-full inline-block">
                    Attendance Recorded
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Error state */}
          <AnimatePresence>
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-destructive/90 text-white"
              >
                <div className="text-center p-4">
                  <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <p className="text-lg font-bold mb-2">Error Scanning</p>
                  <Button 
                    variant="outline" 
                    className="bg-transparent border-white/30 hover:bg-white/10 text-white"
                    onClick={() => setStatus('idle')}
                  >
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Control buttons */}
        <div className="flex justify-center items-center gap-4">
          {status === 'idle' ? (
            <ScanButton 
              onClick={startScanning} 
              className="h-20 w-20"
              disabled={!selectedCourse}
            />
          ) : (
            <Button 
              variant="outline" 
              size="lg"
              onClick={stopScanning}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Stop Scanning
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default ScanPage;
