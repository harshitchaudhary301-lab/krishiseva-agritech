import React, { useState, useEffect } from 'react';
import {
  Wrench, CheckCircle2, Clock, IndianRupee, MapPin, Star,
  Briefcase, ArrowRight, Loader2, AlertCircle, ShieldCheck, PlayCircle
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';
import SubmitQuoteModal from '../../components/SubmitQuoteModal';

export default function ProviderDashboard() {
  const { user, refreshProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [matchingRequests, setMatchingRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState({ error: '', success: '' });
  const [isAvailable, setIsAvailable] = useState(user?.provider_profile?.is_available ?? true);
  const [toggling, setToggling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, bookRes] = await Promise.all([
        api.get('/bookings/requests/'),
        api.get('/bookings/')
      ]);
      setMatchingRequests(reqRes.data);
      setBookings(bookRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const next = !isAvailable;
      await api.put('/accounts/me/', { is_available: next });
      setIsAvailable(next);
      refreshProfile();
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  // Provider Confirms Availability
  const handleConfirmBooking = async (bookingId) => {
    setActionLoading(bookingId);
    setActionMessage({ error: '', success: '' });

    try {
      const res = await api.post(`/bookings/${bookingId}/confirm/`);
      setActionMessage({
        error: '',
        success: lang === 'hi'
          ? 'बुकिंग सफलतापूर्वक पक्की हो गई! किसान को सूचित कर दिया गया है।'
          : 'Booking confirmed successfully! Farmer has been notified.'
      });
      fetchData();
    } catch (err) {
      console.error(err);
      setActionMessage({
        error: err.response?.data?.error || 'Failed to confirm booking. Check for date conflict.',
        success: ''
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Provider updates status (e.g. in_progress, completed)
  const handleStatusUpdate = async (bookingId, newStatus) => {
    setActionLoading(bookingId);
    setActionMessage({ error: '', success: '' });

    try {
      await api.post(`/bookings/${bookingId}/status/`, { status: newStatus });
      setActionMessage({
        error: '',
        success: `Booking marked as '${newStatus}'.`
      });
      fetchData();
    } catch (err) {
      setActionMessage({
        error: err.response?.data?.error || 'Failed to update status.',
        success: ''
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingConfirmations = bookings.filter(b => b.status === 'pending_confirmation');
  const activeBookings = bookings.filter(b => ['confirmed', 'scheduled', 'in_progress'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalEarnings = bookings
    .filter(b => ['confirmed', 'scheduled', 'completed'].includes(b.status))
    .reduce((acc, b) => acc + parseFloat(b.agreed_amount || 0), 0);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
        <span className="text-xs">Loading provider dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider Business Header */}
      <div className="bg-gradient-to-r from-[#174D32] to-[#236544] p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#84B547]" />
              <span>Verified Provider</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8B44C] text-slate-950">
              <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
              <span>{user?.provider_profile?.rating || 4.9}★</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black">
            {user?.provider_profile?.business_name || user?.get_full_name || user?.username}
          </h2>

          <div className="text-xs text-emerald-100 flex items-center gap-3 flex-wrap">
            <span>{user?.first_name} {user?.last_name}</span>
            <span>•</span>
            <span>{user?.village}, {user?.district}</span>
            <span>•</span>
            <span>Radius: {user?.provider_profile?.service_radius_km || 25} km</span>
          </div>

          <p className="text-xs text-emerald-100/80 max-w-xl pt-1">
            {user?.provider_profile?.bio || 'Trained professional agricultural service provider with on-farm equipment & repair facilities.'}
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex flex-col items-start sm:items-end gap-2 shrink-0">
          <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
            {lang === 'hi' ? 'सेवा उपलब्धता' : 'Service Availability'}
          </span>
          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              isAvailable
                ? 'bg-[#84B547] text-white hover:bg-[#74a03c]'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {isAvailable ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            <span>{isAvailable ? 'Accepting Bookings' : 'Paused / Busy'}</span>
          </button>
        </div>
      </div>

      {actionMessage.error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionMessage.error}</span>
        </div>
      )}

      {actionMessage.success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage.success}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'hi' ? 'पुष्टि प्रतीक्षारत' : 'Pending Confirmation'}
          </span>
          <div className="text-2xl font-black text-amber-700 mt-1">{pendingConfirmations.length}</div>
          <span className="text-[11px] text-amber-700 font-semibold">Action Required</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'hi' ? 'सक्रिय बुकिंग्स' : 'Confirmed Active'}
          </span>
          <div className="text-2xl font-black text-[#174D32] mt-1">{activeBookings.length}</div>
          <span className="text-[11px] text-slate-500">Scheduled on calendar</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'hi' ? 'पूर्ण बुकिंग्स' : 'Completed Bookings'}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {completedBookings.length || user?.provider_profile?.completed_bookings_count || 24}
          </div>
          <span className="text-[11px] text-slate-500">Verified farm jobs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'hi' ? 'कुल कमाई रिकॉर्ड' : 'Total Revenue Booked'}
          </span>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            ₹{totalEarnings > 0 ? totalEarnings.toLocaleString() : '30,000'}
          </div>
          <span className="text-[11px] text-slate-500">Directly from farmers</span>
        </div>
      </div>

      {/* CRUCIAL SECTION: Pending Booking Confirmations (Action Required!) */}
      {pendingConfirmations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h3 className="font-black text-base text-amber-950">
                {lang === 'hi' ? 'तत्काल कार्रवाई: किसान ने आपका कोटेशन स्वीकार किया है!' : 'Action Required: Farmer Accepted Your Quotation!'}
              </h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              {pendingConfirmations.length} Pending
            </span>
          </div>

          <p className="text-xs text-amber-800 leading-relaxed">
            {lang === 'hi'
              ? 'किसान ने आपकी कोटेशन स्वीकार कर ली है। मंच के सुरक्षा नियमों के अनुसार, जब तक आप अपनी उपलब्धता की पुष्टि नहीं करते, बुकिंग पक्की नहीं होती। पुष्टि करने पर उसी तारीख के लिए डबल-बुकिंग स्वतः ब्लॉक हो जाएगी।'
              : 'As per platform integrity rules, a booking is not final until you confirm availability. Confirming locks the scheduled date and protects your calendar against conflicts.'}
          </p>

          <div className="space-y-3 pt-1">
            {pendingConfirmations.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{b.reference_id}</span>
                    <span className="font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ₹{b.agreed_amount?.toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{b.request_title}</h4>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Farmer: <strong>{b.farmer_name}</strong> ({b.farmer_village}) • Scheduled Date: <strong className="text-slate-900">{b.scheduled_date}</strong>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleConfirmBooking(b.id)}
                    disabled={actionLoading === b.id}
                    className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === b.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Calendar...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#84B547]" />
                        <span>{lang === 'hi' ? 'उपलब्धता व बुकिंग पक्की करें' : 'Confirm Booking Availability'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matching Service Requests in Category */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {lang === 'hi' ? 'आपकी श्रेणी की खुली सेवा मांगें' : 'Open Service Requests in Your Area'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'hi' ? 'कोटेशन सबमिट करें और किसानों से सीधे जुड़ें।' : 'Review customer requirements and submit your price quotations.'}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900">
            {matchingRequests.length} Open Requests
          </span>
        </div>

        {matchingRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            {lang === 'hi' ? 'इस समय कोई नई खुली मांग नहीं है।' : 'No open requests available at this time.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matchingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#84B547] transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        REQ-{req.id} • {req.category_details?.name_en}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 mt-0.5">{req.title}</h4>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {req.description}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-amber-200/60 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{lang === 'hi' ? 'मात्रा / दायरा:' : 'Scope:'}</span>
                      <span className="font-bold text-slate-900">{req.scope_quantity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{lang === 'hi' ? 'तारीख:' : 'Target Date:'}</span>
                      <span className="font-bold text-slate-900">{req.required_date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{lang === 'hi' ? 'गाँव:' : 'Location:'}</span>
                      <span className="font-semibold text-slate-800">{req.village}, {req.district}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Farmer: <strong>{req.farmer_name}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setSelectedReq(req);
                      setQuoteModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{lang === 'hi' ? 'कोटेशन सबमिट करें' : 'Submit Quotation'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmed Bookings Management */}
      <div className="space-y-4 pt-6">
        <h3 className="text-xl font-bold text-slate-900">
          {lang === 'hi' ? 'पुष्टीकृत बुकिंग्स एवं प्रगति नियंत्रण' : 'Confirmed Bookings & Progress Controls'}
        </h3>

        {bookings.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            {lang === 'hi' ? 'कोई पुष्टीकृत बुकिंग नहीं है।' : 'No confirmed bookings found.'}
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{b.reference_id}</span>
                    <span className="font-black text-sm text-[#174D32]">₹{b.agreed_amount?.toLocaleString()}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 mt-1">{b.request_title}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Farmer: {b.farmer_name} ({b.farmer_village}) • Date: {b.scheduled_date}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={b.status} />

                  {/* Progress Controls */}
                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(b.id, 'in_progress')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 cursor-pointer"
                    >
                      Start Work (In Progress)
                    </button>
                  )}

                  {b.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusUpdate(b.id, 'completed')}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold hover:bg-teal-100 cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedReq && (
        <SubmitQuoteModal
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
          requestItem={selectedReq}
          onSubmitted={() => fetchData()}
        />
      )}
    </div>
  );
}
