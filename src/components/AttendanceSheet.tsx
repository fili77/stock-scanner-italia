
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import googleSheetsAPI, { Student } from '@/utils/googleSheetsAPI';
import { useQuery } from '@tanstack/react-query';

interface AttendanceSheetProps {
  courseId: string;
  courseName: string;
}

const AttendanceSheet = ({ courseId, courseName }: AttendanceSheetProps) => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Ottenere la lista degli studenti per questo corso
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', courseId],
    queryFn: () => googleSheetsAPI.getStudents(courseId),
    enabled: !!courseId,
  });

  const currentDate = format(new Date(), 'EEEE d MMMM yyyy', { locale: it });
  const currentTime = format(new Date(), 'HH:mm');

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    const printContents = printContent.innerHTML;
    
    document.body.innerHTML = `
      <div style="padding: 20px;">
        ${printContents}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const generatePDF = () => {
    toast({
      title: 'Download iniziato',
      description: 'Il foglio firme sarà scaricato a breve.',
    });
    
    setTimeout(() => {
      handlePrint();
    }, 500);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Foglio Firme</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Stampa
            </Button>
            <Button variant="default" size="sm" onClick={generatePDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div ref={printRef} className="border rounded-md p-4">
          <div className="text-center mb-6 print:mb-8">
            <h2 className="text-xl font-bold">{courseName}</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Data:</span> {currentDate} - <span className="font-medium">Ora:</span> {currentTime}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">N.</TableHead>
                <TableHead>Cognome</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Matricola</TableHead>
                <TableHead className="w-[150px]">Firma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Caricamento studenti...
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Nessuno studente iscritto a questo corso
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student: Student, index: number) => {
                  // Dividi il nome in cognome e nome (supponiamo che il formato sia "Cognome Nome")
                  const nameParts = student.name.split(' ');
                  const lastName = nameParts[0];
                  const firstName = nameParts.slice(1).join(' ');
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{lastName}</TableCell>
                      <TableCell>{firstName}</TableCell>
                      <TableCell>{student.id}</TableCell>
                      <TableCell className="h-[40px]"></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceSheet;
