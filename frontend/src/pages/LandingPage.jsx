import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu, X, Globe, ArrowRight, ChevronRight,
  Sprout, Tractor, BarChart3, CalendarCheck,
  Wheat, ChevronDown
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

/* ─── Floating Navigation ─────────────────────────────────── */
function HeroNavbar() {
  const { lang, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'farmer') return '/farmer/overview';
    if (user.role === 'worker') return '/worker/dashboard';
    if (user.role === 'provider') return '/provider/dashboard';
    return '/farmer/overview';
  };

  const navLinks = [
    { label: lang === 'hi' ? 'मुख्य पृष्ठ' : 'Home', href: '#hero' },
    { label: lang === 'hi' ? 'सेवाएं' : 'Services', href: '#services' },
    { label: lang === 'hi' ? 'फार्म प्लानिंग' : 'Farm Planning', href: '#farm-planning' },
    { label: lang === 'hi' ? 'कार्यप्रणाली' : 'How It Works', href: '#how-it-works' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'py-2' : 'py-4 lg:py-6'
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Floating obsidian pill */}
        <div
          className={`flex items-center justify-between rounded-full px-5 py-2.5 lg:px-6 lg:py-3 transition-all duration-300 ${
            scrolled
              ? 'bg-[#101510]/95 backdrop-blur-md shadow-2xl shadow-black/30'
              : 'bg-[#101510]/80 backdrop-blur-sm shadow-xl shadow-black/20'
          }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#174D32] flex items-center justify-center">
              <Sprout className="w-4.5 h-4.5 text-[#84B547]" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              Krishi<span className="text-[#84B547]">Seva</span>
            </span>
          </Link>

          {/* Desktop Centre Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-3.5 py-1.5 text-[13px] font-semibold text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Language */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'EN' : 'हिं'}</span>
            </button>

            {user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className="hidden sm:inline-flex px-4 py-1.5 rounded-full bg-white text-[#101510] text-[13px] font-bold hover:bg-white/90 transition"
                >
                  {lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
                </Link>
                <button
                  onClick={logout}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-[12px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  {lang === 'hi' ? 'लॉगआउट' : 'Log Out'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-4 py-1.5 rounded-full text-[13px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition"
                >
                  {lang === 'hi' ? 'पंजीकरण' : 'Sign Up'}
                </Link>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex px-4 py-1.5 rounded-full bg-white text-[#101510] text-[13px] font-bold hover:bg-white/90 transition"
                >
                  {lang === 'hi' ? 'लॉगिन' : 'Log In'}
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded-full text-white/80 hover:bg-white/10 transition cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="lg:hidden mt-2 rounded-2xl bg-[#101510]/95 backdrop-blur-md shadow-2xl px-5 py-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 mt-2 border-t border-white/10 flex flex-wrap gap-2">
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white/70 border border-white/20 hover:bg-white/10 transition cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                {lang === 'hi' ? 'English' : 'हिंदी'}
              </button>
              {user ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-1.5 rounded-full bg-white text-[#101510] text-xs font-bold"
                  >
                    {lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    {lang === 'hi' ? 'लॉगआउट' : 'Log Out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-1.5 rounded-full text-xs font-bold text-white/80 border border-white/20 hover:bg-white/10"
                  >
                    {lang === 'hi' ? 'पंजीकरण' : 'Sign Up'}
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-1.5 rounded-full bg-white text-[#101510] text-xs font-bold"
                  >
                    {lang === 'hi' ? 'लॉगिन' : 'Log In'}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ─── Capability Strip ────────────────────────────────────── */
function CapabilityStrip({ lang }) {
  const capabilities = [
    { icon: CalendarCheck, en: 'Farm Planning', hi: 'फार्म प्लानिंग' },
    { icon: Tractor, en: 'Service Discovery', hi: 'सेवा खोज' },
    { icon: BarChart3, en: 'Expense Management', hi: 'खर्च प्रबंधन' },
    { icon: Wheat, en: 'Agricultural Records', hi: 'कृषि रिकॉर्ड' },
  ];
  return (
    <div className="bg-[#101510] border-t border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8">
          {capabilities.map(({ icon: Icon, en, hi }) => (
            <div key={en} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5 text-[#FCE052]" />
              </div>
              <span className="text-[13px] lg:text-sm font-semibold text-white/90">
                {lang === 'hi' ? hi : en}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Feature Card (lower-right) ──────────────────────────── */
function FeatureCard({ lang }) {
  return (
    <div className="w-[280px] lg:w-[310px] rounded-2xl overflow-hidden shadow-2xl shadow-black/30 backdrop-blur-sm border border-white/10">
      {/* Top photo strip */}
      <div
        className="h-[90px] bg-cover bg-center"
        style={{
          backgroundImage: 'linear-gradient(to bottom, transparent 50%, #174D32), url(/images/krishiseva/hero/hero-desktop.jpg)',
          backgroundPosition: 'center 30%',
        }}
      />
      {/* Content */}
      <div className="bg-[#174D32] px-5 py-4 space-y-2.5">
        <h3 className="text-[15px] font-bold text-white leading-snug">
          {lang === 'hi' ? 'आपका डिजिटल फार्म मैनेजर' : 'Your Digital Farm Manager'}
        </h3>
        <p className="text-[11px] text-emerald-100/80 leading-relaxed">
          {lang === 'hi'
            ? 'मिट्टी से फसल तक — फसल योजना, सेवा खोज और खर्च प्रबंधन एक जगह।'
            : 'From soil to harvest — plan crops, discover services, and manage expenses in one place.'}
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FCE052] text-[#101510] text-[12px] font-bold hover:bg-[#FFF3B0] transition"
        >
          <span>{lang === 'hi' ? 'फार्म प्लानिंग देखें' : 'Explore Farm Planning'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ─── LANDING PAGE ────────────────────────────────────────── */
export default function LandingPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#101510]">
      <HeroNavbar />

      {/* ───── HERO SECTION ───── */}
      <section id="hero" className="relative w-full overflow-hidden">
        {/* Outer container with margin and radius */}
        <div className="mx-3 sm:mx-5 lg:mx-6 xl:mx-8">
          <div className="relative rounded-[24px] lg:rounded-[32px] overflow-hidden" style={{ height: 'clamp(500px, 90vh, 960px)' }}>
            {/* Background photograph */}
            <picture>
              <source
                media="(max-width: 639px)"
                srcSet="/images/krishiseva/hero/hero-mobile.jpg"
              />
              <img
                src="/images/krishiseva/hero/hero-desktop.jpg"
                alt="Green tractor on Indian farmland at golden sunrise"
                className="absolute inset-0 w-full h-full object-cover object-center"
                fetchPriority="high"
                decoding="async"
              />
            </picture>

            {/* Gradient overlays for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
            {/* Subtle vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.3)_100%)]" />

            {/* Content layer */}
            <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-8 lg:p-10 xl:p-12">
              {/* Spacer for nav */}
              <div className="h-16 lg:h-20" />

              {/* Bottom content row */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-10">
                {/* Left — Hero copy */}
                <div className="max-w-2xl space-y-5 lg:space-y-6">
                  {/* Eyebrow */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                    <span className="text-[11px] sm:text-xs font-bold text-white/90 tracking-widest uppercase">
                      {lang === 'hi'
                        ? 'एक प्लेटफ़ॉर्म। संपूर्ण खेती का सफर।'
                        : 'ONE PLATFORM. COMPLETE FARMING JOURNEY.'}
                    </span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-[36px] sm:text-[48px] lg:text-[64px] xl:text-[72px] font-black leading-[1.05] tracking-tight text-white">
                    {lang === 'hi' ? (
                      <>
                        आपका खेत।<br />
                        आपका भविष्य।<br />
                        <span className="text-[#FCE052]">हमारा साथ।</span>
                      </>
                    ) : (
                      <>
                        Your Farm.<br />
                        Your Future.<br />
                        <span className="text-[#FCE052]">Our Commitment.</span>
                      </>
                    )}
                  </h1>

                  {/* Description */}
                  <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed max-w-xl">
                    {lang === 'hi'
                      ? 'मिट्टी से फसल तक, अपनी खेती की योजना बनाएं, सही सेवाएं खोजें और विश्वास के साथ अपना खेत चलाएं।'
                      : 'From soil to harvest, plan your farming journey, find the right services and manage your farm with confidence.'}
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#FCE052] text-[#101510] text-sm sm:text-base font-bold hover:bg-[#FFF3B0] transition shadow-lg shadow-yellow-500/20"
                    >
                      <span>{lang === 'hi' ? 'शुरू करें' : 'Get Started'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href="#services"
                      className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full border border-white/30 text-white text-sm sm:text-base font-semibold hover:bg-white/10 transition backdrop-blur-sm"
                    >
                      <span>{lang === 'hi' ? 'कृषि सेवा जानें' : 'Explore KrishiSeva'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Right — Feature Card (desktop only) */}
                <div className="hidden lg:block shrink-0">
                  <FeatureCard lang={lang} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── CAPABILITY STRIP ───── */}
      <CapabilityStrip lang={lang} />

      {/* ───── Mobile Feature Card (shown below hero on small screens) ───── */}
      <div className="lg:hidden px-4 sm:px-6 py-6 bg-[#101510]">
        <FeatureCard lang={lang} />
      </div>

      {/* ───── REMAINING SECTIONS — Placeholder anchors for navigation ───── */}
      {/* These sections will be fully implemented in Stage 02 after Gate A approval */}
      <section id="services" className="min-h-[200px]" />
      <section id="farm-planning" className="min-h-[200px]" />
      <section id="how-it-works" className="min-h-[200px]" />
    </div>
  );
}
