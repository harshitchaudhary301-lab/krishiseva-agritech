import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Plus, Calendar, Tractor, ArrowRight,
  Clock, CheckCircle2, AlertTriangle, Sparkles, Loader2, IndianRupee, Layers
} from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';

export default function FarmerProjects() {
  const { lang, t } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [farms, setFarms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: 'Wheat Harvesting 2026',
    crop: 'Wheat',
    target_area_acres: '20',
    farm: '',
    start_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    expected_completion_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    notes: 'Complete harvesting operations coordination.'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, farmRes, catRes] = await Promise.all([
        api.get('/farm-projects/projects/'),
        api.get('/farm-projects/farms/'),
        api.get('/services/categories/')
      ]);
      setProjects(projRes.data);
      setFarms(farmRes.data);
      setCategories(catRes.data);
      if (farmRes.data.length > 0 && !formData.farm) {
        setFormData(prev => ({ ...prev, farm: farmRes.data[0].id }));
      }
      // Pre-select active categories for farm projects by default
      if (catRes.data.length > 0) {
        const activeIds = catRes.data
          .filter(c => ['labour', 'machinery_rental', 'tractor_mechanic', 'tubewell_repair'].includes(c.slug))
          .map(c => c.id);
        setSelectedCategories(activeIds.length > 0 ? activeIds : catRes.data.slice(0, 3).map(c => c.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCategorySelection = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.crop || !formData.target_area_acres) {
      setError(lang === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const servicesPayload = selectedCategories.map(catId => {
        const cat = categories.find(c => c.id === catId);
        return {
          category_id: catId,
          scope_description: `${cat?.name_en || 'Service'} for ${formData.name}`,
          target_date: formData.start_date
        };
      });

      const payload = {
        name: formData.name,
        crop: formData.crop,
        target_area_acres: parseFloat(formData.target_area_acres),
        farm: formData.farm ? parseInt(formData.farm) : null,
        start_date: formData.start_date,
        expected_completion_date: formData.expected_completion_date,
        notes: formData.notes,
        services: servicesPayload
      };

      await api.post('/farm-projects/projects/', payload);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create farm project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#174D32] to-[#236544] p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold text-emerald-100 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E8B44C]" />
            <span>{lang === 'hi' ? 'कृषि सेवा का मुख्य डिफरेंटिएटर' : 'KrishiSeva Core Differentiator'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            {lang === 'hi' ? 'फार्म प्रोजेक्ट मैनेजर' : 'Farm Project Manager'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl mt-1 leading-relaxed">
            {lang === 'hi'
              ? 'अलग-अलग सेवा खोजने के बजाय, पूरी फसल गतिविधि (जैसे 20 एकड़ गेहूं कटाई) को एक प्रोजेक्ट में व्यवस्थित करें — श्रमिक, मशीनरी और मैकेनिक एक साथ।'
              : 'Coordinate multi-service farm operations (labour, harvesters, mechanics) under a unified schedule, budget, and readiness checklist.'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#84B547] hover:bg-[#74a03c] text-white text-xs font-bold transition shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'hi' ? 'नया फार्म प्रोजेक्ट बनाएं' : 'Create Farm Project'}</span>
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
          <span className="text-xs">Loading farm projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <FolderKanban className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">
            {lang === 'hi' ? 'कोई प्रोजेक्ट नहीं मिला' : 'No farm projects created yet'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {lang === 'hi'
              ? 'गेहूं या धान की कटाई के लिए एक नया प्रोजेक्ट शुरू करें।'
              : 'Create a project like "Wheat Harvesting" to coordinate machinery, labour, and maintenance under one synchronized schedule.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#174D32] text-white text-xs font-bold"
          >
            {lang === 'hi' ? 'पहला प्रोजेक्ट बनाएं' : 'Start First Project'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs hover:border-[#84B547] transition flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      {proj.crop} • {proj.target_area_acres} Acres • {proj.farm_name || 'Farm Plot'}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#174D32] transition mt-0.5">
                      {proj.name}
                    </h3>
                  </div>
                  <StatusBadge status={proj.status} />
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-600">{lang === 'hi' ? 'समग्र प्रगति:' : 'Coordination Progress:'}</span>
                    <span className="text-[#174D32]">{proj.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-[#84B547] to-[#174D32] h-full rounded-full transition-all duration-500"
                      style={{ width: `${proj.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAF8F2] border border-amber-200/60 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">{lang === 'hi' ? 'बजट / खर्च' : 'Budget / Committed'}</span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{proj.actual_cost?.toLocaleString()} / ₹{proj.estimated_budget?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">{lang === 'hi' ? 'सेवाएं पक्की' : 'Services Ready'}</span>
                    <span className="font-bold text-emerald-800 text-sm">
                      {proj.confirmed_count} of {proj.services_count} Confirmed
                    </span>
                  </div>
                </div>

                {/* Services Pills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {lang === 'hi' ? 'शामिल कृषि गतिविधियां:' : 'Linked Operations:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.project_services?.map((s) => (
                      <span
                        key={s.id}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#F7F9F5] border border-slate-200 text-slate-700 flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#84B547]" />
                        <span>{s.category_details?.name_en}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Target: {proj.start_date} to {proj.expected_completion_date}
                </span>
                <Link
                  to={`/farmer/projects/${proj.id}`}
                  className="px-4 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <span>{lang === 'hi' ? 'प्रोजेक्ट खोलें' : 'Open Dashboard'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  {lang === 'hi' ? 'नया फार्म प्रोजेक्ट बनाएं' : 'Create Farm Project'}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  The Farm Operations Coordination Platform
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-white/80 hover:text-white rounded-xl">
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs border-b border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'प्रोजेक्ट का नाम *' : 'Project Name *'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="उदा: Wheat Harvesting 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'फसल *' : 'Crop *'}
                  </label>
                  <input
                    type="text"
                    value={formData.crop}
                    onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                    placeholder="Wheat, Paddy, Mustard"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'रकबा (एकड़) *' : 'Target Area (Acres) *'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.target_area_acres}
                    onChange={(e) => setFormData({ ...formData, target_area_acres: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'खेत चुनें' : 'Select Farm Plot'}
                </label>
                <select
                  value={formData.farm}
                  onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                >
                  <option value="">-- Standalone (No Farm Plot) --</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.size_acres} Acres)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'शुरुआत तारीख *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'समाप्ति तारीख *' : 'End Date *'}
                  </label>
                  <input
                    type="date"
                    value={formData.expected_completion_date}
                    onChange={(e) => setFormData({ ...formData, expected_completion_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Service Selection Checklist */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {lang === 'hi' ? 'आवश्यक कृषि सेवाएं शामिल करें' : 'Include Required Agricultural Services'}
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  {lang === 'hi'
                    ? 'चुनी गई सेवाओं के लिए स्वचालित रूप से संबंधित सेवा अनुरोध (Service Requests) प्रोजेक्ट में जुड़ जाएंगे।'
                    : 'Selected operations will be initialized under this project with coordinated schedules.'}
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {categories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategorySelection(cat.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#174D32]/5 border-[#174D32] text-[#174D32] font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#174D32] border-[#174D32] text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="truncate">{cat.name_en}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : (lang === 'hi' ? 'प्रोजेक्ट बनाएं' : 'Create Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
