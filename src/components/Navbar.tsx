'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, LayoutDashboard, ArrowRight, Menu, X, BookOpen, ShieldAlert, Cpu, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [session, setSession] = useState<{
    authenticated: boolean;
    user?: { id: string; email: string; displayName: string };
    role?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data) => setSession(data))
      .catch(() => setSession({ authenticated: false }));
  }, [pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false });
    router.push('/login');
  };

  const getPortalUrl = () => {
    if (!session || !session.role) return '/login';
    if (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') return '/admin';
    if (session.role === 'TRAINER') return '/trainer';
    return '/student';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-900 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-900/10 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                NoProxy
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.5 rounded">
                  SaaS
                </span>
              </span>
              <span className="text-[11px] block text-slate-600 font-medium -mt-0.5">
                Smart Attendance Management
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link
              href="/"
              className={`hover:text-indigo-600 transition-colors ${pathname === '/' ? 'text-indigo-600 font-bold' : ''}`}
            >
              Overview
            </Link>
            <Link
              href="/features"
              className={`hover:text-indigo-600 transition-colors ${pathname === '/features' ? 'text-indigo-600 font-bold' : ''}`}
            >
              Anti-Proxy Features
            </Link>
            <Link
              href="/how-it-works"
              className={`hover:text-indigo-600 transition-colors ${pathname === '/how-it-works' ? 'text-indigo-600 font-bold' : ''}`}
            >
              How It Works
            </Link>
            <Link
              href="/security"
              className={`hover:text-indigo-600 transition-colors ${pathname === '/security' ? 'text-indigo-600 font-bold' : ''}`}
            >
              Security &amp; Privacy
            </Link>
          </nav>

          {/* Actions & Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session?.authenticated && session.user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href={getPortalUrl()}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-sm transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Portal</span>
                  <span className="text-[9px] font-mono uppercase bg-indigo-800 px-1 py-0.2 rounded text-indigo-200 ml-0.5 hidden xs:inline">
                    {session.role}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                  title="Sign out of account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-sm transition-all hover:scale-105"
                >
                  <span>Student Sign Up</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-300" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                pathname === '/' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4" />
              Overview
            </Link>
            <Link
              href="/features"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                pathname === '/features' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Anti-Proxy Features
            </Link>
            <Link
              href="/how-it-works"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                pathname === '/how-it-works' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              How It Works
            </Link>
            <Link
              href="/security"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                pathname === '/security' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Security &amp; Privacy
            </Link>
          </nav>

          {!session?.authenticated && (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                Sign In to Account
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-2.5 rounded-xl bg-indigo-900 text-white text-xs font-bold shadow hover:bg-indigo-950"
              >
                Student Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

