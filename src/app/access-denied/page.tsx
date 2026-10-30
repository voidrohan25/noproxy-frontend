import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl mx-auto flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">403 — Access Restricted</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            You do not have the required role or authorization to access this portal. Access to administrative and instructor consoles requires elevated permissions.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/login"
            className="w-full py-2.5 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Switch Account / Sign In
          </Link>
          <Link
            href="/"
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
