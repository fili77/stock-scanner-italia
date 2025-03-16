
import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar as CalendarIcon, Camera, Upload, Loader2 } from 'lucide-react';
import CourseSelector from '@/components/CourseSelector';
import BatchScanResults from '@/components/BatchScanResults';
import { cn } from '@/lib/utils';
import googleSheetsAPI from '@/utils/googleSheetsAPI';
import { useAttendance } from '@/hooks/useAttendance';
import { processBatchImage } from '@/utils/batchBarcodeScanner';

const BatchScanPage = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResults, setProcessedResults] = useState<{
    totalDetected: number;
    studentsMarked: { id: string; name: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const { isOnline, queueSize } = useAttendance(selectedCourse);
  
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => googleSheetsAPI.getCourses(),
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    setProcessedResults(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImage(file);
    }
  };

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImage(file);
    }
  };

  const processImage = async (file: File) => {
    if (!selectedCourse) {
      alert('Seleziona prima un corso');
      return;
    }

    setIsProcessing(true);
    setProcessedResults(null);

    try {
      // Elabora l'immagine per rilevare i codici a barre
      const detectedBarcodes = await processBatchImage(file);
      
      if (!detectedBarcodes || detectedBarcodes.length === 0) {
        alert('Nessun codice a barre rilevato nell\'immagine');
        setIsProcessing(false);
        return;
      }

      // Registra le presenze per tutti i codici a barre rilevati
      const markedStudents = [];
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      for (const barcode of detectedBarcodes) {
        const student = await googleSheetsAPI.findStudentById(barcode);
        
        if (student && student.courses.includes(selectedCourse)) {
          const success = await googleSheetsAPI.markAttendance(
            student.id, 
            selectedCourse, 
            formattedDate
          );
          
          if (success) {
            markedStudents.push({ id: student.id, name: student.name });
          }
        }
      }

      setProcessedResults({
        totalDetected: detectedBarcodes.length,
        studentsMarked: markedStudents
      });
    } catch (error) {
      console.error('Errore durante l\'elaborazione dell\'immagine:', error);
      alert('Si è verificato un errore durante l\'elaborazione dell\'immagine');
    } finally {
      setIsProcessing(false);
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraRef.current) cameraRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-3xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Scansione Multipla</h1>
          <p className="text-muted-foreground">
            Carica una foto del foglio firme per registrare presenze multiple contemporaneamente
          </p>
        </div>

        {/* Course selection */}
        <CourseSelector
          selectedCourse={selectedCourse}
          onCourseChange={handleCourseChange}
          courses={courses}
          isLoadingCourses={isLoadingCourses}
          scanStatus={isProcessing ? 'processing' : 'idle'}
        />

        {/* Date selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Seleziona Data</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                disabled={isProcessing}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, 'PPP', { locale: it })
                ) : (
                  <span>Seleziona una data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={it}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Upload buttons */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              disabled={isProcessing || !selectedCourse}
            />
            <Button
              variant="outline"
              size="lg"
              className="w-full h-24 flex flex-col items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || !selectedCourse}
            >
              <Upload className="h-8 w-8 mb-2" />
              <span>Carica Immagine</span>
            </Button>
          </div>
          
          <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraRef}
              onChange={handleCameraCapture}
              className="hidden"
              disabled={isProcessing || !selectedCourse}
            />
            <Button
              variant="default"
              size="lg"
              className="w-full h-24 flex flex-col items-center justify-center"
              onClick={() => cameraRef.current?.click()}
              disabled={isProcessing || !selectedCourse}
            >
              <Camera className="h-8 w-8 mb-2" />
              <span>Scatta Foto</span>
            </Button>
          </div>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="my-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Elaborazione dell'immagine in corso...</p>
          </div>
        )}

        {/* Results */}
        {processedResults && (
          <BatchScanResults 
            results={processedResults} 
            courseName={courses?.find(c => c.id === selectedCourse)?.name || ''}
            date={format(selectedDate, 'PPP', { locale: it })}
          />
        )}
      </main>
    </div>
  );
};

export default BatchScanPage;
