
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScanStatus } from '@/hooks/useAttendance';
import { Student } from '@/utils/googleSheetsAPI';

type ScanResultsProps = {
  status: ScanStatus;
  lastScannedStudent: Student | null;
  onReset: () => void;
};

const ScanResults = ({ status, lastScannedStudent, onReset }: ScanResultsProps) => {
  return (
    <>
      {/* Processing state */}
      {status === 'processing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
          <div className="text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-4 animate-rotate" />
            <p className="text-lg font-medium">Elaborazione...</p>
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
              <p className="text-sm opacity-90 mb-2">Matricola: {lastScannedStudent.id}</p>
              <p className="text-xs bg-white/20 px-3 py-1 rounded-full inline-block">
                Presenza Registrata
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
              <p className="text-lg font-bold mb-2">Errore di Scansione</p>
              <Button 
                variant="outline" 
                className="bg-transparent border-white/30 hover:bg-white/10 text-white"
                onClick={onReset}
              >
                Riprova
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ScanResults;
