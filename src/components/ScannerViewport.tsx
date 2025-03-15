
import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { ScanStatus } from '@/hooks/useAttendance';

type ScannerViewportProps = {
  status: ScanStatus;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

const ScannerViewport = ({ 
  status, 
  videoRef, 
  canvasRef 
}: ScannerViewportProps) => {
  return (
    <div className="relative mb-8 overflow-hidden rounded-lg bg-black aspect-[4/3] shadow-md">
      {/* Camera feed */}
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover ${status === 'scanning' ? 'opacity-100' : 'opacity-0'}`}
        autoPlay
        playsInline
        muted
      />
      
      {/* Canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Scan animation overlay */}
      {status === 'scanning' && (
        <div className="scanner-overlay">
          <div className="scanner-line" />
        </div>
      )}
      
      {/* Placeholder when not scanning */}
      {status === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/10 text-white">
          <Camera className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Pronto per la Scansione</p>
          <p className="text-sm opacity-70 mt-1">Premi il pulsante per iniziare</p>
        </div>
      )}
    </div>
  );
};

export default ScannerViewport;
