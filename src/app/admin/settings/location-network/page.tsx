'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  ShieldAlert,
  Radio,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Lock,
  Layers,
  Compass,
  Building,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Classroom } from '@/lib/db/types';

export default function AdminLocationNetworkSettingsPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [latitude, setLatitude] = useState<number>(19.0760);
  const [longitude, setLongitude] = useState<number>(72.8777);
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState<number>(60);
  const [requiredGpsAccuracyMeters, setRequiredGpsAccuracyMeters] = useState<number>(35);
  const [allowedNetworkCidrs, setAllowedNetworkCidrs] = useState<string>('192.168.1.0/24, 10.0.0.0/16');
  const [gpsVerificationEnabled, setGpsVerificationEnabled] = useState<boolean>(true);
  const [gpsMandatory, setGpsMandatory] = useState<boolean>(true);
  const [networkVerificationEnabled, setNetworkVerificationEnabled] = useState<boolean>(false);
  const [networkMandatory, setNetworkMandatory] = useState<boolean>(false);
  const [auditReason, setAuditReason] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.authenticated) {
          router.push('/login');
        } else if (data.role !== 'ADMIN' && data.role !== 'SUPER_ADMIN') {
          router.push('/access-denied');
        } else {
          setAuthLoading(false);
          loadClassroomSettings();
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadClassroomSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/location-network');
      const data = await res.json();
      if (data.success && data.classrooms && data.classrooms.length > 0) {
        setClassrooms(data.classrooms);
        populateClassroom(data.classrooms[0]);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load classroom infrastructure settings.' });
    }
  };

  const populateClassroom = (c: Classroom) => {
    setSelectedClassroomId(c.id);
    setName(c.name);
    setBuilding(c.building || '');
    setRoomNumber(c.roomNumber || '');
    setLatitude(c.latitude);
    setLongitude(c.longitude);
    setGeofenceRadiusMeters(c.geofenceRadiusMeters);
    setRequiredGpsAccuracyMeters(c.requiredGpsAccuracyMeters);
    setAllowedNetworkCidrs(c.allowedNetworkCidrs?.join(', ') || '');
    setGpsVerificationEnabled(c.gpsVerificationEnabled);
    setGpsMandatory(c.gpsMandatory);
    setNetworkVerificationEnabled(c.networkVerificationEnabled);
    setNetworkMandatory(c.networkMandatory);
  };

  const handleClassroomSelect = (id: string) => {
    const selected = classrooms.find((c) => c.id === id);
    if (selected) {
      populateClassroom(selected);
      setMessage(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditReason || auditReason.trim().length < 5) {
      setMessage({
        type: 'error',
        text: 'A mandatory audit reason (minimum 5 characters) is required when updating location/network settings.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const cidrs = allowedNetworkCidrs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/settings/location-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          name,
          building,
          roomNumber,
          latitude: Number(latitude),
          longitude: Number(longitude),
          geofenceRadiusMeters: Number(geofenceRadiusMeters),
          requiredGpsAccuracyMeters: Number(requiredGpsAccuracyMeters),
          allowedNetworkCidrs: cidrs,
          gpsVerificationEnabled,
          gpsMandatory,
          networkVerificationEnabled,
          networkMandatory,
          reason: auditReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Classroom GPS geofence and network settings updated and recorded in audit log.',
        });
        setAuditReason('');
        loadClassroomSettings();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update location settings.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network failure while saving settings.' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-sm font-semibold flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          Verifying administrative authorization...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Admin Security Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded">
                Admin-Only Restricted Access
              </span>
              <span className="text-xs text-slate-400">• Security Tier 1</span>
            </div>
            <h1 className="text-lg font-black tracking-tight text-white mt-0.5">
              Institute Location & Network Verification Settings
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Coordinates masked from Trainers & Students</span>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {message && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Security Disclosure Notice */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 space-y-1">
            <h4 className="font-bold text-sm text-indigo-900">Privacy & Operational Boundaries</h4>
            <p className="text-slate-700 leading-relaxed">
              These exact GPS coordinates, geofence radii, and network CIDRs are stored authoritatively on the server.
              Neither trainers nor students receive these coordinates in frontend JavaScript or API responses.
              The server validates mobile submissions against these coordinates using the spherical Haversine formula.
            </p>
          </div>
        </div>

        {/* Classroom Selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Select Classroom / Lab to Configure
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classrooms.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleClassroomSelect(c.id)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedClassroomId === c.id
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900">{c.name}</h4>
                  <span className="text-[10px] font-mono text-slate-500">{c.roomNumber}</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">{c.building}</span>
                <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold text-slate-600">
                  <span>Radius: {c.geofenceRadiusMeters}m</span>
                  <span>•</span>
                  <span>Accuracy: &lt;{c.requiredGpsAccuracyMeters}m</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Configuration */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Classroom Geofence & Location Coordinates
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the exact physical center coordinates of the lecture hall or computer laboratory.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Classroom Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Building / Complex</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Room Number</label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Latitude (°N/S)</label>
              <input
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Longitude (°E/W)</label>
              <input
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Geofence Radius (Meters)</label>
              <input
                type="number"
                min="5"
                max="500"
                value={geofenceRadiusMeters}
                onChange={(e) => setGeofenceRadiusMeters(parseInt(e.target.value, 10))}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Max Allowable Accuracy (Meters)</label>
              <input
                type="number"
                min="5"
                max="100"
                value={requiredGpsAccuracyMeters}
                onChange={(e) => setRequiredGpsAccuracyMeters(parseInt(e.target.value, 10))}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Network & Policy Switches */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Enforcement & Verification Policies
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={gpsVerificationEnabled}
                  onChange={(e) => setGpsVerificationEnabled(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">GPS Verification Enabled</span>
                  <span className="text-[11px] text-slate-500 block">
                    Calculates distance against classroom coordinates on each offline attendance submission.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={gpsMandatory}
                  onChange={(e) => setGpsMandatory(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">GPS Verification Mandatory</span>
                  <span className="text-[11px] text-slate-500 block">
                    Hard failure: Submissions outside geofence radius or without location are strictly rejected.
                  </span>
                </div>
              </label>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Authorized Campus IP Subnets / CIDRs (Comma-separated)
              </label>
              <input
                type="text"
                value={allowedNetworkCidrs}
                onChange={(e) => setAllowedNetworkCidrs(e.target.value)}
                placeholder="e.g. 192.168.1.0/24, 10.0.0.0/16"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Used to verify campus intranet IP addresses. Browser limitations prevent direct hardware BSSID access without a companion native client.
              </span>
            </div>
          </div>

          {/* Mandatory Audit Reason */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              Mandatory Audit Reason for Change <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="e.g. Relocated Lab 402 to new Science Tower wing, adjusted radius to 65m"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving Settings...' : 'Save & Audit Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
