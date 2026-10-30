import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'NoProxy — Smart Attendance Management SaaS',
  description: 'Production-ready attendance platform with dynamic QR anti-proxy, classroom GPS geofencing, one active device policy, and Excel registers.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-700">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              &copy; {new Date().getFullYear()} <strong>NoProxy SaaS</strong>. Built for educational institutions &amp; IT training institutes.
            </p>
            <div className="flex items-center gap-4 text-[11px] font-medium text-slate-700">
              <span>Strict 3-Status System (Present | Online | Absent)</span>
              <span>•</span>
              <span>HMAC Dynamic QR</span>
              <span>•</span>
              <span>GPS Geofenced</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
