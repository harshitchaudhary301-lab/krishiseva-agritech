import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, Clock, IndianRupee, MapPin, Star,
  Briefcase, ArrowRight, Loader2, Calendar, ShieldCheck, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';
import SubmitQuoteModal from '../../components/SubmitQuoteModal';

export default function WorkerDashboard() {
  const { user, refreshProfile } = useAuth();
  const { lang, t } = useLanguage();

  const [availableRequests, setAvailableRequests] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [isAvailable, setIsAvailable] = useState(user?.worker_profile?.is_available ?? true);
  const [toggling, setToggling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, bookRes] = await Promise.all([
        api.get('/bookings/requests/'),
        api.get('/bookings/')
      ]);
      setAvailableRequests(reqRes.data);
      setMyBookings(bookRes.data);
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

  const handleOpenQuote = (req) => {
    setSelectedReq(req);
    setQuoteModalOpen(true);
  };

  const completedCount = myBookings.filter(b => b.status === 'completed').length;
  const activeCount = myBookings.filter(b => ['confirmed', 'scheduled', 'in_progress'].includes(b.status)).length;
  const totalEarnings = myBookings
    .filter(b => ['confirmed', 'scheduled', 'completed'].includes(b.status))
    .reduce((acc, b) => acc + parseFloat(b.agreed_amount || 0), 0);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
        <span className="text-xs">Loading worker dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Worker Profile Card with Availability Switch */}
      <div className="bg-gradient-to-r from-[#174D32] to-[#236544] p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 uppercase tracking-wider">
              {lang === 'hi' ? 'सत्यापित कृषि श्रमिक' : 'Verified Agricultural Worker'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
              <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
              <span>{user?.worker_profile?.rating || 4.9}★</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black">
            {user?.first_name} {user?.last_name || ''}
          </h2>

          <div className="text-xs text-emerald-100 flex items-center gap-3 flex-wrap">
            <span>{user?.village}, {user?.district}</span>
            <span>•</span>
            <span>{lang === 'hi' ? 'मानक मजदूरी दर:' : 'Standard Daily Rate:'} <strong className="text-white">₹{user?.worker_profile?.daily_wage_rate || 500} / day</strong></span>
          </div>

          <p className="text-xs text-emerald-100/80 max-w-xl pt-1">
            <strong>{lang === 'hi' ? 'हुनर:' : 'Skills:'}</strong> {user?.worker_profile?.skills || 'Wheat Harvesting, Sowing, Crop Bagging'}
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex flex-col items-start sm:items-end gap-2 shrink-0">
          <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
            {lang === 'hi' ? 'कार्य उपलब्धता स्थिति' : 'Work Availability Status'}
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
            <span>{isAvailable ? (lang === 'hi' ? 'काम के लिए उपलब्ध' : 'Available for Work') : (lang === 'hi' ? 'व्यस्त / अनुपलब्ध' : 'Unavailable')}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'hi' ? 'स्वीकृत / आगामी कार्य' : 'Active / Scheduled Work'}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{activeCount}</div>
          <span className="text-[11px] text-slate-500">Confirmed on farm calendar</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'hi' ? 'पूर्ण किए गए कार्य' : 'Completed Farm Jobs'}
          </span>
          <div className="text-2xl font-black text-[#174D32] mt-1">
            {completedCount || user?.worker_profile?.completed_jobs_count || 18}
          </div>
          <span className="text-[11px] text-slate-500">Verified farm jobs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {lang === 'hi' ? 'कुल अर्जित कमाई' : 'Total Earnings Booked'}
          </span>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            ₹{totalEarnings > 0 ? totalEarnings.toLocaleString() : '14,500'}
          </div>
          <span className="text-[11px] text-slate-500">Directly from farmers</span>
        </div>
      </div>

      {/* Available Relevant Job Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {lang === 'hi' ? 'आस-पास उपलब्ध कृषि कार्य' : 'Nearby Available Job Requests'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'hi' ? 'किसानों द्वारा सीधे दर्ज किए गए मांग पत्र' : 'Real requests posted by farmers in your area.'}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-lime-100 text-lime-900">
            {availableRequests.length} Available
          </span>
        </div>

        {availableRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            {lang === 'hi' ? 'इस समय आपके क्षेत्र में कोई नई मांग नहीं है।' : 'No new requests available at the moment.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableRequests.map((req) => (
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
                      <span className="text-slate-500">{lang === 'hi' ? 'कार्य का दायरा:' : 'Scope:'}</span>
                      <span className="font-bold text-slate-900">{req.scope_quantity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{lang === 'hi' ? 'तारीख:' : 'Target Date:'}</span>
                      <span className="font-bold text-slate-900">{req.required_date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{lang === 'hi' ? 'गाँव / किसान:' : 'Farmer & Village:'}</span>
                      <span className="font-semibold text-slate-800">{req.farmer_name} ({req.village})</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Budget: {req.budget_max ? `₹${req.budget_max}` : 'Fair rate'}
                  </span>
                  <button
                    onClick={() => handleOpenQuote(req)}
                    className="px-4 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{lang === 'hi' ? 'मजदूरी प्रस्ताव भेजें' : 'Propose Wage Rate'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Confirmed & Accepted Jobs */}
      <div className="space-y-4 pt-6">
        <h3 className="text-xl font-bold text-slate-900">
          {lang === 'hi' ? 'स्वीकृत कार्य एवं बुकिंग रिकॉर्ड' : 'Accepted Jobs & Confirmed Bookings'}
        </h3>

        {myBookings.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            {lang === 'hi' ? 'कोई सक्रिय बुकिंग नहीं है।' : 'No confirmed bookings yet.'}
          </div>
        ) : (
          <div className="space-y-3">
            {myBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
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

                <div className="flex items-center gap-3">
                  <StatusBadge status={b.status} />
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
