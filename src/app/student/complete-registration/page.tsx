'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, AlertCircle, CheckCircle2, ArrowRight, Layers, IdCard, Building2 } from 'lucide-react';
import { db } from '@/lib/db/mock-db';

export default function CompleteRegistrationPage() {
  const router = useRouter();

  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [submittedFullName, setSubmittedFullName] = useState('');
  const [batchId, setBatchId] = useState('77777777-7777-7777-7777-777777777771');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load available batches for student selection
  const batches = db.listBatches('11111111-1111-1111-1111-111111111111');

  useEffect(() => {
    // Check if user is signed in
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.authenticated) {
          router.push('/login');
        } else if (data.studentProfile?.isVerified) {
          // Already verified -> redirect to student dashboard
          router.push('/student');
        } else if (data.user?.displayName) {
          setSubmittedFullName(data.user.displayName);
        }
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/claim-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          studentIdNumber,
          submittedFullName,
          institutionId: '11111111-1111-1111-1111-111111111111',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Identity could not be verified against the institutional roster.');
        setLoading(false);
        return;
      }

      setSuccessMessage('Identity verified! Your account is now linked to your official student record.');
      setTimeout(() => {
        router.push('/student');
      }, 1500);
    } catch {
      setErrorMessage('Network error validating student identity.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        {/* Step Indicator Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Onboarding Step 2 of 2</span>
            <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              Authoritative Roster Check
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Verify Your Student Identity
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            To prevent proxy accounts, NoProxy cross-checks your registration against the authoritative student roster pre-loaded by Apex Institute of Technology.
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-medium space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Identity Verification Failed</span>
            </div>
            <p className="text-[11px] leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Success Feedback */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-medium space-y-1 animate-pulse">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Match Confirmed</span>
            </div>
            <p className="text-[11px] leading-relaxed">{successMessage} Redirecting to your dashboard...</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Enrolled Academic Batch</label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-900 bg-white"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Official Student ID / Roll Number</label>
            <div className="relative">
              <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. ST-002"
                value={studentIdNumber}
                onChange={(e) => setStudentIdNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono font-bold text-slate-900 uppercase"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Enter the exact student roll number provided on your admission letter or ID card.
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name (As officially enrolled)</label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Priya Singh"
                value={submittedFullName}
                onChange={(e) => setSubmittedFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Security Notice on Account Linking:</p>
            <p>
              Once linked, your Student ID is permanently bound to this account and your attendance device. Each ID can only be claimed once across the entire institution.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Validating Roster Match...</span>
            ) : (
              <>
                <span>Verify &amp; Activate Student Profile</span>
                <ArrowRight className="w-4 h-4 text-indigo-300" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
