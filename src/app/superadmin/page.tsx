'use client';

import React, { useState } from 'react';
import { ShieldCheck, Building2, Plus, Users, CheckCircle2, AlertTriangle, Activity, Database, Lock } from 'lucide-react';
import { db } from '@/lib/db/mock-db';
import { Institution } from '@/lib/db/types';

export default function SuperAdminPage() {
  const [institutions, setInstitutions] = useState<Institution[]>(db.listInstitutions());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleCreateInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug || !newEmail) return;

    const newInst: Institution = {
      id: `inst-${Date.now()}`,
      name: newName,
      slug: newSlug.toLowerCase().replace(/\s+/g, '-'),
      contactEmail: newEmail,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.institutions.set(newInst.id, newInst);
    setInstitutions(db.listInstitutions());
    setShowAddModal(false);
    setNewName('');
    setNewSlug('');
    setNewEmail('');
  };

  const toggleStatus = (inst: Institution) => {
    const nextStatus = inst.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    inst.status = nextStatus;
    db.institutions.set(inst.id, { ...inst, status: nextStatus });
    setInstitutions(db.listInstitutions());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-700">
              Platform Super Admin Console
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Multi-Tenant Management</h1>
          <p className="text-xs text-slate-700">
            Control institutions, monitor platform health, and audit system activities.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Onboard New Institution
        </button>
      </div>

      {/* Platform Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-bold uppercase">Active Institutions</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">{institutions.length}</span>
          <span className="text-[11px] text-emerald-800 font-semibold block mt-1">100% Operational</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-bold uppercase">Academic Batches</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">
            {Array.from(db.batches.values()).length}
          </span>
          <span className="text-[11px] text-slate-700 block mt-1">Across all institutions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-bold uppercase">Finalized Sessions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">
            {Array.from(db.sessions.values()).filter((s) => s.sessionStatus === 'FINALIZED').length}
          </span>
          <span className="text-[11px] text-emerald-800 font-semibold block mt-1">Locked with Audit Logs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-bold uppercase">Anti-Proxy Checks</span>
            <Lock className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-slate-900">100%</span>
          <span className="text-[11px] text-indigo-700 font-semibold block mt-1">Dynamic HMAC + GPS Active</span>
        </div>
      </div>

      {/* Institutions Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Registered Institutions (Tenants)</h2>
            <p className="text-xs text-slate-700">Strictly isolated database tenant records</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Institution Name</th>
                <th className="px-6 py-3.5">Slug / Identifier</th>
                <th className="px-6 py-3.5">Contact Email</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Tenant Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {institutions.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      {inst.name}
                    </div>
                    <span className="text-[10px] text-slate-700 font-mono">ID: {inst.id}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600 font-semibold">
                    {inst.slug}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {inst.contactEmail}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        inst.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${inst.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(inst)}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                        inst.status === 'ACTIVE'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {inst.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Institution Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Onboard New Institution</h3>
              <p className="text-xs text-slate-700">Creates an isolated tenant boundary</p>
            </div>

            <form onSubmit={handleCreateInstitution} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Institute of Tech"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Slug (URL Safe)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. nit-tech"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Contact Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@nit.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-900 hover:bg-indigo-950 font-bold rounded-xl text-white transition-colors"
                >
                  Save Institution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
