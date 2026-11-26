import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Tractor, Users, Wrench, Droplet, Plus, ArrowRight,
  FolderKanban, Calendar, Clock, CheckCircle2, AlertTriangle,
  MapPin, Loader2, IndianRupee, CloudSun, Droplets, Wind,
  BarChart3, Sprout, ChevronRight, Layers, ShieldCheck,
  Check, ArrowUpRight, Sparkles, AlertCircle
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [weather, setWeather] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [createReqOpen, setCreateReqOpen] = useState(false);
  const [preselectedSlug, setPreselectedSlug] = useState(null);

  // Preserve category & trigger request modal from navigation
  useEffect(() => {
    const reqCat = searchParams.get('requestCategory');
    if (reqCat) {
      setPreselectedSlug(reqCat);
      setCreateReqOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('requestCategory');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, bookRes, projRes, farmRes, weatherRes, analyticsRes] = await Promise.all([
        api.get('/bookings/requests/'),
        api.get('/bookings/'),
        api.get('/farm-projects/projects/'),
        api.get('/farm-projects/farms/'),
        api.get(`/services/weather/?district=${user?.district || 'Meerut'}`).catch(() => ({ data: null })),
        api.get('/farm-projects/analytics/').catch(() => ({ data: null }))
      ]);
      setRequests(reqRes.data || []);
      setBookings(bookRes.data || []);
      setProjects(projRes.data || []);
      const farmList = farmRes.data || [];
      setFarms(farmList);
      if (farmList.length > 0 && !selectedFarmId) {
        setSelectedFarmId(farmList[0].id);
      }
      if (weatherRes?.data) setWeather(weatherRes.data);
      if (analyticsRes?.data) setAnalytics(analyticsRes.data);
    } catch (e) {
      console.error('Failed to load farmer dashboard data', e);
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

  // Active selected farm object
  const activeFarm = farms.find(f => f.id === selectedFarmId) || farms[0] || null;

  // Active projects filtered by selected farm
  const farmProjects = activeFarm
    ? projects.filter(p => p.farm === activeFarm.id || p.farm_name === activeFarm.name)
    : projects;

  const currentProject = farmProjects.length > 0 ? farmProjects[0] : (projects[0] || null);

  // Next operation in the current project
  const nextOperation = currentProject?.project_operations?.find(
    op => op.status === 'ready' || op.status === 'planned' || op.status === 'service_requested' || op.status === 'scheduled'
  ) || null;

  // Financial aggregates
  const finTotals = analytics?.financial_totals || currentProject?.financial_summary || {
    planned_estimates: '0.00',
    confirmed_commitments: '0.00',
    incurred_expenditure: '0.00',
    net_recorded_payments: '0.00',
    outstanding_balance: '0.00',
    realized_revenue: '0.00',
    recorded_surplus: '0.00'
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#174D32]" />
        <span className="text-xs font-bold text-[#64748B] tracking-wide">
          {lang === 'hi' ? 'डैशबोर्ड लोड हो रहा है...' : 'Loading your farm dashboard...'}
        </span>
      </div>
    );
  }

  // §18 First-Time User State: No Farm Registered
  if (farms.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E2E8DF] shadow-md text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#174D32] flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8 text-[#84B547]" />
          </div>
          <h2 className="text-2xl font-black text-[#172D20]">
            {lang === 'hi' ? 'अपना पहला खेत जोड़ें' : 'Add Your First Farm'}
          </h2>
          <p className="text-sm text-[#64748B] leading-relaxed">
            {lang === 'hi'
              ? 'फसल योजना और सेवा समन्वय शुरू करने के लिए अपने खेत का नाम, गांव और खसरा रकबा दर्ज करें।'
              : 'Register your land parcel, survey number (Khasra), acreage, and soil profile to unlock structured crop operations and service matching.'}
          </p>
          <div className="pt-2">
            <Link
              to="/farmer/farms"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#174D32] text-white text-xs font-bold hover:bg-[#0e3321] transition shadow-md"
            >
              <Plus className="w-4 h-4 text-[#FCE052]" />
              <span>{lang === 'hi' ? 'खेत पंजीकृत करें' : 'Register Farm Parcel'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── ROW 1: FARM OVERVIEW BANNER (12 Columns per §14) ─── */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-950 bg-[#174D32] min-h-[180px] flex flex-col justify-between">
        {/* Panoramic agricultural background photograph */}
        <img
          src="/images/krishiseva/dashboard/farm-banner-panoramic.jpg"
          alt="Panoramic agricultural farmland in Western Uttar Pradesh"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Localized gradient overlay for high contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#101510]/95 via-[#101510]/80 to-[#174D32]/65" />

        <div className="relative z-10 p-6 sm:p-8 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Top Bar: Farm Selector & Location */}
            <div className="flex flex-wrap items-center gap-2">
              {farms.length > 1 ? (
                <div className="relative inline-block">
                  <select
                    value={activeFarm?.id || ''}
                    onChange={(e) => setSelectedFarmId(Number(e.target.value))}
                    className="appearance-none bg-white/20 text-white font-bold text-xs pl-3 pr-8 py-1.5 rounded-full border border-white/20 outline-none cursor-pointer hover:bg-white/30 transition backdrop-blur-xs"
                  >
                    {farms.map(f => (
                      <option key={f.id} value={f.id} className="text-[#101510]">
                        🌾 {f.name} ({f.size_acres || '?'} Ac)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold text-emerald-100 border border-white/10 backdrop-blur-xs">
                  <MapPin className="w-3.5 h-3.5 text-[#FCE052]" />
                  <span>{activeFarm?.name || 'Ganga Khet'}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold text-white/90 backdrop-blur-xs">
                <span>{activeFarm?.village || user?.village || 'Daurala'}, {activeFarm?.district || user?.district || 'Meerut'}</span>
              </span>

              {activeFarm?.soil_type && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-700/50 backdrop-blur-xs">
                  {activeFarm.soil_type}
                </span>
              )}
            </div>

            {/* Farm Title & Welcome */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
                {lang === 'hi' ? `राम-राम, ${user?.first_name || 'किसान भाई'}!` : `Welcome back, ${user?.first_name || 'Farmer'}!`}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 leading-relaxed">
                {lang === 'hi'
                  ? `खेत का रकबा: ${activeFarm?.size_acres || '20'} एकड़ • फसलें: ${activeFarm?.current_crops || 'गेहूं, गन्ना'} • पारदर्शी ग्रामीण सेवा समन्वय`
                  : `Farm Size: ${activeFarm?.size_acres || '20'} Acres • Active Crops: ${activeFarm?.current_crops || 'Wheat, Sugarcane'} • Operations Sync`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => {
                setPreselectedSlug(null);
                setCreateReqOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#FCE052] text-[#101510] text-xs font-black hover:bg-[#FFF3B0] transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#101510]" />
              <span>{lang === 'hi' ? 'नया सेवा अनुरोध' : 'New Service Request'}</span>
            </button>
            <Link
              to="/farmer/projects"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition border border-white/25 backdrop-blur-xs"
            >
              <FolderKanban className="w-4 h-4 text-[#FCE052]" />
              <span>{lang === 'hi' ? 'फसल योजना बनाएं' : 'Plan Crop Project'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── ROW 2: NEXT OPERATION (8 COLS) + WEATHER REFERENCE (4 COLS) per §14 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Next Farming Operation — 8 Columns */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8DF] shadow-sm flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#E2E8DF]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#84B547] animate-pulse shrink-0" />
                <h3 className="text-xs font-extrabold text-[#172D20] uppercase tracking-wider truncate">
                  {lang === 'hi' ? 'अगला कृषि कार्य' : 'Next Agricultural Operation'}
                </h3>
              </div>
              {currentProject && (
                <span className="text-[11px] font-bold text-[#174D32] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 truncate max-w-[200px] shrink-0">
                  {currentProject.name}
                </span>
              )}
            </div>

            {nextOperation ? (
              <div className="pt-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[#84B547] uppercase tracking-wider">
                      {lang === 'hi' ? `कार्य क्रम #${nextOperation.sequence_order}` : `Task #${nextOperation.sequence_order}`} • {nextOperation.stage}
                    </div>
                    <h4 className="text-base sm:text-xl font-black text-[#172D20] mt-0.5 break-words">
                      {lang === 'hi' ? nextOperation.operation_name_hi : nextOperation.operation_name_en}
                    </h4>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={nextOperation.status} />
                  </div>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed">
                  {nextOperation.notes || (lang === 'hi' ? 'फसल कैलेंडर के अनुसार अगली अनुशंसित गतिविधि।' : 'Next recommended operation according to cultivation template.')}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-2xl bg-[#F4F4EE]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                      {lang === 'hi' ? 'नियोजित तारीख' : 'Planned Target'}
                    </span>
                    <span className="font-extrabold text-[#172D20] mt-0.5 block truncate">
                      {nextOperation.planned_start_date || (lang === 'hi' ? '7 दिन के भीतर' : 'Within 7 Days')}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F4F4EE]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                      {lang === 'hi' ? 'आवश्यक सेवा' : 'Service Needed'}
                    </span>
                    <span className="font-extrabold text-[#174D32] mt-0.5 block truncate">
                      {nextOperation.service_category_details?.name_en || (lang === 'hi' ? 'कृषि मशीनरी / श्रमिक' : 'Farm Machinery / Labour')}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F4F4EE] col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                      {lang === 'hi' ? 'पूर्व शर्त' : 'Prerequisite'}
                    </span>
                    <span className="font-extrabold text-[#172D20] mt-0.5 block truncate">
                      {nextOperation.prerequisite_name ? (lang === 'hi' ? 'पलेवा पूर्ण' : 'Pre-sowing Done') : (lang === 'hi' ? 'कोई नहीं (तैयार)' : 'None (Ready)')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* §18 First-Time User State: Farm exists but no project */
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
                  <Sprout className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#172D20]">
                  {lang === 'hi' ? 'कोई सक्रिय फसल योजना नहीं है' : 'Create Your First Crop Plan'}
                </h4>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  {lang === 'hi'
                    ? 'गेहूं, धान, गन्ना या सरसों की योजना बनाकर अगले कार्य और मशीनरी का शेड्यूल प्राप्त करें।'
                    : 'Choose from 6 ICAR crop templates to generate sequenced operations and book services seamlessly.'}
                </p>
                <Link
                  to="/farmer/projects"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#174D32] text-white text-xs font-bold hover:bg-[#0e3321] transition"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FCE052]" />
                  <span>{lang === 'hi' ? 'फसल योजना शुरू करें' : 'Create Crop Plan'}</span>
                </Link>
              </div>
            )}
          </div>

          {nextOperation && (
            <div className="pt-4 mt-4 border-t border-[#E2E8DF] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">
                {nextOperation.service_category ? 'Verified local providers available' : 'Standard operational milestone'}
              </span>
              <button
                onClick={() => {
                  setPreselectedSlug(nextOperation.service_category_details?.slug || null);
                  setCreateReqOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition cursor-pointer"
              >
                <span>{lang === 'hi' ? 'कोटेशन मांगें' : 'Request Service'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Weather Reference Card — 4 Columns (Module 05) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8DF]">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-[#84B547]" />
                <h3 className="text-xs font-extrabold text-[#172D20] uppercase tracking-wider">
                  {lang === 'hi' ? 'मौसम संदर्भ' : 'Advisory Weather'}
                </h3>
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                weather?.is_live
                  ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                  : 'text-amber-800 bg-amber-50 border-amber-200'
              }`}>
                {weather?.is_live
                  ? (lang === 'hi' ? 'लाइव' : 'Live')
                  : (lang === 'hi' ? 'क्षेत्रीय मानक' : 'Regional Benchmark')}
              </span>
            </div>

            {weather ? (
              <div className="pt-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-[#172D20]">
                      {weather.current?.temperature_c || 24}°C
                    </div>
                    <div className="text-xs font-bold text-[#174D32] mt-0.5">
                      {lang === 'hi' ? weather.current?.condition_hi : weather.current?.condition_en}
                    </div>
                  </div>
                  <div className="text-right text-xs text-[#64748B] space-y-1">
                    <div className="flex items-center justify-end gap-1">
                      <Droplets className="w-3 h-3 text-blue-500" />
                      <span>{weather.current?.humidity_percent || 60}% Humidity</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Wind className="w-3 h-3 text-slate-400" />
                      <span>{weather.current?.wind_speed_kmh || 8.5} km/h Wind</span>
                    </div>
                  </div>
                </div>

                {/* Factual Weather Metadata per §4 */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-[#64748B] bg-[#F4F4EE] p-2.5 rounded-xl border border-[#E2E8DF]">
                  <div>
                    <span className="font-semibold text-slate-500 block">{lang === 'hi' ? 'स्रोत:' : 'Source:'}</span>
                    <span className="font-bold text-[#172D20] truncate block" title={weather.source || weather.data_source}>
                      {weather.source ? (weather.source.includes('IMD') ? 'IMD Agro Reference' : 'Open-Meteo') : 'IMD Agro Reference'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">{lang === 'hi' ? 'स्थान:' : 'Location:'}</span>
                    <span className="font-bold text-[#172D20] truncate block">
                      {weather.location?.district || activeFarm?.district || 'Meerut'}, UP
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">{lang === 'hi' ? 'समय:' : 'Timestamp:'}</span>
                    <span className="font-bold text-[#172D20] truncate block">
                      {weather.observation_timestamp ? new Date(weather.observation_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">{lang === 'hi' ? 'ताज़गी:' : 'Freshness:'}</span>
                    <span className="font-bold text-[#172D20] truncate block">
                      {weather.is_live ? 'Live' : 'Standard Benchmark'}
                    </span>
                  </div>
                </div>

                {/* Advisory / Factual Observation per §4 */}
                <div className="p-3 rounded-2xl bg-[#FAF8F2] border border-amber-200/70 text-[11px] leading-relaxed text-[#172D20]">
                  <strong className="block text-amber-900 mb-0.5">🌾 {lang === 'hi' ? 'मौसम अवलोकन:' : 'Factual Observation:'}</strong>
                  <span>{lang === 'hi' ? weather.agro_advisory_hi : weather.agro_advisory_en}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#64748B]">
                {lang === 'hi' ? 'मौसम डेटा अनुपलब्ध (सलाहकारी)' : 'Weather data temporarily unavailable (advisory)'}
              </div>
            )}
          </div>

          {/* Statutory Policy Disclaimer per §4 & §8 */}
          <div className="pt-3 mt-3 border-t border-[#E2E8DF] text-[10px] text-[#64748B] leading-tight">
            {lang === 'hi'
              ? 'सलाहकारी अवलोकन मात्र; मंच सुरक्षा आश्वासन अथवा स्वतः बुकिंग निरस्तीकरण नहीं करता।'
              : 'Factual reference only; platform does not provide safety guarantees or auto-cancel bookings.'}
          </div>
        </div>
      </div>

      {/* ─── ROW 3: SIX RESPONSIVE QUICK-SERVICE CARDS (12 COLS) per §14 ─── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#172D20]">
            {lang === 'hi' ? 'त्वरित सेवा बुकिंग' : 'Six Core Agricultural Services'}
          </h3>
          <Link to="/farmer/services" className="text-xs font-bold text-[#174D32] hover:underline flex items-center gap-1 shrink-0">
            <span>{lang === 'hi' ? 'सभी 16+ देखें' : 'View all'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* 1. Combine Harvester / Machinery */}
          <button
            onClick={() => openReqForCategory('machinery_rental')}
            className="p-4 rounded-2xl bg-white border border-[#E2E8DF] hover:border-[#174D32] text-left transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#174D32] group-hover:bg-[#174D32] group-hover:text-white flex items-center justify-center transition mb-3">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#172D20]">
                {lang === 'hi' ? 'कंबाइन हार्वेस्टर' : 'Combine Harvester'}
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">₹1,500 - ₹2,500 / Ac</div>
            </div>
          </button>

          {/* 2. Tractor Mechanic */}
          <button
            onClick={() => openReqForCategory('tractor_mechanic')}
            className="p-4 rounded-2xl bg-white border border-[#E2E8DF] hover:border-[#174D32] text-left transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 group-hover:bg-[#E8B44C] group-hover:text-[#101510] flex items-center justify-center transition mb-3">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#172D20]">
                {lang === 'hi' ? 'ट्रैक्टर मैकेनिक' : 'Tractor Repair'}
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">₹300 - ₹1,500 / Visit</div>
            </div>
          </button>

          {/* 3. Agricultural Labour */}
          <button
            onClick={() => openReqForCategory('labour')}
            className="p-4 rounded-2xl bg-white border border-[#E2E8DF] hover:border-[#174D32] text-left transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-lime-50 text-lime-800 group-hover:bg-[#84B547] group-hover:text-white flex items-center justify-center transition mb-3">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#172D20]">
                {lang === 'hi' ? 'कृषि श्रमिक' : 'Agricultural Labour'}
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">₹400 - ₹600 / Day</div>
            </div>
          </button>

          {/* 4. Tubewell Repair */}
          <button
            onClick={() => openReqForCategory('tubewell_repair')}
            className="p-4 rounded-2xl bg-white border border-[#E2E8DF] hover:border-[#174D32] text-left transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition mb-3">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#172D20]">
                {lang === 'hi' ? 'ट्यूबवेल कारीगर' : 'Tubewell Repair'}
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">₹500 - ₹2,000 / Job</div>
            </div>
          </button>

          {/* 5. Land Preparation */}
          <button
            onClick={() => openReqForCategory('land_preparation')}
            className="p-4 rounded-2xl bg-white border border-[#E2E8DF] hover:border-[#174D32] text-left transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-800 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center transition mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#172D20]">
                {lang === 'hi' ? 'खेत की जुताई' : 'Land Preparation'}
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">₹800 - ₹1,800 / Ac</div>
            </div>
          </button>

          {/* 6. Sprayers & Protection */}
          <button
            onClick={() => openReqForCategory('spraying_dusting')}
            className="p-4 rounded-2xl bg-white border border-[#E2E8DF] hover:border-[#174D32] text-left transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition mb-3">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#172D20]">
                {lang === 'hi' ? 'कीट नियंत्रण व स्प्रे' : 'Crop Protection'}
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">₹300 - ₹800 / Ac</div>
            </div>
          </button>
        </div>
      </div>

      {/* ─── ROW 4: ACTIVE PROJECTS (6 COLS) + UPCOMING BOOKINGS (6 COLS) per §14 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Active Projects — 6 Columns */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8DF] mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#174D32]" />
                <h3 className="font-extrabold text-sm text-[#172D20]">
                  {lang === 'hi' ? 'सक्रिय फार्म प्रोजेक्ट्स' : 'Active Farm Projects'}
                </h3>
              </div>
              <Link to="/farmer/projects" className="text-xs font-bold text-[#174D32] hover:underline">
                {lang === 'hi' ? 'सभी प्रबंधित करें' : 'Manage All'}
              </Link>
            </div>

            <div className="space-y-3.5">
              {projects.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  {lang === 'hi' ? 'कोई सक्रिय प्रोजेक्ट नहीं है।' : 'No active farm projects registered yet.'}
                </div>
              ) : (
                projects.slice(0, 2).map((proj) => (
                  <Link
                    key={proj.id}
                    to={`/farmer/projects/${proj.id}`}
                    className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#E2E8DF] hover:border-[#174D32] block transition group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-[#172D20] group-hover:text-[#174D32] transition">
                          {proj.name}
                        </h4>
                        <div className="text-[11px] text-[#64748B] mt-0.5">
                          {proj.crop} • {proj.target_area_acres} Acres • {proj.farm_name}
                        </div>
                      </div>
                      <StatusBadge status={proj.status} />
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-[#64748B]">Coordination Progress</span>
                        <span className="font-black text-[#174D32]">{proj.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-[#E2E8DF] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#84B547] h-full rounded-full transition-all duration-500"
                          style={{ width: `${proj.completion_percentage}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E2E8DF] flex items-center justify-between text-xs">
            <span className="text-[#64748B]">
              {projects.length} {lang === 'hi' ? 'फसल चक्र प्रगति पर' : 'crop plans running'}
            </span>
            <Link to="/farmer/projects" className="font-bold text-[#174D32] hover:underline flex items-center gap-1">
              <span>{lang === 'hi' ? 'नया प्रोजेक्ट बनाएं' : 'Create New Plan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Upcoming Operations & Bookings — 6 Columns */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8DF] mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#84B547]" />
                <h3 className="font-extrabold text-sm text-[#172D20]">
                  {lang === 'hi' ? 'आगामी ऑपरेशन्स व बुकिंग्स' : 'Upcoming Bookings & Schedule'}
                </h3>
              </div>
              <Link to="/farmer/bookings" className="text-xs font-bold text-[#174D32] hover:underline">
                {lang === 'hi' ? 'कैलेंडर देखें' : 'View Calendar'}
              </Link>
            </div>

            <div className="space-y-3">
              {bookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  {lang === 'hi' ? 'कोई आगामी बुकिंग नहीं है।' : 'No confirmed upcoming bookings.'}
                </div>
              ) : (
                bookings.slice(0, 3).map((book) => (
                  <div
                    key={book.id}
                    className="p-3.5 rounded-2xl bg-[#F4F4EE] border border-[#E2E8DF] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#172D20]">{book.category_name}</span>
                        <span className="font-extrabold text-[#174D32]">₹{book.agreed_amount?.toLocaleString()}</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        Provider: {book.provider_name} • Scheduled: {book.scheduled_date}
                      </div>
                    </div>
                    <StatusBadge status={book.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E2E8DF] flex items-center justify-between text-xs">
            <span className="text-[#64748B]">
              Double-booking protected schedule
            </span>
            <Link to="/farmer/bookings" className="font-bold text-[#174D32] hover:underline">
              {lang === 'hi' ? 'सभी बुकिंग्स' : 'All Bookings'}
            </Link>
          </div>
        </div>
      </div>

      {/* ─── ROW 5: FINANCIAL SUMMARY (6 COLS) + SERVICE REQUESTS (6 COLS) per §14 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Financial Summary — 6 Columns (FIN-01 to FIN-12) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8DF] mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#174D32]" />
                <h3 className="font-extrabold text-sm text-[#172D20]">
                  {lang === 'hi' ? 'वित्तीय लेजर व खर्च सारांश' : 'Authoritative Financial Ledger'}
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {lang === 'hi' ? 'सत्यापित लेजर' : 'Verified Ledger'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
              <div className="p-3 rounded-2xl bg-[#F4F4EE]">
                <div className="text-[10px] font-bold uppercase text-[#64748B]">
                  {lang === 'hi' ? 'नियोजित बजट' : 'Planned Estimates'}
                </div>
                <div className="text-xs sm:text-sm font-black text-[#172D20] mt-0.5">
                  ₹{Number(finTotals.planned_estimates || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#F4F4EE]">
                <div className="text-[10px] font-bold uppercase text-[#64748B]">
                  {lang === 'hi' ? 'वास्तविक खर्च' : 'Incurred Costs'}
                </div>
                <div className="text-xs sm:text-sm font-black text-[#174D32] mt-0.5">
                  ₹{Number(finTotals.incurred_expenditure || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#F4F4EE]">
                <div className="text-[10px] font-bold uppercase text-[#64748B]">
                  {lang === 'hi' ? 'कुल भुगतान' : 'Net Payments'}
                </div>
                <div className="text-xs sm:text-sm font-black text-emerald-700 mt-0.5">
                  ₹{Number(finTotals.net_recorded_payments || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#F4F4EE]">
                <div className="text-[10px] font-bold uppercase text-[#64748B]">
                  {lang === 'hi' ? 'बकाया राशि' : 'Outstanding'}
                </div>
                <div className="text-xs sm:text-sm font-black text-amber-700 mt-0.5">
                  ₹{Number(finTotals.outstanding_balance || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#F4F4EE]">
                <div className="text-[10px] font-bold uppercase text-[#64748B]">
                  {lang === 'hi' ? 'फसल बिक्री' : 'Crop Revenue'}
                </div>
                <div className="text-xs sm:text-sm font-black text-[#172D20] mt-0.5">
                  ₹{Number(finTotals.realized_revenue || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] font-bold uppercase text-emerald-800">
                  {lang === 'hi' ? 'दर्ज शुद्ध मुनाफा' : 'Recorded Surplus'}
                </div>
                <div className="text-xs sm:text-sm font-black text-[#174D32] mt-0.5">
                  ₹{Number(finTotals.recorded_surplus || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E2E8DF] flex items-center justify-between text-xs">
            <span className="text-[10px] text-[#64748B] line-clamp-1">
              {lang === 'hi' ? 'खेत खर्च एवं वित्तीय संतुलन लेजर' : 'Operational farm expenditure and balance ledger'}
            </span>
            <Link to="/farmer/analytics" className="font-bold text-[#174D32] hover:underline shrink-0">
              {lang === 'hi' ? 'विस्तृत रिपोर्ट' : 'Full Analytics'}
            </Link>
          </div>
        </div>

        {/* Service Requests & Notifications — 6 Columns */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8DF] mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#174D32]" />
                <h3 className="font-extrabold text-sm text-[#172D20]">
                  {lang === 'hi' ? 'सेवा मांगें व कोटेशन' : 'Service Requests & Quotations'}
                </h3>
              </div>
              <Link to="/farmer/requests" className="text-xs font-bold text-[#174D32] hover:underline">
                {lang === 'hi' ? 'सभी मांगें' : 'View All'}
              </Link>
            </div>

            <div className="space-y-3">
              {requests.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  {lang === 'hi' ? 'कोई सक्रिय मांग नहीं है।' : 'No active service requests.'}
                </div>
              ) : (
                requests.slice(0, 3).map((req) => (
                  <Link
                    key={req.id}
                    to={`/farmer/requests/${req.id}`}
                    className="p-3.5 rounded-2xl bg-[#F4F4EE] border border-[#E2E8DF] hover:border-[#174D32] block transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-xs text-[#172D20]">{req.title}</h4>
                        <div className="text-[11px] text-[#64748B] mt-0.5">
                          {req.category_details?.name_en} • Required: {req.required_date}
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#E2E8DF] flex items-center justify-between text-[11px] text-[#64748B]">
                      <span className="font-semibold text-emerald-800">
                        {req.quotations_count || 0} quotes received
                      </span>
                      <span>Target: {req.scope_quantity}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E2E8DF] flex items-center justify-between text-xs">
            <span className="text-[#64748B]">
              Backup providers automatically available
            </span>
            <button
              onClick={() => {
                setPreselectedSlug(null);
                setCreateReqOpen(true);
              }}
              className="font-bold text-[#174D32] hover:underline cursor-pointer"
            >
              + {lang === 'hi' ? 'नई मांग' : 'Post Request'}
            </button>
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
