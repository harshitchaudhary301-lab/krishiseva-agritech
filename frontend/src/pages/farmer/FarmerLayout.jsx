import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Map, Search, FileText, CheckCircle2,
  FolderKanban, Calendar, HelpCircle, Settings, LogOut,
  Sparkles, Globe, Menu, X, Tractor, Bell, BarChart3,
  User, ChevronDown, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import NotificationDropdown from '../../components/NotificationDropdown';
import QuickDemoModal from '../../components/QuickDemoModal';

export default function FarmerLayout() {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);

  // §14 Required Sidebar Navigation:
  // Home | Services | Projects | Finance | My Farm | More Tools | Profile
  const navItems = [
    { name: lang === 'hi' ? 'मुख्य डैशबोर्ड' : 'Home', path: '/farmer/overview', icon: LayoutDashboard },
    { name: lang === 'hi' ? 'सेवाएं खोजें' : 'Services', path: '/farmer/services', icon: Search },
    { name: lang === 'hi' ? 'फार्म प्रोजेक्ट्स' : 'Projects', path: '/farmer/projects', icon: FolderKanban, highlight: true },
    { name: lang === 'hi' ? 'वित्तीय हिसाब' : 'Finance', path: '/farmer/analytics', icon: BarChart3 },
    { name: lang === 'hi' ? 'मेरा खेत' : 'My Farm', path: '/farmer/farms', icon: Map },
    {
      name: lang === 'hi' ? 'अन्य टूल्स' : 'More Tools',
      isDropdown: true,
      icon: Layers,
      subItems: [
        { name: lang === 'hi' ? 'मेरी मांगें' : 'My Requests', path: '/farmer/requests', icon: FileText },
        { name: lang === 'hi' ? 'मेरी बुकिंग्स' : 'My Bookings', path: '/farmer/bookings', icon: CheckCircle2 },
        { name: lang === 'hi' ? 'कैलेंडर' : 'Calendar', path: '/farmer/calendar', icon: Calendar },
        { name: lang === 'hi' ? 'सहायता व योजनाएं' : 'Help & Govt', path: '/farmer/help', icon: HelpCircle },
      ]
    },
    { name: lang === 'hi' ? 'प्रोफ़ाइल सेटिंग्स' : 'Profile', path: '/farmer/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F4F4EE] flex flex-col md:flex-row">
      {/* ─── Desktop Sidebar (§14: ~248px, Dark Obsidian #101510) ─── */}
      <aside className="hidden md:flex flex-col w-[248px] bg-[#101510] text-white border-r border-white/10 shrink-0 select-none justify-between z-20">
        <div>
          {/* Logo & Brand Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#174D32] flex items-center justify-center text-white shadow-xs">
                <Tractor className="w-4.5 h-4.5 text-[#84B547]" />
              </div>
              <div>
                <span className="font-black text-lg text-white">
                  Krishi<span className="text-[#84B547]">Seva</span>
                </span>
                <div className="text-[10px] text-white/60 font-hindi -mt-1 font-semibold">
                  किसान पोर्टल
                </div>
              </div>
            </Link>
          </div>

          {/* User Snapshot */}
          <div className="p-3.5 mx-3 my-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#174D32] text-[#FCE052] flex items-center justify-center font-bold text-sm shrink-0 border border-white/10">
                {user?.first_name ? user.first_name[0] : 'K'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs text-white truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
                </div>
                <div className="text-[11px] text-white/60 truncate">
                  {user?.village || 'Daurala'}, {user?.district || 'Meerut'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.isDropdown) {
                const isSubActive = item.subItems.some(sub => location.pathname === sub.path);
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setMoreToolsOpen(!moreToolsOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isSubActive
                          ? 'bg-white/15 text-white'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-[#84B547]" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-white/50 transition-transform ${moreToolsOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {(moreToolsOpen || isSubActive) && (
                      <div className="pl-6 pr-1 space-y-1 pt-0.5">
                        {item.subItems.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <NavLink
                              key={sub.path}
                              to={sub.path}
                              className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition ${
                                  isActive
                                    ? 'bg-[#174D32] text-white'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`
                              }
                            >
                              <SubIcon className="w-3.5 h-3.5" />
                              <span>{sub.name}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#174D32] text-white shadow-xs'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    } ${item.highlight && !location.pathname.includes(item.path) ? 'border border-[#FCE052]/30 text-[#FCE052]' : ''}`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#84B547]" />
                  <span className="flex-1">{item.name}</span>
                  {item.highlight && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FCE052] text-[#101510] font-black">
                      USP
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-white/10 space-y-2">
          <button
            onClick={() => setDemoModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#FCE052] text-[#101510] text-xs font-black hover:bg-[#FFF3B0] transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#101510]" />
            <span>{lang === 'hi' ? 'डेमो स्विच' : 'Switch Demo User'}</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header (§14: ~64px, White, Clean) */}
        <header className="h-16 bg-white border-b border-[#E2E8DF] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden rounded-lg hover:bg-slate-100 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-[#172D20] font-hindi">
                {lang === 'hi' ? 'मेरा खेत, मेरा दिन' : 'My Farm, My Day'}
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {user?.village || 'Daurala'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8DF] text-xs font-bold text-[#172D20] hover:bg-[#F4F4EE] transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#174D32]" />
              <span>{lang === 'hi' ? 'EN' : 'हिंदी'}</span>
            </button>

            {/* Quick Demo */}
            <button
              onClick={() => setDemoModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F2] border border-[#E2E8DF] text-[#172D20] text-xs font-bold hover:bg-white transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E8B44C]" />
              <span>Demo</span>
            </button>

            <NotificationDropdown />
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#101510] text-white border-b border-white/10 px-4 py-3 space-y-1 z-30 animate-in fade-in slide-in-from-top-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              if (item.isDropdown) {
                return (
                  <div key={item.name} className="py-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 px-3 py-1">
                      {item.name}
                    </div>
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold ${
                              isActive ? 'bg-[#174D32] text-white' : 'text-white/70 hover:bg-white/10'
                            }`
                          }
                        >
                          <SubIcon className="w-4 h-4 text-[#84B547]" />
                          <span>{sub.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold ${
                      isActive ? 'bg-[#174D32] text-white' : 'text-white/70 hover:bg-white/10'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-[#84B547]" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-white/10 rounded-lg"
            >
              {t('logout')}
            </button>
          </div>
        )}

        {/* Routed Page Content (§14: Cream background #F4F4EE, Content padding ~24px) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (§14: 5 Items: Home | Services | Projects | Finance | Profile) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8DF] py-2 px-2 flex justify-around items-center z-40 shadow-lg">
          <NavLink
            to="/farmer/overview"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-[#174D32]' : 'text-[#64748B]'}`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/farmer/services"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-[#174D32]' : 'text-[#64748B]'}`
            }
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span>Services</span>
          </NavLink>
          <NavLink
            to="/farmer/projects"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-[#174D32]' : 'text-[#64748B]'}`
            }
          >
            <FolderKanban className="w-5 h-5 mb-0.5 text-[#E8B44C]" />
            <span>Projects</span>
          </NavLink>
          <NavLink
            to="/farmer/analytics"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-[#174D32]' : 'text-[#64748B]'}`
            }
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span>Finance</span>
          </NavLink>
          <NavLink
            to="/farmer/settings"
            className={({ isActive }) =>
              `flex flex-col items-center text-[10px] font-bold ${isActive ? 'text-[#174D32]' : 'text-[#64748B]'}`
            }
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>Profile</span>
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
