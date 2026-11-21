import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

export default function CinematicIntro({ onComplete, isReplay = false }) {
  const { lang, toggleLanguage, t } = useLanguage();
  const [act, setAct] = useState(1); // 1: Problems, 2: Solution, 3: Triad, 4: Brand Reveal, 5: Exit
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const startTimeRef = useRef(null);
  const animFrameRef = useRef(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !isReplay) {
      handleComplete();
    }
  }, [isReplay]);

  // Escape key listener to skip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main 8-Second Choreography Engine
  useEffect(() => {
    startTimeRef.current = performance.now();

    const updateTimeline = (now) => {
      const elapsed = now - startTimeRef.current;
      const totalDuration = 8000;
      const currentProgress = Math.min(100, (elapsed / totalDuration) * 100);
      setProgress(currentProgress);

      if (elapsed < 2000) {
        setAct(1);
      } else if (elapsed < 4000) {
        setAct(2);
      } else if (elapsed < 6000) {
        setAct(3);
      } else if (elapsed < 7700) {
        setAct(4);
      } else if (elapsed >= 7700) {
        setAct(5);
        if (!isExiting) {
          setIsExiting(true);
          setTimeout(() => {
            handleComplete();
          }, 600);
          return;
        }
      }

      if (elapsed < 8500 && !isExiting) {
        animFrameRef.current = requestAnimationFrame(updateTimeline);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateTimeline);

    // Safety fallback timeout
    const fallbackTimeout = setTimeout(() => {
      handleComplete();
    }, 8600);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      clearTimeout(fallbackTimeout);
    };
  }, [isExiting]);

  const handleSkip = () => {
    if (isExiting) return;
    setIsExiting(true);
    setAct(5);
    setTimeout(() => {
      handleComplete();
    }, 450);
  };

  const handleComplete = () => {
    localStorage.setItem('krishiseva_intro_seen_v1', 'true');
    if (onComplete) onComplete();
  };

  return (
    <AnimatePresence>
      {!isExiting ? (
        <motion.div
          key="cinematic-intro-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] overflow-hidden bg-[#071910] text-white flex flex-col justify-between select-none cursor-default"
          style={{
            background: 'radial-gradient(ellipse 90% 80% at 50% 45%, #15452d 0%, #0d2b1d 45%, #06150d 100%)'
          }}
        >
          {/* Subtle Animated Agricultural Background Contours */}
          <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 1440 900"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient id="contourGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#84B547" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#E8B44C" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#174D32" stopOpacity="0.5" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Agricultural Field Furrows / Contours */}
              <motion.path
                d="M-100 250 C 300 200, 700 350, 1540 220"
                stroke="url(#contourGrad)"
                strokeWidth="1.5"
                strokeDasharray="8 6"
                initial={{ pathOffset: 0 }}
                animate={{ pathOffset: 1 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M-100 450 C 400 380, 900 520, 1540 400"
                stroke="url(#contourGrad)"
                strokeWidth="1.2"
                strokeDasharray="6 4"
                initial={{ pathOffset: 0 }}
                animate={{ pathOffset: -1 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M-100 650 C 500 580, 1000 700, 1540 600"
                stroke="url(#contourGrad)"
                strokeWidth="1.5"
                strokeDasharray="10 8"
                initial={{ pathOffset: 0 }}
                animate={{ pathOffset: 1 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              />

              {/* Geometric Field Grid Coordinates & Nodes */}
              <circle cx="340" cy="225" r="3.5" fill="#84B547" opacity="0.6" filter="url(#glow)" />
              <circle cx="720" cy="350" r="4.5" fill="#E8B44C" opacity="0.7" filter="url(#glow)" />
              <circle cx="1120" cy="280" r="3.5" fill="#84B547" opacity="0.6" filter="url(#glow)" />
              <circle cx="580" cy="480" r="4" fill="#84B547" opacity="0.6" filter="url(#glow)" />
              <circle cx="950" cy="510" r="3.5" fill="#E8B44C" opacity="0.5" filter="url(#glow)" />

              {/* Connecting Agricultural Network Vectors */}
              <line x1="340" y1="225" x2="720" y2="350" stroke="#84B547" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="3 3" />
              <line x1="720" y1="350" x2="1120" y2="280" stroke="#84B547" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="3 3" />
              <line x1="720" y1="350" x2="580" y2="480" stroke="#84B547" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="3 3" />
              <line x1="580" y1="480" x2="950" y2="510" stroke="#84B547" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="3 3" />
            </svg>
          </div>

          {/* Central Atmospheric Radial Bloom */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{
                scale: act === 1 ? [1, 1.15, 1] : act === 2 ? [1.1, 1.3, 1.2] : [1.2, 1.4, 1.3],
                opacity: act === 1 ? 0.25 : act === 2 ? 0.45 : 0.35
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] rounded-full blur-[90px] ${
                act === 1
                  ? 'bg-emerald-900/40'
                  : act === 2
                  ? 'bg-[#84B547]/25'
                  : act === 3
                  ? 'bg-amber-500/20'
                  : 'bg-[#84B547]/30'
              }`}
            />
          </div>

          {/* Top Header Bar: Language Switcher & Skip Intro Button */}
          <header className="relative z-20 max-w-7xl w-full mx-auto px-6 pt-6 flex items-center justify-between">
            {/* Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md text-xs font-bold text-emerald-100 transition shadow-xs cursor-pointer"
              title="Toggle Language / भाषा बदलें"
            >
              <span className="w-2 h-2 rounded-full bg-[#84B547]" />
              <span>{lang === 'hi' ? 'EN / हिंदी' : 'हिंदी / EN'}</span>
            </button>

            {/* Skip Button with Circular Radial Progress */}
            <button
              onClick={handleSkip}
              className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-xs font-bold text-white transition shadow-lg cursor-pointer"
            >
              <span>{t('intro.skip')}</span>
              <span className="text-[10px] font-mono opacity-60 px-1 py-0.5 rounded bg-black/30 border border-white/10">
                {t('intro.skipKey')}
              </span>

              {/* Circular Progress Ring */}
              <div className="relative w-4 h-4 flex items-center justify-center">
                <svg className="w-4 h-4 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#84B547"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray={62.83}
                    strokeDashoffset={62.83 - (62.83 * progress) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />
                </svg>
              </div>
            </button>
          </header>

          {/* Core Cinematic Showcase Container */}
          <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6">
            <div className="max-w-4xl w-full text-center">

              {/* ACT 1: 0 - 2 SECONDS ("Farming Problems") */}
              {act === 1 && (
                <motion.div
                  key="act1-problems"
                  initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4 sm:space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, letterSpacing: '0.3em' }}
                    animate={{ opacity: 1, letterSpacing: '0.2em' }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono font-extrabold uppercase text-[#E8B44C] px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
                  >
                    <span>{t('intro.act1Kicker')}</span>
                  </motion.div>

                  <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-[#FAF8F2] tracking-tight leading-tight">
                    {lang === 'hi' ? 'खेती की चुनौतियाँ' : 'Farming Problems'}
                  </h1>

                  <p className="text-sm sm:text-base text-emerald-200/80 max-w-xl mx-auto font-light leading-relaxed">
                    {lang === 'hi'
                      ? 'श्रमिकों की कमी, मशीनों की अनुपलब्धता और अनिश्चित समय।'
                      : 'Fragmented labor, unavailable machinery, and critical harvest delays.'}
                  </p>
                </motion.div>
              )}

              {/* ACT 2: 2 - 4 SECONDS ("One Connected Solution") */}
              {act === 2 && (
                <motion.div
                  key="act2-solution"
                  initial={{ opacity: 0, scale: 0.94, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4 sm:space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono font-extrabold uppercase text-emerald-300 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#84B547] animate-pulse" />
                    <span>{t('intro.act2Kicker')}</span>
                  </motion.div>

                  <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight">
                    <span className="text-white">{lang === 'hi' ? 'एक ' : 'One '}</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A8DC64] via-[#84B547] to-[#E8B44C] drop-shadow-sm">
                      {lang === 'hi' ? 'एकीकृत ' : 'Connected '}
                    </span>
                    <span className="text-white">{lang === 'hi' ? 'समाधान' : 'Solution'}</span>
                  </h1>

                  <div className="w-24 sm:w-36 h-1 mx-auto rounded-full bg-gradient-to-r from-transparent via-[#84B547] to-transparent" />

                  <p className="text-sm sm:text-base text-emerald-100/90 max-w-xl mx-auto font-light leading-relaxed">
                    {lang === 'hi'
                      ? 'संपूर्ण कृषि गतिविधियों का एक विश्वसनीय और पारदर्शी मंच।'
                      : 'Connecting farmers, workers, mechanics, and machinery under unified coordination.'}
                  </p>
                </motion.div>
              )}

              {/* ACT 3: 4 - 6 SECONDS ("Find → Connect → Grow") */}
              {act === 3 && (
                <motion.div
                  key="act3-triad"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                  transition={{ duration: 0.6 }}
                  className="space-y-8 sm:space-y-10"
                >
                  <div className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-emerald-200/70 uppercase">
                    THE THREE PILLARS • तीन मुख्य स्तंभ
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8">
                    {/* Pillar 1: Find */}
                    <motion.div
                      initial={{ opacity: 0, y: 24, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="p-5 sm:p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center gap-3 w-44 sm:w-48 shadow-xl shadow-black/20 group hover:border-[#84B547]/50 transition"
                    >
                      {/* Minimal Line Icon: Find / Compass */}
                      <div className="w-12 h-12 rounded-2xl bg-[#174D32] border border-[#84B547]/40 flex items-center justify-center text-[#84B547] shadow-inner">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="7" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          <circle cx="11" cy="11" r="2.5" stroke="#E8B44C" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white">
                        {t('intro.find')}
                      </div>
                      <div className="text-[11px] text-emerald-200/70 font-medium">
                        {t('intro.findSub')}
                      </div>
                    </motion.div>

                    {/* Sequential Connector 1 */}
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.4, delay: 0.45 }}
                      className="hidden sm:flex items-center text-[#84B547]"
                    >
                      <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </motion.div>

                    {/* Pillar 2: Connect */}
                    <motion.div
                      initial={{ opacity: 0, y: 24, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.55 }}
                      className="p-5 sm:p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center gap-3 w-44 sm:w-48 shadow-xl shadow-black/20 group hover:border-[#84B547]/50 transition"
                    >
                      {/* Minimal Line Icon: Connect / Sync */}
                      <div className="w-12 h-12 rounded-2xl bg-[#174D32] border border-[#84B547]/40 flex items-center justify-center text-[#84B547] shadow-inner">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-[#A8DC64]">
                        {t('intro.connect')}
                      </div>
                      <div className="text-[11px] text-emerald-200/70 font-medium">
                        {t('intro.connectSub')}
                      </div>
                    </motion.div>

                    {/* Sequential Connector 2 */}
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.4, delay: 0.85 }}
                      className="hidden sm:flex items-center text-[#E8B44C]"
                    >
                      <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </motion.div>

                    {/* Pillar 3: Grow */}
                    <motion.div
                      initial={{ opacity: 0, y: 24, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.95 }}
                      className="p-5 sm:p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center gap-3 w-44 sm:w-48 shadow-xl shadow-black/20 group hover:border-[#E8B44C]/50 transition"
                    >
                      {/* Minimal Line Icon: Grow / Harvest Sprout */}
                      <div className="w-12 h-12 rounded-2xl bg-[#174D32] border border-[#E8B44C]/40 flex items-center justify-center text-[#E8B44C] shadow-inner">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 20h10" />
                          <path d="M12 20v-8" />
                          <path d="M12 12c0-4 4-7 8-7 0 4-3 7-8 7Z" />
                          <path d="M12 15c0-3-3-5-6-5 0 3 2 5 6 5Z" />
                        </svg>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-[#E8B44C]">
                        {t('intro.grow')}
                      </div>
                      <div className="text-[11px] text-emerald-200/70 font-medium">
                        {t('intro.growSub')}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* ACT 4: 6 - 8 SECONDS (KrishiSeva Brand Revelation) */}
              {(act === 4 || act === 5) && (
                <motion.div
                  key="act4-brand"
                  initial={{ opacity: 0, scale: 0.88, filter: 'blur(16px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.06, filter: 'blur(10px)' }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-5 sm:space-y-7"
                >
                  {/* KrishiSeva Emblem Badge */}
                  <motion.div
                    initial={{ rotate: -10, scale: 0.7 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.8, type: 'spring', damping: 14 }}
                    className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-br from-[#174D32] to-[#0e3321] p-1 border-2 border-[#84B547] shadow-2xl shadow-[#84B547]/30 flex items-center justify-center relative group"
                  >
                    <div className="absolute inset-0 rounded-3xl bg-[#84B547]/20 blur-xl pointer-events-none" />
                    <svg className="w-12 h-12 sm:w-14 sm:h-14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12" strokeWidth="2" strokeLinecap="round" stroke="#84B547" />
                      <path d="M12 6V18M12 11L8 8M12 14L16 11M12 17L8 15" strokeWidth="2.2" strokeLinecap="round" stroke="#FFFFFF" />
                    </svg>
                  </motion.div>

                  {/* Brand Typography */}
                  <div>
                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none text-white drop-shadow-lg">
                      Krishi<span className="text-[#84B547]">Seva</span>
                    </h1>
                    <div className="text-base sm:text-xl font-bold text-amber-200/90 font-hindi mt-2">
                      {t('tagline')}
                    </div>
                  </div>

                  {/* Tagline & Positioning Pill */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="space-y-3"
                  >
                    <p className="text-sm sm:text-lg text-emerald-100 font-medium max-w-xl mx-auto">
                      {lang === 'hi'
                        ? 'खेती की हर जरूरत। एक जुड़ा हुआ मंच।'
                        : 'Every Farming Need. One Connected Platform.'}
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-[#E8B44C] animate-ping" />
                      <span>{t('subTagline')}</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}

            </div>
          </main>

          {/* Bottom Progress Bar & Indicator */}
          <footer className="relative z-20 max-w-xl w-full mx-auto px-6 pb-8 text-center space-y-3">
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden border border-white/10">
              <motion.div
                className="bg-gradient-to-r from-[#84B547] via-[#A8DC64] to-[#E8B44C] h-full rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[11px] font-mono text-emerald-200/60 uppercase tracking-widest flex items-center justify-between">
              <span>{lang === 'hi' ? 'कृषि सेवा में स्वागत है' : 'Entering KrishiSeva'}</span>
              <span>{Math.round((progress / 100) * 8)}s / 8s</span>
            </div>
          </footer>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
