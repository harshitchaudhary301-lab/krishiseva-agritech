import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { login, quickLogin } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const [error, setError] = useState('');

  const redirectByRole = (role) => {
    if (role === 'farmer') navigate('/farmer/overview');
    else if (role === 'worker') navigate('/worker/dashboard');
    else if (role === 'provider') navigate('/provider/dashboard');
    else navigate('/farmer/overview');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError(lang === 'hi' ? 'कृपया यूजरनेम और पासवर्ड भरें।' : 'Please enter both username and password.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const user = await login(username, password);
      redirectByRole(user.role);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid username or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async (key) => {
    setDemoLoading(key);
    setError('');
    try {
      const user = await quickLogin(key);
      redirectByRole(user.role);
    } catch (err) {
      console.error(err);
      setError('Failed to log in with demo account. Ensure Django backend is running.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand header */}
        <Link to="/" className="flex flex-col items-center group">
          <div className="w-12 h-12 rounded-2xl bg-[#174D32] flex items-center justify-center text-white shadow-lg mb-2">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12" strokeWidth="2" strokeLinecap="round" stroke="#84B547"/>
              <path d="M12 6V18M12 11L8 8M12 14L16 11M12 17L8 15" strokeWidth="2" strokeLinecap="round" stroke="#FFFFFF"/>
            </svg>
          </div>
          <span className="text-2xl font-black text-[#174D32]">
            Krishi<span className="text-[#84B547]">Seva</span>
          </span>
          <span className="text-xs text-slate-500 font-hindi mt-0.5">
            खेती की हर जरूरत, एक जगह।
          </span>
        </Link>
        <h2 className="mt-4 text-center text-xl font-bold text-slate-900">
          {lang === 'hi' ? 'अपने खाते में लॉगिन करें' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Quick Demo Login Box */}
        <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 rounded-2xl p-4 mb-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2.5">
            <Sparkles className="w-4 h-4 text-[#E8B44C]" />
            <span>{lang === 'hi' ? 'एक-क्लिक त्वरित डेमो लॉगिन:' : 'One-Click Quick Demo Switch:'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemo('farmer')}
              disabled={demoLoading !== null}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 font-bold text-emerald-900 text-left shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between"
            >
              <span>👨‍🌾 Ramesh (Farmer)</span>
              {demoLoading === 'farmer' && <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />}
            </button>
            <button
              onClick={() => handleDemo('worker')}
              disabled={demoLoading !== null}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-lime-500 font-bold text-lime-900 text-left shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between"
            >
              <span>👷 Suresh (Worker)</span>
              {demoLoading === 'worker' && <Loader2 className="w-3 h-3 animate-spin text-lime-700" />}
            </button>
            <button
              onClick={() => handleDemo('mechanic')}
              disabled={demoLoading !== null}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-500 font-bold text-amber-900 text-left shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between"
            >
              <span>🔧 Vikram (Mechanic)</span>
              {demoLoading === 'mechanic' && <Loader2 className="w-3 h-3 animate-spin text-amber-700" />}
            </button>
            <button
              onClick={() => handleDemo('machinery')}
              disabled={demoLoading !== null}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-sky-500 font-bold text-sky-900 text-left shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between"
            >
              <span>🚜 Baldev (Harvester)</span>
              {demoLoading === 'machinery' && <Loader2 className="w-3 h-3 animate-spin text-sky-700" />}
            </button>
          </div>
        </div>

        {/* Regular Login Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'यूजरनेम या ईमेल' : 'Username or Email'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ramesh_farmer"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] focus:border-[#174D32] outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'पासवर्ड' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] focus:border-[#174D32] outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-sm font-bold shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'hi' ? 'सत्यापन हो रहा है...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{t('login')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            <span>{lang === 'hi' ? 'नया खाता बनाना चाहते हैं?' : "Don't have an account yet?"}{' '}</span>
            <Link to="/register" className="font-bold text-[#174D32] hover:underline">
              {t('register')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
