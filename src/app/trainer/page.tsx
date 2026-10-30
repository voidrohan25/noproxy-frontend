'use client';

import React, { useState, useEffect } from 'react';
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
  Plus,
  Play,
  Layers,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { db } from '@/lib/db/mock-db';
import { DynamicQRDisplay } from '@/components/DynamicQRDisplay';
import { AttendanceStatusBadge } from '@/components/AttendanceStatusBadge';
import { Session } from '@/lib/db/types';

export default function TrainerPortalPage() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.authenticated) {
          router.push('/login');
        } else if (data.role !== 'TRAINER' && data.role !== 'ADMIN' && data.role !== 'SUPER_ADMIN') {
          router.push('/access-denied');
        } else {
          setCurrentUser(data.user);
          setAuthChecking(false);
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const trainerId = currentUser?.id || '33333333-3333-3333-3333-333333333331';
  const institutionId = '11111111-1111-1111-1111-111111111111';

  // Find all batches assigned to this trainer
  const trainerAssignments = Array.from(db.trainerAssignments.values()).filter(
    (a) => a.trainerId === trainerId && a.status === 'ACTIVE'
  );

  const assignedBatchIds = trainerAssignments.map((a) => a.batchId);
  const allBatches = db.listBatches(institutionId);
  const availableBatches = allBatches.filter((b) =>
    assignedBatchIds.length > 0 ? assignedBatchIds.includes(b.id) : true
  );

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    availableBatches[0]?.id || '77777777-7777-7777-7777-777777777771'
  );

  const currentBatch = db.batches.get(selectedBatchId) || availableBatches[0];
  const publicClassrooms = db.listClassroomsPublic(institutionId);

  // Sessions for current batch
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [rosterKey, setRosterKey] = useState(0);

  useEffect(() => {
    if (selectedBatchId) {
      const batchSessions = db.listSessions(selectedBatchId);
      setSessions(batchSessions);
      if (batchSessions.length > 0) {
        setSelectedSessionId(batchSessions[0].id);
      }
    }
  }, [selectedBatchId, rosterKey]);

  // New session modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMode, setNewMode] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [newSubjectId, setNewSubjectId] = useState('66666666-6666-6666-6666-666666666661');
  const [newClassroomId, setNewClassroomId] = useState(publicClassrooms[0]?.id || '88888888-8888-8888-8888-888888888881');

  const selectedSession = db.getSession(selectedSessionId) || sessions[0];
  const selectedSubject = selectedSession ? db.subjects.get(selectedSession.subjectId) : db.subjects.get(newSubjectId);
  const enrolledStudents = db.getBatchEnrolledStudents(selectedBatchId);

  const handleMarkOnline = async (studentId: string) => {
    try {
      const res = await fetch('/api/attendance/mark-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          studentId,
          trainerId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRosterKey((prev) => prev + 1);
      } else {
        alert(data.error || 'Failed to record online attendance');
      }
    } catch {
      alert('Error updating attendance status');
    }
  };

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newSess: Session = {
      id: `sess-${Date.now()}`,
      institutionId,
      batchId: selectedBatchId,
      subjectId: newSubjectId,
      classroomId: newMode === 'OFFLINE' ? newClassroomId : undefined,
      createdBy: trainerId,
      title: newTitle,
      sessionDate: new Date().toISOString().split('T')[0],
      startTime: '10:00:00',
      endTime: '12:00:00',
      mode: newMode,
      sessionStatus: 'ACTIVE',
      externalMeetingPlatform: newMode === 'ONLINE' ? 'Zoom' : undefined,
      externalMeetingUrl: newMode === 'ONLINE' ? 'https://zoom.us/j/987654321' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.sessions.set(newSess.id, newSess);
    setSessions(db.listSessions(selectedBatchId));
    setSelectedSessionId(newSess.id);
    setShowNewModal(false);
    setNewTitle('');
  };

  if (authChecking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-xs font-semibold text-slate-600">Verifying instructor authorization...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Presentation className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Instructor Lecture Console
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            {currentUser?.displayName} — Active Lectures
          </h1>
          <p className="text-xs text-slate-600">
            Teaching {availableBatches.length} assigned batch{availableBatches.length > 1 ? 'es' : ''}
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Start New Lecture Session
        </button>
      </div>

      {/* Batch Switcher Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-700" />
          <span className="text-xs font-bold text-slate-700">Active Batch:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {availableBatches.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBatchId(b.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedBatchId === b.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {b.name} ({b.code})
            </button>
          ))}
        </div>
      </div>

      {/* Session Selector Strip for Current Batch */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {sessions.length === 0 ? (
          <span className="text-xs text-slate-500 py-2">No sessions recorded yet for {currentBatch?.name}.</span>
        ) : (
          sessions.map((sess) => {
            const isSelected = sess.id === selectedSession?.id;
            return (
              <button
                key={sess.id}
                onClick={() => setSelectedSessionId(sess.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-900 text-white border-indigo-950 shadow-md ring-2 ring-indigo-900/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sess.mode === 'OFFLINE' ? (
                  <QrCode className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`} />
                ) : (
                  <Radio className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-200' : 'text-blue-600'}`} />
                )}
                <span>{sess.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  sess.sessionStatus === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {sess.sessionStatus}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Dynamic QR Display Component if Mode is OFFLINE */}
      {selectedSession && selectedSession.mode === 'OFFLINE' && currentBatch && selectedSubject && (
        <DynamicQRDisplay
          session={selectedSession}
          batch={currentBatch}
          subject={selectedSubject}
          institutionName="Apex Institute of Technology"
          onSessionFinalized={() => {
            setSessions(db.listSessions(selectedBatchId));
            setRosterKey((prev) => prev + 1);
          }}
        />
      )}

      {/* Online Session Manager if Mode is ONLINE */}
      {selectedSession && selectedSession.mode === 'ONLINE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Online Lecture Session
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                {selectedSession.title}
              </h2>
              <p className="text-xs text-slate-600">
                Meeting Platform: <strong>{selectedSession.externalMeetingPlatform}</strong> ({selectedSession.externalMeetingUrl})
              </p>
            </div>
            <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
              Status: {selectedSession.sessionStatus}
            </span>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
            <strong>Online Attendance Rule:</strong> Confirm participants from the live {selectedSession.externalMeetingPlatform} video roster and click &quot;Mark Online&quot;. Online attendance is recorded strictly as <strong>ONLINE</strong> and is never falsely marked as physical classroom presence.
          </div>
        </div>
      )}

      {/* Live Roster of Enrolled Students */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Session Roster &amp; Live Attendance Status
            </h3>
            <p className="text-xs text-slate-600">
              Enrolled students in {currentBatch?.name} (Strict 3-Status system)
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700">
            Total Students: {enrolledStudents.length}
          </span>
        </div>

        <div className="overflow-x-auto" key={rosterKey}>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Roll No.</th>
                <th className="px-6 py-3.5">Student Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Attendance Status</th>
                <th className="px-6 py-3.5 text-right">Instructor Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {enrolledStudents.map((item) => {
                const rec = db.attendance.get(`${selectedSession?.id}:${item.student.id}`);
                const status = rec ? rec.status : (selectedSession?.sessionStatus === 'FINALIZED' ? 'ABSENT' : 'Pending');

                return (
                  <tr key={item.student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                      {item.rollNumber}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.student.displayName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.student.email}
                    </td>
                    <td className="px-6 py-4">
                      {status === 'Pending' ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                          Pending Scan
                        </span>
                      ) : (
                        <AttendanceStatusBadge status={status} size="sm" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {selectedSession?.mode === 'ONLINE' && selectedSession.sessionStatus === 'ACTIVE' && (
                        <button
                          onClick={() => handleMarkOnline(item.student.id)}
                          disabled={status === 'ONLINE'}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm disabled:opacity-50 transition-colors"
                        >
                          {status === 'ONLINE' ? 'Marked Online' : 'Mark Online'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start New Session Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Start New Lecture Session</h3>
            <p className="text-xs text-slate-600">
              Batch: <strong>{currentBatch?.name}</strong>
            </p>

            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lecture Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lecture 5: Database Transactions & ACID"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Session Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewMode('OFFLINE')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      newMode === 'OFFLINE'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    Offline (QR Scan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMode('ONLINE')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      newMode === 'ONLINE'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Radio className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    Online (Virtual)
                  </button>
                </div>
              </div>

              {newMode === 'OFFLINE' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Classroom / Lab</label>
                  <select
                    value={newClassroomId}
                    onChange={(e) => setNewClassroomId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {publicClassrooms.map((cr) => (
                      <option key={cr.id} value={cr.id}>
                        {cr.name} ({cr.roomNumber} - {cr.building})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-900 hover:bg-indigo-950 text-white shadow-md"
                >
                  Launch Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
