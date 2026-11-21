import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, Phone, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';

export default function ProviderBookings() {
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
      setMsg({ error: '', success: 'Booking availability confirmed!' });
      fetchBookings();
    } catch (err) {
      setMsg({ error: err.response?.data?.error || 'Failed to confirm booking.', success: '' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatus = async (id, status) => {
    setActionLoading(id);
    setMsg({ error: '', success: '' });
    try {
      await api.post(`/bookings/${id}/status/`, { status });
      setMsg({ error: '', success: `Status changed to '${status}'.` });
      fetchBookings();
    } catch (err) {
      setMsg({ error: err.response?.data?.error || 'Failed to update status.', success: '' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {lang === 'hi' ? 'बुकिंग प्रबंधन एवं कार्य प्रगति' : 'Provider Bookings & Schedule Management'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'hi'
            ? 'स्वीकृत कोटेशन्स की पुष्टि करें और कार्य प्रगति को अपडेट करें।'
            : 'Confirm farmer bookings with double-booking prevention, and track execution.'}
        </p>
      </div>

      {msg.error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {msg.error}
        </div>
      )}
      {msg.success && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
          {msg.success}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
          <span className="text-xs">Loading bookings...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
          No bookings found.
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {b.category_name}
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900">{b.request_title}</h4>
                <div className="text-xs text-slate-600 flex items-center gap-3">
                  <span>Farmer: <strong>{b.farmer_name}</strong></span>
                  <span>•</span>
                  <span>Phone: {b.farmer_phone || 'Available on confirmation'}</span>
                  <span>•</span>
                  <span>Village: {b.farmer_village}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Scheduled Service Date: <strong className="text-slate-800">{b.scheduled_date}</strong>
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
                    <span>Confirm Availability</span>
                  </button>
                )}

                {b.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatus(b.id, 'in_progress')}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200"
                  >
                    Start Service
                  </button>
                )}

                {b.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatus(b.id, 'completed')}
                    className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Job</span>
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
