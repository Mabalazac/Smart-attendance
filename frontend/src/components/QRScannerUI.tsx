import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle, XCircle, Loader2, Camera, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from 'jsqr';

type ScanState = 'idle' | 'scanning' | 'success' | 'failed';

interface QRScannerUIProps {
  onSuccess?: (decodedText: string) => void;
  activeSession?: any;
  autoStart?: boolean;
}

export default function QRScannerUI({ onSuccess, activeSession, autoStart = false }: QRScannerUIProps) {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);

  const startScan = async () => {
    setScanState('scanning');
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: 'environment' } } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
        videoRef.current.play();
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Camera access denied. Please use localhost or HTTPS.");
      setScanState('failed');
    }
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;
      
      const canvas = canvasElement.getContext("2d");
      if (!canvas) return;

      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        stopCamera();
        setScanState('success');
        if (onSuccess) onSuccess(code.data);
        return;
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  const stopCamera = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (autoStart) {
      startScan();
    }
    return () => stopCamera();
  }, [autoStart]);

  const reset = () => {
    stopCamera();
    setScanState('idle');
    setError(null);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <AnimatePresence mode="wait">
        {scanState === 'idle' && !autoStart && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            <div className="w-64 h-64 rounded-2xl bg-gray-900 flex items-center justify-center relative overflow-hidden border-4 border-[hsl(210,90%,55%)]/30 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <Camera size={48} className="text-gray-500" />
                <p className="text-gray-400 text-xs text-center px-4">Tap below to open camera</p>
              </div>
            </div>
            <button
              onClick={startScan}
              className="flex items-center justify-center gap-3 w-full py-4 bg-[hsl(210,90%,55%)] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[hsl(210,90%,48%)] active:scale-95 transition-all duration-200 shadow-xl shadow-[hsl(210,90%,55%)]/30 focus:outline-none focus:ring-2 focus:ring-[hsl(210,90%,55%)]/50"
            >
              <QrCode size={18} />
              Open Camera Scanner
            </button>
          </motion.div>
        )}

        {scanState === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden border-4 border-[hsl(210,90%,55%)] shadow-2xl bg-black">
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover" 
                autoPlay 
                playsInline 
                muted 
              />
              <canvas ref={canvasRef} className="hidden" />
              <motion.div
                className="absolute left-4 right-4 h-0.5 bg-[hsl(210,90%,55%)] shadow-[0_0_15px_rgba(37,99,235,0.8)] z-20 pointer-events-none"
                animate={{ top: ['20%', '80%', '20%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="text-[hsl(210,90%,55%)] animate-spin" />
                <p className="text-gray-700 font-bold text-sm">Scanning for QR Code…</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Cancel Scan
            </button>
          </motion.div>
        )}

        {scanState === 'success' && (
          <motion.div
            key="success"
            className="flex flex-col items-center gap-6 w-full"
          >
            <div className="w-64 h-64 rounded-2xl bg-emerald-50 border-4 border-emerald-400 flex items-center justify-center shadow-lg">
              <div className="flex flex-col items-center gap-3">
                <CheckCircle size={64} className="text-emerald-500" />
                <p className="text-emerald-700 font-black text-lg uppercase tracking-tight">QR Captured!</p>
              </div>
            </div>
          </motion.div>
        )}

        {scanState === 'failed' && (
          <motion.div
            key="failed"
            className="flex flex-col items-center gap-6 w-full"
          >
            <div className="w-64 h-64 rounded-2xl bg-red-50 border-4 border-red-400 flex items-center justify-center shadow-lg">
              <div className="flex flex-col items-center gap-3">
                <XCircle size={64} className="text-red-500" />
                <p className="text-red-700 font-bold text-lg text-center px-4">{error}</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-8 py-3.5 bg-[hsl(210,90%,55%)] text-white rounded-2xl font-bold hover:bg-[hsl(210,90%,48%)]"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}