
import React from 'react';
import { Scan } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScanButtonProps = {
  onClick: () => void;
  className?: string;
  isScanning?: boolean;
  disabled?: boolean;
};

const ScanButton = ({ onClick, className, isScanning = false, disabled = false }: ScanButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "scan-button",
        isScanning && "animate-pulse-soft",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label="Scan attendance"
      disabled={disabled}
    >
      <Scan className="h-6 w-6" />
    </button>
  );
};

export default ScanButton;
