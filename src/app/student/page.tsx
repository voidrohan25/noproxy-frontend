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
  X,
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
  const [enrolledBatches, setEnrolledBatches] = useState<StudentBatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 1. Load student profile & batch enrollments from real backend API
  const loadStudentData = useCallback(async () => {
    try {
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

      setCurrentUser(meData.user);

      // 2. Fetch Enrolled Batches with real-time active sessions
      const batchesRes = await fetch('/api/student/batches');
      const batchesData = await batchesRes.json();
      if (batchesData.success && batchesData.batches) {
        setEnrolledBatches(batchesData.batches);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Authenticating Student Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#172554] text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
                  NoProxy
                  <span className="text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-1.5 py-0.5 rounded">
                    Student
                  </span>
                </span>
                <span className="text-[10px] block text-slate-300 font-medium -mt-0.5">
                  Instant Attendance
                </span>
              </div>
            </div>

            {/* Student Info & Logout */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="text-right hidden sm:block">
                <p className="font-bold leading-none">{currentUser?.displayName || 'Student'}</p>
                <p className="text-[10px] text-slate-300 font-mono">{currentUser?.email}</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome Student Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg font-black text-[#0F172A] tracking-tight">
              Welcome, {currentUser?.displayName}
            </h1>
            <p className="text-xs text-[#64748B]">
              Email: <strong className="text-slate-800 font-mono">{currentUser?.email}</strong> • Enrolled in{' '}
              <strong className="text-blue-600">{enrolledBatches.length}</strong> {enrolledBatches.length === 1 ? 'Batch' : 'Batches'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* My Batches Tabs */}
        {enrolledBatches.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>My Batches (Select to Mark Attendance)</span>
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {enrolledBatches.map((item) => (
                <button
                  key={item.batch.id}
                  type="button"
                  onClick={() => {
                    setSelectedBatchId(item.batch.id);
                    setIsScanning(false);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                    selectedBatchId === item.batch.id
                      ? 'bg-[#172554] text-white border-[#172554] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.batch.name}</span>
                  {item.activeSession?.sessionStatus === 'ACTIVE' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {/* Selected Batch Active Status & Scan Console */}
            {currentBatchItem && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-[#0F172A]">{currentBatchItem.batch.name}</h2>
                      <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {currentBatchItem.batch.code}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Trainer: <strong className="text-slate-800">{currentBatchItem.trainer?.displayName || 'Instructor'}</strong>
                      {currentBatchItem.subject && <span> • Course: {currentBatchItem.subject.name}</span>}
                    </p>
                  </div>

                  {currentBatchItem.summary && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Attendance Rate
                      </span>
                      <span className="text-base font-black text-blue-600">
                        {currentBatchItem.summary.attendancePercentage}
                      </span>
                    </div>
                  )}
                </div>

                {/* Live Session Status Banner & Scan Trigger */}
                {isSessionActive ? (
                  <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                        <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span>Active Attendance Session: {activeSession?.title}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Live Now
                      </span>
                    </div>

                    {hasAlreadyMarked ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                        <div className="flex items-center justify-center gap-2 text-emerald-900 font-extrabold text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span>Attendance Already Recorded!</span>
                        </div>
                        <p className="text-xs text-emerald-700 font-semibold">
                          Your attendance status for this session is marked as <strong>{activeSession?.myAttendanceStatus}</strong>.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center space-y-3 pt-1">
                        <p className="text-xs text-slate-600 max-w-sm mx-auto">
                          The trainer is currently projecting the live dynamic QR code. Scan the code on your trainer's screen to mark your attendance.
                        </p>
                        {!isScanning ? (
                          <button
                            type="button"
                            onClick={() => setIsScanning(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all inline-flex items-center gap-2 hover:scale-102"
                          >
                            <QrCode className="w-5 h-5" />
                            <span>Scan QR Code</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsScanning(false)}
                            className="px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
                          >
                            <X className="w-4 h-4" />
                            <span>Cancel Scanner</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                    <p className="font-bold text-xs text-slate-700">No Active Attendance Session</p>
                    <p className="text-[11px] text-slate-400">
                      When your trainer clicks "Start Attendance" in class, the scanner will appear here automatically.
                    </p>
                  </div>
                )}

                {/* Mobile Camera Scanner Viewfinder */}
                {isScanning && activeSession && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    <MobileQRScanner
                      sessionId={activeSession.id}
                      batchName={currentBatchItem.batch.name}
                      studentId={currentUser?.id}
                      studentName={currentUser?.displayName}
                      onSuccess={handleScanSuccess}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-sm text-slate-800">Not Enrolled in Any Batch</h3>
            <p className="text-xs text-slate-500">
              Your account is active, but you are not yet enrolled in any batch. Please ask your trainer or administrator to add your email ({currentUser?.email}) to your batch.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
