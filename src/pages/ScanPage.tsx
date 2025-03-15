
import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import CourseSelector from '@/components/CourseSelector';
import OfflineWarning from '@/components/OfflineWarning';
import ScannerViewport from '@/components/ScannerViewport';
import ScanResults from '@/components/ScanResults';
import ScanControls from '@/components/ScanControls';
import barcodeScanner, { ScanResult } from '@/utils/barcodeScanner';
import googleSheetsAPI from '@/utils/googleSheetsAPI';
import { useAttendance } from '@/hooks/useAttendance';

const ScanPage = () => {
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
      alert('Seleziona prima un corso');
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
          <h1 className="text-2xl font-bold mb-2">Scansiona Presenze</h1>
          <p className="text-muted-foreground">
            Seleziona un corso e scansiona i codici a barre per registrare le presenze
          </p>
        </div>

        {/* Course selection */}
        <CourseSelector
          selectedCourse={selectedCourse}
          onCourseChange={handleCourseChange}
          courses={courses}
          isLoadingCourses={isLoadingCourses}
          scanStatus={status}
        />

        {/* Offline warning */}
        <OfflineWarning isOnline={isOnline} queueSize={queueSize} />

        {/* Scanner viewport */}
        <div className="relative">
          <ScannerViewport
            status={status}
            videoRef={videoRef}
            canvasRef={canvasRef}
          />
          
          <ScanResults
            status={status}
            lastScannedStudent={lastScannedStudent}
            onReset={() => setStatus('idle')}
          />
        </div>

        {/* Control buttons */}
        <ScanControls
          status={status}
          onStartScan={startScanning}
          onStopScan={stopScanning}
          isCourseSelected={!!selectedCourse}
        />
      </main>
    </div>
  );
};

export default ScanPage;
