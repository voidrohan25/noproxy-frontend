import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  QrCode,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      role: 'Institution Admin',
      title: 'Pre-Load Authoritative Roster & Configure Classrooms',
      desc: 'The administrator sets up academic courses, batches, and assigns trainers. They upload or pre-load the authoritative student roster with official Student IDs and full names. Classroom GPS coordinates and geofence radii are configured once.',
      icon: Building2,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      step: '02',
      role: 'Student Onboarding',
      title: 'Register & Match Identity Against Official Roster',
      desc: 'Students create an account using Email or Google OAuth. First-time students must verify their identity by submitting their official Student ID and enrolled full name. The server validates the match against the institution roster, preventing duplicate or fake claims.',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      step: '03',
      role: 'Trainer Lecture Station',
      title: 'Launch Dynamic QR Projector for Offline Sessions',
      desc: 'The trainer opens their assigned batch and starts the lecture. The screen projects a dynamic QR code that automatically rotates every 20 seconds using HMAC-SHA256 signatures, rendering forwarded screenshots invalid.',
      icon: QrCode,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      step: '04',
      role: 'Student Phone App',
      title: 'Scan QR with GPS & Registered Device Validation',
      desc: 'The student opens the NoProxy web app on their phone, captures the dynamic challenge, and allows the device to verify GPS coordinates. The server calculates the distance and records the verified physical presence as PRESENT.',
      icon: Smartphone,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      step: '05',
      role: 'Session Finalization',
      title: 'Lock Session & Automatically Mark Absents',
      desc: 'When the lecture concludes, the trainer locks and finalizes the session. Any student on the eligible roster who did not establish verified attendance is automatically marked ABSENT. The session is permanently locked.',
      icon: ShieldCheck,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      step: '06',
      role: 'Official Audits',
      title: 'Generate Genuine Batch Excel Registers (.xlsx)',
      desc: 'Authorized administrators and trainers export batch registers. Each session appears in its own date column with clear Present, Online, and Absent totals, ready for faculty records and university audits.',
      icon: FileSpreadsheet,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
          End-to-End Workflow
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          How NoProxy Works in Real Institutions
        </h1>
        <p className="text-base text-slate-600">
          From administrative batch setup to classroom projection and automated absence finalization.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-slate-300">{s.step}</span>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 block mb-1">
                    {s.role}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl text-sm shadow-lg transition-transform hover:scale-105"
        >
          <span>Sign In to Access Your Portal</span>
          <ArrowRight className="w-4 h-4 text-indigo-300" />
        </Link>
      </div>
    </div>
  );
}
