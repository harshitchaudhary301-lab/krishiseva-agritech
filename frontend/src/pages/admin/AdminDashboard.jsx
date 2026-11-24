import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Users, Clock, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, Loader2, ArrowLeft, Search, Filter, History
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';

export default function AdminDashboard() {
  const { lang, t } = useLanguage();

  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'users' | 'logs'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' | 'reject' | 'suspend' | 'reinstate'
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pendingRes, logsRes, usersRes] = await Promise.all([
        api.get('/accounts/admin/verification/'),
        api.get('/accounts/admin/verification/logs/'),
        api.get('/accounts/admin/users/')
      ]);
      setPendingUsers(pendingRes.data);
      setAuditLogs(logsRes.data);
      setAllUsers(usersRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch administrative records. Ensure you are signed in as an administrator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        user_id: selectedUser.id,
        action: actionType,
        notes: notes || `Admin action: ${actionType}`,
        suspension_reason: reason || ''
      };
      await api.post('/accounts/admin/verification/', payload);
      setMessage(`Successfully processed ${actionType} for ${selectedUser.username}.`);
      setSelectedUser(null);
      setNotes('');
      setReason('');
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F2] text-slate-800">
      {/* Admin Top Header */}
      <header className="bg-[#174D32] text-white py-4 px-6 sm:px-8 border-b border-[#0e3321] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#84B547]" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                KrishiSeva Administration & Governance
              </h1>
              <p className="text-xs text-emerald-200">
                {lang === 'hi' ? 'सेवा प्रदाता सत्यापन एवं अनुपालन नियंत्रण केंद्र' : 'Provider Verification & Security Compliance Desk'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{lang === 'hi' ? 'रीफ्रेश' : 'Refresh'}</span>
            </button>
            <Link
              to="/farmer/overview"
              className="px-3.5 py-1.5 rounded-xl bg-[#84B547] hover:bg-[#72a03b] text-white text-xs font-bold transition"
            >
              {lang === 'hi' ? 'किसान पोर्टल' : 'Farmer Portal'}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6">
        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-rose-900 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3-Tab Filter Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#174D32] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{lang === 'hi' ? 'सत्यापन प्रतीक्षारत' : 'Pending Verification'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-amber-400 text-slate-900 font-black' : 'bg-slate-100 text-slate-600'}`}>
              {pendingUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#174D32] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{lang === 'hi' ? 'समस्त पंजीकृत उपयोगकर्ता' : 'Registered Users Roster'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {allUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-[#174D32] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{lang === 'hi' ? 'सत्यापन ऑडिट लॉग' : 'Verification Audit Trail'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'logs' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* TAB 1: Pending Verification */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{lang === 'hi' ? 'सत्यापन की प्रतीक्षा में नए प्रदाता एवं श्रमिक' : 'Newly Registered Providers & Workers Awaiting Admin Vetting'}</span>
              <span>{pendingUsers.length} Pending Approval</span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
                <span className="text-xs">Loading verification desk...</span>
              </div>
            ) : pendingUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#84B547] transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900">
                          {u.role_display}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID #{u.id}</span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900">
                        {u.full_name || u.username}
                      </h3>

                      <div className="text-xs text-slate-600 space-y-1">
                        <p><strong>Username:</strong> {u.username} • <strong>Phone:</strong> {u.phone || 'N/A'}</p>
                        <p><strong>Location:</strong> {u.village}, {u.district}, {u.state}</p>
                        {u.business_name && <p><strong>Business:</strong> {u.business_name}</p>}
                        {u.services_offered && <p><strong>Services:</strong> {u.services_offered}</p>}
                        {u.experience_years && <p><strong>Experience:</strong> {u.experience_years} Years</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setActionType('approve');
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'सत्यापित करें' : 'Verify / Approve'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setActionType('reject');
                        }}
                        className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'अस्वीकार करें' : 'Reject'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {lang === 'hi' ? 'कोई लंबित सत्यापन नहीं है' : 'Verification Queue is Clear'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All registered service providers and workers have been reviewed. New registrations will automatically appear here pending approval.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: All Users Roster */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm">
              {lang === 'hi' ? 'प्लेटफॉर्म के पंजीकृत उपयोगकर्ता' : 'Complete Registered User Directory'}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {u.full_name || u.username} <span className="text-slate-400 font-normal">(@{u.username})</span>
                      </td>
                      <td className="py-3 px-4 capitalize">{u.role}</td>
                      <td className="py-3 px-4">{u.village}, {u.district}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.verification_status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.verification_status === 'suspended'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.verification_status || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'farmer' && u.role !== 'admin' && (
                          <div className="inline-flex gap-1.5">
                            {u.verification_status === 'verified' ? (
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('suspend');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px]"
                              >
                                Suspend
                              </button>
                            ) : u.verification_status === 'suspended' ? (
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('reinstate');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px]"
                              >
                                Reinstate
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setActionType('approve');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 font-bold text-[10px]"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Verification Audit Logs */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm">
              {lang === 'hi' ? 'प्रशासनिक कार्रवाई एवं ऑडिट रिकॉर्ड' : 'Verification Audit Trail (Immutable Log)'}
            </h3>

            {auditLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Subject User</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Reviewed By</th>
                      <th className="py-3 px-4">Notes / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {log.subject_user_name || `User #${log.subject_user}`}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">{log.reviewed_by_name || 'System Admin'}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{log.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                No audit entries recorded yet.
              </div>
            )}
          </div>
        )}

        {/* Review Action Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold capitalize">
                    {actionType} Provider / Worker
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {selectedUser.full_name || selectedUser.username} (@{selectedUser.username})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-white/80 hover:text-white rounded-xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleVerificationSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Review Decision Notes *
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Document credentials verified, inspection outcome, or suspension justification..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#84B547] outline-none"
                    required
                  />
                </div>

                {(actionType === 'suspend' || actionType === 'reject') && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Reason for {actionType} *
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Unverified credentials, booking violation"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#84B547] outline-none"
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition disabled:opacity-50 ${
                      actionType === 'approve' || actionType === 'reinstate'
                        ? 'bg-emerald-700 hover:bg-emerald-800'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {actionLoading ? 'Saving...' : `Confirm ${actionType}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
