import React, { useState } from 'react';
import { ShieldCheck, Star, MapPin, Wrench, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ProviderProfileView() {
  const { user, refreshProfile } = useAuth();
  const { lang } = useLanguage();

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    village: user?.village || 'Daurala',
    district: user?.district || 'Meerut',
    business_name: user?.provider_profile?.business_name || '',
    service_categories: user?.provider_profile?.service_categories || 'tractor_mechanic',
    service_villages: user?.provider_profile?.service_villages || 'Daurala, Sardhana, Mawana',
    service_radius_km: user?.provider_profile?.service_radius_km || 25,
    qualifications: user?.provider_profile?.qualifications || '',
    machinery_details: user?.provider_profile?.machinery_details || '',
    bio: user?.provider_profile?.bio || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ error: '', success: '' });

    try {
      await api.put('/accounts/me/', formData);
      await refreshProfile();
      setMsg({ error: '', success: lang === 'hi' ? 'प्रोफाइल सफलतापूर्वक अपडेट हो गई।' : 'Profile updated successfully.' });
    } catch (err) {
      console.error(err);
      setMsg({ error: 'Failed to update profile.', success: '' });
    } finally {
      setSaving(false);
    }
  };

  const isVerified = user?.provider_profile?.verification_status === 'verified';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {lang === 'hi' ? 'प्रदाता प्रोफाइल एवं सत्यापन' : 'Provider Profile & Verification Status'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'hi'
            ? 'अपनी वर्कशॉप, सेवा क्षेत्र और प्रमाणन का विवरण अपडेट करें।'
            : 'Manage your workshop credentials, service villages, and verification.'}
        </p>
      </div>

      {msg.error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {msg.error}
        </div>
      )}
      {msg.success && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
          {msg.success}
        </div>
      )}

      {/* Verification Badge Box */}
      <div className={`p-6 rounded-3xl border flex items-center justify-between gap-4 ${
        isVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white rounded-2xl shadow-xs">
            <ShieldCheck className={`w-8 h-8 ${isVerified ? 'text-[#84B547]' : 'text-amber-600'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base">
                {isVerified ? 'Platform Verified Provider' : 'Verification Under Review'}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200">
                {user?.provider_profile?.verification_status || 'verified'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Verified providers appear with top matching priority in farmer service requests.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1 text-sm font-black px-3 py-1 rounded-full bg-white shadow-xs">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{user?.provider_profile?.rating || 4.9}★</span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'व्यवसाय / वर्कशॉप का नाम' : 'Business / Workshop Name'}
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'संपर्क मोबाइल' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'मुख्य गाँव' : 'Base Village'}
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
                {lang === 'hi' ? 'सेवा दायरा (किमी)' : 'Service Radius (km)'}
              </label>
              <input
                type="number"
                value={formData.service_radius_km}
                onChange={(e) => setFormData({ ...formData, service_radius_km: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {lang === 'hi' ? 'कवर किए जाने वाले गाँव' : 'Covered Service Villages'}
            </label>
            <input
              type="text"
              value={formData.service_villages}
              onChange={(e) => setFormData({ ...formData, service_villages: e.target.value })}
              placeholder="Daurala, Sardhana, Mawana, Meerut Rural"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {lang === 'hi' ? 'योग्यता व प्रमाणपत्र' : 'Qualifications & Certifications'}
            </label>
            <input
              type="text"
              value={formData.qualifications}
              onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
              placeholder="ITI Diesel Mechanic, Licensed Electrician"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {lang === 'hi' ? 'उपकरण व मशीनरी' : 'Machinery & Equipment Available'}
            </label>
            <input
              type="text"
              value={formData.machinery_details}
              onChange={(e) => setFormData({ ...formData, machinery_details: e.target.value })}
              placeholder="Harvesters, hydraulic testing kit, mobile repair van"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {lang === 'hi' ? 'कार्य विवरण / बायो' : 'Workshop Bio'}
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : (lang === 'hi' ? 'प्रोफाइल सहेजें' : 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
