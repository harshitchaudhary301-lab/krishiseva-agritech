import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  Wrench, Briefcase, CheckCircle2, IndianRupee, Star,
  LogOut, Sparkles, Globe, Menu, X, LayoutDashboard, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import NotificationDropdown from '../../components/NotificationDropdown';
import QuickDemoModal from '../../components/QuickDemoModal';

export default function ProviderLayout() {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const navItems = [
    { name: lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard', path: '/provider/dashboard', icon: LayoutDashboard },
    { name: lang === 'hi' ? 'मिलती-जुलती मांगें' : 'Matching Requests', path: '/provider/matching', icon: Briefcase },
    { name: lang === 'hi' ? 'बुकिंग्स व कन्फर्मेशन' : 'Bookings & Confirmations', path: '/provider/bookings', icon: CheckCircle2 },
    { name: lang === 'hi' ? 'कमाई रिकॉर्ड' : 'Earnings & History', path: '/provider/earnings', icon: IndianRupee },
    { name: lang === 'hi' ? 'प्रोफाइल व सत्यापन' : 'Profile & Verification', path: '/provider/profile', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9F5] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 select-none justify-between">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#174D32] flex items-center justify-center text-white shadow-xs">
                <Wrench className="w-5 h-5 text-[#E8B44C]" />
              </div>
              <div>
                <span className="font-black text-lg text-[#174D32]">
                  Krishi<span className="text-[#84B547]">Seva</span>
                </span>
                <div className="text-[10px] text-slate-500 font-hindi -mt-1 font-semibold">
                  प्रदाता पोर्टल
                </div>
              </div>
            </Link>
          </div>

          {/* Provider Business Snapshot */}
          <div className="p-4 mx-3 my-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#174D32] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {user?.provider_profile?.business_name ? user.provider_profile.business_name[0] : 'P'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {user?.provider_profile?.business_name || user?.username}
                </div>
                <div className="text-[11px] text-slate-600 truncate">
                  {user?.village} • {user?.provider_profile?.verification_status === 'verified' ? 'Verified Provider' : 'Pending'}
                </div>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#174D32] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            onClick={() => setDemoModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Switch Demo Profile</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden rounded-lg hover:bg-slate-100 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 font-hindi">
              {lang === 'hi' ? 'सेवा प्रदाता डैशबोर्ड' : 'Service Provider Operations'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#174D32]" />
              <span>{lang === 'hi' ? 'EN' : 'हिंदी'}</span>
            </button>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demo</span>
            </button>
            <NotificationDropdown />
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 z-30">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold ${
                      isActive ? 'bg-[#174D32] text-white' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg"
            >
              {t('logout')}
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <QuickDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}
