import React from 'react';
import { AttendanceStatus } from '@/lib/db/types';

interface BadgeProps {
  status: AttendanceStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const AttendanceStatusBadge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const normalized = (status || '').toUpperCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-bold tracking-wide uppercase',
    lg: 'px-3.5 py-1.5 text-sm font-bold tracking-wide uppercase',
  }[size];

  if (normalized === 'PRESENT') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        Present
      </span>
    );
  }

  if (normalized === 'ONLINE') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 ${sizeClasses}`}>
        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
        Online
      </span>
    );
  }

  if (normalized === 'ABSENT') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses}`}>
        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        Absent
      </span>
    );
  }

  // Fallback for unknown
  return (
    <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-800 border border-gray-300 ${sizeClasses}`}>
      {status}
    </span>
  );
};
