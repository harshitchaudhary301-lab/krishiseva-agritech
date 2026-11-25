import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Mic, MicOff, ArrowRight, CheckCircle2,
  Users, Wrench, Droplet, Tractor, Waves, Sprout, Truck,
  Building2, ShieldCheck, Calendar, Sparkles, ChevronRight,
  HelpCircle, Star, AlertCircle, Play, X, ChevronDown
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import QuickDemoModal from '../components/QuickDemoModal';
import CreateRequestModal from '../components/CreateRequestModal';
import CinematicIntro from '../components/CinematicIntro';
import NationwideLocationSelector from '../components/NationwideLocationSelector';

export default function LandingPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState('Daurala');
  const [selectedLocation, setSelectedLocation] = useState({
    state: 'Uttar Pradesh',
    state_id: 35,
    district: 'Meerut',
    district_id: 720,
    subdistrict: 'Sardhana',
    subdistrict_id: 692,
    village: 'Daurala',
    is_unverified: false
  });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [createReqOpen, setCreateReqOpen] = useState(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(null);
  const [activeFaq, setActiveFaq] = useState(0);

  // KAABIL-style Cinematic Intro state (plays automatically on first visit, remembers in localStorage)
  const [showIntro, setShowIntro] = useState(() => {
    return !localStorage.getItem('krishiseva_intro_seen_v1');
  });

  useEffect(() => {
    const handleReplayIntro = () => {
      setShowIntro(true);
    };
    window.addEventListener('krishi_replay_intro', handleReplayIntro);
    return () => window.removeEventListener('krishi_replay_intro', handleReplayIntro);
  }, []);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [catRes, vilRes] = await Promise.all([
          api.get('/services/categories/'),
          api.get('/services/villages/')
        ]);
        setCategories(catRes.data);
        setVillages(vilRes.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchLandingData();
  }, []);

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Users': return Users;
      case 'Wrench': return Wrench;
      case 'Droplet': return Droplet;
      case 'Tractor': return Tractor;
      case 'Waves': return Waves;
      case 'Sprout': return Sprout;
      case 'Truck': return Truck;
      case 'Building2': return Building2;
      default: return Wrench;
    }
  };

  const handleCategoryClick = (cat) => {
    if (!cat.is_active) return;
    if (user) {
      if (user.role === 'farmer') {
        setSelectedCategorySlug(cat.slug);
        setCreateReqOpen(true);
      } else {
        navigate('/provider/dashboard');
      }
    } else {
      setDemoModalOpen(true);
    }
  };

  const faqs = [
    {
      q_en: "What makes KrishiSeva different from just calling a local mechanic?",
      q_hi: "स्थानीय मैकेनिक को सामान्य फोन करने की तुलना में कृषि सेवा कैसे बेहतर है?",
      a_en: "KrishiSeva introduces complete Farm Operations Task Management. Instead of isolated calls, a farmer can coordinate a complete operation—like a 20-acre Wheat Harvesting project—managing machinery, labour, and emergency mechanics with unified schedules, transparent quotes, double-booking prevention, and automated backup providers.",
      a_hi: "कृषि सेवा संपूर्ण फार्म प्रोजेक्ट प्रबंधन प्रदान करती है। सिर्फ फोन लगाने के बजाय, किसान पूरे गेहूं कटाई प्रोजेक्ट के लिए कंबाइन हार्वेस्टर, श्रमिक और मैकेनिक एक साथ पारदर्शी कोटेशन, बिना डबल-बुकिंग और ऑटोमैटिक बैकअप प्रदाता सुविधा के साथ बुक कर सकते हैं।"
    },
    {
      q_en: "How does KrishiSeva prevent double-booking conflicts?",
      q_hi: "कृषि सेवा डबल-बुकिंग की समस्या को कैसे रोकती है?",
      a_en: "Our backend runs strict database checks. When a service provider confirms availability for a specific date, our system atomically prevents conflicting bookings for the same provider on that date.",
      a_hi: "हमारा बैकएंड कड़े डेटाबेस नियमों का पालन करता है। जब कोई प्रदाता किसी निश्चित तारीख के लिए बुकिंग स्वीकार करता है, तो सिस्टम उसी तारीख पर किसी अन्य बुकिंग को अस्वीकार कर देता है।"
    },
    {
      q_en: "What happens if a booked provider or technician cancels at the last minute?",
      q_hi: "यदि बुक किया गया प्रदाता अंतिम समय पर काम रद्द कर दे तो क्या होगा?",
      a_en: "Our Backup Provider System immediately triggers. It identifies nearby verified providers in the same category who are available on your date, ranks them transparently, and lets the farmer request replacement quotations with one click.",
      a_hi: "हमारा बैकअप प्रदाता सिस्टम तुरंत सक्रिय हो जाता है। यह उसी गाँव व जिले के अन्य पात्र व उपलब्ध प्रदाताओं को ढूंढता है और किसान को एक क्लिक में वैकल्पिक कोटेशन प्राप्त करने की सुविधा देता है।"
    },
    {
      q_en: "Do agricultural workers need to pay any commission or registration fee?",
      q_hi: "क्या कृषि श्रमिकों को कोई कमीशन या शुल्क देना होता है?",
      a_en: "No. Agricultural workers register for free, quote their own fair daily wage rates, and freely accept or decline work according to their schedule.",
      a_hi: "बिल्कुल नहीं। कृषि श्रमिकों का पंजीकरण पूरी तरह निशुल्क है। वे अपनी मजदूरी स्वयं तय करते हैं और अपनी मर्जी से काम स्वीकार या अस्वीकार कर सकते हैं।"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9F5]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 bg-gradient-to-b from-[#FAF8F2] via-[#F7F9F5] to-white border-b border-slate-200">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#84B547]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-[#174D32]/5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & Search */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Top Tagline Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#174D32]/10 border border-[#174D32]/20 text-[#174D32] text-xs font-extrabold uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#84B547]" />
                <span>{t('subTagline')}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#174D32] tracking-tight leading-[1.15]">
                {lang === 'hi' ? (
                  <>
                    खेती की हर जरूरत, <br />
                    <span className="text-[#84B547] underline decoration-[#E8B44C] decoration-4 underline-offset-8">
                      एक जगह।
                    </span>
                  </>
                ) : (
                  <>
                    Every Farm Need, <br />
                    <span className="text-[#84B547] underline decoration-[#E8B44C] decoration-4 underline-offset-8">
                      In One Place.
                    </span>
                  </>
                )}
              </h1>

              {/* Subtext */}
              <p className="text-base sm:text-lg text-slate-700 max-w-2xl leading-relaxed font-normal">
                {lang === 'hi'
                  ? 'कुशल कृषि श्रमिक, ट्रैक्टर मैकेनिक, ट्यूबवेल कारीगर और कंबाइन हार्वेस्टर किराए पर लें — पारदर्शी कोटेशन और संपूर्ण फार्म प्रोजेक्ट प्रबंधन के साथ।'
                  : 'Find verified agricultural workers, tractor mechanics, tubewell technicians, and machinery rentals through one connected platform with complete farm task management.'}
              </p>

              {/* Search & Location Bar */}
              <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl shadow-emerald-950/5 border border-slate-200/90 max-w-xl mx-auto lg:mx-0 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                {/* Pan-India Location Selector Trigger */}
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50/90 hover:bg-emerald-100 rounded-xl border border-emerald-200/90 shrink-0 text-left transition cursor-pointer"
                  title="Click to select nationwide location"
                >
                  <MapPin className="w-4 h-4 text-[#174D32] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-emerald-800 font-extrabold uppercase leading-none">
                      {selectedLocation.district || 'India'}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                      {selectedLocation.village || 'Select Village'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {/* Search Input */}
                <div className="flex-1 flex items-center px-2">
                  <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'hi' ? 'खोजें: हार्वेस्टर, मैकेनिक, श्रमिक...' : 'Search: harvester, mechanic, labour...'}
                    className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent outline-none"
                  />
                </div>

                {/* Voice search control clearly marked as coming soon */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-[11px] font-semibold cursor-not-allowed border border-slate-200 shrink-0"
                  title="Voice Search is coming soon in future release"
                >
                  <MicOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === 'hi' ? 'आवाज (जल्द)' : 'Voice (Soon)'}</span>
                </div>

                {/* CTA Action */}
                <button
                  onClick={() => {
                    if (user && user.role === 'farmer') {
                      setCreateReqOpen(true);
                    } else {
                      setDemoModalOpen(true);
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>{t('findServices')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* CTAs & Trust Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs font-bold">
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#84B547] text-white hover:bg-[#729f3c] transition shadow-md shadow-lime-900/10 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'डेमो टेस्ट करें (एक-क्लिक)' : 'Try Live Demo (One-Click)'}</span>
                </button>

                <button
                  onClick={() => setShowIntro(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50/60 text-[#174D32] transition shadow-xs cursor-pointer"
                  title={lang === 'hi' ? 'सिनेमैटिक इंट्रो देखें' : 'Watch Cinematic Intro'}
                >
                  <Play className="w-3.5 h-3.5 text-[#84B547] fill-[#84B547]" />
                  <span>{lang === 'hi' ? 'सिनेमैटिक इंट्रो' : 'Watch Intro'}</span>
                </button>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 transition"
                >
                  <Users className="w-4 h-4 text-[#174D32]" />
                  <span>{t('joinProvider')}</span>
                </Link>
              </div>

              {/* Reliability Indicators */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#84B547]" />
                  <span>{lang === 'hi' ? 'डबल-बुकिंग रोकथाम' : 'Double-booking prevention'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#84B547]" />
                  <span>{lang === 'hi' ? 'सत्यापित स्थानीय प्रदाता' : 'Verified local providers'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#84B547]" />
                  <span>{lang === 'hi' ? 'बैकअप प्रदाता सहायता' : 'Backup provider guarantee'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
                {/* Top Badge */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {lang === 'hi' ? 'लाइव फार्म ऑपरेशन्स' : 'Live Operations'}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Daurala, Meerut
                  </span>
                </div>

                {/* Example Project Card */}
                <div className="pt-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-amber-200/70">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{t('wheatProjectExample')}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {lang === 'hi' ? 'प्रगति: 65%' : 'Progress: 65%'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
                      <div className="bg-[#84B547] h-full rounded-full transition-all duration-500" style={{ width: '65%' }} />
                    </div>

                    {/* Sub services list */}
                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <Tractor className="w-4 h-4 text-emerald-700" />
                          <span className="font-medium text-slate-800">Combine Harvester (20 Ac)</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Confirmed (₹30,000)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-lime-700" />
                          <span className="font-medium text-slate-800">5 Labourers (Bagging)</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Confirmed (₹5,000)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-amber-700" />
                          <span className="font-medium text-slate-800">Tractor Inspection</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          2 Quotes Received
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                    {lang === 'hi'
                      ? 'कृषि सेवा पर किसान एक ही प्रोजेक्ट में सभी आवश्यक सेवाएं एक साथ व्यवस्थित करते हैं।'
                      : 'Farmers seamlessly coordinate labour, machinery, and maintenance under one synchronized farm activity.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories Ecosystem */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
              <span>{t('categoriesTitle')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#174D32]">
              {lang === 'hi' ? 'सभी आवश्यक कृषि सेवाएं — सत्यापित और पारदर्शी' : 'Essential Agricultural Services Ecosystem'}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t('categoriesSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className={`p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
                    cat.is_active
                      ? 'bg-[#F7F9F5] border-slate-200 hover:border-[#84B547] hover:shadow-lg hover:-translate-y-1 cursor-pointer'
                      : 'bg-slate-50/70 border-slate-200/60 opacity-80 cursor-not-allowed'
                  }`}
                >
                  <div>
                    {/* Top row: Icon and Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl transition ${
                        cat.is_active
                          ? 'bg-white shadow-xs text-[#174D32] group-hover:bg-[#174D32] group-hover:text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {cat.is_active ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {t('activeBadge')}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          {t('upcomingBadge')}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#174D32] transition">
                      {lang === 'hi' ? cat.name_hi : cat.name_en}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                      {lang === 'hi' ? cat.description_hi : cat.description_en}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        {lang === 'hi' ? 'मानक दर' : 'Typical Rate'}
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {cat.typical_price_range}
                      </div>
                    </div>
                    {cat.is_active && (
                      <span className="p-2 rounded-xl bg-white group-hover:bg-[#84B547] text-slate-600 group-hover:text-white shadow-xs transition">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#F7F9F5] border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#174D32]/10 text-[#174D32] text-xs font-bold">
              <span>{t('howItWorks')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#174D32]">
              {lang === 'hi' ? 'सरल, पारदर्शी और भरोसेमंद प्रक्रिया' : 'Simple, Reliable 3-Step Coordination'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-[#174D32] text-white flex items-center justify-center font-black text-lg mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t('step1Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('step1Desc')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-[#84B547] text-white flex items-center justify-center font-black text-lg mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t('step2Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('step2Desc')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-[#E8B44C] text-slate-950 flex items-center justify-center font-black text-lg mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t('step3Title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core USP Spotlight: Farm Project Manager */}
      <section id="farm-projects" className="py-20 bg-gradient-to-r from-[#174D32] to-[#236544] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-emerald-100">
                <Sparkles className="w-3.5 h-3.5 text-[#E8B44C]" />
                <span>{t('coreUSPTitle')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                {lang === 'hi' ? (
                  <>खेती की गतिविधियों का <br/><span className="text-[#84B547]">एक संपूर्ण प्रोजेक्ट प्रबंधन</span></>
                ) : (
                  <>Coordinate Entire Farm Activities <br/><span className="text-[#84B547]">As One Unified Project</span></>
                )}
              </h2>
              <p className="text-emerald-100 text-sm sm:text-base leading-relaxed max-w-2xl">
                {lang === 'hi'
                  ? 'अकेले किसी सेवा को खोजने के बजाय, किसान एक "गेहूं कटाई प्रोजेक्ट" बना सकते हैं जिसमें कंबाइन मशीन, 5 श्रमिक, और आपातकालीन ट्रैक्टर मैकेनिक तीनों एक साथ कोटेशन और शेड्यूल के साथ ट्रैक होते हैं।'
                  : 'Instead of isolated service bookings, farmers create unified farm operations like "Wheat Harvesting", coordinating machinery, adult labour, and mechanic inspection with synchronized dates, budgets, and milestones.'}
              </p>

              <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold">
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-[#84B547] text-white hover:bg-[#729f3c] transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  <span>{lang === 'hi' ? 'गेहूं कटाई प्रोजेक्ट देखें' : 'View Wheat Harvesting Demo'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white text-slate-800 p-6 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-base text-slate-900">Wheat Harvesting 2026</h4>
                  <span className="text-xs text-slate-500">20 Acres • Ganga Khet (Daurala)</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  Planning & Quoting
                </span>
              </div>

              <div className="py-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Estimated Budget:</span>
                  <span className="font-bold text-slate-900">₹35,950</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Services Confirmed:</span>
                  <span className="font-bold text-[#174D32]">2 of 3 Confirmed</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                  ⚠️ Note: Project cannot be marked Ready until all essential services (e.g. Tractor Overhaul) have confirmed bookings.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Ecosystem */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Farmer */}
            <div className="p-8 rounded-3xl bg-[#F7F9F5] border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-[#174D32] text-white flex items-center justify-center font-bold mb-4">
                <Tractor className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('farmerBenefits')}</h3>
              <ul className="text-xs text-slate-600 space-y-2.5">
                <li>✓ Reliable farm service scheduling in peak seasons</li>
                <li>✓ Transparent quotations with price breakdowns</li>
                <li>✓ Automatic backup provider suggestions on cancellations</li>
                <li>✓ No middlemen or hidden commissions</li>
              </ul>
            </div>

            {/* Worker */}
            <div className="p-8 rounded-3xl bg-[#F7F9F5] border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-[#84B547] text-white flex items-center justify-center font-bold mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('workerBenefits')}</h3>
              <ul className="text-xs text-slate-600 space-y-2.5">
                <li>✓ Direct connection to local farmers without exploitation</li>
                <li>✓ Propose fair daily wages based on skill</li>
                <li>✓ Complete freedom to accept or reject work</li>
                <li>✓ Build genuine local reputation and work history</li>
              </ul>
            </div>

            {/* Provider */}
            <div className="p-8 rounded-3xl bg-[#F7F9F5] border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-[#E8B44C] text-slate-900 flex items-center justify-center font-bold mb-4">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('providerBenefits')}</h3>
              <ul className="text-xs text-slate-600 space-y-2.5">
                <li>✓ Guaranteed double-booking protection on your calendar</li>
                <li>✓ Direct notifications for nearby tractor & tubewell requests</li>
                <li>✓ High machinery utilization during harvest & sowing</li>
                <li>✓ Verified provider badge and genuine farm reviews</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="about" className="py-20 bg-[#FAF8F2] border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-extrabold text-[#174D32]">
              {t('faqTitle')}
            </h2>
            <p className="text-slate-600 text-sm">
              {lang === 'hi' ? 'कृषि सेवा की कार्यप्रणाली के मुख्य प्रश्न' : 'Clear answers to common questions about our platform.'}
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((f, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? -1 : idx)}
                  className="w-full text-left p-5 flex items-center justify-between font-bold text-sm text-slate-900 hover:text-[#174D32] cursor-pointer"
                >
                  <span>{lang === 'hi' ? f.q_hi : f.q_en}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-90 text-[#174D32]' : ''}`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {lang === 'hi' ? f.a_hi : f.a_en}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nationwide Location Selection Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-[#174D32]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {lang === 'hi' ? 'स्थान चुनें (Pan-India Central Location Engine)' : 'Select Location (Pan-India)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'hi' ? '6.6 लाख+ आधिकारिक LGD गाँवों और सभी 36 राज्यों/केंद्र शासित प्रदेशों में खोजें' : 'Search across 662k+ official LGD villages & all 36 States/UTs'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <NationwideLocationSelector
              value={selectedLocation}
              onChange={(loc) => {
                setSelectedLocation(loc);
                if (loc.village) setSelectedVillage(loc.village);
              }}
              showBlock
            />

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {selectedLocation.village
                  ? `${selectedLocation.village}, ${selectedLocation.district}, ${selectedLocation.state}`
                  : 'Select a location'}
              </span>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition cursor-pointer"
              >
                {lang === 'hi' ? 'स्थान लागू करें' : 'Apply Location'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <QuickDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
      <CreateRequestModal
        isOpen={createReqOpen}
        onClose={() => setCreateReqOpen(false)}
        defaultCategorySlug={selectedCategorySlug}
        onCreated={() => navigate('/farmer/requests')}
      />

      {/* KAABIL-style Cinematic Intro Overlay */}
      {showIntro && (
        <CinematicIntro
          onComplete={() => setShowIntro(false)}
          isReplay={false}
        />
      )}
    </div>
  );
}
