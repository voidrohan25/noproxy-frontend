import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Database,
  Radio,
} from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
          Security &amp; Privacy Architecture
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Transparent Security with Full Data Minimization
        </h1>
        <p className="text-base text-slate-600">
          NoProxy prioritizes cryptographic security, role-based database constraints, and user privacy without collecting raw biometric templates.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Zero Biometric Storage</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            NoProxy never asks for, captures, or stores fingerprint images, facial templates, or device passcodes. Local authentication is delegated to the operating system via W3C WebAuthn standards.
          </p>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Row Level Security (RLS)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tenants are strictly isolated at the database layer via PostgreSQL Row Level Security. An administrator or trainer from one institution cannot query records belonging to another tenant.
          </p>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
            <EyeOff className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Continuous Tracking</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            GPS coordinates are requested solely at the exact second a student scans an attendance challenge. The platform never monitors students outside scheduled classroom lectures.
          </p>
        </div>
      </div>

      {/* Platform Limitations & Transparency Callout */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-6">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Honest Engineering &amp; Platform Transparency</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black">
          Browser Capabilities vs. Native Mobile Extensions
        </h2>

        <div className="grid md:grid-cols-2 gap-6 pt-2 text-xs text-slate-300">
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              Wi-Fi BSSID / MAC Address Limitations
            </h4>
            <p>
              Standard mobile browsers (Chrome, Safari) strictly forbid web applications from accessing the router&apos;s physical BSSID / MAC address for user privacy reasons. NoProxy validates network egress IP ranges and allows institutions requiring router BSSID verification to plug in a native Android companion without altering backend APIs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Multi-Layered Defense Philosophy
            </h4>
            <p>
              No single technology (GPS alone or QR alone) is completely fraud-proof. NoProxy achieves high security by combining four independent signals: server-signed rotating dynamic QR, classroom geofencing, one registered phone binding, and authoritative institutional roster cross-checking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
