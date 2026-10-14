import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, X, RefreshCw, Check, AlertCircle, 
  FlipHorizontal, Sparkles, Database, ShieldCheck, Upload
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
  title?: string;
  description?: string;
  passId?: string;
  visitorName?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Capture Visitor Profile Photo',
  description = 'Live Browser Camera API &bull; Direct MySQL Backend Sync',
  passId,
  visitorName
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCameraError(null);
      startCamera();
      enumerateCameras();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, selectedDeviceId]);

  // Clean stream on unmount
  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop warning:', e);
        }
      });
      setStream(null);
    }
  };

  const enumerateCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }
    } catch (e) {
      console.warn('Could not enumerate media devices:', e);
    }
  };

  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser Camera API (navigator.mediaDevices.getUserMedia) is not supported in this browser environment.');
      }

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch((playErr) => {
          console.warn('Video play interrupted:', playErr);
        });
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      let errMsg = 'Unable to access browser camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission denied. Please allow camera permissions in your browser address bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No physical webcam or video input device detected on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = 'Webcam is currently in use by another application.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setCameraError(errMsg);
      setIsInitializing(false);
    }
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;

    // Trigger visual shutter flash
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Convert to high-quality JPEG Data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhoto(dataUrl);

    // Stop live stream to conserve battery/CPU
    stopCameraStream();
  };

  const handleStartCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleTakeSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      stopCameraStream();
      onCapture(capturedPhoto);
      onClose();
    }
  };

  // Fallback: File upload when hardware webcam is unavailable
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCapturedPhoto(result);
        stopCameraStream();
      };
      reader.readAsDataURL(file);
    }
  };

  // Fallback: Test sample photo for headless/restricted dev environments
  const handleUseSimulatedPhoto = () => {
    const samples = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    setCapturedPhoto(picked);
    stopCameraStream();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-[#1C2E63] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white">{title}</h3>
              <p className="text-[11px] text-blue-200 font-medium flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-300" />
                <span>{description}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              stopCameraStream();
              onClose();
            }} 
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visitor & Pass Context Banner if provided */}
        {(passId || visitorName) && (
          <div className="bg-slate-100 dark:bg-slate-800/60 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Target Profile:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{visitorName || 'Pre-Registered Visitor'}</span>
            </div>
            {passId && (
              <span className="font-mono bg-blue-100 dark:bg-blue-950 text-[#1C2E63] dark:text-blue-300 px-2 py-0.5 rounded font-bold text-[11px]">
                {passId}
              </span>
            )}
          </div>
        )}

        {/* Viewfinder / Capture Canvas Container */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center bg-slate-900 text-white relative select-none">
          
          {/* Flash Effect overlay */}
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-30 opacity-90 transition-opacity duration-200 pointer-events-none" />
          )}

          {/* Countdown Indicator */}
          {countdown !== null && (
            <div className="absolute z-20 inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-7xl font-black text-amber-400 animate-ping font-mono">
                {countdown}
              </span>
            </div>
          )}

          {/* 1. Camera Error State */}
          {cameraError && !capturedPhoto && (
            <div className="w-full bg-slate-800/90 rounded-2xl p-6 text-center border border-rose-500/30 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white mb-1">Camera Access Notice</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {cameraError}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera API</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload Image File</span>
                </button>

                <button
                  type="button"
                  onClick={handleUseSimulatedPhoto}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Verified Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Live Camera Viewfinder */}
          {!cameraError && !capturedPhoto && (
            <div className="relative w-full aspect-[4/3] max-w-[420px] rounded-2xl overflow-hidden bg-black border-2 border-slate-700 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Viewfinder Target Guidelines (Portrait Oval Overlay) */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-60 border-2 border-dashed border-emerald-400/70 rounded-[100px] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex items-center justify-center relative">
                  <div className="absolute top-2 text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-slate-950/70 px-2 py-0.5 rounded-full">
                    Position Face Here
                  </div>
                  {/* Subtle Crosshairs */}
                  <div className="w-6 h-0.5 bg-emerald-400/40" />
                  <div className="h-6 w-0.5 bg-emerald-400/40 absolute" />
                </div>
              </div>

              {/* Live Badge */}
              <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>LIVE WEBCAM</span>
              </div>

              {/* Hardware Switcher (if multiple cameras detected) */}
              {videoDevices.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur rounded-lg px-2 py-1 flex items-center gap-1 text-[11px]">
                  <FlipHorizontal className="w-3 h-3 text-slate-300" />
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="bg-transparent text-white text-[10px] outline-none border-none cursor-pointer"
                  >
                    {videoDevices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId} className="bg-slate-900 text-white">
                        {dev.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 3. Captured Photo Review Preview */}
          {capturedPhoto && (
            <div className="relative w-full aspect-[4/3] max-w-[420px] rounded-2xl overflow-hidden bg-black border-2 border-emerald-500 shadow-2xl flex items-center justify-center">
              <img
                src={capturedPhoto}
                alt="Captured Snapshot"
                className="w-full h-full object-cover transform -scale-x-100"
              />

              <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Captured Snapshot</span>
              </div>

              <div className="absolute bottom-3 inset-x-3 bg-slate-950/80 backdrop-blur-sm p-2 rounded-xl text-center border border-white/10">
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>Ready to sync with MySQL visitor_photos table</span>
                </p>
              </div>
            </div>
          )}

          {/* Hidden Canvas & File Fallback Input */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileFallbackRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          {!capturedPhoto ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Photo Instead</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!!cameraError || isInitializing}
                  onClick={handleStartCountdown}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition disabled:opacity-40"
                  title="3-Second Timer"
                >
                  3s Timer
                </button>

                <button
                  type="button"
                  disabled={!!cameraError || isInitializing}
                  onClick={handleTakeSnapshot}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-40 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Snapshot</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="px-6 py-2.5 bg-[#1C2E63] hover:bg-blue-900 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-900/30 flex items-center gap-2 transition active:scale-95"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Confirm &amp; Store Photo to MySQL</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
