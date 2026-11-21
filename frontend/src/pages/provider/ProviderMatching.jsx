import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowRight, Loader2, MapPin, Calendar } from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';
import SubmitQuoteModal from '../../components/SubmitQuoteModal';

export default function ProviderMatching() {
  const { lang } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/requests/');
      setRequests(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {lang === 'hi' ? 'मिलती-जुलती सेवा मांगें' : 'Matching Open Service Requests'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'hi'
            ? 'आपकी श्रेणी (ट्रैक्टर, ट्यूबवेल, मशीनरी) और सेवा गांवों से मेल खाने वाली सक्रिय मांगें।'
            : 'Service requests matching your registered categories, skills, and service radius.'}
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
          <span className="text-xs">Loading matching requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
          No open service requests matching your profile right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#84B547] transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      REQ-{req.id} • {req.category_details?.name_en}
                    </span>
                    <h4 className="font-bold text-base text-slate-900 mt-0.5">{req.title}</h4>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {req.description}
                </p>

                <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-amber-200/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Scope:</span>
                    <span className="font-bold text-slate-900">{req.scope_quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Required Date:</span>
                    <span className="font-bold text-slate-900">{req.required_date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Farmer:</span>
                    <span className="font-semibold text-slate-800">{req.farmer_name} ({req.village})</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Estimated: {req.budget_max ? `₹${req.budget_max}` : 'Open Quote'}
                </span>
                <button
                  onClick={() => {
                    setSelectedReq(req);
                    setQuoteModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{lang === 'hi' ? 'कोटेशन सबमिट करें' : 'Submit Quotation'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReq && (
        <SubmitQuoteModal
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
          requestItem={selectedReq}
          onSubmitted={() => fetchRequests()}
        />
      )}
    </div>
  );
}
