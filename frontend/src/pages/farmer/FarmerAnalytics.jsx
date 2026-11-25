import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, IndianRupee, FolderKanban, CheckCircle2,
  Clock, AlertTriangle, Layers, Sprout, ArrowUpRight, ShieldCheck,
  Loader2, RefreshCw
} from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerAnalytics() {
  const { lang } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters for Farm Analytics (Batch D1)
  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');

  const fetchAnalytics = async (farm = selectedFarm, proj = selectedProject, ssn = selectedSeason) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (farm) params.append('farm', farm);
      if (proj) params.append('project', proj);
      if (ssn) params.append('season', ssn);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/farm-projects/analytics/${query}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError(lang === 'hi' ? 'विश्लेषण डेटा लोड करने में त्रुटि।' : 'Failed to load farm analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedFarm, selectedProject, selectedSeason]);

  const handleResetFilters = () => {
    setSelectedFarm('');
    setSelectedProject('');
    setSelectedSeason('');
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
        <span className="text-xs font-semibold">
          {lang === 'hi' ? 'खेत विश्लेषण तैयार हो रहा है...' : 'Compiling farm operational analytics...'}
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 text-sm">
        {error || 'No analytics data available.'}
      </div>
    );
  }

  const { overview, financial_totals, projects, crop_breakdown } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#174D32] flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-[#84B547]" />
            <span>{lang === 'hi' ? 'खेत विश्लेषण और समग्र प्रगति' : 'Farm Analytics & Progress'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'hi'
              ? 'आपकी सभी कृषि परियोजनाओं, कार्यों और वित्तीय रिकॉर्ड का आधिकारिक सारांश।'
              : 'Descriptive operational and financial analytics aggregated across all your active farm projects.'}
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'ताज़ा करें' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Interactive Filters Bar (Batch D1) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">{lang === 'hi' ? 'खेत:' : 'Farm:'}</span>
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#84B547] outline-none"
            >
              <option value="">{lang === 'hi' ? 'सभी खेत (All Farms)' : 'All Farms'}</option>
              {(data.filters?.farms || []).map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">{lang === 'hi' ? 'परियोजना:' : 'Project:'}</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#84B547] outline-none"
            >
              <option value="">{lang === 'hi' ? 'सभी परियोजनाएं (All Projects)' : 'All Projects'}</option>
              {(data.filters?.projects || []).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">{lang === 'hi' ? 'मौसम:' : 'Season:'}</span>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#84B547] outline-none"
            >
              <option value="">{lang === 'hi' ? 'सभी मौसम (All Seasons)' : 'All Seasons'}</option>
              {(data.filters?.seasons || ['rabi', 'kharif', 'zaid']).map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {(selectedFarm || selectedProject || selectedSeason) && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
          >
            {lang === 'hi' ? 'फ़िल्टर हटाएं' : 'Reset Filters'}
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {lang === 'hi' ? 'कुल परियोजनाएं' : 'Total Projects'}
            </span>
            <FolderKanban className="w-4 h-4 text-[#174D32]" />
          </div>
          <div className="text-2xl font-black text-slate-800">{overview.total_projects}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {overview.active_projects} {lang === 'hi' ? 'सक्रिय' : 'Active'} · {overview.completed_projects} {lang === 'hi' ? 'पूर्ण' : 'Completed'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {lang === 'hi' ? 'कृषि रकबा' : 'Cultivated Area'}
            </span>
            <Sprout className="w-4 h-4 text-[#84B547]" />
          </div>
          <div className="text-2xl font-black text-slate-800">{overview.total_cultivated_acres} <span className="text-sm font-semibold text-slate-500">{lang === 'hi' ? 'एकड़' : 'Acres'}</span></div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {lang === 'hi' ? 'मानकीकृत भूमि क्षेत्रफल' : 'Normalized operational acreage'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {lang === 'hi' ? 'कार्य निष्पादन' : 'Task Operations'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {overview.completed_operations} <span className="text-sm font-normal text-slate-400">/ {overview.total_operations}</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {overview.ready_operations} {lang === 'hi' ? 'तैयार' : 'Ready'} · {overview.overdue_operations} {lang === 'hi' ? 'विलंबित' : 'Overdue'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {lang === 'hi' ? 'दर्ज शुद्ध अधिशेष' : 'Recorded Surplus'}
            </span>
            <TrendingUp className="w-4 h-4 text-[#84B547]" />
          </div>
          <div className="text-2xl font-black text-[#174D32]">₹{parseFloat(financial_totals.recorded_surplus).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {lang === 'hi' ? 'कुल राजस्व - कुल अंतिम खर्च' : 'Revenue minus incurred cost'}
          </div>
        </div>
      </div>

      {/* Financial Overview Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-[#174D32]" />
              <span>{lang === 'hi' ? 'समग्र वित्तीय सारांश (सभी परियोजनाएं)' : 'Cumulative Financial Ledger'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {financial_totals.economic_disclaimer}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase">{lang === 'hi' ? 'योजनाबद्ध बजट' : 'Planned Budget'}</div>
            <div className="text-lg font-bold text-slate-700 mt-1">₹{parseFloat(financial_totals.planned_estimates).toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100">
            <div className="text-[11px] font-bold text-amber-700 uppercase">{lang === 'hi' ? 'प्रतिबद्धताएं' : 'Commitments'}</div>
            <div className="text-lg font-bold text-amber-900 mt-1">₹{parseFloat(financial_totals.confirmed_commitments).toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100">
            <div className="text-[11px] font-bold text-red-700 uppercase">{lang === 'hi' ? 'अंतिम खर्च' : 'Incurred Cost'}</div>
            <div className="text-lg font-bold text-red-900 mt-1">₹{parseFloat(financial_totals.incurred_expenditure).toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
            <div className="text-[11px] font-bold text-blue-700 uppercase">{lang === 'hi' ? 'कुल भुगतान' : 'Net Payments'}</div>
            <div className="text-lg font-bold text-blue-900 mt-1">₹{parseFloat(financial_totals.net_recorded_payments).toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100">
            <div className="text-[11px] font-bold text-orange-700 uppercase">{lang === 'hi' ? 'बकाया राशि' : 'Outstanding'}</div>
            <div className="text-lg font-bold text-orange-900 mt-1">₹{parseFloat(financial_totals.outstanding_balance).toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
            <div className="text-[11px] font-bold text-emerald-700 uppercase">{lang === 'hi' ? 'प्राप्त राजस्व' : 'Realized Revenue'}</div>
            <div className="text-lg font-bold text-emerald-900 mt-1">₹{parseFloat(financial_totals.realized_revenue).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Crop-wise Comparison & Project Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Crop Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#84B547]" />
            <span>{lang === 'hi' ? 'फसल-वार विवरण' : 'Crop-Wise Breakdown'}</span>
          </h3>

          <div className="space-y-3">
            {Object.keys(crop_breakdown).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">{lang === 'hi' ? 'कोई फसल डेटा नहीं मिला।' : 'No crop records available.'}</p>
            ) : (
              Object.entries(crop_breakdown).map(([cropName, cData]) => (
                <div key={cropName} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{cropName}</h4>
                    <span className="text-[11px] text-slate-500">
                      {cData.project_count} {lang === 'hi' ? 'परियोजनाएं' : 'projects'} · {cData.total_acres} {lang === 'hi' ? 'एकड़' : 'acres'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-700">+₹{parseFloat(cData.surplus).toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400">{lang === 'hi' ? 'खर्च:' : 'Exp:'} ₹{parseFloat(cData.incurred).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Project Progress Overview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-[#174D32]" />
            <span>{lang === 'hi' ? 'परियोजनावार प्रगति' : 'Project-Wise Progress'}</span>
          </h3>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">{lang === 'hi' ? 'कोई सक्रिय परियोजना नहीं।' : 'No projects active.'}</p>
            ) : (
              projects.map(p => (
                <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{p.name}</h4>
                      <span className="text-[11px] text-slate-500">{p.crop}{p.variant ? ` (${p.variant})` : ''} · {p.target_area_acres} {lang === 'hi' ? 'एकड़' : 'Acres'}</span>
                    </div>
                    <span className="text-xs font-bold text-[#174D32] bg-[#F5F1E6] px-2.5 py-1 rounded-full">
                      {p.progress_percentage !== null && p.progress_percentage !== undefined ? `${p.progress_percentage}%` : 'N/A'}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#84B547] h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.progress_percentage !== null && p.progress_percentage !== undefined ? Math.min(100, p.progress_percentage) : 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
