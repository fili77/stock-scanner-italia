
import React from 'react';
import { Scan } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type ScanButtonProps = {
  onClick: () => void;
  className?: string;
  isScanning?: boolean;
  disabled?: boolean;
};

const ScanButton = ({ onClick, className, isScanning = false, disabled = false }: ScanButtonProps) => {
  return (
    <motion.button 
      onClick={onClick}
      className={cn(
        "scan-button bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center shadow-lg",
        isScanning && "animate-pulse-soft",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label="Scansiona presenza"
      disabled={disabled}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
    >
      <Scan className="h-7 w-7" />
    </motion.button>
  );
};

export default ScanButton;
