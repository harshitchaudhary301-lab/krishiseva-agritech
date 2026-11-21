import React, { useState, useEffect } from 'react';
import { Map, Plus, Trash2, Edit2, Loader2, CheckCircle2, AlertCircle, Droplets, Sprout, MapPin } from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function FarmerFarms() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    village: user?.village || 'Daurala',
    district: user?.district || 'Meerut',
    state: 'Uttar Pradesh',
    size_acres: '10',
    current_crops: 'Wheat, Sugarcane',
    soil_type: 'Alluvial Loam',
    irrigation_source: 'Tubewell + Canal Channel'
  });

  const fetchFarms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/farm-projects/farms/');
      setFarms(res.data);
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
        district: user?.district || 'Meerut',
        state: 'Uttar Pradesh',
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
          <h2 className="text-2xl font-bold text-slate-900">
            {lang === 'hi' ? 'मेरा खेत — भूमि व फसल रिकॉर्ड' : 'My Farm — Land & Crop Profiles'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'hi'
              ? 'सत्यापित भूमि का रिकॉर्ड, फसल का प्रकार और सिंचाई साधन। यह डेटा सेवाओं व प्रोजेक्ट्स से जुड़ता है।'
              : 'Save your farm plots, approximate land areas, and crop types backed by real database records.'}
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? (lang === 'hi' ? 'बंद करें' : 'Close Form') : (lang === 'hi' ? 'नया खेत जोड़ें' : 'Add New Farm Plot')}</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'गाँव *' : 'Village *'}
                </label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'जिला *' : 'District *'}
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'राज्य *' : 'State *'}
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
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
                    <h3 className="font-bold text-base text-slate-900">{farm.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#174D32]" />
                      <span>{farm.village}, {farm.district}</span>
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
  );
}
