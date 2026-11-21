import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Globe, Sparkles, User, LogOut, LayoutDashboard, ChevronDown, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationDropdown from './NotificationDropdown';
import QuickDemoModal from './QuickDemoModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const handleReplayIntro = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    setTimeout(() => {
      window.dispatchEvent(new Event('krishi_replay_intro'));
    }, 60);
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'farmer') return '/farmer/overview';
    if (user.role === 'worker') return '/worker/dashboard';
    if (user.role === 'provider') return '/provider/dashboard';
    return '/farmer/overview';
  };

  const navLinks = [
    { name: lang === 'hi' ? 'मुख्य पृष्ठ' : 'Home', href: '/' },
    { name: lang === 'hi' ? 'कृषि सेवाएं' : 'Services', href: '/#services' },
    { name: lang === 'hi' ? 'कार्यप्रणाली' : 'How It Works', href: '/#how-it-works' },
    { name: lang === 'hi' ? 'फार्म प्रोजेक्ट्स' : 'Farm Projects', href: '/#farm-projects' },
    { name: lang === 'hi' ? 'हमारे बारे में' : 'About', href: '/#about' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-[#174D32] flex items-center justify-center text-white shadow-md shadow-emerald-900/10 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12" strokeWidth="2" strokeLinecap="round" stroke="#84B547"/>
                  <path d="M12 6V18M12 11L8 8M12 14L16 11M12 17L8 15" strokeWidth="2" strokeLinecap="round" stroke="#FFFFFF"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-[#174D32]">
                    Krishi<span className="text-[#84B547]">Seva</span>
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300/60">
                    MVP
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-500 font-hindi -mt-0.5">
                  खेती की हर जरूरत, एक जगह।
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-semibold text-slate-700 hover:text-[#174D32] transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Action buttons */}
            <div className="hidden sm:flex items-center gap-2.5">
              {/* Replay Cinematic Intro Button */}
              <button
                onClick={handleReplayIntro}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 hover:bg-emerald-100/60 text-xs font-bold text-[#174D32] transition cursor-pointer shadow-2xs"
                title={lang === 'hi' ? 'सिनेमैटिक इंट्रो दोबारा देखें' : 'Replay Cinematic Intro'}
              >
                <Play className="w-3 h-3 text-[#84B547] fill-[#84B547]" />
                <span>{lang === 'hi' ? 'इंट्रो' : 'Intro'}</span>
              </button>

              {/* Language switcher */}
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                title="Change language"
              >
                <Globe className="w-3.5 h-3.5 text-[#174D32]" />
                <span>{lang === 'hi' ? 'EN / हिंदी' : 'हिंदी / EN'}</span>
              </button>

              {/* Quick Demo Button */}
              <button
                onClick={() => setDemoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-xs hover:from-amber-600 hover:to-amber-700 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'डेमो लॉगिन' : 'Demo Switch'}</span>
              </button>

              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <NotificationDropdown />

                  <Link
                    to={getDashboardPath()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#174D32] text-white text-xs font-bold hover:bg-[#0e3321] transition shadow-xs"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t('dashboard')}</span>
                  </Link>

                  <button
                    onClick={logout}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title={t('logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-[#174D32] transition"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-xl bg-[#174D32] text-white text-xs font-bold hover:bg-[#0e3321] transition shadow-xs shadow-emerald-950/10"
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setDemoModalOpen(true)}
                className="p-2 rounded-xl bg-amber-500 text-white text-xs font-bold"
                title="Demo logins"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 flex-wrap">
              <button
                onClick={() => {
                  handleReplayIntro();
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-bold text-[#174D32]"
              >
                <Play className="w-3.5 h-3.5 text-[#84B547] fill-[#84B547]" />
                <span>{lang === 'hi' ? 'सिनेमैटिक इंट्रो' : 'Replay Intro'}</span>
              </button>

              <button
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
              >
                <Globe className="w-4 h-4 text-[#174D32]" />
                <span>{lang === 'hi' ? 'EN' : 'हिंदी'}</span>
              </button>

              <button
                onClick={() => {
                  setDemoModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo</span>
              </button>
            </div>

            <div className="space-y-1">
              {navLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  {item.name}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100">
              {user ? (
                <div className="space-y-2">
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 rounded-xl bg-[#174D32] text-white text-sm font-bold"
                  >
                    {t('dashboard')} ({user.username})
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-center py-2 rounded-xl text-red-600 text-sm font-bold hover:bg-red-50"
                  >
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-xl bg-[#174D32] text-white text-sm font-bold"
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <QuickDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </>
  );
}
