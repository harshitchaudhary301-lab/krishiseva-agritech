import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, IndianRupee, Layers, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function CreateRequestModal({ isOpen, onClose, onCreated, defaultProjectId = null, defaultCategorySlug = null }) {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    category: '',
    farm_project: defaultProjectId || '',
    title: '',
    description: '',
    village: user?.village || 'Daurala',
    district: user?.district || 'Meerut',
    required_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    scope_quantity: '',
    budget_max: ''
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [catRes, projRes] = await Promise.all([
            api.get('/services/categories/'),
            api.get('/farm-projects/projects/')
          ]);
          // Only MVP active categories can be requested
          const activeCats = catRes.data.filter(c => c.is_active);
          setCategories(activeCats);
          setProjects(projRes.data);

          if (defaultCategorySlug) {
            const matched = activeCats.find(c => c.slug === defaultCategorySlug);
            if (matched) {
              setFormData(prev => ({ ...prev, category: matched.id }));
            }
          } else if (activeCats.length > 0 && !formData.category) {
            setFormData(prev => ({ ...prev, category: activeCats[0].id }));
          }

          if (defaultProjectId) {
            setFormData(prev => ({ ...prev, farm_project: defaultProjectId }));
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, defaultProjectId, defaultCategorySlug]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.title || !formData.required_date || !formData.scope_quantity) {
      setError(lang === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        category: formData.category,
        title: formData.title,
        description: formData.description || formData.title,
        village: formData.village,
        district: formData.district,
        required_date: formData.required_date,
        scope_quantity: formData.scope_quantity,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        farm_project: formData.farm_project ? parseInt(formData.farm_project) : null
      };

      const res = await api.post('/bookings/requests/', payload);
      if (onCreated) {
        onCreated(res.data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit service request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">
              {lang === 'hi' ? 'नया सेवा अनुरोध बनाएं' : 'Create New Service Request'}
            </h3>
            <p className="text-xs text-emerald-100 mt-1">
              {lang === 'hi'
                ? 'मांग दर्ज करें — स्थानीय सत्यापित प्रदाताओं से पारदर्शी कोटेशन प्राप्त होंगे।'
                : 'Post requirement to receive competitive quotes from verified nearby providers.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs border-b border-red-200">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'hi' ? 'सेवा श्रेणी *' : 'Service Category *'}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] focus:border-[#174D32] outline-none bg-slate-50 font-medium"
              required
            >
              <option value="">{lang === 'hi' ? '-- श्रेणी चुनें --' : '-- Select Category --'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === 'hi' ? c.name_hi : c.name_en} ({c.base_unit})
                </option>
              ))}
            </select>
          </div>

          {/* Link to Farm Project */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
              <span>{lang === 'hi' ? 'फार्म प्रोजेक्ट से जोड़ें (वैकल्पिक)' : 'Link to Farm Project (Optional)'}</span>
              <span className="text-[11px] text-emerald-700 font-semibold">Core Coordination USP</span>
            </label>
            <select
              value={formData.farm_project}
              onChange={(e) => setFormData({ ...formData, farm_project: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none bg-slate-50"
            >
              <option value="">{lang === 'hi' ? '-- स्वतंत्र अनुरोध (कोई प्रोजेक्ट नहीं) --' : '-- Standalone Request (No Project) --'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.crop} - {p.target_area_acres} Acres)
                </option>
              ))}
            </select>
          </div>

          {/* Request Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'hi' ? 'अनुरोध का शीर्षक *' : 'Request Title *'}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={lang === 'hi' ? 'उदा: 20 एकड़ गेहूं कटाई हेतु कंबाइन हार्वेस्टर' : 'e.g. Combine Harvester for 20 Acres Wheat'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
              required
            />
          </div>

          {/* Scope / Quantity */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'hi' ? 'कार्य का दायरा / मात्रा *' : 'Work Quantity / Scope *'}
            </label>
            <input
              type="text"
              value={formData.scope_quantity}
              onChange={(e) => setFormData({ ...formData, scope_quantity: e.target.value })}
              placeholder={lang === 'hi' ? 'उदा: 5 श्रमिक x 2 दिन / 15 एकड़ खेत' : 'e.g. 5 Workers for 2 Days / 15 Acres / 1 Tractor Overhaul'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
              required
            />
          </div>

          {/* Two Columns: Date & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {lang === 'hi' ? 'आवश्यक तारीख *' : 'Required Date *'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.required_date}
                  onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {lang === 'hi' ? 'अधिकतम बजट (₹) (वैकल्पिक)' : 'Estimated Budget (₹) (Optional)'}
              </label>
              <input
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                placeholder="₹"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
              />
            </div>
          </div>

          {/* Village & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {lang === 'hi' ? 'गाँव *' : 'Village *'}
              </label>
              <input
                type="text"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {lang === 'hi' ? 'जिला *' : 'District *'}
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'hi' ? 'अतिरिक्त विवरण' : 'Detailed Notes'}
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={lang === 'hi' ? 'विशेष आवश्यकताएं, समय या उपकरण के निर्देश...' : 'Any special machinery attachments, timings, or field conditions...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174D32] text-white text-sm font-bold hover:bg-[#0e3321] transition shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'hi' ? 'दर्ज हो रहा है...' : 'Posting...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#84B547]" />
                  <span>{lang === 'hi' ? 'अनुरोध प्रकाशित करें' : 'Publish Request'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
