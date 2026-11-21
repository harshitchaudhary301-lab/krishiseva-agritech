import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Sparkles, Star, MapPin, Phone, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function BackupProvidersModal({ isOpen, onClose, bookingId }) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [contacted, setContacted] = useState({});

  useEffect(() => {
    if (isOpen && bookingId) {
      const fetchBackups = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await api.get(`/bookings/${bookingId}/backup-providers/`);
          setData(res.data);
        } catch (err) {
          console.error(err);
          setError('Failed to load backup provider recommendations.');
        } finally {
          setLoading(false);
        }
      };
      fetchBackups();
    }
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const handleRequestQuote = (providerId) => {
    setContacted(prev => ({ ...prev, [providerId]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 text-white shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {lang === 'hi' ? 'वैकल्पिक / बैकअप सेवा प्रदाता' : 'Backup Provider Recommendations'}
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">
                {lang === 'hi'
                  ? 'बुकिंग रद्द होने पर सिस्टम द्वारा स्वतः खोजे गए सत्यापित नजदीकी प्रदाता।'
                  : 'Automated transparent backup matching based on category, date, and proximity.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
              <p className="text-sm font-medium">
                {lang === 'hi' ? 'सत्यापित बैकअप प्रदाता खोजे जा रहे हैं...' : 'Finding verified backup providers...'}
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {error}
            </div>
          ) : !data || data.backup_providers.length === 0 ? (
            <div className="py-12 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">
                {lang === 'hi' ? 'कोई अन्य पात्र प्रदाता उपलब्ध नहीं है' : 'No Eligible Backup Providers Currently Available'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'hi'
                  ? 'इस तारीख और गाँव के लिए कोई अन्य प्रदाता उपलब्ध नहीं मिला। कृपया अनुरोध की तारीख बदलकर पुनः प्रयास करें।'
                  : 'No verified replacement providers are available for this specific date and village. Please consider modifying the requested service date.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 pb-1">
                <span>
                  {lang === 'hi' ? `कुल ${data.count} पात्र बैकअप प्रदाता मिले` : `Found ${data.count} verified alternative providers`}
                </span>
                <span className="font-semibold text-emerald-800">
                  {data.category} • {data.village}
                </span>
              </div>

              {data.backup_providers.map((p) => {
                const isSent = contacted[p.provider_id];
                return (
                  <div
                    key={p.provider_id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#84B547] bg-[#FAF8F2] transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-base">{p.name}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{p.rating}★</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          ({p.completed_jobs} jobs done)
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-3">
                        <span className="font-medium text-slate-800">{p.service_title}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#174D32]" />
                          {p.village}, {p.district}
                        </span>
                      </div>

                      {/* Transparent match reasons */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {p.match_reasons.map((r, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-medium px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200"
                          >
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
                      {isSent ? (
                        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold w-full sm:w-auto justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{lang === 'hi' ? 'कोटेशन अनुरोध भेजा गया' : 'Quote Requested'}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRequestQuote(p.provider_id)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>{lang === 'hi' ? 'कोटेशन मांगें' : 'Request Quote'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
