
import React from 'react';
import { Scan } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScanButtonProps = {
  onClick: () => void;
  className?: string;
  isScanning?: boolean;
};

const ScanButton = ({ onClick, className, isScanning = false }: ScanButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "scan-button",
        isScanning && "animate-pulse-soft",
        className
      )}
      aria-label="Scan attendance"
    >
      <Scan className="h-6 w-6" />
    </button>
  );
};

export default ScanButton;
