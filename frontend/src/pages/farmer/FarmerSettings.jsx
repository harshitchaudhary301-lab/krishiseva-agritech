import React, { useState } from 'react';
import { Settings, User, Phone, MapPin, Globe, Sprout, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerSettings() {
  const { user, refreshProfile } = useAuth();
  const { lang, setLang } = useLanguage();

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    village: user?.village || 'Daurala',
    district: user?.district || 'Meerut',
    state: user?.state || 'Uttar Pradesh',
    preferred_language: user?.farmer_profile?.preferred_language || lang || 'hi',
    total_land_acres: user?.farmer_profile?.total_land_acres || '20',
    primary_crops: user?.farmer_profile?.primary_crops || 'Wheat, Sugarcane, Mustard'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ error: '', success: '' });

    try {
      const payload = {
        ...formData,
        total_land_acres: parseFloat(formData.total_land_acres || 0)
      };
      await api.put('/accounts/me/', payload);
      await refreshProfile();
      if (formData.preferred_language !== lang) {
        setLang(formData.preferred_language);
        localStorage.setItem('krishi_lang', formData.preferred_language);
      }
      setMsg({ error: '', success: lang === 'hi' ? 'सेटिंग्स सफलतापूर्वक सहेजी गईं।' : 'Settings updated successfully.' });
    } catch (err) {
      console.error(err);
      setMsg({ error: 'Failed to update settings.', success: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {lang === 'hi' ? 'किसान खाता सेटिंग्स' : 'Farmer Profile & Account Settings'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'hi'
            ? 'अपनी व्यक्तिगत जानकारी, पसंदीदा भाषा और फसल विवरण को अपडेट करें।'
            : 'Manage your contact information, preferred language, and default crop preferences.'}
        </p>
      </div>

      {msg.error && (
        <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{msg.error}</span>
        </div>
      )}
      {msg.success && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg.success}</span>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'पहला नाम' : 'First Name'}
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'अंतिम नाम' : 'Last Name'}
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'मोबाइल नंबर' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'पसंदीदा भाषा' : 'Preferred Language'}
              </label>
              <select
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
              >
                <option value="hi">हिंदी (Hindi)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'गाँव' : 'Village'}
              </label>
              <input
                type="text"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'जिला' : 'District'}
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'राज्य' : 'State'}
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'कुल कृषि भूमि (एकड़)' : 'Total Land Area (Acres)'}
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.total_land_acres}
                onChange={(e) => setFormData({ ...formData, total_land_acres: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'मुख्य फसलें' : 'Primary Crops'}
              </label>
              <input
                type="text"
                value={formData.primary_crops}
                onChange={(e) => setFormData({ ...formData, primary_crops: e.target.value })}
                placeholder="Wheat, Sugarcane, Mustard"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{lang === 'hi' ? 'सेटिंग्स सहेजें' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
