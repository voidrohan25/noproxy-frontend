'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  School,
  Users,
  BookOpen,
  MapPin,
  FileSpreadsheet,
  Download,
  Plus,
  Edit3,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  UserPlus,
  Upload,
  RefreshCw,
  LogOut,
  AlertTriangle,
  History,
  Lock,
} from 'lucide-react';
import { db } from '@/lib/db/mock-db';
import { AttendanceStatusBadge } from '@/components/AttendanceStatusBadge';
import { AttendanceStatus, AuthoritativeStudent } from '@/lib/db/types';

export default function AdminConsolePage() {
  const router = useRouter();
  const institutionId = '11111111-1111-1111-1111-111111111111';
  const institution = db.getInstitution(institutionId);

  // Authentication & Role Guard
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.authenticated) {
          router.push('/login');
        } else if (data.role !== 'ADMIN' && data.role !== 'SUPER_ADMIN') {
          router.push('/access-denied');
        } else {
          setCurrentUser(data.user);
          setAuthChecking(false);
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'enrollments' | 'trainers' | 'academic' | 'classrooms' | 'records'>('overview');

  // Academic Entities
  const [batches, setBatches] = useState(db.listBatches(institutionId));
  const [courses, setCourses] = useState(db.listCourses(institutionId));
  const [subjects, setSubjects] = useState(db.listSubjects(institutionId));
  const [classrooms, setClassrooms] = useState(db.listClassrooms(institutionId));
  const [trainers, setTrainers] = useState(db.listTrainers(institutionId));

  // Multi-Batch Enrollments State
  const [enrollmentsList, setEnrollmentsList] = useState(Array.from(db.studentEnrollments.values()));
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState('44444444-4444-4444-4444-444444444441');
  const [enrollBatchId, setEnrollBatchId] = useState(batches[1]?.id || batches[0]?.id);
  const [enrollRollNumber, setEnrollRollNumber] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');

  // Roster Tab state
  const selectedBatchId = batches[0]?.id || '77777777-7777-7777-7777-777777777771';
  const [roster, setRoster] = useState<AuthoritativeStudent[]>(db.listAuthoritativeRoster(selectedBatchId));
  const [newStudentIdNumber, setNewStudentIdNumber] = useState('');
  const [newStudentFullName, setNewStudentFullName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Trainer Creation state
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPassword, setTrainerPassword] = useState('Trainer@2026!');

  // Audited Correction modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<{ sessionId: string; studentId: string; currentStatus: AttendanceStatus } | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionMessage, setCorrectionMessage] = useState('');

  const refreshData = () => {
    setBatches(db.listBatches(institutionId));
    setCourses(db.listCourses(institutionId));
    setSubjects(db.listSubjects(institutionId));
    setClassrooms(db.listClassrooms(institutionId));
    setTrainers(db.listTrainers(institutionId));
    setRoster(db.listAuthoritativeRoster(selectedBatchId));
    setEnrollmentsList(Array.from(db.studentEnrollments.values()));
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError('');
    setEnrollSuccess('');

    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: enrollStudentId,
          batchId: enrollBatchId,
          rollNumber: enrollRollNumber,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEnrollSuccess('Student enrolled successfully into additional batch.');
        setEnrollmentsList(Array.from(db.studentEnrollments.values()));
        setTimeout(() => setShowEnrollModal(false), 1200);
      } else {
        setEnrollError(data.error || 'Failed to enroll student');
      }
    } catch {
      setEnrollError('Network failure enrolling student');
    }
  };

  const handleDeactivateEnrollment = async (studentId: string, batchId: string) => {
    if (!confirm('Are you sure you want to deactivate this student from this specific batch? Their other enrolled batches will remain completely active.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          batchId,
          reason: 'Deactivated by administrator in console',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEnrollmentsList(Array.from(db.studentEnrollments.values()));
      } else {
        alert(data.error || 'Failed to deactivate enrollment');
      }
    } catch {
      alert('Network failure');
    }
  };

  const handleAddAuthoritativeStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentIdNumber || !newStudentFullName) return;

    const res = db.addAuthoritativeStudent({
      institutionId,
      batchId: selectedBatchId,
      studentIdNumber: newStudentIdNumber,
      fullName: newStudentFullName,
      email: newStudentEmail,
    });

    if (res.success) {
      setRoster(db.listAuthoritativeRoster(selectedBatchId));
      setShowAddStudentModal(false);
      setNewStudentIdNumber('');
      setNewStudentFullName('');
      setNewStudentEmail('');
    } else {
      alert(res.error || 'Failed to add student');
    }
  };

  const handleBulkImportStudents = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        alert('Invalid JSON format: Must be an array of objects.');
        return;
      }
      const summary = db.importAuthoritativeRoster(selectedBatchId, institutionId, parsed);
      alert(`Import complete: ${summary.imported} imported, ${summary.skipped} skipped.`);
      setRoster(db.listAuthoritativeRoster(selectedBatchId));
      setShowImportModal(false);
      setImportJsonText('');
    } catch {
      alert('Error parsing JSON text. Please check format.');
    }
  };

  const handleResetStudentClaim = (rosterId: string) => {
    const reason = prompt('Mandatory audit reason for resetting student account claim:');
    if (!reason || reason.trim().length < 5) {
      alert('A valid reason (min 5 chars) is required.');
      return;
    }
    const res = db.resetStudentClaim(rosterId, currentUser?.id || 'admin', reason);
    if (res.success) {
      alert('Student claim reset. The student may now re-register.');
      setRoster(db.listAuthoritativeRoster(selectedBatchId));
    } else {
      alert(res.error || 'Failed to reset claim');
    }
  };

  const handleCreateTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerName || !trainerEmail) return;

    const res = db.createTrainerAccount({
      institutionId,
      name: trainerName,
      email: trainerEmail,
      password: trainerPassword,
      batchIds: [selectedBatchId],
      subjectIds: [subjects[0]?.id || '66666666-6666-6666-6666-666666666661'],
      actorId: currentUser?.id || 'admin',
    });

    if (res.success) {
      alert('Trainer created successfully and assigned to batch.');
      setTrainers(db.listTrainers(institutionId));
      setShowAddTrainerModal(false);
      setTrainerName('');
      setTrainerEmail('');
    } else {
      alert(res.error || 'Failed to create trainer');
    }
  };

  const handleCorrectAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget || !correctionReason) return;

    try {
      const res = await fetch('/api/attendance/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: correctionTarget.sessionId,
          studentId: correctionTarget.studentId,
          newStatus,
          reason: correctionReason,
          actorId: currentUser?.id || 'admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCorrectionMessage(`Record updated to ${newStatus}. Audit logged.`);
        setTimeout(() => {
          setShowCorrectionModal(false);
          setCorrectionMessage('');
          setCorrectionReason('');
        }, 1500);
      } else {
        alert(data.error || 'Failed to correct attendance');
      }
    } catch {
      alert('Error updating attendance record');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-xs font-semibold text-slate-600">Verifying administrator authorization...</span>
      </div>
    );
  }

  const allAttendance = Array.from(db.attendance.values()).filter((a) => a.institutionId === institutionId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Console Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-700">
              Institution Administration Console
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            {institution?.name}
          </h1>
          <p className="text-xs text-slate-600">
            Authenticated Administrator: <strong>{currentUser?.displayName}</strong> ({currentUser?.email})
          </p>
        </div>

        {/* Global Quick Action: Excel Register Download */}
        <div className="flex items-center gap-3">
          <a
            href={`/api/reports/excel?batchId=${selectedBatchId}`}
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-all hover:scale-105"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            Export Batch Excel Register (.xlsx)
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Dashboard Overview
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'roster'
              ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Authoritative Student Roster ({roster.length})
        </button>

        <button
          onClick={() => setActiveTab('enrollments')}
          className={`px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'enrollments'
              ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Multi-Batch Enrollments ({enrollmentsList.filter((e) => e.status === 'ACTIVE').length})
        </button>

        <button
          onClick={() => setActiveTab('trainers')}
          className={`px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'trainers'
              ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Instructors / Trainers ({trainers.length})
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          className={`px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'academic'
              ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Academic Batches &amp; Courses
        </button>

        <button
          onClick={() => setActiveTab('classrooms')}
          className={`px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'classrooms'
              ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Classroom Geofences ({classrooms.length})
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'records'
              ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Attendance Records &amp; Audits ({allAttendance.length})
        </button>
      </div>

      {/* Tab 1: Dashboard Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase block">Enrolled Students</span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{roster.length}</span>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                {roster.filter((r) => r.isClaimed).length} Claimed &amp; Verified
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase block">Active Instructors</span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{trainers.length}</span>
              <span className="text-[11px] text-slate-500 mt-1 block">Assigned to Batches</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase block">Attendance Records</span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{allAttendance.length}</span>
              <span className="text-[11px] text-indigo-700 font-semibold mt-1 block">Strict 3-Status System</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase block">Anti-Proxy Geofences</span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{classrooms.length}</span>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">Haversine GPS Active</span>
            </div>
          </div>

          {/* Quick Notice on Institutional Operations */}
          <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl space-y-2">
            <h3 className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
              Institutional Identity Integrity Safeguards
            </h3>
            <p className="text-xs text-indigo-900 leading-relaxed">
              Students cannot register arbitrary identities. All student registrations must cross-check against the <strong>Authoritative Student Roster</strong> pre-loaded in this console. Each student ID can be linked to exactly one active device, eliminating proxy submissions.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Authoritative Student Roster & Excel Import */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Authoritative Institutional Student Roster</h2>
              <p className="text-xs text-slate-600">Students must match these official records to activate their account</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900 text-white font-bold rounded-xl text-xs shadow-sm hover:bg-indigo-950 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                Bulk Import JSON/Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student ID / Roll</th>
                  <th className="px-6 py-3.5">Authoritative Legal Name</th>
                  <th className="px-6 py-3.5">Assigned Email</th>
                  <th className="px-6 py-3.5">Account Claim Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {roster.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {student.studentIdNumber}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {student.fullName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {student.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {student.isClaimed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Claimed &amp; Linked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-amber-100 text-amber-800 border border-amber-300">
                          Unclaimed (Pending)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {student.isClaimed && (
                        <button
                          onClick={() => handleResetStudentClaim(student.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                        >
                          Reset Claim
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Multi-Batch Student Enrollments */}
      {activeTab === 'enrollments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Multi-Batch Student Enrollment Manager</h2>
              <p className="text-xs text-slate-600">
                Students can belong to multiple batches simultaneously without overwriting previous enrollments
              </p>
            </div>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900 text-white font-bold rounded-xl text-xs hover:bg-indigo-950 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Enroll Student in Additional Batch
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Roll Number</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Enrolled Batch</th>
                  <th className="px-6 py-3.5">Batch Code</th>
                  <th className="px-6 py-3.5">Enrollment Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {enrollmentsList.map((enr) => {
                  const student = db.profiles.get(enr.studentId);
                  const batch = db.batches.get(enr.batchId);

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">{enr.rollNumber}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{student?.displayName || enr.studentId}</td>
                      <td className="px-6 py-4 text-slate-700 font-semibold">{batch?.name || enr.batchId}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                          {batch?.code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            enr.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {enr.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {enr.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleDeactivateEnrollment(enr.studentId, enr.batchId)}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                          >
                            Deactivate
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
      )}

      {/* Tab 3: Trainers Management */}
      {activeTab === 'trainers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Authorized Instructors &amp; Trainers</h2>
              <p className="text-xs text-slate-600">Trainers can only access batches assigned by the administrator</p>
            </div>
            <button
              onClick={() => setShowAddTrainerModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900 text-white font-bold rounded-xl text-xs hover:bg-indigo-950 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Onboard Trainer
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {trainers.map((t) => (
              <div key={t.profile.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{t.profile.displayName}</h4>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                    TRAINER
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-mono">{t.profile.email}</p>
                <div className="pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 block mb-1 font-semibold">Assigned Batches:</span>
                  <div className="flex flex-wrap gap-1">
                    {t.assignments.map((a, i) => (
                      <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-800">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Academic Batches & Courses */}
      {activeTab === 'academic' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Configured Academic Batches &amp; Courses</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {batches.map((b) => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                    {b.code}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Enrolled Students: {db.getBatchEnrolledStudents(b.id).length} | Status: {b.status}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Duration: {b.startDate} to {b.endDate || 'Ongoing'}</span>
                  <a
                    href={`/api/reports/excel?batchId=${b.id}`}
                    download
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Register
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Classrooms & GPS Geofences */}
      {activeTab === 'classrooms' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Classroom GPS Geofencing Settings</h2>
              <p className="text-xs text-slate-600">Institute physical classroom boundaries and accuracy thresholds.</p>
            </div>
            <Link
              href="/admin/settings/location-network"
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow flex items-center gap-2 transition-all hover:scale-105"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Configure Sensitive Coordinates &amp; Network Rules
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {classrooms.map((cr) => (
              <div key={cr.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-sm">{cr.name}</h4>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    GPS Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Latitude</span>
                    <strong>{cr.latitude}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Longitude</span>
                    <strong>{cr.longitude}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Permitted Radius</span>
                    <strong>{cr.geofenceRadiusMeters} meters</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Required Accuracy</span>
                    <strong>&plusmn;{cr.requiredGpsAccuracyMeters} meters</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Attendance Records & Corrections */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Institution Attendance Records</h2>
              <p className="text-xs text-slate-600">Strictly 3 Statuses: Present, Online, Absent</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
              Total Records: {allAttendance.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Session / Mode</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Verification Source</th>
                  <th className="px-6 py-3.5 text-right">Audited Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allAttendance.map((record) => {
                  const student = db.getProfile(record.studentId);
                  const session = db.getSession(record.sessionId);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <strong className="block text-slate-900">{student?.displayName || 'Student'}</strong>
                        <span className="text-[10px] text-slate-500">{student?.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 block">{session?.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Date: {session?.sessionDate} ({session?.mode})</span>
                      </td>
                      <td className="px-6 py-4">
                        <AttendanceStatusBadge status={record.status} size="sm" />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {record.attendanceSource}
                        </span>
                        {record.correctionReason && (
                          <span className="block text-[10px] text-amber-700 italic mt-0.5">
                            Note: {record.correctionReason}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setCorrectionTarget({
                              sessionId: record.sessionId,
                              studentId: record.studentId,
                              currentStatus: record.status,
                            });
                            setNewStatus(record.status);
                            setShowCorrectionModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Correct
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Single Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add to Authoritative Roster</h3>
            <form onSubmit={handleAddAuthoritativeStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student ID / Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ST-010"
                  value={newStudentIdNumber}
                  onChange={(e) => setNewStudentIdNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newStudentFullName}
                  onChange={(e) => setNewStudentFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="rahul.sharma@student.edu"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-900 text-white rounded-xl font-bold"
                >
                  Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Bulk Import Student Roster</h3>
            <p className="text-xs text-slate-600">
              Paste JSON array of students formatted as: <code>[{`{"studentIdNumber": "ST-011", "fullName": "Anil Rao"}`}]</code>
            </p>
            <form onSubmit={handleBulkImportStudents} className="space-y-4 text-xs">
              <textarea
                rows={6}
                required
                placeholder='[&#10;  {"studentIdNumber": "ST-011", "fullName": "Anil Rao", "email": "anil@student.edu"},&#10;  {"studentIdNumber": "ST-012", "fullName": "Megha Nair"}&#10;]'
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-[11px]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-900 text-white rounded-xl font-bold"
                >
                  Import Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboard Trainer Modal */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Onboard New Instructor</h3>
            <form onSubmit={handleCreateTrainer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sunita Kulkarni"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructor Email</label>
                <input
                  type="email"
                  required
                  placeholder="sunita.kulkarni@apexinstitute.edu"
                  value={trainerEmail}
                  onChange={(e) => setTrainerEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={trainerPassword}
                  onChange={(e) => setTrainerPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  className="flex-1 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-900 text-white rounded-xl font-bold"
                >
                  Create Instructor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audited Attendance Correction Modal */}
      {showCorrectionModal && correctionTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Audited Attendance Correction</h3>
            <p className="text-xs text-slate-600">Strictly 3 Statuses: PRESENT, ONLINE, ABSENT</p>

            {correctionMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold text-center">
                {correctionMessage}
              </div>
            ) : (
              <form onSubmit={handleCorrectAttendance} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Attendance Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="PRESENT">PRESENT (Physical Classroom)</option>
                    <option value="ONLINE">ONLINE (Virtual Participation)</option>
                    <option value="ABSENT">ABSENT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mandatory Correction Reason (Audit Trail)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Approved medical leave certificate / Physical lab presence manually verified."
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCorrectionModal(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-900 hover:bg-indigo-950 font-bold rounded-xl text-white"
                  >
                    Record Correction
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Multi-Batch Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Enroll Student into Additional Batch</h3>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {enrollSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {enrollSuccess}
              </div>
            )}

            {enrollError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                {enrollError}
              </div>
            )}

            <form onSubmit={handleEnrollStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Student</label>
                <select
                  value={enrollStudentId}
                  onChange={(e) => setEnrollStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-600"
                >
                  {Array.from(db.profiles.values())
                    .filter((p) => {
                      const m = Array.from(db.memberships.values()).find((mem) => mem.userId === p.id);
                      return m?.role === 'STUDENT';
                    })
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName} ({s.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Academic Batch</label>
                <select
                  value={enrollBatchId}
                  onChange={(e) => setEnrollBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-600"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Enrolling the student into this batch preserves all existing enrollments in other batches.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Batch Roll Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ST-001 or PY-101"
                  value={enrollRollNumber}
                  onChange={(e) => setEnrollRollNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-900 hover:bg-indigo-950 font-bold rounded-xl text-white"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
