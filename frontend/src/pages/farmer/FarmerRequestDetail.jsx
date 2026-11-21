import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, MapPin, IndianRupee, Star, ShieldCheck,
  CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles, Loader2, Phone
} from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';

export default function FarmerRequestDetail() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [requestItem, setRequestItem] = useState(null);
  const [matchingProviders, setMatchingProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/bookings/requests/${id}/`);
      setRequestItem(res.data);

      // Fetch matching providers recommendations
      try {
        const matchRes = await api.get(`/matching/providers/?request_id=${id}`);
        setMatchingProviders(matchRes.data.matches || []);
      } catch (err) {
        // Optional
      }
    } catch (err) {
      console.error(err);
      setFeedback({ error: 'Failed to load request details.', success: '' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const handleAcceptQuote = async (quoteId) => {
    setActionLoading(quoteId);
    setFeedback({ error: '', success: '' });

    try {
      const res = await api.post(`/bookings/quotations/${quoteId}/accept/`);
      setFeedback({
        error: '',
        success: lang === 'hi'
          ? 'कोटेशन स्वीकृत! बुकिंग प्रदाता पुष्टि की प्रतीक्षा में दर्ज हो गई है।'
          : 'Quotation accepted! Booking is now awaiting provider confirmation.'
      });
      fetchRequestDetails();
    } catch (err) {
      console.error(err);
      setFeedback({
        error: err.response?.data?.error || 'Failed to accept quotation.',
        success: ''
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm(lang === 'hi' ? 'क्या आप इस अनुरोध को रद्द करना चाहते हैं?' : 'Are you sure you want to cancel this request?')) {
      return;
    }
    setActionLoading('cancel');
    try {
      await api.post(`/bookings/requests/${id}/cancel/`);
      setFeedback({
        error: '',
        success: lang === 'hi' ? 'अनुरोध सफलतापूर्वक रद्द कर दिया गया।' : 'Request cancelled successfully.'
      });
      fetchRequestDetails();
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Failed to cancel request.', success: '' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
        <span className="text-xs">Loading request details...</span>
      </div>
    );
  }

  if (!requestItem) {
    return (
      <div className="p-8 text-center text-sm text-slate-600">
        Request not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/farmer/requests"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#174D32] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'सभी मांगों पर वापस जाएं' : 'Back to requests'}</span>
        </Link>
      </div>

      {feedback.error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{feedback.error}</span>
        </div>
      )}

      {feedback.success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback.success}</span>
        </div>
      )}

      {/* Main Request Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase text-slate-400">
                REQ-{requestItem.id} • {requestItem.category_details?.name_en}
              </span>
              {requestItem.farm_project && (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Project: {requestItem.project_name}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {requestItem.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={requestItem.status} />
            {requestItem.status === 'open' && (
              <button
                onClick={handleCancelRequest}
                disabled={actionLoading === 'cancel'}
                className="px-3.5 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition cursor-pointer"
              >
                {lang === 'hi' ? 'अनुरोध रद्द करें' : 'Cancel Request'}
              </button>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF8F2] border border-amber-200/60 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block uppercase text-[10px]">{lang === 'hi' ? 'कार्य का दायरा' : 'Scope of Work'}</span>
            <span className="font-bold text-slate-900 text-sm">{requestItem.scope_quantity}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block uppercase text-[10px]">{lang === 'hi' ? 'आवश्यक तारीख' : 'Required Date'}</span>
            <span className="font-bold text-slate-900 text-sm">{requestItem.required_date}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block uppercase text-[10px]">{lang === 'hi' ? 'स्थान' : 'Location'}</span>
            <span className="font-bold text-slate-900 text-sm">{requestItem.village}, {requestItem.district}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block uppercase text-[10px]">{lang === 'hi' ? 'अनुमानित बजट' : 'Estimated Budget'}</span>
            <span className="font-bold text-emerald-800 text-sm">
              {requestItem.budget_max ? `₹${requestItem.budget_max}` : 'Competitive'}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            {lang === 'hi' ? 'विवरण' : 'Description'}
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            {requestItem.description}
          </p>
        </div>
      </div>

      {/* Received Quotations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900">
              {lang === 'hi' ? 'प्राप्त कोटेशन्स' : 'Received Quotations'}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
              {requestItem.quotations?.length || 0}
            </span>
          </div>
          {requestItem.status === 'open' && (
            <span className="text-xs font-medium text-slate-500">
              {lang === 'hi' ? 'कोटेशन चुनकर सहमति की पुष्टि करवाएं' : 'Compare proposals & choose preferred provider'}
            </span>
          )}
        </div>

        {requestItem.quotations?.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            {lang === 'hi'
              ? 'अभी तक कोई कोटेशन प्राप्त नहीं हुआ है। नजदीकी प्रदाताओं को अनुरोध भेजा गया है।'
              : 'No quotations received yet. Matching nearby providers have been notified.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requestItem.quotations.map((q) => {
              const isAccepted = q.status === 'accepted';
              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-3xl p-6 border transition flex flex-col justify-between shadow-xs ${
                    isAccepted
                      ? 'border-[#84B547] ring-2 ring-[#84B547] bg-emerald-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-slate-900">{q.provider_name}</h4>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{q.provider_rating}★</span>
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {q.provider_village} • {q.provider_completed_jobs} jobs completed
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-black text-[#174D32]">
                          ₹{q.quote_amount?.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Proposed Price</span>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-700 block">
                        {lang === 'hi' ? 'दर व खर्च का विवरण:' : 'Breakdown:'}
                      </span>
                      <p className="text-slate-600">{q.price_breakdown || 'Standard flat rate quoted'}</p>
                    </div>

                    {/* Notes */}
                    {q.notes && (
                      <p className="text-xs text-slate-600 italic">
                        "{q.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>Schedule: {q.proposed_schedule}</span>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>

                  {/* Accept Action */}
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    {isAccepted ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'hi' ? 'स्वीकृत (बुकिंग प्रक्रियाधीन)' : 'Accepted (Booking Pending Confirmation)'}</span>
                      </div>
                    ) : requestItem.status === 'open' ? (
                      <button
                        onClick={() => handleAcceptQuote(q.id)}
                        disabled={actionLoading !== null}
                        className="w-full py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === q.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-[#84B547]" />
                            <span>{lang === 'hi' ? 'यह कोटेशन स्वीकार करें' : 'Accept This Quotation'}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="text-center text-xs text-slate-400 font-semibold py-1">
                        Request not open for selection
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Smart Rule Matching Section */}
      {matchingProviders.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E8B44C]" />
              <h3 className="font-bold text-base text-slate-900">
                {lang === 'hi' ? 'स्मार्ट मैचिंग इंजन — पात्र प्रदाता' : 'Smart Rule Matching Engine Recommendations'}
              </h3>
            </div>
            <span className="text-xs text-emerald-800 font-semibold">
              {matchingProviders.length} Eligible Providers Ranked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchingProviders.map((m) => (
              <div
                key={m.provider_id}
                className="p-4 rounded-2xl bg-[#FAF8F2] border border-amber-200/60 text-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                    <span className="font-black text-[#174D32]">{m.match_score} pts</span>
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    {m.village}, {m.district} • {m.rating}★
                  </div>
                  <div className="mt-2 space-y-1">
                    {m.match_reasons.map((r, idx) => (
                      <div key={idx} className="text-[11px] text-slate-600 flex items-center gap-1">
                        <span className="text-[#84B547]">✓</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
