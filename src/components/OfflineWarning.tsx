
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type OfflineWarningProps = {
  isOnline: boolean;
  queueSize: number;
};

const OfflineWarning = ({ isOnline, queueSize }: OfflineWarningProps) => {
  return (
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
              <span>Sei offline. Le presenze saranno sincronizzate quando la connessione sarà ripristinata.</span>
              {queueSize > 0 && (
                <span className="text-xs bg-destructive/20 px-2 py-1 rounded-full">
                  {queueSize} in attesa
                </span>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineWarning;
