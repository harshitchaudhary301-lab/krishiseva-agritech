import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, Search, FileText, CheckCircle2,
  FolderKanban, Calendar, HelpCircle, Settings, LogOut,
  Sparkles, Globe, Menu, X, Tractor, Bell, BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import NotificationDropdown from '../../components/NotificationDropdown';
import QuickDemoModal from '../../components/QuickDemoModal';

export default function FarmerLayout() {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const navItems = [
    { name: lang === 'hi' ? 'अवलोकन' : 'Overview', path: '/farmer/overview', icon: LayoutDashboard },
    { name: lang === 'hi' ? 'मेरा खेत' : 'My Farm', path: '/farmer/farms', icon: Map },
    { name: lang === 'hi' ? 'सेवाएं खोजें' : 'Find Services', path: '/farmer/services', icon: Search },
    { name: lang === 'hi' ? 'मेरी मांगें' : 'My Requests', path: '/farmer/requests', icon: FileText },
    { name: lang === 'hi' ? 'मेरी बुकिंग्स' : 'My Bookings', path: '/farmer/bookings', icon: CheckCircle2 },
    { name: lang === 'hi' ? 'फार्म प्रोजेक्ट्स' : 'Farm Projects', path: '/farmer/projects', icon: FolderKanban, highlight: true },
    { name: lang === 'hi' ? 'कैलेंडर' : 'Calendar', path: '/farmer/calendar', icon: Calendar },
    { name: lang === 'hi' ? 'खेत विश्लेषण' : 'Analytics', path: '/farmer/analytics', icon: BarChart3 },
    { name: lang === 'hi' ? 'सहायता केंद्र' : 'Help & Support', path: '/farmer/help', icon: HelpCircle },
    { name: lang === 'hi' ? 'सेटिंग्स' : 'Settings', path: '/farmer/settings', icon: Settings },
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
                <Tractor className="w-5 h-5 text-[#84B547]" />
              </div>
              <div>
                <span className="font-black text-lg text-[#174D32]">
                  Krishi<span className="text-[#84B547]">Seva</span>
                </span>
                <div className="text-[10px] text-slate-500 font-hindi -mt-1 font-semibold">
                  किसान पोर्टल
                </div>
              </div>
            </Link>
          </div>

          {/* User Snapshot */}
          <div className="p-4 mx-3 my-3 rounded-2xl bg-[#FAF8F2] border border-amber-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#174D32] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {user?.first_name ? user.first_name[0] : 'K'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {user?.village}, {user?.district}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
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
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    } ${item.highlight && !location.pathname.includes(item.path) ? 'border border-[#84B547]/40 bg-emerald-50/50' : ''}`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.highlight && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E8B44C] text-slate-950 font-black">
                      USP
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            onClick={() => setDemoModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'डेमो स्विच' : 'Switch Demo User'}</span>
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
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden rounded-lg hover:bg-slate-100 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 font-hindi">
              {lang === 'hi' ? 'किसान डैशबोर्ड' : 'Farmer Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#174D32]" />
              <span>{lang === 'hi' ? 'EN' : 'हिंदी'}</span>
            </button>

            {/* Quick Demo */}
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

        {/* Mobile menu dropdown */}
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

        {/* Routed Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation for quick rural thumb reach */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-3 flex justify-around items-center z-40 shadow-lg">
          <NavLink
            to="/farmer/overview"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-[#174D32]' : 'text-slate-500'}`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Overview</span>
          </NavLink>
          <NavLink
            to="/farmer/requests"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-[#174D32]' : 'text-slate-500'}`
            }
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span>Requests</span>
          </NavLink>
          <NavLink
            to="/farmer/projects"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-[#174D32]' : 'text-slate-500'}`
            }
          >
            <FolderKanban className="w-5 h-5 mb-0.5 text-[#E8B44C]" />
            <span>Projects</span>
          </NavLink>
          <NavLink
            to="/farmer/bookings"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-[#174D32]' : 'text-slate-500'}`
            }
          >
            <CheckCircle2 className="w-5 h-5 mb-0.5" />
            <span>Bookings</span>
          </NavLink>
        </nav>
      </div>

      <QuickDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}
