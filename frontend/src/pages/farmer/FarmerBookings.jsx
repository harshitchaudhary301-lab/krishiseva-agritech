import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, Calendar, MapPin, Phone, AlertTriangle,
  XCircle, ArrowRight, ShieldAlert, Loader2, Sparkles, History
} from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';
import BackupProvidersModal from '../../components/BackupProvidersModal';
import ReviewModal from '../../components/ReviewModal';

export default function FarmerBookings() {
  const { lang, t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBackupBookingId, setSelectedBackupBookingId] = useState(null);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState({});

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

  const handleCancelBooking = async (bookingId) => {
    if (!cancelReason) {
      alert(lang === 'hi' ? 'कृपया रद्द करने का कारण दर्ज करें।' : 'Please enter a cancellation reason.');
      return;
    }
    setCancellingId(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/cancel/`, { reason: cancelReason });
      setShowCancelPrompt(null);
      setCancelReason('');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmCompletion = async (bookingId, isApproved) => {
    let reason = '';
    if (!isApproved) {
      reason = window.prompt(lang === 'hi' ? 'आपत्ति / विवाद का कारण दर्ज करें:' : 'Please enter reason for dispute:');
      if (!reason) return;
    }
    try {
      await api.post(`/bookings/${bookingId}/confirm-completion/`, {
        approved: isApproved,
        reason: reason
      });
      alert(isApproved ? (lang === 'hi' ? 'सेवा पूर्णता स्वीकृत! धन्यवाद।' : 'Service completion approved!') : (lang === 'hi' ? 'आपत्ति दर्ज की गई।' : 'Dispute recorded.'));
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record completion decision.');
    }
  };

  const openBackupModal = (bookingId) => {
    setSelectedBackupBookingId(bookingId);
    setBackupModalOpen(true);
  };

  const toggleEvents = (id) => {
    setExpandedEvents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['confirmed', 'scheduled', 'in_progress', 'pending_confirmation'].includes(b.status);
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'cancelled') return b.status.startsWith('cancelled');
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {lang === 'hi' ? 'मेरी बुकिंग्स' : 'My Bookings & Farm Services'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'hi'
              ? 'सत्यापित बुकिंग्स का लाइव स्टेटस, शेड्यूल और रद्द होने पर बैकअप प्रदाता सुविधा।'
              : 'Confirmed service bookings with atomic double-booking protection and instant backup provider routing.'}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 text-xs font-bold">
          {['all', 'active', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl capitalize transition cursor-pointer ${
                filter === tab
                  ? 'bg-[#174D32] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
          <span className="text-xs">Loading bookings...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">
            {lang === 'hi' ? 'कोई बुकिंग नहीं मिली' : 'No bookings found in this view'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {lang === 'hi'
              ? 'जब आप किसी सेवा अनुरोध के लिए कोटेशन स्वीकार करेंगे और प्रदाता सहमति देंगे, तो बुकिंग यहाँ दिखाई देगी।'
              : 'Accept a quotation from your service requests to establish confirmed bookings.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((b) => {
            const isCancelled = b.status.startsWith('cancelled');
            const canCancel = ['pending_confirmation', 'confirmed', 'scheduled'].includes(b.status);

            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#84B547] transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 tracking-wide">{b.reference_id}</span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {b.category_name}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 mt-1">
                        {b.request_title}
                      </h4>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  {/* Provider & Pricing details */}
                  <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-amber-200/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">{lang === 'hi' ? 'प्रदाता / कारीगर:' : 'Service Provider:'}</span>
                      <span className="font-bold text-slate-900">{b.provider_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">{lang === 'hi' ? 'संपर्क:' : 'Phone:'}</span>
                      <span className="font-semibold text-slate-800">{b.provider_phone || 'Protected'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">{lang === 'hi' ? 'तय राशि:' : 'Agreed Amount:'}</span>
                      <span className="font-black text-base text-[#174D32]">₹{b.agreed_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">{lang === 'hi' ? 'निर्धारित तारीख:' : 'Scheduled Date:'}</span>
                      <span className="font-bold text-slate-900">{b.scheduled_date}</span>
                    </div>
                  </div>

                  {b.cancellation_reason && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200">
                      <strong>{lang === 'hi' ? 'रद्द करने का कारण:' : 'Cancellation Reason:'}</strong> {b.cancellation_reason}
                    </div>
                  )}

                  {/* Audit trail toggle */}
                  {b.events?.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleEvents(b.id)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>{expandedEvents[b.id] ? 'Hide Audit Trail' : `View Status History (${b.events.length} events)`}</span>
                      </button>

                      {expandedEvents[b.id] && (
                        <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5">
                          {b.events.map((ev) => (
                            <div key={ev.id} className="flex items-start justify-between text-slate-600">
                              <span><strong>{ev.action}</strong> {ev.notes && `— ${ev.notes}`}</span>
                              <span className="text-slate-400 shrink-0 ml-2">
                                {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  {isCancelled ? (
                    <button
                      onClick={() => openBackupModal(b.id)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold hover:from-amber-700 hover:to-amber-800 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#E8B44C]" />
                      <span>{lang === 'hi' ? 'बैकअप प्रदाता खोजें' : 'Find Backup Providers'}</span>
                    </button>
                  ) : canCancel ? (
                    showCancelPrompt === b.id ? (
                      <div className="w-full space-y-2">
                        <input
                          type="text"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder={lang === 'hi' ? 'रद्द करने का कारण...' : 'Reason for cancellation...'}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-red-300 outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            disabled={cancellingId === b.id}
                            className="flex-1 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                          >
                            {cancellingId === b.id ? 'Cancelling...' : 'Confirm Cancel'}
                          </button>
                          <button
                            onClick={() => setShowCancelPrompt(null)}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-700"
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCancelPrompt(b.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                      >
                        {lang === 'hi' ? 'बुकिंग रद्द करें' : 'Cancel Booking'}
                      </button>
                    )
                  ) : b.status === 'completion_pending' ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleConfirmCompletion(b.id, true)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'कार्य स्वीकृत करें' : 'Approve Completion'}</span>
                      </button>
                      <button
                        onClick={() => handleConfirmCompletion(b.id, false)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                      >
                        <span>{lang === 'hi' ? 'आपत्ति दर्ज करें' : 'Dispute'}</span>
                      </button>
                    </div>
                  ) : b.status === 'completed' ? (
                    <button
                      onClick={() => {
                        setSelectedReviewBooking(b);
                        setReviewModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>★ {lang === 'hi' ? 'समीक्षा व रेटिंग दें' : 'Rate & Review'}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      Booking finalized
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBackupBookingId && (
        <BackupProvidersModal
          isOpen={backupModalOpen}
          onClose={() => setBackupModalOpen(false)}
          bookingId={selectedBackupBookingId}
        />
      )}

      {selectedReviewBooking && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          booking={selectedReviewBooking}
          onReviewed={() => fetchBookings()}
        />
      )}
    </div>
  );
}
