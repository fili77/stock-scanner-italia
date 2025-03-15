
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ScanButton from '@/components/ScanButton';
import { ScanStatus } from '@/hooks/useAttendance';

type ScanControlsProps = {
  status: ScanStatus;
  onStartScan: () => void;
  onStopScan: () => void;
  isCourseSelected: boolean;
};

const ScanControls = ({
  status,
  onStartScan,
  onStopScan,
  isCourseSelected
}: ScanControlsProps) => {
  return (
    <div className="flex justify-center items-center gap-4">
      {status === 'idle' ? (
        <ScanButton 
          onClick={onStartScan} 
          className="h-20 w-20"
          disabled={!isCourseSelected}
        />
      ) : (
        <Button 
          variant="outline" 
          size="lg"
          onClick={onStopScan}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Stop Scanning
        </Button>
      )}
    </div>
  );
};

export default ScanControls;
