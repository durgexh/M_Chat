import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { X, Camera, RefreshCw, Upload, KeyRound, AlertCircle } from 'lucide-react';
import { GroupChannel } from '../types';
import { parseGroupInvite } from '../services/crypto';

interface QRScannerProps {
  onGroupFound: (group: GroupChannel) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onGroupFound, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualKey, setManualKey] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Animation frame tracker
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera stream
  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Required for iOS Safari inline playback
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setCameraActive(true);
        startScanLoop();
      }
    } catch (err: unknown) {
      console.warn('Camera stream failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
        setCameraError('Camera permission was denied. You can paste the group token or upload a QR image below.');
      } else {
        setCameraError('Unable to start camera stream. Use image upload or paste code instead.');
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Continuous frame analysis loop
  const startScanLoop = () => {
    const scanFrame = () => {
      if (!videoRef.current || !canvasRef.current || isProcessing) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          const parsed = parseGroupInvite(code.data);
          if (parsed) {
            setIsProcessing(true);
            stopCamera();
            const group: GroupChannel = {
              id: parsed.id,
              name: parsed.name,
              creatorPeerId: 'remote',
              createdAt: Date.now(),
              rawKeyBase64: parsed.rawKeyBase64,
              saltBase64: parsed.saltBase64,
            };
            onGroupFound(group);
            return;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Process uploaded QR code image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          const parsed = parseGroupInvite(code.data);
          if (parsed) {
            stopCamera();
            const group: GroupChannel = {
              id: parsed.id,
              name: parsed.name,
              creatorPeerId: 'remote',
              createdAt: Date.now(),
              rawKeyBase64: parsed.rawKeyBase64,
              saltBase64: parsed.saltBase64,
            };
            onGroupFound(group);
            return;
          }
        }
        setManualError('No valid MChat QR code found in this image.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Process manually pasted invite token
  const handleManualJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    if (!manualKey.trim()) return;

    const parsed = parseGroupInvite(manualKey.trim());
    if (parsed) {
      stopCamera();
      const group: GroupChannel = {
        id: parsed.id,
        name: parsed.name,
        creatorPeerId: 'remote',
        createdAt: Date.now(),
        rawKeyBase64: parsed.rawKeyBase64,
        saltBase64: parsed.saltBase64,
      };
      onGroupFound(group);
    } else {
      setManualError('Invalid invitation format. Ensure you pasted a valid mchat:// link.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-[#11141c] border border-slate-800 p-5 shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white">Join Encrypted Group</h2>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative mt-4 w-full aspect-square max-h-72 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Error or Off fallback */}
          {!cameraActive && (
            <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <p className="max-w-xs">{cameraError || 'Camera unavailable. Use token or image below.'}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
              >
                Retry Camera
              </button>
            </div>
          )}

          {/* Reticle Overlay when camera active */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-2xl relative">
                {/* Corner reticles */}
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                {/* Laser scan line */}
                <div className="w-full h-0.5 bg-emerald-400/70 shadow-[0_0_8px_#10b981] animate-pulse absolute top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Flip camera control */}
          {cameraActive && (
            <button
              onClick={toggleCameraFacing}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-sm transition-colors cursor-pointer"
              title="Flip Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-2.5">
          Scan the QR code displayed on the group creator's device.
        </p>

        {/* Alternative Input Methods */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
          {/* File Upload Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Have a screenshot of the QR?</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload Image</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Manual Token Paste */}
          <form onSubmit={handleManualJoin} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Paste mchat:// link or raw key token"
                  value={manualKey}
                  onChange={e => setManualKey(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Join
              </button>
            </div>
            {manualError && (
              <p className="text-[11px] text-red-400">{manualError}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
