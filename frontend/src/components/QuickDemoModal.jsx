import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, User, Wrench, Tractor, Users, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getAdminUrl } from '../api/client';

export default function QuickDemoModal({ isOpen, onClose }) {
  const { quickLogin } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectDemo = async (key) => {
    setLoadingRole(key);
    setError('');
    try {
      const user = await quickLogin(key);
      onClose();
      if (user.role === 'farmer') {
        navigate('/farmer/overview');
      } else if (user.role === 'worker') {
        navigate('/worker/dashboard');
      } else if (user.role === 'provider') {
        navigate('/provider/dashboard');
      } else if (user.role === 'admin' || user.is_superuser) {
        window.open(getAdminUrl(), '_blank');
        navigate('/farmer/overview');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to log in with demo account. Ensure Django backend is running.');
    } finally {
      setLoadingRole(null);
    }
  };

  const demos = [
    {
      key: 'farmer',
      name: 'Ramesh Patel',
      roleText: lang === 'hi' ? 'किसान (20 एकड़ खेत)' : 'Farmer (20 Acres Farm)',
      village: 'Daurala, Meerut',
      badge: lang === 'hi' ? 'फार्मर डैशबोर्ड' : 'Farmer Dashboard',
      icon: User,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-500',
      desc: lang === 'hi' 
        ? 'गेहूं कटाई प्रोजेक्ट, 2 पक्की बुकिंग्स, और ट्रैक्टर मैकेनिक की खुली मांग।' 
        : 'Active Wheat Harvesting project with confirmed harvester + labour bookings.'
    },
    {
      key: 'worker',
      name: 'Suresh Kumar',
      roleText: lang === 'hi' ? 'कुशल कृषि श्रमिक टीम लीड' : 'Agricultural Worker Team Lead',
      village: 'Daurala, Meerut',
      badge: lang === 'hi' ? 'श्रमिक डैशबोर्ड' : 'Worker Dashboard',
      icon: Users,
      color: 'bg-lime-50 text-lime-800 border-lime-200 hover:border-lime-500',
      desc: lang === 'hi'
        ? 'दैनिक मजदूरी ₹500, कटाई व बोरी भराई काम, 4.9 रेटिंग, उपलब्ध स्थिति।'
        : 'Daily wage ₹500, 4.9 rating, accepted grain bagging job with Ramesh Patel.'
    },
    {
      key: 'mechanic',
      name: 'Vikram Singh',
      roleText: lang === 'hi' ? 'ट्रैक्टर मैकेनिक (किसान वर्कशॉप)' : 'Tractor Mechanic (Kisan Workshop)',
      village: 'Daurala, Meerut',
      badge: lang === 'hi' ? 'मैकेनिक प्रदाता' : 'Provider Dashboard',
      icon: Wrench,
      color: 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-500',
      desc: lang === 'hi'
        ? 'ITI प्रमाणित, ऑन-फार्म रिपेयरिंग, रमेश पटेल के ट्रैक्टर के लिए पेंडिंग कोटेशन।'
        : 'Submitted ₹950 quote for pre-harvest Swaraj tractor inspection.'
    },
    {
      key: 'machinery',
      name: 'Baldev Singh',
      roleText: lang === 'hi' ? 'कृषि यंत्र व हार्वेस्टर बेड़ा' : 'Machinery Fleet & Harvesters',
      village: 'Mawana, Meerut',
      badge: lang === 'hi' ? 'मशीनरी प्रदाता' : 'Provider Dashboard',
      icon: Tractor,
      color: 'bg-sky-50 text-sky-800 border-sky-200 hover:border-sky-500',
      desc: lang === 'hi'
        ? 'कंबाइन हार्वेस्टर मालिक, रमेश पटेल के साथ ₹30,000 की पक्की बुकिंग।'
        : 'Confirmed ₹30,000 booking for 20 acres wheat harvesting.'
    },
    {
      key: 'tubewell',
      name: 'Amit Verma',
      roleText: lang === 'hi' ? 'ट्यूबवेल व मोटर कारीगर' : 'Tubewell & Motor Technician',
      village: 'Daurala, Meerut',
      badge: lang === 'hi' ? 'तकनीशियन प्रदाता' : 'Provider Dashboard',
      icon: Wrench,
      color: 'bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-500',
      desc: lang === 'hi'
        ? 'सबमर्सिबल मोटर, वाइंडिंग और स्टार्टर मरम्मत विशेषज्ञ (4.8★)।'
        : 'Borewell pump rewinding & electrical starter repair.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#174D32] to-[#236544] text-white flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold mb-1 text-emerald-100">
              <Sparkles className="w-3.5 h-3.5 text-[#E8B44C]" />
              <span>{lang === 'hi' ? 'तुरंत परीक्षण मोड' : 'Instant Hackathon & Demo Mode'}</span>
            </div>
            <h2 className="text-xl font-bold">
              {lang === 'hi' ? 'एक-क्लिक डेमो भूमिका चुनें' : 'Select a Pre-Seeded Demo Profile'}
            </h2>
            <p className="text-sm text-emerald-100 mt-0.5">
              {lang === 'hi'
                ? 'बिना टाइप किए तुरंत किसी भी भूमिका में लॉगिन करके वास्तविक कार्यप्रवाह देखें।'
                : 'Experience real database-backed workflows without typing credentials.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm border-b border-red-200">
            {error}
          </div>
        )}

        {/* List of demo cards */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {demos.map((d) => {
            const Icon = d.icon;
            const isLoading = loadingRole === d.key;
            return (
              <button
                key={d.key}
                disabled={loadingRole !== null}
                onClick={() => handleSelectDemo(d.key)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${d.color} hover:shadow-md cursor-pointer`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-white shadow-xs text-slate-800 shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-base">{d.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/80 border border-slate-300/50">
                        {d.badge}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-0.5">
                      {d.roleText} • {d.village}
                    </div>
                    <p className="text-xs text-slate-700 mt-1 line-clamp-2 leading-relaxed">
                      {d.desc}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center text-slate-700">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#174D32]" />
                  ) : (
                    <div className="p-2 rounded-full bg-white/70 hover:bg-white shadow-xs">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-[#F7F9F5] border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>All profiles use real SQLite database records & migrations.</span>
          <span className="font-semibold text-[#174D32]">KrishiSeva MVP</span>
        </div>
      </div>
    </div>
  );
}
