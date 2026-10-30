import React from 'react';
import Link from 'next/link';
import {
  QrCode,
  MapPin,
  Smartphone,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Anti-Proxy Verification Architecture
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Engineered to Stop Attendance Fraud at Every Layer
        </h1>
        <p className="text-base text-slate-600">
          NoProxy combines cryptographic challenge generation, spherical coordinate calculations, and hardware-bound passkeys into a unified institutional platform.
        </p>
      </div>

      {/* Feature 1: Dynamic QR Code */}
      <div className="grid md:grid-cols-2 gap-10 items-center bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            1. Cryptographic HMAC Dynamic QR Code
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Standard attendance codes are static and easily shared via messaging apps. NoProxy generates server-signed challenges that rotate automatically every 20 seconds.
          </p>
          <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>HMAC-SHA256 signature guarantees token authenticity</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>20-second sliding expiration invalidates intercepted screenshots</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Single-use nonces consumed transactionally to prevent replay attacks</span>
            </li>
          </ul>
        </div>
        <div className="bg-slate-900 p-8 rounded-2xl text-white font-mono text-xs space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-indigo-300 border-b border-slate-800 pb-2 text-[11px]">
            <span>Challenge Structure</span>
            <span className="text-emerald-400">HMAC-SHA256</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <p><span className="text-indigo-400">sessionId</span>: &quot;99999999-9999-9999-9999-999999999994&quot;</p>
            <p><span className="text-indigo-400">institutionId</span>: &quot;11111111-1111-1111-1111-111111111111&quot;</p>
            <p><span className="text-indigo-400">issuedAt</span>: 1730219400000</p>
            <p><span className="text-indigo-400">expiresAt</span>: 1730219420000 <span className="text-emerald-400">(20s lifetime)</span></p>
            <p><span className="text-indigo-400">nonce</span>: &quot;a4f7e819b2c3d4e5&quot; <span className="text-rose-400">(Single-use)</span></p>
          </div>
        </div>
      </div>

      {/* Feature 2: Classroom GPS Geofencing */}
      <div className="grid md:grid-cols-2 gap-10 items-center bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm">
        <div className="bg-slate-900 p-8 rounded-2xl text-white font-mono text-xs space-y-3 shadow-inner order-2 md:order-1">
          <div className="flex items-center justify-between text-indigo-300 border-b border-slate-800 pb-2 text-[11px]">
            <span>Haversine Distance Engine</span>
            <span className="text-emerald-400">Spherical Trigonometry</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <p><span className="text-indigo-400">Lab 402 Target</span>: 19.0760&deg;N, 72.8777&deg;E</p>
            <p><span className="text-indigo-400">Reported Student Fix</span>: 19.07605&deg;N, 72.87775&deg;E</p>
            <p><span className="text-indigo-400">Calculated Distance</span>: 7.65 meters</p>
            <p><span className="text-indigo-400">Max Permitted Radius</span>: 50.00 meters</p>
            <p><span className="text-indigo-400">Reported Accuracy</span>: &plusmn;12m &lt; 35m max</p>
            <p className="text-emerald-400 font-bold pt-2">&gt;&gt; GEOFENCE_VERIFIED: STATUS_OK</p>
          </div>
        </div>
        <div className="space-y-5 order-1 md:order-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <MapPin className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            2. Classroom GPS Geofencing (Haversine Formula)
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Administrators configure precise classroom coordinates, permitted radius, and required device accuracy thresholds. Attendance attempts made from outside the physical room are rejected automatically.
          </p>
          <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Spherical great-circle distance computed on the server</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Inaccurate GPS fixes exceeding allowable error thresholds rejected</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No continuous background location tracking: checked strictly upon scan</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Feature 3: One-Device-Per-Student Binding */}
      <div className="grid md:grid-cols-2 gap-10 items-center bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            3. One-Device-Per-Student Policy
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Prevents a single present student from holding multiple smartphones to mark friends absent from class. Each student account is bound to a verified device.
          </p>
          <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>WebAuthn / Passkey platform authenticator binding</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Device credentials stored securely in database, not just browser cookies</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Audited administrative device reset workflow if a student replaces their phone</span>
            </li>
          </ul>
        </div>
        <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs">
            <span className="font-bold text-slate-900">Registered Student Device</span>
            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
              ACTIVE
            </span>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-500">Student ID:</span>
              <span className="font-mono font-bold text-slate-800">ST-001 (Aarav Patel)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Device Hardware:</span>
              <span className="font-semibold text-slate-800">iPhone 15 Pro (iOS Safari)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Credential Ref:</span>
              <span className="font-mono text-[10px] text-slate-700">cred-mock-webauthn-aarav-phone</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 4: Excel Register Matrix */}
      <div className="bg-indigo-950 text-white rounded-3xl p-8 sm:p-12 space-y-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-800 text-indigo-200 text-xs font-bold uppercase">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            University &amp; Faculty Audit Ready
          </div>
          <h2 className="text-3xl font-black">
            4. Genuine Batch Attendance Matrix (.xlsx)
          </h2>
          <p className="text-sm text-indigo-200">
            Generates real OpenXML Excel workbooks from authorized database queries. Each finalized lecture receives a dedicated date column with frozen student panes and dynamic attendance percentages.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-950 hover:bg-indigo-50 font-bold rounded-xl text-xs shadow-md transition-all hover:scale-105"
          >
            <span>Sign In to View Reports</span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}
