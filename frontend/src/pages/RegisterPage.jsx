import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Phone, MapPin, Mail, Tractor, Wrench, Users, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NationwideLocationSelector from '../components/NationwideLocationSelector';

export default function RegisterPage() {
  const { register } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState('farmer');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    state: 'Uttar Pradesh',
    district: 'Meerut',
    village: 'Daurala',
    // Farmer
    land_acres: '10',
    primary_crops: 'Wheat, Sugarcane',
    // Worker
    skills: 'Wheat Harvesting, Sowing',
    daily_wage_rate: '500',
    // Provider
    business_name: '',
    service_categories: 'tractor_mechanic',
    service_villages: 'Daurala, Sardhana, Mawana',
    qualifications: 'ITI Diesel Mechanic Certified',
    machinery_details: 'Mobile diagnostic & repair unit',
    confirm_adult: true,
    consent_terms: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const redirectByRole = (userRole) => {
    if (userRole === 'farmer') navigate('/farmer/overview');
    else if (userRole === 'worker') navigate('/worker/dashboard');
    else if (userRole === 'provider') navigate('/provider/dashboard');
    else navigate('/farmer/overview');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.phone || !formData.village) {
      setError(lang === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }

    if ((role === 'worker' || role === 'provider') && !formData.confirm_adult) {
      setError(lang === 'hi' ? 'वयस्क घोषणा आवश्यक: श्रमिक एवं सेवा प्रदाता की आयु 18 वर्ष या उससे अधिक होनी चाहिए।' : 'Adult declaration required: Agricultural workers and service providers must confirm they are at least 18 years of age.');
      return;
    }

    if (!formData.consent_terms) {
      setError(lang === 'hi' ? 'कृपया सेवा की शर्तें और गोपनीयता नीति स्वीकार करें।' : 'Please accept the Terms of Service & Privacy Policy to proceed.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        role,
        ...formData,
        confirm_adult: Boolean(formData.confirm_adult),
        consent_terms: Boolean(formData.consent_terms),
        consent_privacy: Boolean(formData.consent_terms),
        land_acres: parseFloat(formData.land_acres || 0),
        daily_wage_rate: parseFloat(formData.daily_wage_rate || 500)
      };

      const user = await register(payload);
      redirectByRole(user.role);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data
        ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(' | ')
        : 'Registration failed. Please check your inputs.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#174D32] flex items-center justify-center text-white shadow-lg mb-2">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12" strokeWidth="2" strokeLinecap="round" stroke="#84B547"/>
                <path d="M12 6V18M12 11L8 8M12 14L16 11M12 17L8 15" strokeWidth="2" strokeLinecap="round" stroke="#FFFFFF"/>
              </svg>
            </div>
            <span className="text-2xl font-black text-[#174D32]">
              Krishi<span className="text-[#84B547]">Seva</span>
            </span>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
            {lang === 'hi' ? 'कृषि सेवा पर नया खाता बनाएं' : 'Create your KrishiSeva account'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {lang === 'hi' ? 'खेती की हर जरूरत, एक जगह।' : 'The Farm Operations Coordination Platform'}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-200">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Selection Tabs */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 text-center">
              {lang === 'hi' ? 'आपकी मुख्य भूमिका चुनें *' : 'Select Your Primary Role *'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Farmer */}
              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  role === 'farmer'
                    ? 'border-[#174D32] bg-emerald-50/70 shadow-xs ring-2 ring-[#174D32]'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-white w-fit shadow-2xs text-[#174D32] mb-3">
                  <Tractor className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">
                    {lang === 'hi' ? 'किसान' : 'Farmer'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {lang === 'hi' ? 'सेवा मांगें और प्रोजेक्ट बनाएं' : 'Post requests & farm projects'}
                  </div>
                </div>
              </button>

              {/* Worker */}
              <button
                type="button"
                onClick={() => setRole('worker')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  role === 'worker'
                    ? 'border-[#84B547] bg-lime-50/70 shadow-xs ring-2 ring-[#84B547]'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-white w-fit shadow-2xs text-[#84B547] mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">
                    {lang === 'hi' ? 'कृषि श्रमिक' : 'Farm Worker'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {lang === 'hi' ? 'कटाई व बुवाई मजदूरी करें' : 'Harvesting & farm labour jobs'}
                  </div>
                </div>
              </button>

              {/* Provider */}
              <button
                type="button"
                onClick={() => setRole('provider')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  role === 'provider'
                    ? 'border-[#E8B44C] bg-amber-50/70 shadow-xs ring-2 ring-[#E8B44C]'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-white w-fit shadow-2xs text-amber-700 mb-3">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">
                    {lang === 'hi' ? 'सेवा प्रदाता' : 'Service Provider'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {lang === 'hi' ? 'मैकेनिक / मशीनरी किराए पर' : 'Mechanic / Machinery Fleet'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'यूजरनेम (लॉगिन हेतु) *' : 'Username *'}
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. ramesh_kisan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'ईमेल पता' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'सुरक्षित पासवर्ड (कम से कम 6 अक्षर) *' : 'Password (min. 6 chars) *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                required
              />
            </div>

            {/* Nationwide Central Location Engine Selector */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#174D32]" />
                  {lang === 'hi' ? 'स्थान विवरण (Pan-India Location)' : 'Location Details (Pan-India)'}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  LGD 2026 Engine
                </span>
              </div>
              <NationwideLocationSelector
                value={formData}
                onChange={(loc) => setFormData((prev) => ({ ...prev, ...loc }))}
                required
              />
            </div>

            {/* Role-Specific Fields */}
            {role === 'farmer' && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3 mt-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                  {lang === 'hi' ? 'किसान प्रोफाइल विवरण' : 'Farm Profile Details'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'hi' ? 'कुल कृषि भूमि (एकड़)' : 'Total Land (Acres)'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.land_acres}
                      onChange={(e) => setFormData({ ...formData, land_acres: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'hi' ? 'मुख्य फसलें' : 'Primary Crops'}
                    </label>
                    <input
                      type="text"
                      value={formData.primary_crops}
                      onChange={(e) => setFormData({ ...formData, primary_crops: e.target.value })}
                      placeholder="Wheat, Sugarcane, Mustard"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {role === 'worker' && (
              <div className="p-4 rounded-2xl bg-lime-50/60 border border-lime-200 space-y-3 mt-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-lime-900">
                  {lang === 'hi' ? 'श्रमिक हुनर व मजदूरी' : 'Worker Skills & Wage'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'hi' ? 'हुनर / कार्य प्रकार' : 'Key Skills'}
                    </label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="Harvesting, Bagging, Sowing"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'hi' ? 'दैनिक मजदूरी दर (₹ / दिन)' : 'Expected Daily Wage (₹)'}
                    </label>
                    <input
                      type="number"
                      value={formData.daily_wage_rate}
                      onChange={(e) => setFormData({ ...formData, daily_wage_rate: e.target.value })}
                      placeholder="500"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {role === 'provider' && (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3 mt-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  {lang === 'hi' ? 'व्यवसाय व सेवा विवरण' : 'Business & Equipment Details'}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'hi' ? 'वर्कशॉप / व्यवसाय का नाम' : 'Workshop / Business Name'}
                    </label>
                    <input
                      type="text"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="e.g. Kisan Tractor Workshop"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'hi' ? 'सेवा श्रेणी' : 'Primary Category'}
                      </label>
                      <select
                        value={formData.service_categories}
                        onChange={(e) => setFormData({ ...formData, service_categories: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                      >
                        <option value="tractor_mechanic">Tractor Mechanic</option>
                        <option value="machinery_rental">Machinery Rental</option>
                        <option value="tubewell_repair">Tubewell Repair</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {lang === 'hi' ? 'मशीनरी / उपकरण' : 'Available Machinery / Tools'}
                      </label>
                      <input
                        type="text"
                        value={formData.machinery_details}
                        onChange={(e) => setFormData({ ...formData, machinery_details: e.target.value })}
                        placeholder="Harvester, toolkit, winch"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legal & Age Consent Declarations */}
            <div className="pt-3 pb-1 space-y-2.5 text-xs text-slate-700">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.confirm_adult}
                  onChange={(e) => setFormData({ ...formData, confirm_adult: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-[#174D32] focus:ring-[#84B547] border-slate-300"
                />
                <span>
                  {lang === 'hi'
                    ? 'मैं पुष्टि करता हूँ कि मेरी आयु 18 वर्ष या उससे अधिक है (श्रमिकों एवं सेवा प्रदाताओं के लिए अनिवार्य)।'
                    : 'I confirm that I am 18 years of age or older (Adult declaration required for agricultural workers & providers).'}
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consent_terms}
                  onChange={(e) => setFormData({ ...formData, consent_terms: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-[#174D32] focus:ring-[#84B547] border-slate-300"
                />
                <span>
                  {lang === 'hi'
                    ? 'मैं कृषि सेवा के नियम, शर्तें और गोपनीयता नीति (Terms of Service & Privacy Policy) स्वीकार करता हूँ।'
                    : 'I agree to the KrishiSeva Terms of Service & Privacy Policy.'}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3.5 px-4 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-sm font-bold shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'hi' ? 'खाता बनाया जा रहा है...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <span>{lang === 'hi' ? 'पंजीकरण पूरा करें' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            <span>{lang === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}</span>
            <Link to="/login" className="font-bold text-[#174D32] hover:underline">
              {t('login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
