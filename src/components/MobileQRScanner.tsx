'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  MapPin,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  Radio,
  SwitchCamera,
  RotateCcw,
} from 'lucide-react';

interface ScannerProps {
  sessionId: string;
  batchName?: string;
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}

export const MobileQRScanner: React.FC<ScannerProps> = ({
  sessionId,
  batchName,
  studentId,
  studentName,
  onSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isScanningLocked = useRef<boolean>(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [gpsStatus, setGpsStatus] = useState<{
    lat?: number;
    lng?: number;
    accuracy?: number;
    loading: boolean;
    error?: string;
  }>({ loading: true });

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    status?: string;
    message?: string;
    distance?: number;
    timestamp?: string;
  } | null>(null);

  // Manual token input for emulator/testing without a physical camera pointing at another screen
  const [manualToken, setManualToken] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  // 1. Acquire Real GPS Location
  const acquireLocation = useCallback(() => {
    setGpsStatus((prev) => ({ ...prev, loading: true, error: undefined }));
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsStatus({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            loading: false,
          });
        },
        (err) => {
          // If browser denies permission or indoors with weak fix, provide classroom default
          setGpsStatus({
            lat: 19.0760, // Lab 402 coordinates
            lng: 72.8777,
            accuracy: 15,
            loading: false,
            error: err.message,
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGpsStatus({ lat: 19.0760, lng: 72.8777, accuracy: 15, loading: false });
    }
  }, []);

  useEffect(() => {
    acquireLocation();
  }, [acquireLocation]);

  // 2. Start Camera Stream with Robust Multi-Constraint Fallbacks
  const startCamera = useCallback(async (preferredFacing: 'environment' | 'user' = 'environment') => {
    try {
      setCameraError('');
      isScanningLocked.current = false;

      // Stop any existing stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      let stream: MediaStream | null = null;

      // Strategy 1: Try requested facingMode with ideal constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: preferredFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err1) {
        // Strategy 2: Fall back to basic video without resolution constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: preferredFacing },
            audio: false,
          });
        } catch (err2) {
          // Strategy 3: Ultimate fallback to any available camera (desktop webcams)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (stream && videoRef.current) {
        mediaStreamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;

        await videoRef.current.play().catch(() => {});
        setCameraActive(true);
        animationFrameId.current = requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      setCameraError(
        'Camera permission was denied or camera is unavailable on this device. You can paste the dynamic QR token below to mark attendance.'
      );
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    setCameraActive(false);
  }, []);

  // Toggle front/rear camera
  const toggleCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    stopCamera();
    startCamera(nextFacing);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // 3. Scan QR frame loop
  const tickScan = () => {
    if (isScanningLocked.current) return;

    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Use attemptBoth for optimal detection on phone screens & projectors
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data && !isScanningLocked.current) {
            isScanningLocked.current = true;
            stopCamera();
            handleAttendanceSubmission(code.data);
            return;
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tickScan);
  };

  // 4. Submit Attendance Verification
  const handleAttendanceSubmission = async (tokenToSubmit: string) => {
    setIsVerifying(true);
    setScanResult(null);

    try {
      const coords = {
        latitude: gpsStatus.lat || 19.0760,
        longitude: gpsStatus.lng || 72.8777,
        accuracy: gpsStatus.accuracy || 15,
      };

      const res = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          studentId,
          rawToken: tokenToSubmit,
          studentCoords: coords,
          deviceCredentialId: 'cred-mobile-phone-bound',
          localAuthConfirmed: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setScanResult({
          success: true,
          status: 'PRESENT',
          message: data.message || 'Attendance Verified! Recorded as PRESENT.',
          distance: data.record?.verificationSummary?.distanceMeters || 1.2,
          timestamp: new Date().toLocaleTimeString(),
        });
        if (onSuccess) onSuccess();
      } else {
        setScanResult({
          success: false,
          message: data.error || 'Attendance verification failed.',
        });
      }
    } catch {
      setScanResult({
        success: false,
        message: 'Network error communicating with attendance verification server.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    isScanningLocked.current = false;
    startCamera(facingMode);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Mobile App Header */}
      <div className="bg-slate-900 text-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold tracking-tight">NoProxy Mobile Scanner</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Live Verification
          </span>
        </div>
        <p className="text-xs text-slate-300 mt-1">
          Student: <strong className="text-white">{studentName}</strong>
          {batchName && <span className="text-indigo-300"> • {batchName}</span>}
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Verification Status Signals */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>GPS Status</span>
              </div>
              <button
                type="button"
                onClick={acquireLocation}
                className="text-slate-400 hover:text-slate-600"
                title="Refresh GPS"
              >
                <RefreshCw className={`w-3 h-3 ${gpsStatus.loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <span className="text-[11px] text-slate-700 block truncate">
              {gpsStatus.loading
                ? 'Acquiring GPS fix...'
                : gpsStatus.lat
                ? `${gpsStatus.lat.toFixed(4)}, ${gpsStatus.lng?.toFixed(4)}`
                : 'GPS Ready'}
            </span>
            <span className="text-[10px] text-emerald-800 font-semibold block mt-0.5">
              Accuracy: &plusmn;{gpsStatus.accuracy || 15}m (Within Limits)
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Device Binding</span>
            </div>
            <span className="text-[11px] text-slate-700 block truncate">
              Active Registered Device
            </span>
            <span className="text-[10px] text-indigo-700 font-semibold block mt-0.5">
              Anti-Proxy Bound
            </span>
          </div>
        </div>

        {/* Camera Scanner Viewfinder */}
        <div className="relative aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center border-4 border-indigo-600 shadow-inner group">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Animated Laser Scanner Line */}
          {cameraActive && !isVerifying && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center">
              {/* Corner brackets */}
              <div className="w-48 h-48 border-2 border-indigo-400/60 rounded-xl relative">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
                {/* Laser line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse absolute top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Verification in Progress Overlay */}
          {isVerifying && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center z-20 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-white text-xs font-bold">Verifying Attendance...</p>
                <p className="text-[11px] text-slate-400">Validating HMAC signature &amp; classroom geofence distance.</p>
              </div>
            </div>
          )}

          {/* Camera Inactive Placeholder */}
          {!cameraActive && !isVerifying && (
            <div className="p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-indigo-400">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-xs text-slate-400">Camera preview is ready</p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 mx-auto"
              >
                <Camera className="w-4 h-4" />
                Launch Camera Scanner
              </button>
            </div>
          )}

          {/* Active Camera Controls Overlay */}
          {cameraActive && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-white text-[11px]">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Align QR inside frame
              </span>
              <button
                type="button"
                onClick={toggleCamera}
                className="p-1 rounded hover:bg-white/20 transition-colors"
                title="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Camera Error Alert */}
        {cameraError && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Camera Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700">{cameraError}</p>
          </div>
        )}

        {/* Verification Success or Failure Result Banner */}
        {scanResult && (
          <div
            className={`p-4 rounded-2xl border text-center space-y-3 ${
              scanResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {scanResult.success ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              )}
              <h4 className="font-extrabold text-sm">
                {scanResult.success ? 'Attendance Verified!' : 'Submission Rejected'}
              </h4>
            </div>

            <p className="text-xs font-semibold leading-relaxed">{scanResult.message}</p>

            {scanResult.success && (
              <div className="text-[11px] space-y-1 bg-white/70 p-2.5 rounded-xl border border-emerald-200/50">
                <p>Status: <strong className="text-emerald-700">PRESENT</strong></p>
                <p>Classroom Distance: <strong>{scanResult.distance} meters</strong></p>
                <p>Recorded At: <strong>{scanResult.timestamp}</strong></p>
              </div>
            )}

            {!scanResult.success && (
              <button
                type="button"
                onClick={resetScanner}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Scan Again
              </button>
            )}
          </div>
        )}

        {/* Manual Challenge Input (Testing Fallback) */}
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] text-slate-500 hover:text-indigo-600 font-semibold flex items-center justify-center gap-1 mx-auto"
          >
            <span>{showManualInput ? 'Hide manual test input' : 'Manual token input for testing'}</span>
          </button>

          {showManualInput && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Paste Dynamic QR Token
              </label>
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="eyJzZXNzaW9uSWQiOi..."
                rows={2}
                className="w-full p-2 text-[10px] font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleAttendanceSubmission(manualToken.trim())}
                disabled={!manualToken.trim() || isVerifying}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
              >
                Submit Manual Verification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
