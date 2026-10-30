'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  BookOpen,
  Users,
  QrCode,
  Radio,
  Play,
  Square,
  UserPlus,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  X,
  FileSpreadsheet,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { DynamicQRDisplay } from '@/components/DynamicQRDisplay';

interface EnrolledStudent {
  id: string;
  displayName: string;
  email: string;
}

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
  students?: EnrolledStudent[];
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

  // Add Student Modal State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentFullName, setStudentFullName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [submittingStudent, setSubmittingStudent] = useState(false);

  // Live session status state (polled every 3 seconds when attendance is active)
  const [liveSessionStatus, setLiveSessionStatus] = useState<any>(null);

  // 1. Load Trainer Batches from real backend API
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

  const currentBatchData = batchesData.find((b) => b.batch.id === selectedBatchId) || batchesData[0];
  const activeSession = currentBatchData?.activeSession;

  // 2. Poll live attendance counts when attendance is active
  useEffect(() => {
    if (!activeSession || activeSession.sessionStatus !== 'ACTIVE') {
      setLiveSessionStatus(null);
      return;
    }

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/sessions/status?sessionId=${activeSession.id}`);
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
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Action: Start Attendance
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
          title: `${currentBatchData?.batch?.name} - QR Attendance`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage({
          type: 'success',
          text: 'Attendance started! The dynamic QR code is now live on your screen for students to scan.',
        });
        await loadTrainerData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to start attendance.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network error starting attendance session.' });
    } finally {
      setLoading(false);
    }
  };

  // Action: Stop Attendance
  const handleStopAttendance = async () => {
    if (!activeSession) return;
    if (!confirm('Are you sure you want to stop attendance? This will lock the QR code and record unverified students as ABSENT.')) {
      return;
    }

    setLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/sessions/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage({
          type: 'success',
          text: `Attendance session closed! ${data.presentCount} marked PRESENT, ${data.absentCount} marked ABSENT.`,
        });
        setLiveSessionStatus(null);
        await loadTrainerData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to stop attendance.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network error stopping attendance session.' });
    } finally {
      setLoading(false);
    }
  };

  // Action: Trainer Add Student (Name + Email Only!)
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;
    if (!studentFullName.trim() || !studentEmail.trim()) {
      setActionMessage({ type: 'error', text: 'Student full name and email are both required.' });
      return;
    }

    setSubmittingStudent(true);
    try {
      const res = await fetch(`/api/trainer/batches/${selectedBatchId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: studentFullName.trim(),
          email: studentEmail.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMessage({
          type: 'success',
          text: data.message || `Student "${studentFullName}" enrolled successfully!`,
        });
        setShowAddStudentModal(false);
        setStudentFullName('');
        setStudentEmail('');
        await loadTrainerData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to enroll student.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network error enrolling student.' });
    } finally {
      setSubmittingStudent(false);
    }
  };

  // Action: Remove Student from Batch
  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Remove student "${studentName}" from this batch? Historical attendance records will remain intact.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/trainer/batches/${selectedBatchId}/students?studentId=${studentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: data.message || 'Student removed from batch.' });
        await loadTrainerData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to remove student.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network error removing student.' });
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Authenticating Trainer Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#172554] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Role */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
                  NoProxy
                  <span className="text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-1.5 py-0.5 rounded">
                    Trainer
                  </span>
                </span>
                <span className="text-[11px] block text-slate-300 font-medium -mt-0.5">
                  Classroom Attendance Management
                </span>
              </div>
            </div>

            {/* Trainer Profile & Sign Out */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser?.displayName?.charAt(0) || 'T'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-bold leading-none">{currentUser?.displayName || 'Trainer'}</p>
                  <p className="text-[10px] text-slate-300">{currentUser?.email}</p>
                </div>
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

        {/* Batch Sub-Nav */}
        <div className="bg-[#0f172a] border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>My Assigned Batches:</span>
              </span>

              <div className="flex items-center gap-2 overflow-x-auto">
                {batchesData.map((item) => (
                  <button
                    key={item.batch.id}
                    type="button"
                    onClick={() => setSelectedBatchId(item.batch.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      selectedBatchId === item.batch.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.batch.name}</span>
                    {item.activeSession && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Action Message Banner */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="p-1 hover:bg-black/5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {currentBatchData ? (
          <div className="space-y-6">
            {/* Batch Workspace Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
                      {currentBatchData.batch.name}
                    </h1>
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {currentBatchData.batch.code}
                    </span>
                    {activeSession && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                        Session Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Course: <strong className="text-slate-800">{currentBatchData.subject?.name || 'Standard Curriculum'}</strong> • Enrolled Students: <strong className="text-slate-800">{currentBatchData.enrolledCount}</strong>
                  </p>
                </div>

                {/* Primary Action Controls */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(true)}
                    className="px-3.5 py-2 bg-[#172554] hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Student</span>
                  </button>

                  {!activeSession ? (
                    <button
                      type="button"
                      onClick={handleStartAttendance}
                      disabled={loading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Attendance</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopAttendance}
                      disabled={loading}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-2"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Attendance</span>
                    </button>
                  )}

                  <Link
                    href={`/api/reports/excel?batchId=${currentBatchData.batch.id}`}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Excel</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Split Section: Active QR Projector Console (When Active) or Inactive Banner */}
            {activeSession ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <h3 className="font-extrabold text-sm text-[#0F172A]">
                      Live Attendance Projector (Present this screen to classroom)
                    </h3>
                  </div>

                  {liveSessionStatus && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        Present: {liveSessionStatus.presentCount}
                      </span>
                      <span className="font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        Total Enrolled: {liveSessionStatus.totalEnrolled}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Left: Dynamic 20s QR Code Generator */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <DynamicQRDisplay
                      session={activeSession}
                      batch={currentBatchData.batch as any}
                      subject={currentBatchData.subject as any}
                      institutionName="NoProxy Institute"
                      onSessionFinalized={loadTrainerData}
                    />
                  </div>

                  {/* Right: Live Roster Feed */}
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Live Classroom Attendance Feed</span>
                      <span className="text-[10px] text-slate-400 font-normal">Auto-refreshes every 3s</span>
                    </h4>

                    <div className="border border-slate-200 rounded-xl max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {liveSessionStatus?.roster && liveSessionStatus.roster.length > 0 ? (
                        liveSessionStatus.roster.map((st: any) => (
                          <div
                            key={st.studentId}
                            className="p-3 flex items-center justify-between hover:bg-slate-50/80 text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{st.fullName}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{st.email || 'Student'}</p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                st.status === 'PRESENT'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {st.status === 'PRESENT' ? 'PRESENT' : 'NOT MARKED'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-xs text-slate-400">
                          Waiting for students to scan QR code...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Enrolled Students Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-sm text-[#0F172A]">
                    Enrolled Students ({currentBatchData.students?.length || currentBatchData.enrolledCount})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Student to This Batch</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Student Name</th>
                      <th className="px-5 py-3">Email Address</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentBatchData.students && currentBatchData.students.length > 0 ? (
                      currentBatchData.students.map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{st.displayName}</td>
                          <td className="px-5 py-3.5 text-slate-600 font-mono">{st.email}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(st.id, st.displayName)}
                              className="text-rose-600 hover:text-rose-800 font-bold p-1 hover:bg-rose-50 rounded transition-colors"
                              title="Remove student from batch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                          No students enrolled in this batch yet. Click <strong>"Add Student"</strong> above to enroll students using only Full Name and Email.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-sm text-slate-800">No Batches Assigned</h3>
            <p className="text-xs text-slate-500">
              You are not currently assigned to any batches. Please contact the administrator.
            </p>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* ADD STUDENT MODAL FOR TRAINERS (NAME + EMAIL ONLY!) */}
      {/* ========================================================================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-[#0F172A]">Add Student to Batch</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200/60 rounded-xl text-blue-900 font-medium">
                Enrolling directly into batch: <strong>{currentBatchData?.batch?.name}</strong>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Patel"
                  value={studentFullName}
                  onChange={(e) => setStudentFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Student Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aarav.patel@student.edu"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Existing student accounts will be automatically reused without duplicate registrations.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStudent}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm"
                >
                  {submittingStudent ? 'Enrolling...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
