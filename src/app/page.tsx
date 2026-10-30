import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  QrCode,
  MapPin,
  Smartphone,
  FileSpreadsheet,
  Building2,
  CheckCircle,
  Lock,
  ArrowRight,
  Radio,
  Users,
  Award,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-6 pb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Enterprise Smart Attendance Management SaaS
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Eliminate Proxy Attendance with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 via-indigo-600 to-purple-600">
            Dynamic QR &amp; Geofencing
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
          Designed for real IT training institutes, universities, engineering colleges, and coaching academies. Features server-signed rotating dynamic QR challenges, classroom GPS geofencing, one registered phone policy, and authoritative roster matching.
        </p>

        {/* Primary Call-to-Actions */}
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-sm shadow-lg shadow-indigo-950/20 transition-all hover:scale-105"
          >
            <span>Sign In to Institutional Portal</span>
            <ArrowRight className="w-4 h-4 text-indigo-300" />
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm transition-all"
          >
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Student First-Time Registration</span>
          </Link>
        </div>

        {/* Strict 3-Status System Guarantee */}
        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-6 py-3.5 rounded-2xl shadow-sm">
          <span className="text-slate-900 uppercase tracking-wider font-extrabold text-[11px]">Strict 3-Status Rule:</span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            PRESENT (Physical Classroom)
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            ONLINE (Virtual Participation)
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            ABSENT (Locked Roster)
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 text-[11px] italic font-normal">
            (No Late or grace-period statuses)
          </span>
        </div>
      </section>

      {/* Core Security Pillars */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="p-7 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Dynamic Rotating QR</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Challenges expire every 20 seconds using HMAC-SHA256 signatures and single-use nonces. Proxy screenshots forwarded over WhatsApp or Telegram are rejected instantly.
          </p>
        </div>

        <div className="p-7 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Classroom GPS Geofencing</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Computes spherical distance via the Haversine formula against configured classroom coordinates. Rejects attempts made from outside the classroom or with poor device accuracy.
          </p>
        </div>

        <div className="p-7 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">One-Device-Per-Student</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ties attendance to the student&apos;s registered smartphone via WebAuthn passkey platform authenticator credentials. One student cannot punch attendance for another.
          </p>
        </div>
      </section>

      {/* Enterprise Architecture Feature Grid */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-8 shadow-xl">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Enterprise SaaS Design
          </span>
          <h2 className="text-3xl font-black tracking-tight">
            Designed for Real Institutional Scales
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            Multi-tenant PostgreSQL schema with Row Level Security (RLS), downloadable Excel registers, and auditable correction logs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          <div className="border border-slate-800 p-5 rounded-2xl bg-slate-800/40 space-y-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-white text-sm">Authoritative Roster</h4>
            <p className="text-xs text-slate-400">
              Students must verify their enrolled Student ID against the pre-loaded official institutional roster.
            </p>
          </div>

          <div className="border border-slate-800 p-5 rounded-2xl bg-slate-800/40 space-y-2">
            <Radio className="w-5 h-5 text-blue-400" />
            <h4 className="font-bold text-white text-sm">Online &amp; Offline Lectures</h4>
            <p className="text-xs text-slate-400">
              Offline dynamic QR projector and online meeting participant confirmation stored separately as ONLINE.
            </p>
          </div>

          <div className="border border-slate-800 p-5 rounded-2xl bg-slate-800/40 space-y-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-white text-sm">Excel Matrix Registers</h4>
            <p className="text-xs text-slate-400">
              ExcelJS generated .xlsx files with individual date columns, frozen student columns, and attendance %.
            </p>
          </div>

          <div className="border border-slate-800 p-5 rounded-2xl bg-slate-800/40 space-y-2">
            <Lock className="w-5 h-5 text-rose-400" />
            <h4 className="font-bold text-white text-sm">Audited Absence Finalization</h4>
            <p className="text-xs text-slate-400">
              Automated absence marking for unrecorded students upon session lock with strict audit logging for corrections.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
