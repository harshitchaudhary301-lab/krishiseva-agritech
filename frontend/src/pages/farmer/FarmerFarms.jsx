import React, { useState, useEffect } from 'react';
import {
  Map, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Droplets, Sprout,
  MapPin, FlaskConical, FileText, ChevronRight, Sparkles, Building
} from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import NationwideLocationSelector from '../../components/NationwideLocationSelector';

export default function FarmerFarms() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('farms'); // 'farms' | 'soil'
  const [farms, setFarms] = useState([]);
  const [soilReports, setSoilReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSoilModal, setShowSoilModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    village: user?.village || 'Daurala',
    block: 'Daurala',
    district: user?.district || 'Meerut',
    state: 'Uttar Pradesh',
    lgd_code: '',
    land_tenure: 'owned',
    khasra_number: '',
    size_acres: '10',
    current_crops: 'Wheat, Sugarcane',
    soil_type: 'Alluvial Loam',
    irrigation_source: 'Tubewell + Canal Channel'
  });

  const [soilData, setSoilData] = useState({
    farm: '',
    sampling_date: new Date().toISOString().split('T')[0],
    lab_name: 'Meerut Soil Testing Laboratory (KVK)',
    sample_id: 'STL-2026-089',
    soil_texture: 'Sandy Clay Loam',
    ph: '7.2',
    electrical_conductivity: '0.45',
    organic_carbon_percentage: '0.62',
    nitrogen_kg_per_ha: '240.0',
    phosphorus_kg_per_ha: '18.5',
    potassium_kg_per_ha: '210.0',
    zinc_ppm: '0.75',
    iron_ppm: '5.2'
  });

  const fetchFarms = async () => {
    setLoading(true);
    try {
      const [farmRes, soilRes] = await Promise.all([
        api.get('/farm-projects/farms/'),
        api.get('/farm-projects/soil-reports/')
      ]);
      setFarms(farmRes.data);
      setSoilReports(soilRes.data);
      if (farmRes.data.length > 0 && !soilData.farm) {
        setSoilData(prev => ({ ...prev, farm: farmRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.size_acres || !formData.village) {
      setError(lang === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        size_acres: parseFloat(formData.size_acres)
      };
      await api.post('/farm-projects/farms/', payload);
      setSuccess(lang === 'hi' ? 'खेत सफलतापूर्वक सहेजा गया।' : 'Farm profile saved successfully.');
      setShowAddForm(false);
      setFormData({
        name: '',
        village: user?.village || 'Daurala',
        block: 'Daurala',
        district: user?.district || 'Meerut',
        state: 'Uttar Pradesh',
        lgd_code: '',
        land_tenure: 'owned',
        khasra_number: '',
        size_acres: '10',
        current_crops: 'Wheat, Sugarcane',
        soil_type: 'Alluvial Loam',
        irrigation_source: 'Tubewell + Canal Channel'
      });
      fetchFarms();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save farm.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoilSubmit = async (e) => {
    e.preventDefault();
    if (!soilData.farm) {
      alert('Please select a farm plot.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/farm-projects/soil-reports/', {
        ...soilData,
        farm: parseInt(soilData.farm, 10),
        ph: parseFloat(soilData.ph),
        electrical_conductivity: parseFloat(soilData.electrical_conductivity),
        organic_carbon_percentage: parseFloat(soilData.organic_carbon_percentage),
        nitrogen_kg_per_ha: parseFloat(soilData.nitrogen_kg_per_ha),
        phosphorus_kg_per_ha: parseFloat(soilData.phosphorus_kg_per_ha),
        potassium_kg_per_ha: parseFloat(soilData.potassium_kg_per_ha),
        zinc_ppm: parseFloat(soilData.zinc_ppm),
        iron_ppm: parseFloat(soilData.iron_ppm)
      });
      setShowSoilModal(false);
      setSuccess(lang === 'hi' ? 'मृदा परीक्षण रिपोर्ट सफलतापूर्वक दर्ज की गई।' : 'Soil test report registered successfully.');
      fetchFarms();
    } catch (err) {
      console.error(err);
      alert('Failed to save soil test report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(lang === 'hi' ? 'क्या आप इस खेत को हटाना चाहते हैं?' : 'Are you sure you want to remove this farm plot?')) {
      return;
    }
    try {
      await api.delete(`/farm-projects/farms/${id}/`);
      fetchFarms();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 tracking-wider">
              Land & Soil Intelligence
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {lang === 'hi' ? 'मेरा खेत — भूमि व मृदा रिकॉर्ड' : 'My Farm — Land & Soil Intelligence'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'hi'
              ? 'सत्यापित भूमि का रिकॉर्ड, खसरा संख्या, मृदा स्वास्थ्य कार्ड और पोषक तत्व स्तर।'
              : 'Official land plots, LGD village codes, Khasra numbers, and verified Soil Health Card lab reports.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'farms' ? (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? (lang === 'hi' ? 'बंद करें' : 'Close Form') : (lang === 'hi' ? 'नया खेत जोड़ें' : 'Add New Farm Plot')}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSoilModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              <span>{lang === 'hi' ? 'मृदा परीक्षण रिपोर्ट जोड़ें' : 'Add Soil Report'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('farms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'farms'
              ? 'bg-[#174D32] text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>{lang === 'hi' ? 'खेत एवं रकबा प्रोफाइल' : 'Farm & Land Profiles'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'farms' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {farms.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('soil')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'soil'
              ? 'bg-[#174D32] text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>{lang === 'hi' ? 'मृदा स्वास्थ्य कार्ड (Soil Intelligence)' : 'Soil Health Reports'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'soil' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {soilReports.length}
          </span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* TAB 1: Farms & Fields */}
      {activeTab === 'farms' && (
        <div className="space-y-6">
          {/* Add Farm Form */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md animate-in fade-in duration-200">
              <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                {lang === 'hi' ? 'खेत का विवरण दर्ज करें' : 'Enter Farm Plot Details'}
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'खेत का नाम / पहचान *' : 'Farm Name / Plot Identifier *'}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="उदा: गंगा खेत — दौराला"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'कुल रकबा (एकड़) *' : 'Land Size (Acres) *'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.size_acres}
                      onChange={(e) => setFormData({ ...formData, size_acres: e.target.value })}
                      placeholder="10"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Pan-India Central Location Engine Selector */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#174D32]" />
                      {lang === 'hi' ? 'खेत का प्रशासनिक स्थान (LGD Location)' : 'Farm Administrative Location (LGD)'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Pan-India Engine
                    </span>
                  </div>
                  <NationwideLocationSelector
                    value={formData}
                    onChange={(loc) => setFormData((prev) => ({
                      ...prev,
                      ...loc,
                      lgd_code: loc.village_lgd_code || prev.lgd_code
                    }))}
                    showBlock
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'भूमि स्वामित्व (Tenure)' : 'Land Tenure'}
                    </label>
                    <select
                      value={formData.land_tenure}
                      onChange={(e) => setFormData({ ...formData, land_tenure: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    >
                      <option value="owned">Owned (निजी)</option>
                      <option value="leased">Leased (पट्टे पर)</option>
                      <option value="shared">Sharecropped (बटाई)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'खसरा / खाता संख्या' : 'Khasra / Plot Number'}
                    </label>
                    <input
                      type="text"
                      value={formData.khasra_number}
                      onChange={(e) => setFormData({ ...formData, khasra_number: e.target.value })}
                      placeholder="उदा: 342/1"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'LGD ग्राम कोड' : 'LGD Village Code'}
                    </label>
                    <input
                      type="text"
                      value={formData.lgd_code}
                      onChange={(e) => setFormData({ ...formData, lgd_code: e.target.value })}
                      placeholder="e.g. 119842"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'वर्तमान फसलें' : 'Current Crops'}
                    </label>
                    <input
                      type="text"
                      value={formData.current_crops}
                      onChange={(e) => setFormData({ ...formData, current_crops: e.target.value })}
                      placeholder="Wheat, Sugarcane"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'मिट्टी का प्रकार' : 'Soil Type'}
                    </label>
                    <input
                      type="text"
                      value={formData.soil_type}
                      onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                      placeholder="Alluvial Loam"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'सिंचाई साधन' : 'Irrigation Source'}
                    </label>
                    <input
                      type="text"
                      value={formData.irrigation_source}
                      onChange={(e) => setFormData({ ...formData, irrigation_source: e.target.value })}
                      placeholder="Tubewell + Canal"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                  >
                    {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{lang === 'hi' ? 'खेत सहेजें' : 'Save Farm'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Farms List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#174D32]" />
                <span className="text-xs">Loading farms...</span>
              </div>
            ) : farms.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Map className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {lang === 'hi' ? 'कोई खेत पंजीकृत नहीं है' : 'No farms saved yet'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {lang === 'hi'
                    ? 'नया खेत जोड़ें ताकि सेवाओं और प्रोजेक्ट्स को सीधे खेत के रकबे से जोड़ा जा सके।'
                    : 'Add a farm plot to coordinate machinery and labour operations with accurate land sizes.'}
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 rounded-xl bg-[#174D32] text-white text-xs font-bold"
                >
                  {lang === 'hi' ? 'पहला खेत जोड़ें' : 'Add First Farm'}
                </button>
              </div>
            ) : (
              farms.map((farm) => (
                <div
                  key={farm.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#84B547] transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            Tenure: {farm.land_tenure || 'owned'}
                          </span>
                          {farm.lgd_code && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              LGD: {farm.lgd_code}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-slate-900">{farm.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#174D32]" />
                          <span>{farm.village}{farm.block ? `, ${farm.block}` : ''}, {farm.district}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(farm.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="Delete farm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="my-4 p-3 rounded-2xl bg-[#FAF8F2] border border-amber-200/50 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {lang === 'hi' ? 'रकबा:' : 'Land Area:'}
                      </span>
                      <span className="text-sm font-black text-[#174D32]">
                        {farm.size_acres} Acres
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-[#84B547] shrink-0" />
                        <span><strong>{lang === 'hi' ? 'फसलें:' : 'Crops:'}</strong> {farm.current_crops}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
                        <span><strong>{lang === 'hi' ? 'सिंचाई:' : 'Irrigation:'}</strong> {farm.irrigation_source || 'Tubewell'}</span>
                      </div>
                      {farm.soil_type && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <FlaskConical className="w-4 h-4 text-amber-600 shrink-0" />
                          <span><strong>{lang === 'hi' ? 'मृदा:' : 'Soil:'}</strong> {farm.soil_type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Registered: {new Date(farm.created_at).toLocaleDateString()}</span>
                    <span className="font-semibold text-emerald-800">Active Record</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Soil Health Reports (Soil Intelligence) */}
      {activeTab === 'soil' && (
        <div className="space-y-6">
          <div className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-2xl space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-emerald-200 inline-block">
                Module 02 • Soil Intelligence
              </span>
              <h3 className="text-xl sm:text-2xl font-bold">
                {lang === 'hi' ? 'मृदा स्वास्थ्य कार्ड एवं प्रयोगशाला विश्लेषण' : 'Soil Health Card & Laboratory Analysis'}
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Record official laboratory soil testing results (pH, Electrical Conductivity, Organic Carbon, N-P-K and micronutrients) to calibrate agricultural operations and fertilizer planning.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {soilReports.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <FlaskConical className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {lang === 'hi' ? 'कोई मृदा परीक्षण रिपोर्ट नहीं मिली' : 'No soil reports on record'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {lang === 'hi'
                    ? 'अपने नजदीकी कृषि विज्ञान केंद्र (KVK) या सरकारी प्रयोगशाला की मृदा जांच रिपोर्ट जोड़ें।'
                    : 'Record your official Soil Health Card parameters to prevent over-fertilization and track soil carbon.'}
                </p>
                <button
                  onClick={() => setShowSoilModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#174D32] text-white text-xs font-bold"
                >
                  {lang === 'hi' ? 'पहली मृदा रिपोर्ट जोड़ें' : 'Add First Soil Report'}
                </button>
              </div>
            ) : (
              soilReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 hover:border-emerald-300 transition"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Sample ID: {report.sample_id || `SOIL-${report.id}`}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 mt-0.5">
                        {report.farm_name || 'Farm Plot'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Tested at: <strong>{report.lab_name}</strong> • Date: {report.sampling_date}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                      {report.soil_texture || 'Loam'}
                    </span>
                  </div>

                  {/* Primary Parameters */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">pH Level</span>
                      <span className="text-base font-black text-slate-900">{report.ph}</span>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">
                        {report.ph >= 6.5 && report.ph <= 7.5 ? 'Optimal' : report.ph < 6.5 ? 'Acidic' : 'Alkaline'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Organic Carbon</span>
                      <span className="text-base font-black text-slate-900">{report.organic_carbon_percent ?? report.organic_carbon_percentage}%</span>
                      <span className="text-[10px] text-amber-700 block mt-0.5">
                        {Number(report.organic_carbon_percent ?? report.organic_carbon_percentage) >= 0.75 ? 'High' : Number(report.organic_carbon_percent ?? report.organic_carbon_percentage) >= 0.5 ? 'Medium' : 'Low'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">EC (Salinity)</span>
                      <span className="text-base font-black text-slate-900">{report.ec ?? report.electrical_conductivity}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">dS/m Normal</span>
                    </div>
                  </div>

                  {/* Macronutrients N-P-K */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-amber-200/60 space-y-2 text-xs">
                    <span className="font-bold text-slate-800 text-[11px] block border-b border-amber-200/50 pb-1">
                      Available Macronutrients (kg/ha)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Nitrogen (N):</span>
                        <strong className="text-slate-900">{report.nitrogen_kg_ha ?? report.nitrogen_kg_per_ha} kg/ha</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Phosphorus (P):</span>
                        <strong className="text-slate-900">{report.phosphorus_kg_ha ?? report.phosphorus_kg_per_ha} kg/ha</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Potassium (K):</span>
                        <strong className="text-slate-900">{report.potassium_kg_ha ?? report.potassium_kg_per_ha} kg/ha</strong>
                      </div>
                    </div>
                  </div>

                  {/* Micronutrients */}
                  <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-1">
                    <span>Zinc (Zn): <strong>{report.zinc_ppm} ppm</strong></span>
                    <span>Iron (Fe): <strong>{report.iron_ppm} ppm</strong></span>
                    <span className="text-emerald-700 font-bold text-[11px]">Verified SHC Record</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Soil Report */}
      {showSoilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {lang === 'hi' ? 'मृदा परीक्षण रिपोर्ट दर्ज करें' : 'Record Soil Test Report'}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Soil Health Card / KVK Lab Record
                </p>
              </div>
              <button onClick={() => setShowSoilModal(false)} className="p-2 text-white/80 hover:text-white rounded-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleSoilSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'संबंधित खेत चुनें *' : 'Select Farm Plot *'}
                </label>
                <select
                  value={soilData.farm}
                  onChange={(e) => setSoilData({ ...soilData, farm: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                >
                  <option value="">-- Select Farm --</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.size_acres} Acres, {f.village})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'जांच की तारीख *' : 'Sampling Date *'}
                  </label>
                  <input
                    type="date"
                    value={soilData.sampling_date}
                    onChange={(e) => setSoilData({ ...soilData, sampling_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'सैंपल पहचान पत्र (ID)' : 'Sample ID'}
                  </label>
                  <input
                    type="text"
                    value={soilData.sample_id}
                    onChange={(e) => setSoilData({ ...soilData, sample_id: e.target.value })}
                    placeholder="STL-2026-089"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'प्रयोगशाला का नाम' : 'Laboratory Name'}
                  </label>
                  <input
                    type="text"
                    value={soilData.lab_name}
                    onChange={(e) => setSoilData({ ...soilData, lab_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'मिट्टी की बनावट (Texture)' : 'Soil Texture'}
                  </label>
                  <input
                    type="text"
                    value={soilData.soil_texture}
                    onChange={(e) => setSoilData({ ...soilData, soil_texture: e.target.value })}
                    placeholder="Sandy Clay Loam"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    pH Level *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={soilData.ph}
                    onChange={(e) => setSoilData({ ...soilData, ph: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    EC (dS/m)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={soilData.electrical_conductivity}
                    onChange={(e) => setSoilData({ ...soilData, electrical_conductivity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Organic C (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={soilData.organic_carbon_percentage}
                    onChange={(e) => setSoilData({ ...soilData, organic_carbon_percentage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nitrogen (kg/ha)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={soilData.nitrogen_kg_per_ha}
                    onChange={(e) => setSoilData({ ...soilData, nitrogen_kg_per_ha: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phosphorus (kg/ha)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={soilData.phosphorus_kg_per_ha}
                    onChange={(e) => setSoilData({ ...soilData, phosphorus_kg_per_ha: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Potassium (kg/ha)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={soilData.potassium_kg_per_ha}
                    onChange={(e) => setSoilData({ ...soilData, potassium_kg_per_ha: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSoilModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (lang === 'hi' ? 'रिपोर्ट सहेजें' : 'Save Report')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
