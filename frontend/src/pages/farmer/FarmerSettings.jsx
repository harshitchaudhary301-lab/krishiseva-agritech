import React, { useState } from 'react';
import { Settings, User, Phone, MapPin, Globe, Sprout, CheckCircle2, Loader2, AlertCircle, Lock, KeyRound, ShieldAlert } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import NationwideLocationSelector from '../../components/NationwideLocationSelector';

export default function FarmerSettings() {
  const { user, refreshProfile, logout } = useAuth();
  const { lang, setLang } = useLanguage();

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  // Password Change State
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ error: '', success: '' });

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordData.old_password || !passwordData.new_password) return;
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordMsg({ error: lang === 'hi' ? 'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।' : 'New password and confirm password do not match.', success: '' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg({ error: '', success: '' });
    try {
      const res = await api.post('/accounts/change-password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      if (res.data.token) {
        localStorage.setItem('krishi_token', res.data.token);
      }
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setPasswordMsg({ error: '', success: lang === 'hi' ? 'पासवर्ड सफलतापूर्वक बदल दिया गया है।' : 'Password changed successfully. Prior credentials revoked.' });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.old_password
        ? err.response.data.old_password[0]
        : err.response?.data?.new_password
        ? err.response.data.new_password[0]
        : 'Failed to change password.';
      setPasswordMsg({ error: errMsg, success: '' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRevokeCredentials = async () => {
    if (!window.confirm(lang === 'hi' ? 'क्या आप सभी सत्रों से लॉगआउट करके क्रेडेंशियल रद्द करना चाहते हैं?' : 'Are you sure you want to revoke credentials and log out?')) return;
    try {
      await api.post('/accounts/revoke-token/');
    } catch (e) {
      // ignore
    } finally {
      await logout();
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

          {/* Nationwide LGD Location Selector */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#174D32]" />
                {lang === 'hi' ? 'निवास / फार्म स्थान (Pan-India Location)' : 'Base Location (Pan-India)'}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                LGD Integrated
              </span>
            </div>
            <NationwideLocationSelector
              value={formData}
              onChange={(loc) => setFormData((prev) => ({ ...prev, ...loc }))}
              compact
            />
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

      {/* Security & Password Management */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-[#174D32] rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'hi' ? 'सुरक्षा एवं पासवर्ड प्रबंधन' : 'Security & Credentials'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'hi'
                  ? 'अपना पासवर्ड बदलें और सक्रिय लॉगिन सत्र प्रबंधित करें।'
                  : 'Update your password and manage active authentication tokens.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRevokeCredentials}
            className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'सभी क्रेडेंशियल रद्द करें' : 'Revoke All Tokens'}</span>
          </button>
        </div>

        {passwordMsg.error && (
          <div className="mb-4 p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordMsg.error}</span>
          </div>
        )}
        {passwordMsg.success && (
          <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordMsg.success}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'वर्तमान पासवर्ड' : 'Current Password'}
              </label>
              <input
                type="password"
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'नया पासवर्ड' : 'New Password'}
              </label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'नया पासवर्ड पुष्टि करें' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {passwordSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{lang === 'hi' ? 'पासवर्ड अपडेट करें' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
