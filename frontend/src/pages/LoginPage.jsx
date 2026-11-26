import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, ArrowRight, Sparkles, Loader2, AlertCircle, KeyRound, CheckCircle2, X } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../constants/demoUsers';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { login, quickLogin } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const [error, setError] = useState('');

  // Password Recovery State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: request, 2: confirm
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetUid, setResetUid] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState({ error: '', success: '' });

  const redirectByRole = (user) => {
    const role = typeof user === 'string' ? user : (user?.role || 'farmer');
    const fromPath = location.state?.from;
    const requestedCat = location.state?.category;

    // Validate permitted navigation destination according to routing rules
    if (fromPath && typeof fromPath === 'string' && fromPath.startsWith('/')) {
      if (fromPath.startsWith('/farmer') && role === 'farmer') {
        const dest = requestedCat ? `${fromPath}${fromPath.includes('?') ? '&' : '?'}requestCategory=${encodeURIComponent(requestedCat)}` : fromPath;
        navigate(dest, { replace: true });
        return;
      }
      if (fromPath.startsWith('/worker') && role === 'worker') {
        navigate(fromPath, { replace: true });
        return;
      }
      if (fromPath.startsWith('/provider') && role === 'provider') {
        navigate(fromPath, { replace: true });
        return;
      }
      if (fromPath.startsWith('/admin') && (role === 'admin' || user?.is_superuser)) {
        navigate(fromPath, { replace: true });
        return;
      }
    }

    // Role-based default destination
    if (role === 'farmer') {
      const dest = requestedCat ? `/farmer/overview?requestCategory=${encodeURIComponent(requestedCat)}` : '/farmer/overview';
      navigate(dest, { replace: true });
    } else if (role === 'worker') {
      navigate('/worker/dashboard', { replace: true });
    } else if (role === 'provider') {
      navigate('/provider/dashboard', { replace: true });
    } else if (role === 'admin') {
      navigate('/admin-dashboard', { replace: true });
    } else {
      navigate('/farmer/overview', { replace: true });
    }
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
      redirectByRole(user);
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
      redirectByRole(user);
    } catch (err) {
      console.error(err);
      setError('Failed to log in with demo account. Ensure Django backend is running.');
    } finally {
      setDemoLoading(null);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotMsg({ error: '', success: '' });
    try {
      const res = await api.post('/accounts/password-reset/request/', { email: forgotEmail });
      if (res.data.dev_uid && res.data.dev_token) {
        setResetUid(res.data.dev_uid);
        setResetToken(res.data.dev_token);
        setForgotStep(2);
        setForgotMsg({ error: '', success: lang === 'hi' ? 'रीसेट टोकन प्राप्त हुआ। कृपया नया पासवर्ड दर्ज करें।' : 'Reset token generated. Please enter your new password.' });
      } else {
        setForgotMsg({ error: '', success: res.data.message || 'Password reset instructions sent.' });
      }
    } catch (err) {
      console.error(err);
      setForgotMsg({ error: 'Failed to request password reset. Check the email or username.', success: '' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotConfirm = async (e) => {
    e.preventDefault();
    if (!newPassword || !resetToken || !resetUid) return;
    setForgotLoading(true);
    setForgotMsg({ error: '', success: '' });
    try {
      const res = await api.post('/accounts/password-reset/confirm/', {
        uid: resetUid,
        token: resetToken,
        new_password: newPassword
      });
      const { token: authToken, user: userData } = res.data;
      localStorage.setItem('krishi_token', authToken);
      localStorage.setItem('krishi_user', JSON.stringify(userData));
      setShowForgot(false);
      redirectByRole(userData.role);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error
        ? (Array.isArray(err.response.data.error) ? err.response.data.error.join(' ') : String(err.response.data.error))
        : 'Failed to reset password.';
      setForgotMsg({ error: errMsg, success: '' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4EE] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand header */}
        <Link to="/" className="flex flex-col items-center group">
          <div className="w-12 h-12 rounded-2xl bg-[#174D32] flex items-center justify-center text-white shadow-lg mb-2">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12" strokeWidth="2" strokeLinecap="round" stroke="#84B547"/>
              <path d="M12 6V18M12 11L8 8M12 14L16 11M12 17L8 15" strokeWidth="2" strokeLinecap="round" stroke="#FFFFFF"/>
            </svg>
          </div>
          <span className="text-2xl font-black text-[#101510]">
            Krishi<span className="text-[#84B547]">Seva</span>
          </span>
          <span className="text-xs text-[#64748B] font-hindi mt-0.5">
            खेती की हर जरूरत, एक जगह।
          </span>
        </Link>
        <h2 className="mt-4 text-center text-2xl font-black text-[#172D20]">
          {lang === 'hi' ? 'अपने खाते में लॉगिन करें' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Quick Demo Login Box */}
        <div className="bg-[#FAF8F2] border border-[#E2E8DF] rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172D20] mb-2.5">
            <Sparkles className="w-4 h-4 text-[#E8B44C]" />
            <span>{lang === 'hi' ? 'एक-क्लिक त्वरित डेमो लॉगिन:' : 'One-Click Quick Demo Switch:'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemo('farmer')}
              disabled={demoLoading !== null}
              className="p-2 rounded-xl bg-white border border-[#E2E8DF] hover:border-[#174D32] font-bold text-[#172D20] text-left shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between"
            >
              <span>👨‍🌾 Ramesh (Farmer)</span>
              {demoLoading === 'farmer' && <Loader2 className="w-3 h-3 animate-spin text-[#174D32]" />}
            </button>
            <button
              onClick={() => handleDemo('worker')}
              disabled={demoLoading !== null}
              className="p-2 rounded-xl bg-white border border-[#E2E8DF] hover:border-[#174D32] font-bold text-[#172D20] text-left shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between"
            >
              <span>👷 Suresh (Worker)</span>
              {demoLoading === 'worker' && <Loader2 className="w-3 h-3 animate-spin text-[#174D32]" />}
            </button>
            <button
              onClick={() => handleDemo('mechanic')}
              disabled={demoLoading !== null}
              className="p-2 rounded-xl bg-white border border-[#E2E8DF] hover:border-[#174D32] font-bold text-[#172D20] text-left shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between"
            >
              <span>🔧 Vikram (Mechanic)</span>
              {demoLoading === 'mechanic' && <Loader2 className="w-3 h-3 animate-spin text-[#174D32]" />}
            </button>
            <button
              onClick={() => handleDemo('machinery')}
              disabled={demoLoading !== null}
              className="p-2 rounded-xl bg-white border border-[#E2E8DF] hover:border-[#174D32] font-bold text-[#172D20] text-left shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between"
            >
              <span>🚜 Baldev (Harvester)</span>
              {demoLoading === 'machinery' && <Loader2 className="w-3 h-3 animate-spin text-[#174D32]" />}
            </button>
            <button
              onClick={() => handleDemo('admin')}
              disabled={demoLoading !== null}
              className="col-span-2 p-2 rounded-xl bg-white border border-[#E2E8DF] hover:border-[#174D32] font-bold text-[#174D32] text-left shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between"
            >
              <span>🛡️ Platform Admin (Compliance Desk)</span>
              {demoLoading === 'admin' && <Loader2 className="w-3 h-3 animate-spin text-[#174D32]" />}
            </button>
          </div>
        </div>

        {/* Regular Login Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-[#E2E8DF] sm:px-10">
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {lang === 'hi' ? 'पासवर्ड' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotStep(1);
                    setForgotMsg({ error: '', success: '' });
                  }}
                  className="text-xs font-semibold text-[#174D32] hover:underline cursor-pointer"
                >
                  {lang === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                </button>
              </div>
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
            <Link to="/register" state={location.state} className="font-bold text-[#174D32] hover:underline">
              {t('register')}
            </Link>
          </div>
        </div>

        {/* Password Recovery Modal */}
        {showForgot && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#174D32]" />
                  <h3 className="font-bold text-slate-900 text-base">
                    {lang === 'hi' ? 'पासवर्ड पुनर्प्राप्ति' : 'Recover Password'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowForgot(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {forgotMsg.error && (
                <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{forgotMsg.error}</span>
                </div>
              )}
              {forgotMsg.success && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotMsg.success}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotRequest} className="mt-4 space-y-4">
                  <p className="text-xs text-slate-600">
                    {lang === 'hi'
                      ? 'अपना पंजीकृत ईमेल या यूजरनेम दर्ज करें। हम आपको पासवर्ड रीसेट निर्देश भेजेंगे।'
                      : 'Enter your registered email address or username to receive password reset instructions.'}
                  </p>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'ईमेल या यूजरनेम' : 'Email or Username'}
                    </label>
                    <input
                      type="text"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="farmer@krishiseva.in"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#84B547]"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgot(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {forgotLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{lang === 'hi' ? 'टोकन अनुरोध करें' : 'Request Token'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotConfirm} className="mt-4 space-y-4">
                  <p className="text-xs text-slate-600">
                    {lang === 'hi'
                      ? 'नया सुरक्षित पासवर्ड दर्ज करें।'
                      : 'Enter your new password to complete account recovery.'}
                  </p>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'नया पासवर्ड' : 'New Password'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#84B547]"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      {lang === 'hi' ? 'वापस' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {forgotLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{lang === 'hi' ? 'पासवर्ड रीसेट करें व लॉगिन करें' : 'Reset Password & Sign In'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
