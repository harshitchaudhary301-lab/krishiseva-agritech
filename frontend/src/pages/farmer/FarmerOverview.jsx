import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Tractor, Users, Wrench, Droplet, Plus, ArrowRight,
  FolderKanban, Calendar, Clock, CheckCircle2, AlertTriangle,
  MapPin, Loader2, IndianRupee, CloudSun, Droplets, Wind, BarChart3
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';
import CreateRequestModal from '../../components/CreateRequestModal';

export default function FarmerOverview() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [farms, setFarms] = useState([]);
  const [weather, setWeather] = useState(null);
  const [createReqOpen, setCreateReqOpen] = useState(false);
  const [preselectedSlug, setPreselectedSlug] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, bookRes, projRes, farmRes, weatherRes] = await Promise.all([
        api.get('/bookings/requests/'),
        api.get('/bookings/'),
        api.get('/farm-projects/projects/'),
        api.get('/farm-projects/farms/'),
        api.get(`/services/weather/?district=${user?.district || 'Meerut'}`).catch(() => ({ data: null }))
      ]);
      setRequests(reqRes.data);
      setBookings(bookRes.data);
      setProjects(projRes.data);
      setFarms(farmRes.data);
      if (weatherRes?.data) setWeather(weatherRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openReqForCategory = (slug) => {
    setPreselectedSlug(slug);
    setCreateReqOpen(true);
  };

  const openRequestsCount = requests.filter(r => r.status === 'open' || r.status === 'quote_accepted').length;
  const confirmedBookingsCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'scheduled').length;
  const activeProjectsCount = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
        <span className="text-xs font-semibold text-slate-500">
          {lang === 'hi' ? 'डैशबोर्ड लोड हो रहा है...' : 'Loading farm dashboard...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#174D32] to-[#236544] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold text-emerald-100">
              <MapPin className="w-3.5 h-3.5 text-[#84B547]" />
              <span>{user?.village || 'Daurala'}, {user?.district || 'Meerut'}</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black">
              {lang === 'hi' ? `राम-राम, ${user?.first_name || 'किसान भाई'}!` : `Welcome, ${user?.first_name || 'Farmer'}!`}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              {lang === 'hi'
                ? 'खेती की हर जरूरत, एक जगह। अपनी फसलों के लिए कुशल श्रमिक, यंत्र व मैकेनिक सीधे यहाँ से जोड़ें।'
                : 'The Farm Operations Coordination Platform. Manage labour, machinery, and repairs under synchronized farm projects.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setPreselectedSlug(null);
                setCreateReqOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#84B547] hover:bg-[#74a03c] text-white text-xs font-bold transition shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'hi' ? 'नया सेवा अनुरोध' : 'New Service Request'}</span>
            </button>
            <Link
              to="/farmer/projects"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition shrink-0"
            >
              <FolderKanban className="w-4 h-4 text-[#E8B44C]" />
              <span>{lang === 'hi' ? 'फार्म प्रोजेक्ट' : 'Farm Project'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Weather Intelligence Card (Module 05) */}
      {weather && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F1E6] flex items-center justify-center text-[#174D32] shrink-0">
              <CloudSun className="w-6 h-6 text-[#84B547]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-800">
                  {weather.current?.temperature_c}°C
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {lang === 'hi' ? weather.current?.condition_hi : weather.current?.condition_en}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded-full">
                  {weather.is_live ? (lang === 'hi' ? 'लाइव मौसम' : 'Live Data') : (lang === 'hi' ? 'मौसमी मानक' : 'Seasonal Benchmark')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  {weather.current?.humidity_percent}% {lang === 'hi' ? 'नमी' : 'Humidity'}
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-slate-400" />
                  {weather.current?.wind_speed_kmh} km/h
                </span>
                <span>{weather.location?.district || 'Meerut'}</span>
              </div>
            </div>
          </div>

          <div className="md:max-w-md bg-emerald-50/60 border border-emerald-100/80 rounded-2xl p-3.5 text-xs text-emerald-950">
            <span className="font-bold text-[#174D32] block mb-0.5">
              {lang === 'hi' ? '🌾 कृषि-मौसम सलाह:' : '🌾 Agro-Advisory:'}
            </span>
            <p className="text-[11px] leading-relaxed text-emerald-900">
              {lang === 'hi' ? weather.agro_advisory_hi : weather.agro_advisory_en}
            </p>
            <div className="mt-1 text-[9px] text-slate-400 flex items-center justify-between">
              <span>{weather.attribution}</span>
              <span>{weather.booking_policy}</span>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Requests */}
        <Link
          to="/farmer/requests"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#84B547] transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>{lang === 'hi' ? 'सक्रिय मांगें' : 'Active Requests'}</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{openRequestsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{lang === 'hi' ? 'कोटेशन की समीक्षा करें' : 'Awaiting quotes'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#174D32] transition" />
          </div>
        </Link>

        {/* Confirmed Bookings */}
        <Link
          to="/farmer/bookings"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#84B547] transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>{lang === 'hi' ? 'पक्की बुकिंग्स' : 'Confirmed Bookings'}</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{confirmedBookingsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{lang === 'hi' ? 'शेड्यूल व स्टेटस देखें' : 'View schedules'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#174D32] transition" />
          </div>
        </Link>

        {/* Farm Projects */}
        <Link
          to="/farmer/projects"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#84B547] transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>{lang === 'hi' ? 'फार्म प्रोजेक्ट्स' : 'Farm Projects'}</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{activeProjectsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{lang === 'hi' ? 'समन्वय एवं बजट' : 'Complete task manager'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#174D32] transition" />
          </div>
        </Link>

        {/* Land Registered */}
        <Link
          to="/farmer/farms"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#84B547] transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>{lang === 'hi' ? 'पंजीकृत खेत' : 'Registered Land'}</span>
            <span className="p-2 rounded-xl bg-lime-50 text-lime-700 group-hover:scale-105 transition-transform">
              <Tractor className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {farms.reduce((acc, f) => acc + parseFloat(f.size_acres || 0), 0) || user?.farmer_profile?.total_land_acres || 20}{' '}
            <span className="text-sm font-semibold text-slate-600">Acres</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{farms.length} {lang === 'hi' ? 'खेत जुड़े हैं' : 'plots saved'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#174D32] transition" />
          </div>
        </Link>
      </div>

      {/* Farm Project Manager Showcase (Wheat Harvesting 2026) */}
      {projects.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider mb-1">
                ⭐ {lang === 'hi' ? 'कोर डिफरेंटिएटर — फार्म टास्क मैनेजमेंट' : 'Core Differentiator — Farm Task Management'}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {projects[0].name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {projects[0].crop} • {projects[0].target_area_acres} Acres • {projects[0].farm_name || 'Ganga Khet'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={projects[0].status} />
              <Link
                to={`/farmer/projects/${projects[0].id}`}
                className="px-4 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>{lang === 'hi' ? 'प्रोजेक्ट प्रबंधित करें' : 'Manage Project'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Progress & Costs */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700">
                    {lang === 'hi' ? 'समग्र प्रोजेक्ट प्रगति:' : 'Overall Project Progress:'}
                  </span>
                  <span className="font-black text-[#174D32]">
                    {projects[0].completion_percentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-[#84B547] to-[#174D32] h-full rounded-full transition-all duration-500"
                    style={{ width: `${projects[0].completion_percentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#FAF8F2] border border-amber-200/60">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    {lang === 'hi' ? 'अनुमानित बजट' : 'Estimated Budget'}
                  </span>
                  <span className="text-base font-black text-slate-900">
                    ₹{projects[0].estimated_budget?.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    {lang === 'hi' ? 'पक्का खर्च (बुक किया गया)' : 'Committed Cost'}
                  </span>
                  <span className="text-base font-black text-[#174D32]">
                    ₹{projects[0].actual_cost?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Linked Services Task List */}
            <div className="lg:col-span-7 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                {lang === 'hi' ? 'प्रोजेक्ट के अंतर्गत समन्वित सेवाएं:' : 'Synchronized Operations in Project:'}
              </span>
              {projects[0].project_services?.map((ps) => (
                <div
                  key={ps.id}
                  className="p-3 bg-[#F7F9F5] rounded-xl border border-slate-200 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#84B547]" />
                    <div>
                      <span className="font-bold text-slate-900">{ps.category_details?.name_en}</span>
                      <span className="text-slate-500 ml-2">({ps.scope_description})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      {ps.agreed_cost > 0 ? `₹${ps.agreed_cost.toLocaleString()}` : 'Quoting'}
                    </span>
                    <StatusBadge status={ps.booking_status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Booking Shortcuts for 4 Live MVP Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {lang === 'hi' ? 'तुरंत सेवा अनुरोध दर्ज करें' : 'Quick Operations Booking'}
          </h3>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {lang === 'hi' ? '4 श्रेणियां सक्रिय हैं' : '4 Categories Live in MVP'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Labour */}
          <button
            onClick={() => openReqForCategory('labour')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#84B547] text-left transition shadow-xs hover:shadow-md cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="p-3 rounded-xl bg-lime-50 text-lime-800 group-hover:bg-[#84B547] group-hover:text-white transition">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                {lang === 'hi' ? 'कृषि श्रमिक' : 'Agricultural Labour'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {lang === 'hi' ? 'कटाई, भराई व बुवाई' : 'Harvesting & bagging teams'}
              </div>
            </div>
          </button>

          {/* Mechanic */}
          <button
            onClick={() => openReqForCategory('tractor_mechanic')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#84B547] text-left transition shadow-xs hover:shadow-md cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 group-hover:bg-[#E8B44C] group-hover:text-slate-950 transition">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                {lang === 'hi' ? 'ट्रैक्टर मैकेनिक' : 'Tractor Mechanic'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {lang === 'hi' ? 'खेत पर आपातकालीन मरम्मत' : 'On-farm emergency repair'}
              </div>
            </div>
          </button>

          {/* Tubewell */}
          <button
            onClick={() => openReqForCategory('tubewell_repair')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#84B547] text-left transition shadow-xs hover:shadow-md cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="p-3 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-600 group-hover:text-white transition">
              <Droplet className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                {lang === 'hi' ? 'ट्यूबवेल मरम्मत' : 'Tubewell Repair'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {lang === 'hi' ? 'मोटर वाइंडिंग व पंप' : 'Motor winding & starters'}
              </div>
            </div>
          </button>

          {/* Machinery */}
          <button
            onClick={() => openReqForCategory('machinery_rental')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#84B547] text-left transition shadow-xs hover:shadow-md cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="p-3 rounded-xl bg-sky-50 text-sky-800 group-hover:bg-[#174D32] group-hover:text-white transition">
              <Tractor className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                {lang === 'hi' ? 'कृषि यंत्र किराया' : 'Machinery Rental'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {lang === 'hi' ? 'कंबाइन व लैंड लेवलर' : 'Harvester, rotavator, trolley'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Two Column: Recent Requests & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Requests */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900">
              {lang === 'hi' ? 'हालिया सेवा मांगें' : 'Recent Service Requests'}
            </h3>
            <Link to="/farmer/requests" className="text-xs font-bold text-[#174D32] hover:underline">
              {lang === 'hi' ? 'सभी देखें' : 'View all'}
            </Link>
          </div>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                {lang === 'hi' ? 'कोई सक्रिय मांग नहीं है।' : 'No service requests yet.'}
              </div>
            ) : (
              requests.slice(0, 3).map((req) => (
                <Link
                  key={req.id}
                  to={`/farmer/requests/${req.id}`}
                  className="p-3.5 rounded-2xl bg-[#F7F9F5] border border-slate-200 hover:border-[#84B547] block transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{req.title}</h4>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {req.category_details?.name_en} • {req.scope_quantity}
                      </div>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                    <span>
                      {lang === 'hi' ? `${req.quotations_count || 0} कोटेशन प्राप्त` : `${req.quotations_count || 0} quotes received`}
                    </span>
                    <span className="font-semibold text-slate-700">Target: {req.required_date}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900">
              {lang === 'hi' ? 'सत्यापित बुकिंग्स' : 'Confirmed Bookings'}
            </h3>
            <Link to="/farmer/bookings" className="text-xs font-bold text-[#174D32] hover:underline">
              {lang === 'hi' ? 'सभी देखें' : 'View all'}
            </Link>
          </div>

          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                {lang === 'hi' ? 'कोई सक्रिय बुकिंग नहीं है।' : 'No confirmed bookings yet.'}
              </div>
            ) : (
              bookings.slice(0, 3).map((book) => (
                <div
                  key={book.id}
                  className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-amber-200/60 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{book.reference_id}</span>
                      <span className="text-xs text-emerald-800 font-bold">₹{book.agreed_amount?.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {book.category_name} • {book.provider_name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Date: {book.scheduled_date}
                    </div>
                  </div>
                  <StatusBadge status={book.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CreateRequestModal
        isOpen={createReqOpen}
        onClose={() => setCreateReqOpen(false)}
        defaultCategorySlug={preselectedSlug}
        onCreated={() => fetchData()}
      />
    </div>
  );
}
