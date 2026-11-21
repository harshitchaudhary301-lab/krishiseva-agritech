import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, MapPin, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getAdminUrl } from '../api/client';

export default function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="bg-[#0e3321] text-slate-300 pt-16 pb-12 border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-emerald-900/60">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#84B547] flex items-center justify-center text-white shadow-md">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12" strokeWidth="2" strokeLinecap="round" stroke="#FFFFFF"/>
                  <path d="M12 6V18M12 11L8 8M12 14L16 11M12 17L8 15" strokeWidth="2" strokeLinecap="round" stroke="#174D32"/>
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Krishi<span className="text-[#84B547]">Seva</span>
              </span>
            </div>
            
            <p className="text-sm text-emerald-100/80 font-hindi text-base leading-relaxed">
              खेती की हर जरूरत, एक जगह।
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The Farm Operations Coordination Platform connecting Indian farmers with verified agricultural workers, tractor mechanics, tubewell technicians, and machinery rental providers.
            </p>

            <div className="pt-2 text-xs text-emerald-200/90 font-medium space-y-1">
              <div><strong className="text-white">Founder:</strong> Harshit Chaudhary</div>
              <div><strong className="text-white">Product:</strong> The Farm Operations Coordination Platform</div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-[#84B547]" />
                <span>Meerut Rural & Western Uttar Pradesh</span>
              </div>
            </div>
          </div>

          {/* Core MVP Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E8B44C] mb-4">
              {lang === 'hi' ? 'सक्रिय कृषि सेवाएं' : 'Active MVP Services'}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#services" className="hover:text-white transition">
                  {lang === 'hi' ? 'कृषि श्रमिक' : 'Agricultural Labour'}
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-white transition">
                  {lang === 'hi' ? 'ट्रैक्टर मैकेनिक' : 'Tractor Mechanic'}
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-white transition">
                  {lang === 'hi' ? 'ट्यूबवेल व मोटर मरम्मत' : 'Tubewell Repair'}
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-white transition">
                  {lang === 'hi' ? 'कृषि यंत्र किराया' : 'Machinery Rental'}
                </a>
              </li>
            </ul>
          </div>

          {/* Upcoming Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              {lang === 'hi' ? 'आगामी सेवाएं' : 'Upcoming Modules'}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span>{lang === 'hi' ? 'ड्रिप एवं सिंचाई' : 'Irrigation & Drip'}</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 rounded">Soon</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>{lang === 'hi' ? 'बीज व उर्वरक' : 'Certified Suppliers'}</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 rounded">Soon</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>{lang === 'hi' ? 'फसल परिवहन' : 'Agri Transport'}</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 rounded">Soon</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>{lang === 'hi' ? 'गोदाम व कोल्ड स्टोर' : 'Storage Godowns'}</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 rounded">Soon</span>
              </li>
            </ul>
          </div>

          {/* Portals & Security */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E8B44C] mb-4">
              {lang === 'hi' ? 'पोर्टल व सुरक्षा' : 'Portals & Admin'}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/login" className="hover:text-white transition">
                  {lang === 'hi' ? 'किसान लॉगिन' : 'Farmer Portal'}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  {lang === 'hi' ? 'श्रमिक व प्रदाता लॉगिन' : 'Worker / Provider Portal'}
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    window.dispatchEvent(new Event('krishi_replay_intro'));
                  }}
                  className="hover:text-white transition inline-flex items-center gap-1.5 text-emerald-300 hover:underline cursor-pointer"
                >
                  <span className="text-[10px]">▶</span>
                  <span>{lang === 'hi' ? 'सिनेमैटिक इंट्रो दोबारा देखें' : 'Replay Cinematic Intro'}</span>
                </button>
              </li>
              <li>
                <a
                  href={getAdminUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition inline-flex items-center gap-1 text-emerald-300"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#84B547]" />
                  <span>Django Admin Panel</span>
                </a>
              </li>
              <li className="text-slate-400 pt-1">
                Zero fake ratings. Genuine double-booking conflict prevention.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 KrishiSeva. Designed for rural agricultural coordination in India.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Built by Harshit Chaudhary</span>
            <span>•</span>
            <span>Clean Architecture MVP</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
