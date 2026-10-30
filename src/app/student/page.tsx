'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Smartphone,
  QrCode,
  History,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  Radio,
  BookOpen,
  LogOut,
  AlertCircle,
  Loader2,
  ChevronRight,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { MobileQRScanner } from '@/components/MobileQRScanner';
import { AttendanceStatusBadge } from '@/components/AttendanceStatusBadge';

interface StudentBatchItem {
  batch: {
    id: string;
    name: string;
    code: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  enrollment: {
    id: string;
    rollNumber: string;
    status: string;
  };
  trainer?: {
    id: string;
    displayName: string;
    email: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  activeSession?: {
    id: string;
    title: string;
    sessionDate: string;
    mode: string;
    sessionStatus: string;
    myAttendanceStatus?: 'PRESENT' | 'ONLINE' | 'ABSENT' | null;
  };
  summary?: {
    presentCount: number;
    onlineCount: number;
    absentCount: number;
    totalFinalizedSessions: number;
    attendancePercentage: number | string;
  };
}

export default function StudentPortalPage() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [enrolledBatches, setEnrolledBatches] = useState<StudentBatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load student profile & batch enrollments from real backend API
  const loadStudentData = useCallback(async () => {
    try {
      // 1. Check Auth & Profile
      const meRes = await fetch('/api/auth/me');
      if (meRes.status === 401) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      if (!meData.authenticated) {
        router.push('/login');
        return;
      }
      if (meData.role !== 'STUDENT' && meData.role !== 'ADMIN' && meData.role !== 'SUPER_ADMIN') {
        router.push('/access-denied');
        return;
      }
      if (meData.role === 'STUDENT' && (!meData.studentProfile || !meData.studentProfile.isVerified)) {
        router.push('/student/complete-registration');
        return;
      }

      setCurrentUser(meData.user);
      setStudentProfile(meData.studentProfile);

      // 2. Fetch Enrolled Batches with real-time active sessions
      const batchesRes = await fetch('/api/student/batches');
      const batchesData = await batchesRes.json();
      if (batchesData.success && batchesData.batches) {
        setEnrolledBatches(batchesData.batches);

        // Keep current selected batch or default to first
        setSelectedBatchId((prev) => {
          if (prev && batchesData.batches.some((b: any) => b.batch.id === prev)) {
            return prev;
          }
          return batchesData.batches[0]?.batch?.id || '';
        });
      }
    } catch {
      // Handle network errors
    } finally {
      setAuthChecking(false);
    }
  }, [router]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData, refreshKey]);

  // Current selected batch item
  const currentBatchItem = enrolledBatches.find((item) => item.batch.id === selectedBatchId) || enrolledBatches[0];
  const activeSession = currentBatchItem?.activeSession;
  const isSessionActive = activeSession?.sessionStatus === 'ACTIVE';
  const hasAlreadyMarked = activeSession?.myAttendanceStatus === 'PRESENT' || activeSession?.myAttendanceStatus === 'ONLINE';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleScanSuccess = () => {
    setIsScanning(false);
    setRefreshKey((k) => k + 1);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
          <h2 className="text-white font-bold text-lg">Authenticating Student Portal...</h2>
          <p className="text-xs text-slate-400">Loading enrolled batches &amp; attendance status.</p>
        </div>
      </div>
    );
  }

  const studentDisplayName = studentProfile?.fullName || currentUser?.displayName || 'Student';
  const rollNumber = studentProfile?.studentIdNumber || 'ST-001';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded">
                Verified Student
              </span>
              <span className="text-xs text-slate-400">• Roll No: {rollNumber}</span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white mt-0.5">
              Welcome, {studentDisplayName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Batches"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
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
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {/* Batch Selector Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              My Enrolled Batches ({enrolledBatches.length})
            </h2>
            <span className="text-xs text-slate-500">
              Select a batch to mark attendance or view percentage.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {enrolledBatches.map((item) => {
              const isSelected = selectedBatchId === item.batch.id;
              const hasActive = item.activeSession?.sessionStatus === 'ACTIVE';

              return (
                <button
                  key={item.batch.id}
                  onClick={() => {
                    setSelectedBatchId(item.batch.id);
                    setIsScanning(false);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{item.batch.name}</h3>
                      <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                        {item.batch.code}
                      </span>
                    </div>
                    {hasActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Attendance:</span>
                    <strong className="text-indigo-600 font-black">
                      {item.summary?.attendancePercentage}%
                    </strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Batch Status & Attendance Panel */}
        {currentBatchItem && (
          <div className="space-y-6">
            {/* Batch Header & Attendance Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Batch Attendance Rate
                </span>
                <span className="text-3xl font-black text-indigo-600 mt-1 block">
                  {currentBatchItem.summary?.attendancePercentage}%
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Present / Online
                </span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {(currentBatchItem.summary?.presentCount || 0) + (currentBatchItem.summary?.onlineCount || 0)} Classes
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Absent
                </span>
                <span className="text-2xl font-black text-rose-500 mt-1 block">
                  {currentBatchItem.summary?.absentCount || 0} Classes
                </span>
              </div>
            </div>

            {/* Attendance Scanner & Session Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Selected Batch
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-0.5">
                    {currentBatchItem.batch.name}
                  </h2>
                </div>

                {currentBatchItem.trainer && (
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    Trainer: <strong>{currentBatchItem.trainer.displayName}</strong>
                  </span>
                )}
              </div>

              {/* Case 1: Attendance session is ACTIVE and NOT yet marked */}
              {isSessionActive && !hasAlreadyMarked && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-black text-emerald-950">
                          Attendance is Currently Active for this Batch!
                        </h4>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          {activeSession?.title}
                        </p>
                      </div>
                    </div>

                    {!isScanning && (
                      <button
                        onClick={() => setIsScanning(true)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        Scan Attendance
                      </button>
                    )}
                  </div>

                  {isScanning && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Point camera at the trainer's QR code:</span>
                        <button
                          onClick={() => setIsScanning(false)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                        >
                          Cancel Scanner
                        </button>
                      </div>

                      <MobileQRScanner
                        sessionId={activeSession.id}
                        batchName={currentBatchItem.batch.name}
                        studentId={currentUser?.id}
                        studentName={studentDisplayName}
                        onSuccess={handleScanSuccess}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Case 2: Attendance session is ACTIVE and ALREADY MARKED */}
              {isSessionActive && hasAlreadyMarked && (
                <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-950">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-black">
                      Attendance Marked Successfully for {currentBatchItem.batch.name}!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Your status for this session is recorded as <strong className="text-emerald-700">PRESENT</strong>. No further action needed.
                    </p>
                  </div>
                </div>
              )}

              {/* Case 3: NO active attendance session for this batch */}
              {!isSessionActive && (
                <div className="py-12 px-6 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto text-slate-500">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-black text-slate-700">
                    No active attendance session for this batch.
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When your trainer starts the lecture attendance session, the scanner button will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
