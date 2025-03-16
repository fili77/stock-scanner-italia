
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Users } from 'lucide-react';

type BatchScanResultsProps = {
  results: {
    totalDetected: number;
    studentsMarked: { id: string; name: string }[];
  };
  courseName: string;
  date: string;
};

const BatchScanResults = ({ results, courseName, date }: BatchScanResultsProps) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Risultati Scansione</span>
          <span className="text-sm font-normal text-muted-foreground">{date}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-primary/10 rounded-full p-3">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">{courseName}</p>
            <p className="text-sm text-muted-foreground">
              {results.studentsMarked.length} presenze registrate su {results.totalDetected} codici rilevati
            </p>
          </div>
        </div>
        
        {results.studentsMarked.length > 0 ? (
          <ScrollArea className="h-[250px] rounded-md border p-4">
            <div className="space-y-2">
              {results.studentsMarked.map((student) => (
                <div key={student.id} className="flex items-center gap-2 py-1 border-b last:border-0">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="font-medium truncate">{student.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{student.id}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nessuno studente valido trovato per questo corso</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchScanResults;
