import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu, X, Globe, ArrowRight, ChevronRight,
  Sprout, Tractor, BarChart3, CalendarCheck,
  Wheat, ChevronDown, CheckCircle2, ShieldCheck,
  Users, Wrench, Droplet, Sparkles, MapPin,
  Clock, Award, Layers, CloudSun, Leaf,
  FileText, Check, HelpCircle, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import QuickDemoModal from '../components/QuickDemoModal';
import CreateRequestModal from '../components/CreateRequestModal';

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
    { label: lang === 'hi' ? 'फार्म मैनेजर' : 'Farm Manager', href: '#farm-manager' },
    { label: lang === 'hi' ? 'पारिस्थितिकी तंत्र' : 'Ecosystem', href: '#ecosystem' },
    { label: lang === 'hi' ? 'कार्यप्रणाली' : 'How It Works', href: '#how-it-works' },
    { label: lang === 'hi' ? 'सवाल-जवाब' : 'FAQ', href: '#faq' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none ${
        scrolled ? 'py-2' : 'py-3 sm:py-4 lg:py-5'
      }`}
    >
      {/* Centred at approximately 65-80% of hero width, adapting to content */}
      <div className="w-[94%] sm:w-[86%] lg:w-[74%] max-w-[1100px] mx-auto pointer-events-auto">
        {/* Floating obsidian pill */}
        <div
          className={`flex items-center justify-between rounded-full px-4 sm:px-6 py-2 sm:py-2.5 transition-all duration-300 ${
            scrolled
              ? 'bg-[#101510]/95 backdrop-blur-md shadow-2xl shadow-black/40 border border-white/15'
              : 'bg-[#101510]/85 backdrop-blur-sm shadow-xl shadow-black/30 border border-white/10'
          }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#174D32] flex items-center justify-center">
              <Sprout className="w-4.5 h-4.5 text-[#84B547]" />
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight text-white">
              Agro<span className="text-[#84B547]">Uday</span>
            </span>
            <span className="hidden md:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#174D32] text-[#84B547] border border-[#84B547]/30">
              Pitch Preview
            </span>
          </Link>

          {/* Desktop Centre Links */}
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-3 py-1.5 text-[12px] xl:text-[13px] font-semibold text-white/85 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-semibold text-white/75 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#84B547]" />
              <span>{lang === 'hi' ? 'EN' : 'हिं'}</span>
            </button>

            {user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className="px-3.5 sm:px-4 py-1.5 rounded-full bg-white text-[#101510] text-xs font-bold hover:bg-white/90 transition shadow-xs"
                >
                  {lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
                </Link>
                <button
                  onClick={logout}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  {lang === 'hi' ? 'लॉगआउट' : 'Log Out'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-xs font-bold text-white/85 hover:text-white hover:bg-white/10 transition"
                >
                  {lang === 'hi' ? 'पंजीकरण' : 'Sign Up'}
                </Link>
                <Link
                  to="/login"
                  className="px-3.5 sm:px-4 py-1.5 rounded-full bg-[#FCE052] text-[#101510] text-xs font-bold hover:bg-[#FFF3B0] transition shadow-xs"
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
          <div className="lg:hidden mt-2 rounded-2xl bg-[#101510]/95 backdrop-blur-md shadow-2xl px-5 py-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200 border border-white/10">
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
                    className="px-4 py-1.5 rounded-full bg-[#FCE052] text-[#101510] text-xs font-bold"
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
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#FCE052]" />
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

/* ─── Feature Card (Safe Product Preview) ──────────────────────────── */
function FeatureCard({ lang }) {
  return (
    <div className="w-[290px] lg:w-[330px] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-md border border-white/20 bg-[#174D32]/95 text-white">
      {/* Product Preview Header */}
      <div className="px-4 py-3 bg-[#101510]/85 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#84B547] animate-pulse" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
            {lang === 'hi' ? 'फार्म प्रोजेक्ट लाइव' : 'Farm Project Preview'}
          </span>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FCE052] text-[#101510]">
          Wheat 2026
        </span>
      </div>

      {/* Product Preview Body */}
      <div className="p-4 sm:p-5 space-y-3.5">
        <div>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-white">{lang === 'hi' ? 'कटाई एवं मड़ाई कार्य' : 'Harvesting & Threshing'}</span>
            <span className="text-[#FCE052]">65%</span>
          </div>
          <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden mt-1.5">
            <div className="bg-[#84B547] h-full rounded-full transition-all duration-500" style={{ width: '65%' }} />
          </div>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/10 border border-white/10">
            <div className="flex items-center gap-2">
              <Tractor className="w-3.5 h-3.5 text-[#FCE052]" />
              <span className="font-semibold text-white/95">Combine Harvester (20 Ac)</span>
            </div>
            <span className="text-[#84B547] font-bold">Confirmed</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/10 border border-white/10">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#FCE052]" />
              <span className="font-semibold text-white/95">5 Skilled Workers</span>
            </div>
            <span className="text-[#84B547] font-bold">Confirmed</span>
          </div>
        </div>

        <div className="pt-1">
          <a
            href="#farm-manager"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#FCE052] text-[#101510] text-[12px] font-extrabold hover:bg-[#FFF3B0] transition shadow-xs"
          >
            <span>{lang === 'hi' ? 'फार्म प्लानिंग देखें' : 'Explore Farm Planning'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

// 8 Highlighted Categories per Quality Lock §2
const HIGHLIGHTED_CATEGORIES = [
  {
    slug: 'machinery_rental',
    name_en: 'Combine Harvester & Machinery Rental',
    name_hi: 'कंबाइन हार्वेस्टर व मशीनरी किराया',
    desc_en: 'Heavy harvest combines, laser land levelers, and specialized implements with transparent rates.',
    desc_hi: 'कंबाइन हार्वेस्टर, लेजर लैंड लेवलर एवं आधुनिक कृषि यंत्र पारदर्शी प्रति एकड़ दरों पर उपलब्ध।',
    rate: '₹1,500 - ₹2,500 / Acre',
    photo: '/images/krishiseva/services/machinery_rental.jpg',
  },
  {
    slug: 'tractor_mechanic',
    name_en: 'Tractor Mechanic & Emergency Repair',
    name_hi: 'ट्रैक्टर मैकेनिक एवं आपातकालीन मरम्मत',
    desc_en: 'Certified diesel mechanics for on-farm hydraulic, transmission, and engine breakdown diagnostics.',
    desc_hi: 'खेत पर ही हाइड्रोलिक, ट्रांसमिशन और इंजन की मरम्मत के लिए प्रमाणित डीजल मैकेनिक।',
    rate: '₹300 - ₹1,500 / Visit',
    photo: '/images/krishiseva/services/tractor_mechanic.jpg',
  },
  {
    slug: 'labour',
    name_en: 'Agricultural Field Labour',
    name_hi: 'कुशल एवं अकुशल कृषि श्रमिक',
    desc_en: 'Verified adult farm worker groups for seasonal transplanting, weeding, and manual crop operations.',
    desc_hi: 'रोपाई, निराई-गुड़ाई और कटाई के लिए 18+ सत्यापित कुशल एवं अकुशल कृषि श्रमिक समूह।',
    rate: '₹400 - ₹600 / Day',
    photo: '/images/krishiseva/services/labour.jpg',
  },
  {
    slug: 'tubewell_repair',
    name_en: 'Tubewell Repair & Boring',
    name_hi: 'ट्यूबवेल मरम्मत एवं सबमर्सिबल कार्य',
    desc_en: 'Submersible pump extraction, motor rewinding, starter repairs, and irrigation maintenance.',
    desc_hi: 'सबमर्सिबल पंप निकालना, मोटर रिवाइंडिंग, स्टार्टर रिपेयर और पाइपलाइन मरम्मत कार्य।',
    rate: '₹500 - ₹2,000 / Job',
    photo: '/images/krishiseva/services/tubewell_repair.jpg',
  },
  {
    slug: 'land_preparation',
    name_en: 'Land Preparation & Deep Tillage',
    name_hi: 'खेत की जुताई एवं पलेवा तैयारी',
    desc_en: 'Rotavator tillage, deep disc ploughing, and bed shaping tailored to crop soil requirements.',
    desc_hi: 'रोटावेटर, डिस्क हैरो और गहरी जुताई द्वारा बुवाई हेतु आदर्श खेत की तैयारी।',
    rate: '₹800 - ₹1,800 / Acre',
    photo: '/images/krishiseva/services/land_preparation.jpg',
  },
  {
    slug: 'sowing_planting',
    name_en: 'Sowing & Precision Planting',
    name_hi: 'बीज बुवाई एवं सीड ड्रिल सेवाएं',
    desc_en: 'Zero-till drill sowing, potato planters, and sugarcane trench cutters for uniform placement.',
    desc_hi: 'जीरो-टिल सीड ड्रिल और आधुनिक प्लांटर द्वारा सटीक गहराई एवं दूरी पर बीज की बुवाई।',
    rate: '₹600 - ₹1,400 / Acre',
    photo: '/images/krishiseva/services/sowing_planting.jpg',
  },
  {
    slug: 'harvesting',
    name_en: 'Harvesting & Threshing',
    name_hi: 'फसल कटाई एवं मड़ाई (थ्रेसिंग)',
    desc_en: 'Stationary multi-crop threshers, manual reaping crews, and mechanized crop collection.',
    desc_hi: 'मल्टी-क्रॉप थ्रेशर, रीपर और अनुभवी कटाई दल द्वारा सुरक्षित और कम दाना नुकसान वाली कटाई।',
    rate: '₹1,200 - ₹2,200 / Acre',
    photo: '/images/krishiseva/services/harvesting.jpg',
  },
  {
    slug: 'transportation',
    name_en: 'Agricultural Transportation to Mandi',
    name_hi: 'मंडी परिवहन एवं ट्रैक्टर ट्रॉली',
    desc_en: 'Heavy tractor trolley transport from farm gate directly to local APMC mandis and sugar mills.',
    desc_hi: 'खेत से स्थानीय कृषि मंडी और चीनी मिल तक फसल की सुरक्षित और त्वरित ढुलाई।',
    rate: '₹500 - ₹1,500 / Trip',
    photo: '/images/krishiseva/services/transportation.jpg',
  },
];

/* ─── MAIN LANDING PAGE ───────────────────────────────────── */
export default function LandingPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [activeFaq, setActiveFaq] = useState(0);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [createReqOpen, setCreateReqOpen] = useState(false);
  const [selectedCatSlug, setSelectedCatSlug] = useState(null);

  useEffect(() => {
    api.get('/services/categories/')
      .then(res => setCategories(res.data))
      .catch(err => console.error('Failed to load categories', err));
  }, []);

  const handleCategoryAction = (cat) => {
    const slug = cat.slug || cat;
    if (user?.role === 'farmer') {
      setSelectedCatSlug(slug);
      setCreateReqOpen(true);
    } else if (user?.role === 'provider') {
      navigate('/provider/dashboard');
    } else if (user?.role === 'worker') {
      navigate('/worker/dashboard');
    } else {
      navigate('/login', { state: { from: '/farmer/overview', category: slug } });
    }
  };

  const faqs = [
    {
      q_en: "How does KrishiSeva prevent double-booking conflicts?",
      q_hi: "कृषि सेवा डबल-बुकिंग की समस्या को कैसे रोकती है?",
      a_en: "Our backend runs strict database-level reservation locking. When a provider accepts a booking for a specific date, our system atomically reserves that slot, preventing any overlapping confirmed commitments on that same calendar day.",
      a_hi: "हमारा बैकएंड कड़े डेटाबेस नियमों का पालन करता है। जब कोई प्रदाता किसी निश्चित तारीख के लिए बुकिंग स्वीकार करता है, तो सिस्टम उसी तारीख पर किसी अन्य बुकिंग को अस्वीकार कर देता है।"
    },
    {
      q_en: "What happens if a booked provider or machine owner cancels?",
      q_hi: "यदि बुक किया गया प्रदाता अंतिम समय पर काम रद्द कर दे तो क्या होगा?",
      a_en: "Our Backup Provider System immediately triggers. It identifies nearby verified providers in the same category who are available on your required date, ranks them transparently, and lets the farmer request replacement quotations with one click.",
      a_hi: "हमारा बैकअप प्रदाता सिस्टम तुरंत सक्रिय हो जाता है। यह उसी गाँव व जिले के अन्य पात्र व उपलब्ध प्रदाताओं को ढूंढता है और किसान को एक क्लिक में वैकल्पिक कोटेशन प्राप्त करने की सुविधा देता है।"
    },
    {
      q_en: "Are there any hidden broker commissions or advance fees?",
      q_hi: "क्या कोई छुपा हुआ कमीशन या पंजीकरण शुल्क देना होता है?",
      a_en: "No. KrishiSeva connects farmers directly with local machinery owners and workers with 100% transparent quotation breakdowns. Workers register freely and set their own fair daily wage rates.",
      a_hi: "बिल्कुल नहीं। कृषि सेवा किसानों और सेवा प्रदाताओं को सीधे जोड़ती है। सभी कोटेशन पूरी तरह पारदर्शी होते हैं और कोई छुपा हुआ कमीशन नहीं लिया जाता।"
    },
    {
      q_en: "Can I manage multiple crops and field parcels across different villages?",
      q_hi: "क्या मैं अलग-अलग गांवों में अपने कई खेतों और फसलों का प्रबंधन कर सकता हूँ?",
      a_en: "Yes. Our Farm & Field parcel management lets you define individual Khasra parcels, land tenure (owned/leased), soil health records, and link them to specialized 6-crop cultivation plans.",
      a_hi: "हाँ। आप अपने अलग-अलग खेतों (खसरा नंबर), स्वामित्व प्रकार और मिट्टी स्वास्थ्य कार्ड को जोड़कर प्रत्येक के लिए अलग फसल चक्र प्रबंधित कर सकते हैं।"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F4EE] text-[#172D20] font-sans selection:bg-[#FCE052] selection:text-[#101510]">
      {/* ─── 1. HERO SECTION & CAPABILITY STRIP ─── */}
      <section id="hero" className="relative w-full min-h-[92vh] lg:min-h-screen overflow-hidden bg-[#101510] flex flex-col justify-between">
        {/* Full-bleed cinematic photograph */}
        <picture className="absolute inset-0 w-full h-full">
          <source
            media="(max-width: 639px)"
            srcSet="/images/krishiseva/hero/hero-mobile.jpg"
          />
          <img
            src="/images/krishiseva/hero/hero-desktop.jpg"
            alt="Green tractor on Indian farmland at golden sunrise"
            className="w-full h-full object-cover object-[72%_center] sm:object-[center_60%] lg:object-[80%_center]"
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        {/* Localized gradients behind text rather than darkening complete photograph */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-full lg:w-[58%] bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none" />

        {/* Floating navbar placed inside the photograph container */}
        <HeroNavbar />

        {/* Hero content layer */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 sm:pb-16 lg:pb-20 flex-1 flex flex-col justify-end">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12">
            {/* Left — Hero copy */}
            <div className="max-w-2xl space-y-4 lg:space-y-6">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#FCE052]" />
                <span className="text-[11px] sm:text-xs font-bold text-white tracking-widest uppercase">
                  {lang === 'hi'
                    ? 'एक प्लेटफ़ॉर्म। संपूर्ण खेती का सफर।'
                    : 'ONE PLATFORM. COMPLETE FARMING JOURNEY.'}
                </span>
              </div>

              {/* Headline — predominantly white */}
              <h1 className="text-[34px] sm:text-[48px] lg:text-[62px] xl:text-[68px] font-black leading-[1.06] tracking-tight text-white drop-shadow-md">
                {lang === 'hi' ? (
                  <>
                    आपका खेत।<br />
                    आपका भविष्य।<br />
                    <span className="text-white">हमारा </span><span className="text-[#FCE052]">संकल्प।</span>
                  </>
                ) : (
                  <>
                    Your Farm.<br />
                    Your Future.<br />
                    <span className="text-white">Our </span><span className="text-[#FCE052]">Commitment.</span>
                  </>
                )}
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed max-w-xl font-normal drop-shadow-sm">
                {lang === 'hi'
                  ? 'मिट्टी से फसल तक, अपनी खेती की योजना बनाएं, सही सेवाएं खोजें और विश्वास के साथ अपना खेत चलाएं।'
                  : 'From soil to harvest, plan your farming journey, find the right services and manage your farm with confidence.'}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-full bg-[#FCE052] text-[#101510] text-sm sm:text-base font-extrabold hover:bg-[#FFF3B0] transition shadow-lg shadow-yellow-500/25"
                >
                  <span>{lang === 'hi' ? 'शुरू करें' : 'Get Started'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-3.5 rounded-full border border-white/35 bg-black/20 text-white text-sm sm:text-base font-semibold hover:bg-white/15 transition backdrop-blur-sm"
                >
                  <span>{lang === 'hi' ? 'कृषि सेवाएं देखें' : 'Explore KrishiSeva'}</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right — Feature Card (desktop only, safe product preview) */}
            <div className="hidden lg:block shrink-0">
              <FeatureCard lang={lang} />
            </div>
          </div>
        </div>
      </section>

      {/* Capability Strip */}
      <CapabilityStrip lang={lang} />

      {/* Mobile Feature Card (below hero on small screens) */}
      <div className="lg:hidden px-4 sm:px-6 py-6 bg-[#101510] flex justify-center">
        <FeatureCard lang={lang} />
      </div>

      {/* ─── 2. EVERYTHING YOUR FARM NEEDS (Service Catalogue) ─── */}
      <section id="services" className="py-20 lg:py-28 bg-[#F4F4EE]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#174D32]/10 text-[#174D32] text-xs font-bold uppercase tracking-wider">
              <Tractor className="w-3.5 h-3.5 text-[#174D32]" />
              <span>{lang === 'hi' ? 'सत्यापित ग्रामीण सेवाएं' : 'Everything Your Farm Needs'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#172D20] tracking-tight">
              {lang === 'hi' ? 'खेत की हर ज़रूरत के लिए विश्वसनीय सेवाएं' : 'Essential Agricultural Service Catalogue'}
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              {lang === 'hi'
                ? 'कंबाइन हार्वेस्टर, ट्रैक्टर मैकेनिक, कुशल श्रमिक और ट्यूबवेल मरम्मत — पारदर्शी दरों और गारंटीकृत उपलब्धता के साथ।'
                : 'Connect with verified local machinery owners, skilled labour, and diagnostic technicians with transparent, competitive rates.'}
            </p>
            {/* Notice per §12 */}
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <MapPin className="w-3 h-3 text-[#174D32]" />
              <span>{lang === 'hi' ? 'सीधा मिलान: मेरठ ग्रामीण एवं पश्चिमी उत्तर प्रदेश • अखिल भारतीय संदर्भ' : 'Direct Matching: Meerut Rural & Western UP • Nationwide catalog'}</span>
            </div>
          </div>

          {/* Service Cards Grid — Exactly 8 Highlighted Categories with 16:10 Photographs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HIGHLIGHTED_CATEGORIES.map((cat) => (
              <div
                key={cat.slug}
                onClick={() => handleCategoryAction(cat)}
                className="group rounded-2xl bg-white border border-[#E2E8DF] shadow-sm hover:shadow-xl hover:border-[#174D32] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div>
                  {/* Category-specific photograph with consistent 16:10 aspect ratio */}
                  <div className="aspect-[16/10] w-full overflow-hidden relative bg-[#101510]">
                    <img
                      src={cat.photo}
                      alt={cat.name_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#101510]/80 text-[#84B547] border border-[#84B547]/40 backdrop-blur-xs">
                      {lang === 'hi' ? 'सक्रिय' : 'Active'}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-[#172D20] group-hover:text-[#174D32] transition leading-snug line-clamp-1">
                      {lang === 'hi' ? cat.name_hi : cat.name_en}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                      {lang === 'hi' ? cat.desc_hi : cat.desc_en}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-4 border-t border-[#E2E8DF] flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#64748B]">
                        {lang === 'hi' ? 'मानक दर' : 'Typical Rate'}
                      </div>
                      <div className="font-extrabold text-[#172D20] mt-0.5">
                        {cat.rate}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryAction(cat);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#174D32] group-hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <span>{lang === 'hi' ? 'सेवा मांगें' : 'Request'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preserve all remaining categories in the existing marketplace per Quality Lock §2 */}
          <div className="mt-12 text-center">
            <Link
              to={user ? "/farmer/services" : "/login"}
              state={user ? undefined : { from: '/farmer/services' }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#174D32] text-white text-xs font-bold hover:bg-[#0e3321] transition shadow-md"
            >
              <span>{lang === 'hi' ? 'सभी 21+ सेवाएं खोजें (सेवा बाज़ार)' : 'Browse Complete Service Catalogue (All 21 Categories)'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 3. YOUR DIGITAL FARM MANAGER (Demonstration Showcase) ─── */}
      <section id="farm-manager" className="py-20 lg:py-28 bg-white border-y border-[#E2E8DF]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#174D32]/10 text-[#174D32] text-xs font-bold uppercase tracking-wider">
                <CalendarCheck className="w-3.5 h-3.5 text-[#174D32]" />
                <span>{lang === 'hi' ? 'फार्म प्रोजेक्ट मैनेजर' : 'Your Digital Farm Manager'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#172D20] tracking-tight leading-tight">
                {lang === 'hi' ? (
                  <>खेती की हर गतिविधि <br /><span className="text-[#174D32]">एक व्यवस्थित प्रोजेक्ट में।</span></>
                ) : (
                  <>Coordinate Entire Farm Activities <br /><span className="text-[#174D32]">Under One Unified Plan.</span></>
                )}
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                {lang === 'hi'
                  ? 'अलग-अलग लोगों को फोन करने के बजाय, किसान अपने पूरे खेत के लिए क्रमबद्ध कार्ययोजना बनाते हैं — बुवाई से लेकर कटाई तक श्रमिक, मशीनें और खर्च एक साथ ट्रैक होते हैं।'
                  : 'Instead of uncoordinated phone calls, build a structured agricultural project. Schedule machinery, track adult labour, log seed lots, and monitor expenses with unified milestone management.'}
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#174D32] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="text-xs sm:text-sm text-[#172D20]">
                    <strong>{lang === 'hi' ? '6 प्रमुख फसलों के वैज्ञानिक टेम्पलेट्स' : '6 Standardized Crop Workflow Templates'}</strong> — {lang === 'hi' ? 'गेहूं, धान, गन्ना, सरसों, मक्का, आलू' : 'Wheat, Paddy (DSR/Transplant), Sugarcane, Mustard, Maize, Potato'}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#174D32] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="text-xs sm:text-sm text-[#172D20]">
                    <strong>{lang === 'hi' ? 'डबल-बुकिंग रोकथाम' : 'Strict Double-Booking Protection'}</strong> — {lang === 'hi' ? 'प्रदाता की तारीख लॉक होने पर कोई टकराव नहीं' : 'Atomic date reservation prevents conflicting schedules'}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#174D32] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="text-xs sm:text-sm text-[#172D20]">
                    <strong>{lang === 'hi' ? 'वित्तीय लेजर व सटीक हिसाब' : 'Financial Ledger (FIN-01 to FIN-12)'}</strong> — {lang === 'hi' ? 'योजना, वास्तविक खर्च, भुगतान और शुद्ध मुनाफा' : 'Track estimates, commitments, incurred costs, and revenue'}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#174D32] text-white text-xs font-bold hover:bg-[#0e3321] transition shadow-md cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#FCE052]" />
                  <span>{lang === 'hi' ? 'लाइव डेमो प्रोजेक्ट देखें' : 'Preview Live Demo Project'}</span>
                </button>
              </div>
            </div>

            {/* Right Showcase Card (Safe Synthetic Demonstration per §12) */}
            <div className="lg:col-span-7">
              <div className="bg-[#FAF8F2] rounded-3xl p-6 sm:p-8 border border-[#E2E8DF] shadow-xl relative overflow-hidden">
                {/* Badge identifying synthetic demonstration */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8DF]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-[#172D20] uppercase tracking-wider">
                      {lang === 'hi' ? 'सिमुलेटेड प्रोजेक्ट प्रदर्शन' : 'Demonstration Preview (Safe Synthetic Records)'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Daurala, Meerut (20 Acres)
                  </span>
                </div>

                {/* Demonstration Project Content */}
                <div className="pt-6 space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-black text-[#172D20]">
                        Wheat Harvesting & Threshing 2026
                      </h4>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-[#174D32]">
                        65% Complete
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">
                      ICAR-IIWBR Karnal Recommended Workflow • Sown Nov 2025 • Parcel: Ganga Khet
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#E2E8DF] h-3 rounded-full overflow-hidden">
                    <div className="bg-[#84B547] h-full rounded-full transition-all duration-500" style={{ width: '65%' }} />
                  </div>

                  {/* Synchronized Operations List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E2E8DF]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#174D32] flex items-center justify-center">
                          <Tractor className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#172D20]">Combine Harvester (20 Acres)</div>
                          <div className="text-[11px] text-[#64748B]">Provider: Meerut Agri Machinery Works</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        Confirmed (₹30,000)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E2E8DF]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#174D32] flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#172D20]">5 Skilled Labourers (Grain Bagging)</div>
                          <div className="text-[11px] text-[#64748B]">Adult Worker Group: Sardhana</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        Confirmed (₹5,000)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E2E8DF]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#172D20]">Tractor Hydraulic Pre-Check</div>
                          <div className="text-[11px] text-[#64748B]">Technician: Daurala Diesel Works</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                        2 Quotes Received
                      </span>
                    </div>
                  </div>

                  {/* Financial Mini Ledger */}
                  <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                    <div className="p-3 bg-white rounded-xl border border-[#E2E8DF]">
                      <div className="text-[10px] text-[#64748B] uppercase font-bold">Planned Budget</div>
                      <div className="text-sm font-black text-[#172D20] mt-0.5">₹38,000</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E2E8DF]">
                      <div className="text-[10px] text-[#64748B] uppercase font-bold">Commitments</div>
                      <div className="text-sm font-black text-[#174D32] mt-0.5">₹35,000</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E2E8DF]">
                      <div className="text-[10px] text-[#64748B] uppercase font-bold">Paid Advance</div>
                      <div className="text-sm font-black text-emerald-700 mt-0.5">₹10,000</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. CONNECTED ECOSYSTEM (Asymmetric Bento Grid) ─── */}
      <section id="ecosystem" className="py-20 lg:py-28 bg-[#F4F4EE]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#174D32]/10 text-[#174D32] text-xs font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-[#174D32]" />
              <span>{lang === 'hi' ? '12 एकीकृत कृषि मॉड्यूल' : '12 Connected Agricultural Modules'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#172D20] tracking-tight">
              {lang === 'hi' ? 'मिट्टी से फसल तक का संपूर्ण चक्र' : 'From Soil to Harvest: Connected Platform'}
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              {lang === 'hi'
                ? 'कृषि सेवा के सभी 12 मॉड्यूल एक-दूसरे से जुड़े हैं — एक जगह किया गया काम पूरे फार्म का डेटा अपडेट करता है।'
                : 'Every module communicates seamlessly: soil reports feed crop planning, operations generate service requests, and bookings update financial ledgers.'}
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Bento 1: Farm Project Manager (Central Hero Feature - 2 cols, 2 rows) */}
            <div className="md:col-span-2 lg:col-span-2 md:row-span-2 rounded-3xl p-8 bg-gradient-to-br from-[#174D32] to-[#0e3321] text-white flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#84B547] text-white flex items-center justify-center mb-6">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#FCE052]">
                  Central Core Feature
                </span>
                <h3 className="text-2xl sm:text-3xl font-black mt-2 mb-3">
                  {lang === 'hi' ? 'फार्म प्रोजेक्ट मैनेजर (Farm Projects)' : 'Farm Operations Project Manager'}
                </h3>
                <p className="text-sm text-emerald-100/85 leading-relaxed">
                  {lang === 'hi'
                    ? 'प्रत्येक फसल के लिए क्रमिक कार्ययोजना। बुवाई, निराई, सिंचाई और कटाई के सभी कार्यों का पूर्व-नियोजन और सेवा आवंटन।'
                    : 'The heart of KrishiSeva. Formulate complete crop plans, manage dependencies between farming operations, and unlock downstream tasks.'}
                </p>
              </div>

              <div className="pt-8 border-t border-white/10 mt-6 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-[#84B547] font-bold">6 Crops Supported</div>
                  <div className="text-white/70">9 Standardized Workflows</div>
                </div>
                <div>
                  <div className="text-[#84B547] font-bold">DAG Dependency</div>
                  <div className="text-white/70">Zero Circular Lockups</div>
                </div>
              </div>
            </div>

            {/* Bento 2: Land & Soil Intelligence */}
            <div className="rounded-3xl p-6 bg-white border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#174D32] flex items-center justify-center mb-4">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#172D20]">
                  {lang === 'hi' ? 'भूमि एवं मिट्टी प्रबंधन' : 'Land & Soil Intelligence'}
                </h4>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  {lang === 'hi'
                    ? 'खसरा पार्सल, मिट्टी परीक्षण (Soil Health Card) और भूमि स्वामित्व का डिजिटल ब्योरा।'
                    : 'Khasra parcels, land tenure (owned/leased), and official Soil Health Card laboratory records.'}
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#174D32] mt-4 flex items-center gap-1">
                Modules 01 & 02 <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Bento 3: Crop & Seed Intelligence */}
            <div className="rounded-3xl p-6 bg-white border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4">
                  <Sprout className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#172D20]">
                  {lang === 'hi' ? 'फसल व बीज प्रबंधन' : 'Crop & Seed Intelligence'}
                </h4>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  {lang === 'hi'
                    ? 'ICAR संस्थान संदर्भ और बीज लॉट की खरीद व वित्तीय लेजर से सीधा जुड़ाव।'
                    : 'Authoritative ICAR institutional references and seed procurement linked to expenditure.'}
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#174D32] mt-4 flex items-center gap-1">
                Modules 03 & 04 <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Bento 4: Weather Integration */}
            <div className="rounded-3xl p-6 bg-white border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center mb-4">
                  <CloudSun className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#172D20]">
                  {lang === 'hi' ? 'मौसम संदर्भ' : 'Advisory Weather'}
                </h4>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  {lang === 'hi'
                    ? '3-दिवसीय पूर्वानुमान, तापमान, वर्षा एवं आर्द्रता — सलाहकारी संदर्भ नीति के साथ।'
                    : 'Real-time 3-day forecast, rainfall, and humidity under non-prescriptive advisory policy.'}
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#174D32] mt-4 flex items-center gap-1">
                Module 05 <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Bento 5: Marketplace & Bookings */}
            <div className="rounded-3xl p-6 bg-white border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-lime-50 text-lime-800 flex items-center justify-center mb-4">
                  <Tractor className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#172D20]">
                  {lang === 'hi' ? 'सेवा बाज़ार एवं बुकिंग' : 'Marketplace & Bookings'}
                </h4>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  {lang === 'hi'
                    ? 'पारदर्शी कोटेशन तुलना, एकल बुकिंग स्वीकृति और ऑटोमैटिक बैकअप प्रदाता।'
                    : 'Competitive quotation proposals, single accepted booking, and backup provider resolution.'}
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#174D32] mt-4 flex items-center gap-1">
                Modules 06 & 07 <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Bento 6: Financial Accounting (FIN-01 to FIN-12) */}
            <div className="md:col-span-2 lg:col-span-2 rounded-3xl p-6 bg-white border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FCE052]/20 text-[#172D20] flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5 text-[#174D32]" />
                </div>
                <h4 className="text-base font-bold text-[#172D20]">
                  {lang === 'hi' ? 'वित्तीय लेजर व हिसाब-किताब' : 'Authoritative Financial Ledger'}
                </h4>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  {lang === 'hi'
                    ? 'नियोजित बजट, स्वीकृत प्रतिबद्धताएं, वास्तविक खर्च, अग्रिम व आंशिक भुगतान, फसल बिक्री और शुद्ध लाभ।'
                    : 'Planned estimates, confirmed commitments, incurred liabilities, recorded advance/partial payments, crop sales, and realized net surplus.'}
                </p>
              </div>
              <div className="pt-4 border-t border-[#E2E8DF] mt-4 flex items-center justify-between text-xs text-[#64748B]">
                <span>Rules FIN-01 to FIN-12 Enforced</span>
                <span className="text-[#174D32] font-bold">Two-Decimal Precision</span>
              </div>
            </div>

            {/* Bento 7: Crop Monitoring & Post-Harvest */}
            <div className="rounded-3xl p-6 bg-white border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-800 flex items-center justify-center mb-4">
                  <Leaf className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#172D20]">
                  {lang === 'hi' ? 'निगरानी व कटाई उपरांत' : 'Monitoring & Post-Harvest'}
                </h4>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  {lang === 'hi'
                    ? 'फसल विकास अवस्था, कीट/रोग प्रेक्षण, उपज भंडारण व मंडी परिवहन सेवाएं।'
                    : 'Phenological stages, crop observation notes, yield grades, storage, and transport requests.'}
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#174D32] mt-4 flex items-center gap-1">
                Modules 09 & 10 <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Bento 8: Analytics & Government Connect */}
            <div className="rounded-3xl p-6 bg-white border border-[#E2E8DF] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center mb-4">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#172D20]">
                  {lang === 'hi' ? 'विश्लेषण व सरकारी योजनाएं' : 'Analytics & Govt Connect'}
                </h4>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  {lang === 'hi'
                    ? 'प्रति एकड़ लागत विश्लेषण, सत्यापित सरकारी योजनाएं एवं नजदीकी KVK संस्थान।'
                    : 'Cost-per-acre metrics, verified central/state schemes, and official ICAR/KVK resources.'}
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#174D32] mt-4 flex items-center gap-1">
                Modules 11 & 12 <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. HOW KRISHISEVA WORKS (4-Step Flow per §12) ─── */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white border-b border-[#E2E8DF]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#174D32]/10 text-[#174D32] text-xs font-bold uppercase tracking-wider">
              <span>{lang === 'hi' ? 'सरल 4-चरणीय प्रक्रिया' : 'How KrishiSeva Works'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#172D20] tracking-tight">
              {lang === 'hi' ? 'खेत से फसल तक का आसान सफर' : 'Four Steps to Complete Farm Coordination'}
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              {lang === 'hi'
                ? 'कृषि सेवा पर फार्म जोड़ना और ऑपरेशन्स चलाना बेहद आसान और पारदर्शी है।'
                : 'Follow the natural agricultural cycle from parcel onboarding to final crop sale.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-[#FAF8F2] p-8 rounded-3xl border border-[#E2E8DF] relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#101510] text-[#FCE052] flex items-center justify-center font-black text-lg mb-6">
                  1
                </div>
                <h3 className="text-lg font-bold text-[#172D20] mb-2">
                  {lang === 'hi' ? 'खेत बनाएं (Create Farm)' : '1. Create Farm'}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {lang === 'hi'
                    ? 'अपना गांव, खसरा नंबर, कुल एकड़ और मिट्टी का प्रकार दर्ज करें।'
                    : 'Register your farm parcels, Khasra numbers, acreage, and soil profile.'}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-[#E2E8DF] text-[11px] font-bold text-[#174D32]">
                Pan-India LGD Hierarchy
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FAF8F2] p-8 rounded-3xl border border-[#E2E8DF] relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#174D32] text-white flex items-center justify-center font-black text-lg mb-6">
                  2
                </div>
                <h3 className="text-lg font-bold text-[#172D20] mb-2">
                  {lang === 'hi' ? 'फसल प्लान करें (Plan Crop)' : '2. Plan Crop'}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {lang === 'hi'
                    ? '6 फसलों में से चुनें — बुवाई, सिंचाई और कटाई के कार्य स्वतः प्लान हो जाएंगे।'
                    : 'Select from 6 standardized crop workflows with pre-sequenced farming tasks.'}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-[#E2E8DF] text-[11px] font-bold text-[#174D32]">
                ICAR Standard Templates
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FAF8F2] p-8 rounded-3xl border border-[#E2E8DF] relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#84B547] text-white flex items-center justify-center font-black text-lg mb-6">
                  3
                </div>
                <h3 className="text-lg font-bold text-[#172D20] mb-2">
                  {lang === 'hi' ? 'सेवाएं खोजें (Find Services)' : '3. Find Services'}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {lang === 'hi'
                    ? 'स्थानीय प्रदाताओं से पारदर्शी कोटेशन प्राप्त करें और पसंदीदा दर चुनें।'
                    : 'Receive competitive quotes from local verified providers with zero commission.'}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-[#E2E8DF] text-[11px] font-bold text-[#174D32]">
                Transparent Quotations
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#FAF8F2] p-8 rounded-3xl border border-[#E2E8DF] relative flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FCE052] text-[#101510] flex items-center justify-center font-black text-lg mb-6">
                  4
                </div>
                <h3 className="text-lg font-bold text-[#172D20] mb-2">
                  {lang === 'hi' ? 'ऑपरेशन्स व खर्च प्रबंधन' : '4. Manage Operations'}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {lang === 'hi'
                    ? 'काम पूरा होने पर स्वीकृति दें, खर्च दर्ज करें और शुद्ध मुनाफे का ब्योरा देखें।'
                    : 'Confirm completed tasks, release payments, and view your net farm surplus.'}
                </p>
              </div>
              <div className="pt-6 mt-4 border-t border-[#E2E8DF] text-[11px] font-bold text-[#174D32]">
                Authoritative Ledger
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. FARMER & PROVIDER ONBOARDING (§12) ─── */}
      <section className="py-20 lg:py-28 bg-[#F4F4EE]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Farmer Card */}
            <div className="bg-white p-8 lg:p-10 rounded-3xl border border-[#E2E8DF] shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#174D32] text-white flex items-center justify-center">
                  <Tractor className="w-6 h-6 text-[#84B547]" />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#174D32]">
                  {lang === 'hi' ? 'किसानों के लिए' : 'For Farmers'}
                </span>
                <h3 className="text-2xl font-black text-[#172D20]">
                  {lang === 'hi' ? 'समय पर मशीनें और कुशल श्रमिक' : 'Reliable Service Scheduling in Peak Seasons'}
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-[#64748B] pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#84B547] shrink-0" />
                    <span>{lang === 'hi' ? 'डबल-बुकिंग मुक्त गारंटीकृत तारीख' : 'Double-booking prevention on your farm calendar'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#84B547] shrink-0" />
                    <span>{lang === 'hi' ? 'पारदर्शी कोटेशन — कोई बिचौलिया नहीं' : 'Transparent quotations with clear price breakdowns'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#84B547] shrink-0" />
                    <span>{lang === 'hi' ? 'रद्द होने पर ऑटोमैटिक बैकअप प्रदाता' : 'Automatic backup provider matching if a booking cancels'}</span>
                  </li>
                </ul>
              </div>
              <div className="pt-8 mt-6 border-t border-[#E2E8DF]">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#174D32] text-white text-xs font-bold hover:bg-[#0e3321] transition shadow-xs"
                >
                  <span>{lang === 'hi' ? 'किसान के रूप में जुड़ें' : 'Register as Farmer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Provider & Worker Card */}
            <div className="bg-white p-8 lg:p-10 rounded-3xl border border-[#E2E8DF] shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#101510] text-[#FCE052] flex items-center justify-center">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#172D20]">
                  {lang === 'hi' ? 'श्रमिकों व प्रदाताओं के लिए' : 'For Providers & Adult Workers'}
                </span>
                <h3 className="text-2xl font-black text-[#172D20]">
                  {lang === 'hi' ? 'उचित मजदूरी और मशीनरी का पूरा उपयोग' : 'Fair Wages & High Machinery Utilization'}
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-[#64748B] pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#84B547] shrink-0" />
                    <span>{lang === 'hi' ? 'अपनी उचित दैनिक मजदूरी स्वयं तय करें' : 'Quote fair daily wages without broker exploitation'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#84B547] shrink-0" />
                    <span>{lang === 'hi' ? 'नजदीकी गांवों से सीधी मांग और बुकिंग' : 'Direct notifications for nearby tractor & tubewell requests'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#84B547] shrink-0" />
                    <span>{lang === 'hi' ? 'सत्यापित प्रदाता बैज और वास्तविक समीक्षाएं' : 'Verified badge and authentic operational work history'}</span>
                  </li>
                </ul>
              </div>
              <div className="pt-8 mt-6 border-t border-[#E2E8DF]">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#101510] text-white text-xs font-bold hover:bg-black transition shadow-xs"
                >
                  <span>{lang === 'hi' ? 'प्रदाता / श्रमिक पंजीकरण' : 'Register as Provider / Worker'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. TRUST AND FAQ (§12) ─── */}
      <section id="faq" className="py-20 lg:py-28 bg-white border-y border-[#E2E8DF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#174D32]/10 text-[#174D32] text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-[#174D32]" />
              <span>{lang === 'hi' ? 'विश्वास एवं सवाल-जवाब' : 'Trust & FAQ'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#172D20] tracking-tight">
              {lang === 'hi' ? 'अक्सर पूछे जाने वाले सवाल' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-sm text-[#64748B]">
              {lang === 'hi' ? 'कृषि सेवा की कार्यप्रणाली के मुख्य प्रश्नों के स्पष्ट उत्तर।' : 'Clear, honest answers about platform mechanics, reliability, and security.'}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((f, idx) => (
              <div
                key={idx}
                className="bg-[#FAF8F2] rounded-2xl border border-[#E2E8DF] overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? -1 : idx)}
                  className="w-full text-left p-6 flex items-center justify-between font-bold text-sm sm:text-base text-[#172D20] hover:text-[#174D32] cursor-pointer"
                >
                  <span>{lang === 'hi' ? f.q_hi : f.q_en}</span>
                  <ChevronRight
                    className={`w-5 h-5 text-[#64748B] transition-transform ${activeFaq === idx ? 'rotate-90 text-[#174D32]' : ''}`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-[#E2E8DF] pt-4">
                    {lang === 'hi' ? f.a_hi : f.a_en}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. PREMIUM FINAL CTA (§12) ─── */}
      <section className="py-20 lg:py-28 bg-[#174D32] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-[#84B547]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-[#101510]/30 blur-3xl pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-emerald-100 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#FCE052]" />
            <span>{lang === 'hi' ? 'भारतीय कृषि का नया सवेरा' : 'The Future of Farm Coordination'}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            {lang === 'hi' ? 'अपने खेत के प्रबंधन का बेहतर तरीका।' : 'A Better Way to Manage Your Farm.'}
          </h2>

          <p className="text-sm sm:text-base text-emerald-100/85 max-w-2xl mx-auto leading-relaxed">
            {lang === 'hi'
              ? 'आज ही कृषि सेवा से जुड़ें — अपनी फसलों की योजना बनाएं, सही सेवा प्रदाता खोजें और बिना किसी तनाव के सफल खेती करें।'
              : 'Join thousands of farmers coordinating labour, machinery rentals, and farm operations with transparent pricing.'}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#FCE052] text-[#101510] text-sm sm:text-base font-extrabold hover:bg-[#FFF3B0] transition shadow-xl shadow-black/20"
            >
              <span>{lang === 'hi' ? 'निशुल्क पंजीकरण करें' : 'Get Started Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-white/30 text-white text-sm sm:text-base font-semibold hover:bg-white/10 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#FCE052]" />
              <span>{lang === 'hi' ? 'डेमो टेस्ट करें' : 'Try Live Demo'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 9. FOOTER (§12) ─── */}
      <footer className="bg-[#101510] text-white/70 py-16 border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
            {/* Col 1: Brand */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#174D32] flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-[#84B547]" />
                </div>
                <span className="text-xl font-black text-white">
                  Krishi<span className="text-[#84B547]">Seva</span>
                </span>
              </Link>
              <p className="text-xs text-white/60 leading-relaxed max-w-sm">
                The Farm Operations Coordination Platform connecting Indian farmers with verified agricultural workers, tractor mechanics, tubewell technicians, and machinery rental providers.
              </p>
              <div className="text-xs text-white/50 space-y-1">
                <div><strong className="text-white/80">Founder:</strong> Harshit Chaudhary</div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <MapPin className="w-3.5 h-3.5 text-[#84B547]" />
                  <span>Meerut Rural & Western Uttar Pradesh</span>
                </div>
              </div>
            </div>

            {/* Col 2: Services */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FCE052] mb-4">
                {lang === 'hi' ? 'सक्रिय सेवाएं' : 'Active Services'}
              </h4>
              <ul className="space-y-2.5 text-xs text-white/70">
                <li><a href="#services" className="hover:text-white transition">Agricultural Labour</a></li>
                <li><a href="#services" className="hover:text-white transition">Tractor Repair & Mechanics</a></li>
                <li><a href="#services" className="hover:text-white transition">Tubewell Technician</a></li>
                <li><a href="#services" className="hover:text-white transition">Machinery Rental</a></li>
              </ul>
            </div>

            {/* Col 3: Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FCE052] mb-4">
                {lang === 'hi' ? 'प्लेटफ़ॉर्म' : 'Platform'}
              </h4>
              <ul className="space-y-2.5 text-xs text-white/70">
                <li><a href="#hero" className="hover:text-white transition">Home</a></li>
                <li><a href="#services" className="hover:text-white transition">Services</a></li>
                <li><a href="#farm-manager" className="hover:text-white transition">Farm Manager</a></li>
                <li><a href="#ecosystem" className="hover:text-white transition">12 Modules</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              </ul>
            </div>

            {/* Col 4: Portals */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FCE052] mb-4">
                {lang === 'hi' ? 'पोर्टल एक्सेस' : 'Portals'}
              </h4>
              <ul className="space-y-2.5 text-xs text-white/70">
                <li><Link to="/login" className="hover:text-white transition">Farmer Login</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Worker Login</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Provider Login</Link></li>
                <li><Link to="/register" className="hover:text-white transition">Sign Up Free</Link></li>
                <li><a href="/admin/" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">Django Admin</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <p>© 2026 KrishiSeva. Designed for rural agricultural coordination in India.</p>
            <div className="flex items-center gap-4">
              <span>Zero Fake Reviews</span>
              <span>•</span>
              <span>Strict Double-Booking Lock</span>
              <span>•</span>
              <span>Clean Architecture MVP</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QuickDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
      <CreateRequestModal
        isOpen={createReqOpen}
        onClose={() => setCreateReqOpen(false)}
        defaultCategorySlug={selectedCatSlug}
        onCreated={() => navigate('/farmer/requests')}
      />
    </div>
  );
}
