'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, Users, ShieldCheck, MapPin, Lock, CheckCircle2, Maximize2, AlertCircle } from 'lucide-react';
import { Session, Classroom, Batch, Subject } from '@/lib/db/types';

interface DynamicQRDisplayProps {
  session: Session;
  batch: Batch;
  subject: Subject;
  classroom?: Classroom;
  institutionName: string;
  onSessionFinalized?: () => void;
}

export const DynamicQRDisplay: React.FC<DynamicQRDisplayProps> = ({
  session,
  batch,
  subject,
  classroom,
  institutionName,
  onSessionFinalized,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [presentCount, setPresentCount] = useState<number>(1);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const fetchNewQR = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          institutionId: session.institutionId,
        }),
      });
      const data = await res.json();
      if (data.success && data.qrDataUrl) {
        setQrDataUrl(data.qrDataUrl);
        setTimeLeft(data.expiresInSeconds || 20);
      } else {
        setStatusMessage(data.error || 'Failed to generate QR');
      }
    } catch (err: any) {
      setStatusMessage('Network error fetching dynamic QR code.');
    } finally {
      setLoading(false);
    }
  }, [session.id, session.institutionId]);

  // Initial fetch and automatic refresh interval
  useEffect(() => {
    fetchNewQR();
    const interval = setInterval(() => {
      fetchNewQR();
    }, 20000);

    return () => clearInterval(interval);
  }, [fetchNewQR]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : 20));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFinalize = async () => {
    if (!confirm('Are you sure you want to lock and finalize this session? All eligible students with no attendance record will be marked ABSENT.')) {
      return;
    }
    try {
      setIsFinalizing(true);
      const res = await fetch(`/api/sessions/${session.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: session.createdBy }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        if (onSessionFinalized) onSessionFinalized();
      } else {
        alert(data.error || 'Failed to finalize session.');
      }
    } catch {
      alert('Error finalizing session.');
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none p-8 flex flex-col justify-center items-center bg-slate-900 text-white' : ''}`}>
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-800 text-white p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              {institutionName}
            </span>
            <span className="text-indigo-400">•</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Dynamic Attendance
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1 text-white">
            {subject.name}
          </h2>
          <p className="text-sm text-indigo-200 font-medium">
            Batch: {batch.name} ({batch.code}) — {session.title}
          </p>
        </div>

        {/* Classroom & Geo Badges */}
        <div className="flex flex-col sm:items-end gap-1.5 text-xs text-indigo-200">
          {classroom && (
            <div className="flex items-center gap-1.5 bg-indigo-800/80 px-3 py-1.5 rounded-lg border border-indigo-700">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{classroom.name} (Geofence: {classroom.geofenceRadiusMeters}m radius)</span>
            </div>
          )}
          <div className="flex items-center gap-2 font-mono text-[11px] text-indigo-300">
            <span>Date: {session.sessionDate}</span>
            <span>|</span>
            <span>Time: {session.startTime} - {session.endTime}</span>
          </div>
        </div>
      </div>

      {/* Main Dynamic QR Area */}
      <div className="p-8 flex flex-col md:flex-row items-center justify-center gap-10">
        {/* Dynamic QR Code Card */}
        <div className="flex flex-col items-center">
          <div className="relative p-5 bg-white rounded-2xl border-2 border-indigo-300 shadow-2xl flex items-center justify-center group">
            {loading && !qrDataUrl ? (
              <div className="w-72 h-72 flex flex-col items-center justify-center gap-3 text-slate-700">
                <RefreshCw className="w-10 h-10 animate-spin text-indigo-600" />
                <span className="text-sm font-semibold">Generating challenge...</span>
              </div>
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Dynamic Attendance QR Code"
                  className="w-72 h-72 object-contain rounded-lg transition-transform group-hover:scale-[1.01]"
                />
                {/* Corner security badge */}
                <div className="absolute -bottom-2 -right-2 bg-indigo-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  HMAC Signed
                </div>
              </div>
            )}
          </div>

          {/* Countdown & Auto-Refresh Progress Bar */}
          <div className="w-full max-w-xs mt-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                Token Refresh:
              </span>
              <span className="font-mono text-indigo-700 text-sm">
                {timeLeft}s remaining
              </span>
            </div>
            {/* Visual progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / 20) * 100}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-center text-slate-700 mt-2">
              Anti-Proxy: Token changes automatically every 20 seconds. Screenshots become invalid immediately.
            </p>
          </div>
        </div>

        {/* Verification Rules & Live Attendance Stats */}
        <div className="max-w-md w-full space-y-5">
          {/* Live Roster Counter Box */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Present</span>
              <span className="text-3xl font-black text-emerald-700 mt-1 block">{presentCount}</span>
              <span className="text-[10px] text-emerald-800 font-semibold">Physical Lab</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">Online</span>
              <span className="text-3xl font-black text-blue-700 mt-1 block">0</span>
              <span className="text-[10px] text-blue-800 font-semibold">N/A (Offline)</span>
            </div>
            <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl text-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Enrolled</span>
              <span className="text-3xl font-black text-slate-700 mt-1 block">5</span>
              <span className="text-[10px] text-slate-700 font-semibold">Eligible Roster</span>
            </div>
          </div>

          {/* Verification Protocol Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Multi-Factor Attendance Verification Policy
            </h4>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Dynamic QR Challenge:</strong> HMAC-SHA256 encrypted, 20s life.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Classroom GPS Geofence:</strong> Must be within 60 meters of Lab 402.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>One-Device-Per-Student:</strong> Must use registered student smartphone.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Replay Defense:</strong> Single-use nonce consumed upon validation.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
              {isFullscreen ? 'Exit Fullscreen' : 'Projector View'}
            </button>
            <button
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
            >
              <Lock className="w-4 h-4" />
              {isFinalizing ? 'Finalizing...' : 'Lock & Finalize'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
