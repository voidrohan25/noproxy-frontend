'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignUp = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setErrorMessage('Could not initialize Google authentication service.');
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim(), displayName: displayName.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      router.push('/student');
    } catch {
      setErrorMessage('Network error connecting to registration service.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F8FAFC]">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#172554] text-white rounded-2xl mx-auto flex items-center justify-center shadow-md">
            <ShieldCheck className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
            Student Registration
          </h1>
          <p className="text-xs text-[#64748B]">
            Create your account using Full Name and Email Address. No roll numbers required.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Priya Singh"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="priya.singh@student.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Google OAuth Option */}
        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading || googleLoading}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{googleLoading ? 'Connecting to Google...' : 'Sign up with Google'}</span>
        </button>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
