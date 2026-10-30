'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { db } from '@/lib/db/mock-db';
import { MobileQRScanner } from '@/components/MobileQRScanner';
import { AttendanceStatusBadge } from '@/components/AttendanceStatusBadge';

export default function StudentMultiBatchPortal() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [enrolledBatches, setEnrolledBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'batches' | 'scan' | 'history'>('batches');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.authenticated) {
          router.push('/login');
        } else if (data.role !== 'STUDENT' && data.role !== 'ADMIN' && data.role !== 'SUPER_ADMIN') {
          router.push('/access-denied');
        } else if (data.role === 'STUDENT' && (!data.studentProfile || !data.studentProfile.isVerified)) {
          router.push('/student/complete-registration');
        } else {
          setCurrentUser(data.user);
          let profile = data.studentProfile;
          if (!profile && (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN')) {
            profile = db.studentProfiles.get('44444444-4444-4444-4444-444444444441');
          }
          setStudentProfile(profile);

          const studentId = profile?.userId || data.user.id;
          // Load all active batch enrollments for this student
          const batches = db.getStudentEnrolledBatches(studentId);
          setEnrolledBatches(batches);
          if (batches.length > 0) {
            setSelectedBatchId(batches[0].batch.id);
          }
          setAuthChecking(false);
        }
      })
      .catch(() => router.push('/login'));
  }, [router, refreshKey]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
          <h2 className="text-white font-bold text-lg">Authenticating Student Portal...</h2>
          <p className="text-xs text-slate-400">Loading multi-batch enrollments & institutional roster claim.</p>
        </div>
      </div>
    );
  }

  const studentId = studentProfile?.userId || currentUser?.id;
  const studentDisplayName = studentProfile?.fullName || currentUser?.displayName || 'Student';
  const rollNumber = studentProfile?.studentIdNumber || 'ST-001';

  // Find currently selected batch item
  const currentBatchItem = enrolledBatches.find((item) => item.batch.id === selectedBatchId) || enrolledBatches[0];
  const currentBatch = currentBatchItem?.batch;
  const currentSummary = currentBatchItem?.summary || db.getStudentAttendanceSummary(selectedBatchId, studentId);

  // Get active session specifically for the selected batch
  const batchSessions = currentBatch ? db.listSessions(currentBatch.id) : [];
  const activeSessionForBatch = batchSessions.find((s) => s.sessionStatus === 'ACTIVE');
  const finalizedSessionsForBatch = batchSessions.filter((s) => s.sessionStatus === 'FINALIZED');

  return (
    <div className="min-h-screen bg-slate-900/5 sm:py-8">
      {/* Mobile Device Frame on Desktop / Full Screen on Phones */}
      <div className="max-w-md mx-auto bg-white min-h-[92vh] sm:rounded-[2.5rem] sm:border-8 sm:border-slate-800 sm:shadow-2xl overflow-hidden flex flex-col">
        {/* Phone Top Notch & Status Bar */}
        <div className="bg-slate-900 text-white px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono">
          <span>09:41</span>
          <div className="w-20 h-4 bg-black rounded-full mx-auto hidden sm:block"></div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>5G • 100%</span>
          </div>
        </div>

        {/* Student App Header */}
        <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 text-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-inner">
                {studentDisplayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight">{studentDisplayName}</h1>
                <span className="text-[10px] text-indigo-300 font-mono">
                  Roll: {rollNumber} • {enrolledBatches.length} Batches Enrolled
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Bound
              </span>
              <button
                onClick={handleLogout}
                title="Sign out of student portal"
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('batches')}
            className={`py-3 flex items-center justify-center gap-1 transition-colors border-b-2 ${
              activeTab === 'batches'
                ? 'border-indigo-600 text-indigo-900 bg-white'
                : 'border-transparent text-slate-700 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            My Batches
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`py-3 flex items-center justify-center gap-1 transition-colors border-b-2 ${
              activeTab === 'scan'
                ? 'border-indigo-600 text-indigo-900 bg-white'
                : 'border-transparent text-slate-700 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Scan QR
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 flex items-center justify-center gap-1 transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-900 bg-white'
                : 'border-transparent text-slate-700 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History ({currentSummary?.attendancePercentage || 0}%)
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4" key={refreshKey}>
          {/* TAB 1: ALL ENROLLED BATCHES */}
          {activeTab === 'batches' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Enrolled Batches ({enrolledBatches.length})
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold">
                  Select a batch to mark attendance
                </span>
              </div>

              {enrolledBatches.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No Active Enrollments</h3>
                  <p className="text-xs text-slate-500">
                    Your account has not been enrolled in any academic batches yet. Please contact your institution administrator.
                  </p>
                </div>
              ) : (
                enrolledBatches.map((item) => {
                  const isSelected = item.batch.id === selectedBatchId;
                  const hasActive = !!item.activeSession;

                  return (
                    <div
                      key={item.batch.id}
                      onClick={() => setSelectedBatchId(item.batch.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              {item.batch.code}
                            </span>
                            {hasActive && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                Live Lecture
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-black text-slate-900 mt-1.5">
                            {item.batch.name}
                          </h4>
                          <span className="text-[10px] text-slate-600 block mt-0.5">
                            Trainer: {item.trainer?.displayName || 'Assigned Instructor'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-indigo-950 block">
                            {item.summary?.attendancePercentage || 0}%
                          </span>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">Attendance</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          {item.activeSession ? item.activeSession.title : 'No active session'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBatchId(item.batch.id);
                            setActiveTab('scan');
                          }}
                          className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Open Batch <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: BATCH-SPECIFIC QR ATTENDANCE SCANNER */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              {currentBatch && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-600">Selected Batch</span>
                    <h4 className="text-xs font-black text-slate-900">{currentBatch.name}</h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('batches')}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Switch Batch
                  </button>
                </div>
              )}

              {activeSessionForBatch ? (
                <>
                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
                        Active Session in Progress
                      </span>
                      <h3 className="text-xs font-black text-indigo-950 mt-0.5">
                        {activeSessionForBatch.title}
                      </h3>
                      <span className="text-[10px] text-slate-700 block">
                        Mode: {activeSessionForBatch.mode} • Room: Advanced Software Lab 402
                      </span>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>

                  {/* Mobile Camera Scanner for Selected Batch */}
                  <MobileQRScanner
                    sessionId={activeSessionForBatch.id}
                    studentId={studentId}
                    studentName={studentDisplayName}
                    onSuccess={() => setRefreshKey((k) => k + 1)}
                  />
                </>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <Radio className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-800">
                    No Active Lecture in {currentBatch?.name || 'this batch'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The trainer for this batch has not opened an active attendance session right now.
                    If you are attending another batch lecture, switch your selected batch.
                  </p>
                  <button
                    onClick={() => setActiveTab('batches')}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow"
                  >
                    View All My Batches
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BATCH-SPECIFIC ATTENDANCE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {currentBatch && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-600">Register For</span>
                    <h4 className="text-xs font-black text-slate-900">{currentBatch.name}</h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('batches')}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Switch Batch
                  </button>
                </div>
              )}

              {/* Metric Ring Cards */}
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                      Batch Finalized Attendance
                    </span>
                    <h2 className="text-3xl font-black mt-1">
                      {currentSummary?.attendancePercentage || 0}%
                    </h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-indigo-300" />
                  </div>
                </div>

                {/* 3-Status Summary Breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-800 text-center text-xs">
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[9px] text-emerald-300 font-bold block uppercase">Present</span>
                    <strong className="text-base text-white block mt-0.5">{currentSummary?.presentCount || 0}</strong>
                    <span className="text-[8px] text-indigo-200">Lab QR</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[9px] text-blue-300 font-bold block uppercase">Online</span>
                    <strong className="text-base text-white block mt-0.5">{currentSummary?.onlineCount || 0}</strong>
                    <span className="text-[8px] text-indigo-200">Virtual</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[9px] text-rose-300 font-bold block uppercase">Absent</span>
                    <strong className="text-base text-white block mt-0.5">{currentSummary?.absentCount || 0}</strong>
                    <span className="text-[8px] text-indigo-200">Unrecorded</span>
                  </div>
                </div>
              </div>

              {/* Finalized Session History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider px-1">
                  Finalized Lectures in {currentBatch?.code}
                </h4>

                <div className="space-y-2">
                  {finalizedSessionsForBatch.length > 0 ? (
                    finalizedSessionsForBatch.map((sess) => {
                      const rec = db.attendance.get(`${sess.id}:${studentId}`);
                      const status = rec ? rec.status : 'ABSENT';
                      const subject = db.subjects.get(sess.subjectId);

                      return (
                        <div
                          key={sess.id}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <h5 className="text-xs font-bold text-slate-900">
                              {subject?.name || sess.title}
                            </h5>
                            <span className="text-[10px] text-slate-700 block mt-0.5">
                              {sess.sessionDate} • Mode: {sess.mode}
                            </span>
                          </div>
                          <AttendanceStatusBadge status={status} size="sm" />
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                      No finalized sessions recorded for this batch yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Phone Bottom Home Bar */}
        <div className="p-2 bg-slate-50 border-t border-slate-200 flex justify-center">
          <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
