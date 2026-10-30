'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, LayoutDashboard, ArrowRight, Menu, X, BookOpen, MapPin, User, LogIn } from 'lucide-react';

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#172554] flex items-center justify-center text-white shadow-md shadow-blue-950/10 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#0F172A] flex items-center gap-1.5">
                NoProxy
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                  SaaS
                </span>
              </span>
              <span className="text-[11px] block text-[#64748B] font-medium -mt-0.5">
                Smart Attendance Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#334155]">
            <Link
              href="/"
              className={`hover:text-blue-600 transition-colors ${pathname === '/' ? 'text-blue-600 font-extrabold' : ''}`}
            >
              Overview
            </Link>
            <Link
              href="/features"
              className={`hover:text-blue-600 transition-colors ${pathname === '/features' ? 'text-blue-600 font-extrabold' : ''}`}
            >
              Anti-Proxy Features
            </Link>
            <Link
              href="/how-it-works"
              className={`hover:text-blue-600 transition-colors ${pathname === '/how-it-works' ? 'text-blue-600 font-extrabold' : ''}`}
            >
              How It Works
            </Link>
            <Link
              href="/security"
              className={`hover:text-blue-600 transition-colors ${pathname === '/security' ? 'text-blue-600 font-extrabold' : ''}`}
            >
              Security
            </Link>
          </nav>

          {/* User Status / Portal Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session?.authenticated && session.user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href={getPortalUrl()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#172554] hover:bg-slate-900 rounded-xl shadow-xs transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  <span>Open {session.role === 'ADMIN' ? 'Admin' : session.role === 'TRAINER' ? 'Trainer' : 'Student'} Workspace</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-xs transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-2 text-xs font-bold text-[#334155]">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-lg hover:bg-slate-50 ${pathname === '/' ? 'text-blue-600' : ''}`}
            >
              Overview
            </Link>
            <Link
              href="/features"
              className={`block px-3 py-2 rounded-lg hover:bg-slate-50 ${pathname === '/features' ? 'text-blue-600' : ''}`}
            >
              Anti-Proxy Features
            </Link>
            <Link
              href="/how-it-works"
              className={`block px-3 py-2 rounded-lg hover:bg-slate-50 ${pathname === '/how-it-works' ? 'text-blue-600' : ''}`}
            >
              How It Works
            </Link>
            <Link
              href="/security"
              className={`block px-3 py-2 rounded-lg hover:bg-slate-50 ${pathname === '/security' ? 'text-blue-600' : ''}`}
            >
              Security
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
