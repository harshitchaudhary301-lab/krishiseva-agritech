import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, Phone, ArrowRight, Loader2, AlertCircle, PlayCircle, XCircle } from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';

export default function WorkerBookings() {
  const { lang } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/');
      setBookings(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirm = async (id) => {
    setActionLoading(id);
    setMsg({ error: '', success: '' });
    try {
      await api.post(`/bookings/${id}/confirm/`);
      setMsg({ error: '', success: 'Work availability confirmed successfully! Farmer has been notified.' });
      fetchBookings();
    } catch (err) {
      setMsg({ error: err.response?.data?.error || 'Failed to confirm availability.', success: '' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatus = async (id, status) => {
    setActionLoading(id);
    setMsg({ error: '', success: '' });
    try {
      await api.post(`/bookings/${id}/status/`, { status });
      setMsg({ error: '', success: `Status updated to '${status}'.` });
      fetchBookings();
    } catch (err) {
      setMsg({ error: err.response?.data?.error || 'Failed to update work status.', success: '' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitCompletion = async (id) => {
    setActionLoading(id);
    setMsg({ error: '', success: '' });
    try {
      await api.post(`/bookings/${id}/submit-completion/`, { notes: 'Worker declared work completed.' });
      setMsg({ error: '', success: 'Work completion submitted! Awaiting farmer review & approval.' });
      fetchBookings();
    } catch (err) {
      setMsg({ error: err.response?.data?.error || 'Failed to submit completion.', success: '' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt(lang === 'hi' ? 'रद्द करने का कारण दर्ज करें:' : 'Enter reason for cancellation:');
    if (!reason) return;
    setActionLoading(id);
    setMsg({ error: '', success: '' });
    try {
      await api.post(`/bookings/${id}/cancel/`, { reason });
      setMsg({ error: '', success: 'Booking cancelled.' });
      fetchBookings();
    } catch (err) {
      setMsg({ error: err.response?.data?.error || 'Failed to cancel.', success: '' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {lang === 'hi' ? 'मेरी कृषि कार्य बुकिंग्स' : 'My Work Bookings & Farm Assignments'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'hi'
            ? 'स्वीकृत कार्य की पुष्टि करें, कार्य शुरू करें और काम पूरा होने पर मार्क करें।'
            : 'Confirm accepted wage proposals, start field work, and mark completed jobs.'}
        </p>
      </div>

      {msg.error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{msg.error}</span>
        </div>
      )}
      {msg.success && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg.success}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
          <span className="text-xs">Loading work bookings...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
          <p>No work bookings assigned yet. Check available jobs to propose fair daily wages.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#84B547] transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{b.reference_id}</span>
                  <span className="font-black text-sm text-[#174D32]">₹{b.agreed_amount?.toLocaleString()}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-100 text-lime-900">
                    {b.category_name}
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900">{b.request_title}</h4>
                <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                  <span>Farmer: <strong>{b.farmer_name}</strong></span>
                  <span>•</span>
                  <span>Phone: {b.farmer_phone || 'Available'}</span>
                  <span>•</span>
                  <span>Village: {b.farmer_village}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Scheduled Work Date: <strong className="text-slate-800">{b.scheduled_date}</strong> • Scope: {b.request_scope}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3 flex-wrap">
                <StatusBadge status={b.status} />

                {b.status === 'pending_confirmation' && (
                  <button
                    onClick={() => handleConfirm(b.id)}
                    disabled={actionLoading === b.id}
                    className="px-4 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#84B547]" />
                    <span>{lang === 'hi' ? 'कार्य उपलब्धता पक्की करें' : 'Confirm Work Availability'}</span>
                  </button>
                )}

                {b.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatus(b.id, 'in_progress')}
                    disabled={actionLoading === b.id}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'कार्य शुरू करें' : 'Start Field Work'}</span>
                  </button>
                )}

                {b.status === 'in_progress' && (
                  <button
                    onClick={() => handleSubmitCompletion(b.id)}
                    disabled={actionLoading === b.id}
                    className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>{lang === 'hi' ? 'कार्य पूर्णता अनुमोदन हेतु भेजें' : 'Submit Completion for Sign-off'}</span>
                  </button>
                )}

                {b.status === 'completion_pending' && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>{lang === 'hi' ? 'किसान समीक्षा लंबित' : 'Awaiting Farmer Sign-off'}</span>
                  </span>
                )}

                {['pending_confirmation', 'confirmed'].includes(b.status) && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="text-xs text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                  >
                    {lang === 'hi' ? 'रद्द करें' : 'Decline / Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
