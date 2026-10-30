'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Presentation,
  QrCode,
  Radio,
  Lock,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Play,
  Square,
  Layers,
  RefreshCw,
  LogOut,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  Award,
} from 'lucide-react';
import { DynamicQRDisplay } from '@/components/DynamicQRDisplay';
import { AttendanceStatusBadge } from '@/components/AttendanceStatusBadge';

interface TrainerBatchData {
  batch: {
    id: string;
    institutionId: string;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  enrolledCount: number;
  activeSession?: any;
  liveStatus?: any;
}

export default function TrainerPortalPage() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [batchesData, setBatchesData] = useState<TrainerBatchData[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live session status state (polled every 3 seconds when attendance is active)
  const [liveSessionStatus, setLiveSessionStatus] = useState<any>(null);

  // Load Trainer Batches from real backend API
  const loadTrainerData = useCallback(async () => {
    try {
      const res = await fetch('/api/trainer/batches');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.status === 403) {
        router.push('/access-denied');
        return;
      }
      const data = await res.json();
      if (data.success && data.batches) {
        setBatchesData(data.batches);
        setCurrentUser(data.trainer);

        // Keep current selected batch or default to first
        setSelectedBatchId((prev) => {
          if (prev && data.batches.some((b: any) => b.batch.id === prev)) {
            return prev;
          }
          return data.batches[0]?.batch?.id || '';
        });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to load trainer batch data.' });
    } finally {
      setAuthChecking(false);
    }
  }, [router]);

  useEffect(() => {
    loadTrainerData();
  }, [loadTrainerData]);

  // Current selected batch
  const currentBatchData = batchesData.find((b) => b.batch.id === selectedBatchId) || batchesData[0];
  const activeSession = currentBatchData?.activeSession;

  // Poll live attendance counts when attendance is active
  useEffect(() => {
    if (!activeSession || activeSession.sessionStatus !== 'ACTIVE') {
      setLiveSessionStatus(null);
      return;
    }

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/sessions/${activeSession.id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setLiveSessionStatus(data);
          }
        }
      } catch {
        // Ignore polling errors
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3000); // 3-second live refresh
    return () => clearInterval(interval);
  }, [activeSession]);

  // Start Attendance Action
  const handleStartAttendance = async () => {
    if (!selectedBatchId) return;
    setLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatchId,
          title: `${currentBatchData?.batch?.name} - QR Attendance Session`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: 'Attendance started! Dynamic QR code is active and ready for scanning.' });
        await loadTrainerData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to start attendance.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network error starting attendance.' });
    } finally {
      setLoading(false);
    }
  };

  // Stop Attendance Action
  const handleStopAttendance = async () => {
    if (!activeSession) return;
    if (!confirm('Are you sure you want to stop attendance? This will lock the QR code and automatically record unverified students as ABSENT.')) {
      return;
    }

    setLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/sessions/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession.id }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: data.message });
        await loadTrainerData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to stop attendance.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network error stopping attendance.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-sm font-semibold flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          Loading Trainer Portal...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <Presentation className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded">
                Trainer Portal
              </span>
              <span className="text-xs text-slate-400">• Real-Time Attendance Console</span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white mt-0.5">
              Welcome, {currentUser?.displayName || 'Trainer'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            {currentUser?.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Action Alerts */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Batch Selector Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              My Assigned Batches ({batchesData.length})
            </h2>
            <span className="text-xs text-slate-500">
              Only batches assigned to you by Admin are displayed.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {batchesData.map((item) => {
              const isSelected = selectedBatchId === item.batch.id;
              const hasActiveSession = !!item.activeSession;

              return (
                <button
                  key={item.batch.id}
                  onClick={() => setSelectedBatchId(item.batch.id)}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{item.batch.name}</h3>
                      <span className="text-[10px] font-mono font-bold text-slate-500 block mt-0.5">
                        {item.batch.code}
                      </span>
                    </div>
                    {hasActiveSession && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-semibold">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {item.enrolledCount} Students
                    </span>
                    {item.subject && (
                      <span className="text-slate-500 truncate text-[11px]">
                        • {item.subject.name}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Batch Active Attendance Console */}
        {currentBatchData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: QR Display & Session Controls */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Active Batch Console
                    </span>
                    <h2 className="text-lg font-black text-slate-900 mt-0.5">
                      {currentBatchData.batch.name}
                    </h2>
                  </div>

                  {/* Start or Stop Attendance Primary Button */}
                  {activeSession ? (
                    <button
                      onClick={handleStopAttendance}
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      Stop Attendance &amp; Lock Session
                    </button>
                  ) : (
                    <button
                      onClick={handleStartAttendance}
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Start Attendance
                    </button>
                  )}
                </div>

                {/* If Attendance is Active -> Display Dynamic QR Code */}
                {activeSession ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-semibold">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span>Dynamic QR Session is Live. Display this screen to classroom students.</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-800">
                        Session: {activeSession.title}
                      </span>
                    </div>

                    <DynamicQRDisplay
                      session={activeSession}
                      batch={currentBatchData.batch as any}
                      subject={currentBatchData.subject as any}
                      institutionName="NoProxy IT Training Institute"
                      onSessionFinalized={loadTrainerData}
                    />
                  </div>
                ) : (
                  /* If No Active Session -> Display Instructions */
                  <div className="py-12 px-6 text-center space-y-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-800">
                        No Active Attendance Session for this Batch
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Click the green <strong>"Start Attendance"</strong> button above to launch the 20-second dynamic rotating QR projector console.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Live Attendance Roster & Summary */}
            <div className="space-y-6">
              {/* Real-time Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Enrolled
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {currentBatchData.enrolledCount}
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Present Today
                  </span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">
                    {liveSessionStatus?.presentCount ?? (activeSession ? 1 : 0)}
                  </span>
                </div>
              </div>

              {/* Live Student Roster List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Batch Roster
                  </h3>
                  <a
                    href={`/api/reports/excel?batchId=${selectedBatchId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Export Excel
                  </a>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {liveSessionStatus?.roster ? (
                    liveSessionStatus.roster.map((student: any) => (
                      <div
                        key={student.studentId}
                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{student.fullName}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {student.studentIdNumber}
                          </span>
                        </div>
                        <AttendanceStatusBadge status={student.status} size="sm" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Roster updates automatically when attendance is started.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
