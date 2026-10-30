'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  Layers,
  MapPin,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Search,
  ExternalLink,
  UserCheck,
  ChevronRight,
  Radio,
  FileSpreadsheet,
  X,
  UserPlus,
} from 'lucide-react';

interface BatchSummary {
  id: string;
  name: string;
  code: string;
  status: string;
  startDate: string;
  endDate: string;
  enrolledCount: number;
  trainerName: string;
  trainerEmail: string;
  hasActiveSession: boolean;
  students?: Array<{ id: string; displayName: string; email: string }>;
}

interface StudentItem {
  id: string;
  displayName: string;
  email: string;
  accountStatus: string;
  createdAt: string;
  enrollments: Array<{ batchId: string; batchName: string; enrolledAt: string }>;
}

interface TrainerItem {
  profile: {
    id: string;
    displayName: string;
    email: string;
    accountStatus: string;
  };
  assignments: string[];
}

interface AttendanceActivity {
  id: string;
  studentName: string;
  studentEmail: string;
  batchName: string;
  status: 'PRESENT' | 'ONLINE' | 'ABSENT';
  markedAt: string;
  source: string;
}

export default function AdminConsolePage() {
  const router = useRouter();

  // Auth state
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Active Tab: 'overview' | 'batches' | 'trainers' | 'students' | 'reports'
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'trainers' | 'students' | 'reports'>('overview');

  // Dashboard Stats
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Batches
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [batchDetail, setBatchDetail] = useState<any>(null);

  // Students & Trainers
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [trainers, setTrainers] = useState<TrainerItem[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Modals
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [showAssignTrainerModal, setShowAssignTrainerModal] = useState(false);

  // Form Inputs
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchStartDate, setNewBatchStartDate] = useState('');
  const [newBatchEndDate, setNewBatchEndDate] = useState('');
  const [newBatchTrainerId, setNewBatchTrainerId] = useState('');

  const [targetBatchForStudent, setTargetBatchForStudent] = useState('');
  const [studentFullName, setStudentFullName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPassword, setTrainerPassword] = useState('Trainer@2026!');

  const [assignTrainerId, setAssignTrainerId] = useState('');
  const [assignBatchId, setAssignBatchId] = useState('');

  // Toast / Feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. Check Authentication
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

  // 2. Load Dashboard Stats
  const loadDashboardData = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setBatches(data.stats.batchSummaries || []);
          if (!selectedBatchId && data.stats.batchSummaries?.length > 0) {
            setSelectedBatchId(data.stats.batchSummaries[0].id);
          }
        }
      }
    } catch {
      showNotification('error', 'Failed to load dashboard metrics.');
    } finally {
      setLoadingStats(false);
    }
  }, [selectedBatchId]);

  // 3. Load Batches Detailed
  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/batches');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBatches(data.batches);
          if (!selectedBatchId && data.batches.length > 0) {
            setSelectedBatchId(data.batches[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedBatchId]);

  // 4. Load Students List
  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/students');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStudents(data.students);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 5. Load Trainers List
  const loadTrainers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/trainers');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTrainers(data.trainers);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!authChecking) {
      loadDashboardData();
      loadBatches();
      loadStudents();
      loadTrainers();
    }
  }, [authChecking, loadDashboardData, loadBatches, loadStudents, loadTrainers]);

  // Batch Detail update when selectedBatchId changes
  useEffect(() => {
    if (selectedBatchId && batches.length > 0) {
      const found = batches.find((b) => b.id === selectedBatchId);
      setBatchDetail(found || batches[0]);
    }
  }, [selectedBatchId, batches]);

  // Action: Create Batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) {
      showNotification('error', 'Please enter a batch name.');
      return;
    }

    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBatchName.trim(),
          startDate: newBatchStartDate || undefined,
          endDate: newBatchEndDate || undefined,
          trainerId: newBatchTrainerId || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || 'Batch created successfully!');
        setShowCreateBatchModal(false);
        setNewBatchName('');
        setNewBatchStartDate('');
        setNewBatchEndDate('');
        setNewBatchTrainerId('');
        await loadBatches();
        await loadDashboardData();
      } else {
        showNotification('error', data.error || 'Failed to create batch.');
      }
    } catch {
      showNotification('error', 'Network error creating batch.');
    }
  };

  // Action: Add Student to Batch (Name + Email Only!)
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const batchId = targetBatchForStudent || selectedBatchId;
    if (!batchId) {
      showNotification('error', 'Please select a batch.');
      return;
    }
    if (!studentFullName.trim() || !studentEmail.trim()) {
      showNotification('error', 'Student full name and email are both required.');
      return;
    }

    try {
      const res = await fetch(`/api/trainer/batches/${batchId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: studentFullName.trim(),
          email: studentEmail.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || 'Student enrolled successfully!');
        setShowAddStudentModal(false);
        setStudentFullName('');
        setStudentEmail('');
        await loadBatches();
        await loadStudents();
        await loadDashboardData();
      } else {
        showNotification('error', data.error || 'Failed to enroll student.');
      }
    } catch {
      showNotification('error', 'Network error enrolling student.');
    }
  };

  // Action: Remove Student from Batch
  const handleRemoveStudent = async (batchId: string, studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove "${studentName}" from this batch? Historical attendance will remain intact.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/trainer/batches/${batchId}/students?studentId=${studentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || 'Student removed from batch.');
        await loadBatches();
        await loadStudents();
        await loadDashboardData();
      } else {
        showNotification('error', data.error || 'Failed to remove student.');
      }
    } catch {
      showNotification('error', 'Network error removing student.');
    }
  };

  // Action: Create Trainer
  const handleAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerName.trim() || !trainerEmail.trim()) {
      showNotification('error', 'Trainer name and email are required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trainerName.trim(),
          email: trainerEmail.trim(),
          password: trainerPassword,
          batchIds: assignBatchId ? [assignBatchId] : [],
          subjectIds: ['66666666-6666-6666-6666-666666666661'],
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', 'Trainer account created successfully!');
        setShowAddTrainerModal(false);
        setTrainerName('');
        setTrainerEmail('');
        setAssignBatchId('');
        await loadTrainers();
        await loadBatches();
        await loadDashboardData();
      } else {
        showNotification('error', data.error || 'Failed to create trainer.');
      }
    } catch {
      showNotification('error', 'Network error creating trainer.');
    }
  };

  // Action: Assign Trainer to Batch
  const handleAssignTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTrainerId || !assignBatchId) {
      showNotification('error', 'Please select both a trainer and a batch.');
      return;
    }

    try {
      const res = await fetch('/api/admin/trainers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: assignTrainerId,
          batchId: assignBatchId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || 'Trainer assigned to batch successfully!');
        setShowAssignTrainerModal(false);
        setAssignTrainerId('');
        setAssignBatchId('');
        await loadBatches();
        await loadTrainers();
        await loadDashboardData();
      } else {
        showNotification('error', data.error || 'Failed to assign trainer.');
      }
    } catch {
      showNotification('error', 'Network error assigning trainer.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const filteredStudents = students.filter(
    (s) =>
      s.displayName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 font-semibold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Authenticating Administrator Session...</span>
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
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
                  NoProxy
                  <span className="text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                </span>
                <span className="text-[11px] block text-slate-300 font-medium -mt-0.5">
                  Institutional Attendance Console
                </span>
              </div>
            </div>

            {/* Right Side Navigation & Account */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <Link
                href="/admin/settings/location-network"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-100 border border-blue-700/50 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                <span>Geofence &amp; Network</span>
              </Link>

              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-blue-900/80">
                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser?.displayName?.charAt(0) || 'A'}
                </div>
                <div className="text-left">
                  <p className="font-bold leading-none">{currentUser?.displayName || 'Administrator'}</p>
                  <p className="text-[10px] text-slate-300">{currentUser?.email || 'admin@noproxy.edu'}</p>
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

        {/* Navigation Tabs Bar */}
        <div className="bg-[#0f172a] border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('batches')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'batches'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Batches</span>
                {batches.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-blue-900/80 rounded-full text-[10px]">
                    {batches.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trainers')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'trainers'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Trainers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'students'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Students</span>
                {students.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-blue-900/80 rounded-full text-[10px]">
                    {students.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'reports'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Attendance Reports</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Toast / Notification Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 hover:bg-black/5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Action Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight">Admin Overview</h1>
                <p className="text-xs text-[#64748B] mt-0.5">Real-time institute metrics and active classroom sessions.</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateBatchModal(true)}
                  className="px-3 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Batch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-3 py-2 bg-[#172554] hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(true)}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-[#334155] border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Add Trainer</span>
                </button>
              </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
                  <span>Total Students</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-black text-[#0F172A]">
                  {stats?.totalStudents ?? 0}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  Verified student accounts
                </span>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
                  <span>Total Trainers</span>
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-[#0F172A]">
                  {stats?.totalTrainers ?? 0}
                </p>
                <span className="text-[11px] text-[#64748B] font-medium">
                  Assigned instructors
                </span>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
                  <span>Active Batches</span>
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-[#0F172A]">
                  {stats?.totalBatches ?? 0}
                </p>
                <span className="text-[11px] text-blue-600 font-medium">
                  Multi-batch enabled
                </span>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
                  <span>Active Sessions</span>
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <p className="text-2xl font-black text-emerald-600">
                  {stats?.activeSessionsCount ?? 0}
                </p>
                <span className="text-[11px] text-[#64748B] font-medium">
                  Live QR attendance
                </span>
              </div>
            </div>

            {/* Split Row: Batches Overview & Recent Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Batches Overview */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Institute Batches</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('batches')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {batches.map((b) => (
                    <div
                      key={b.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0F172A]">{b.name}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {b.code}
                          </span>
                          {b.hasActiveSession && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                              <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                              Active QR
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          Trainer: <strong>{b.trainerName}</strong> • {b.enrolledCount} Students Enrolled
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBatchId(b.id);
                          setActiveTab('batches');
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-blue-600 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Recent Activity */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-600" />
                    <span>Recent Attendance</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Real-time</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {stats?.recentRecords && stats.recentRecords.length > 0 ? (
                    stats.recentRecords.slice(0, 7).map((rec: AttendanceActivity) => (
                      <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 leading-tight">{rec.studentName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{rec.batchName}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            rec.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : rec.status === 'ONLINE'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No attendance activity recorded yet today.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BATCHES MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'batches' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight">Batches &amp; Student Enrollment</h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Select a batch to inspect enrolled students or enroll new students using Full Name and Email.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateBatchModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Batch</span>
                </button>
              </div>
            </div>

            {/* Batch Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {batches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBatchId(b.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                    selectedBatchId === b.id
                      ? 'bg-[#172554] text-white border-[#172554] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{b.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedBatchId === b.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {b.enrolledCount}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Batch Workspace */}
            {batchDetail ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-[#0F172A]">{batchDetail.name}</h2>
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                        {batchDetail.code}
                      </span>
                      {batchDetail.hasActiveSession && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                          Attendance In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Assigned Trainer: <strong className="text-slate-800">{batchDetail.trainerName}</strong>
                      {batchDetail.trainerEmail && <span> ({batchDetail.trainerEmail})</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetBatchForStudent(batchDetail.id);
                        setShowAddStudentModal(true);
                      }}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Student to Batch</span>
                    </button>
                    <Link
                      href={`/api/reports/excel?batchId=${batchDetail.id}`}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4 text-slate-600" />
                      <span>Export Excel</span>
                    </Link>
                  </div>
                </div>

                {/* Enrolled Students Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Enrolled Students ({batchDetail.students?.length || batchDetail.enrolledCount || 0})</span>
                    </h3>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Student Name</th>
                          <th className="px-4 py-3">Email Address</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batchDetail.students && batchDetail.students.length > 0 ? (
                          batchDetail.students.map((st: any, idx: number) => (
                            <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                              <td className="px-4 py-3 font-bold text-slate-900">{st.displayName}</td>
                              <td className="px-4 py-3 text-slate-600 font-mono">{st.email}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudent(batchDetail.id, st.id, st.displayName)}
                                  className="text-rose-600 hover:text-rose-800 font-bold p-1 hover:bg-rose-50 rounded transition-colors"
                                  title="Remove from this batch"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                              No students enrolled in this batch yet. Click <strong>"Add Student to Batch"</strong> above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                No batch selected.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TRAINERS DIRECTORY */}
        {/* ========================================================================= */}
        {activeTab === 'trainers' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight">Trainer Accounts &amp; Assignments</h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Only Administrators can create trainers and assign them to specific classroom batches.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Trainer Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignTrainerModal(true)}
                  className="px-3.5 py-2 bg-[#172554] hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Assign to Batch</span>
                </button>
              </div>
            </div>

            {/* Trainers Directory Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Trainer Name</th>
                    <th className="px-5 py-3">Email Address</th>
                    <th className="px-5 py-3">Assigned Batches</th>
                    <th className="px-5 py-3">Account Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainers.map((t) => {
                    const assignedBatches = batches.filter((b) => t.assignments.includes(b.id));
                    return (
                      <tr key={t.profile.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                            {t.profile.displayName.charAt(0)}
                          </div>
                          <span>{t.profile.displayName}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-mono">{t.profile.email}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {assignedBatches.length > 0 ? (
                              assignedBatches.map((b) => (
                                <span
                                  key={b.id}
                                  className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md"
                                >
                                  {b.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No batches assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {t.profile.accountStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setAssignTrainerId(t.profile.id);
                              setShowAssignTrainerModal(true);
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Assign Batch
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

        {/* ========================================================================= */}
        {/* TAB 4: STUDENTS DIRECTORY */}
        {/* ========================================================================= */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight">Institutional Student Directory</h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Unique student identity is based strictly on <strong>Full Name</strong> and <strong>Email Address</strong>. No roll numbers required.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Enroll Student in Batch</span>
                </button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search students by full name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3">Email Address</th>
                    <th className="px-5 py-3">Enrolled Batches</th>
                    <th className="px-5 py-3">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {st.displayName.charAt(0)}
                          </div>
                          <span>{st.displayName}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-mono">{st.email}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {st.enrollments.length > 0 ? (
                              st.enrollments.map((enr, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                                >
                                  {enr.batchName}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No batches</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {st.accountStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        No students found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ATTENDANCE REPORTS */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight">Institutional Attendance Reports</h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Export authoritative attendance registers (.xlsx) calculated strictly with 3 statuses: PRESENT, ONLINE, and ABSENT.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/api/reports/excel?batchId=${selectedBatchId || batches[0]?.id}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Excel (.xlsx)</span>
                </Link>
              </div>
            </div>

            {/* Batch Selector for Report */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="max-w-xs space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Batch for Attendance Matrix
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.enrolledCount} Students)
                    </option>
                  ))}
                </select>
              </div>

              {/* Attendance Calculation Formula Card */}
              <div className="p-4 bg-blue-50/60 border border-blue-200/70 rounded-xl text-xs text-blue-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Authoritative Calculation Formula:</span>
                </p>
                <p className="font-mono text-[11px] text-blue-800">
                  Attendance Percentage = (Present + Online) / Total Eligible Finalized Sessions × 100
                </p>
                <p className="text-[11px] text-slate-600">
                  Zero roll numbers and zero lunch columns. Records are audited directly from dynamic QR challenges.
                </p>
              </div>

              {/* Preview of Enrolled Students in Batch */}
              {batchDetail && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs mt-4">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">Batch Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchDetail.students && batchDetail.students.length > 0 ? (
                        batchDetail.students.map((st: any, idx: number) => (
                          <tr key={st.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">{st.displayName}</td>
                            <td className="px-4 py-3 font-mono text-slate-600">{st.email}</td>
                            <td className="px-4 py-3 text-slate-700">{batchDetail.name}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                            No students enrolled in this batch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE BATCH */}
      {/* ========================================================================= */}
      {showCreateBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-[#0F172A] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Create New Batch</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateBatchModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Batch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python Full Stack 2026"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Start Date</label>
                  <input
                    type="date"
                    value={newBatchStartDate}
                    onChange={(e) => setNewBatchStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">End Date</label>
                  <input
                    type="date"
                    value={newBatchEndDate}
                    onChange={(e) => setNewBatchEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Assign Trainer (Optional)</label>
                <select
                  value={newBatchTrainerId}
                  onChange={(e) => setNewBatchTrainerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  <option value="">Unassigned (Assign later)</option>
                  {trainers.map((t) => (
                    <option key={t.profile.id} value={t.profile.id}>
                      {t.profile.displayName} ({t.profile.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateBatchModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / ENROLL STUDENT (NAME + EMAIL ONLY!) */}
      {/* ========================================================================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-[#0F172A] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Enroll Student in Batch</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Select Batch *</label>
                <select
                  value={targetBatchForStudent || selectedBatchId}
                  onChange={(e) => setTargetBatchForStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
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
                  If the student already exists, they will be enrolled into this batch without duplicate accounts.
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD TRAINER ACCOUNT */}
      {/* ========================================================================= */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-[#0F172A] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span>Create Trainer Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTrainerModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTrainer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Trainer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Arvind Kapoor"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Trainer Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. trainer.kapoor@apexinstitute.edu"
                  value={trainerEmail}
                  onChange={(e) => setTrainerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Initial Password *</label>
                <input
                  type="text"
                  required
                  value={trainerPassword}
                  onChange={(e) => setTrainerPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Assign Initial Batch (Optional)</label>
                <select
                  value={assignBatchId}
                  onChange={(e) => setAssignBatchId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  <option value="">None (Assign later)</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Create Trainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ASSIGN TRAINER TO BATCH */}
      {/* ========================================================================= */}
      {showAssignTrainerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-[#0F172A] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Assign Trainer to Batch</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignTrainerModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTrainer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Select Trainer *</label>
                <select
                  required
                  value={assignTrainerId}
                  onChange={(e) => setAssignTrainerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  <option value="">Choose a trainer</option>
                  {trainers.map((t) => (
                    <option key={t.profile.id} value={t.profile.id}>
                      {t.profile.displayName} ({t.profile.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Select Batch *</label>
                <select
                  required
                  value={assignBatchId}
                  onChange={(e) => setAssignBatchId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  <option value="">Choose a batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignTrainerModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
