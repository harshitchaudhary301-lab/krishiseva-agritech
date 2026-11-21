import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, FileText, ArrowRight, Loader2, Calendar, MapPin, IndianRupee } from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';
import CreateRequestModal from '../../components/CreateRequestModal';

export default function FarmerRequests() {
  const { lang, t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [createReqOpen, setCreateReqOpen] = useState(false);

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

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'open') return r.status === 'open' || r.status === 'quote_accepted';
    if (filter === 'booked') return r.status === 'booked' || r.status === 'completed';
    if (filter === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {lang === 'hi' ? 'मेरी सेवा मांगें' : 'My Service Requests'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'hi'
              ? 'आपके द्वारा दर्ज की गई मांगें। प्राप्त कोटेशन देखें और सबसे उचित सेवा चुनें।'
              : 'Track active requests, received quotations, and choose preferred providers.'}
          </p>
        </div>

        <button
          onClick={() => setCreateReqOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'hi' ? 'नया अनुरोध दर्ज करें' : 'Post New Request'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {['all', 'open', 'booked', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer capitalize ${
              filter === tab
                ? 'bg-[#174D32] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab === 'all' ? (lang === 'hi' ? 'सभी मांगें' : 'All Requests') : tab}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
          <span className="text-xs">Loading requests...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">
            {lang === 'hi' ? 'कोई सेवा मांग नहीं मिली' : 'No service requests found'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {lang === 'hi'
              ? 'श्रमिक, ट्रैक्टर मरम्मत या हार्वेस्टर की मांग दर्ज करें।'
              : 'Create a service request to start receiving competitive quotations from local verified providers.'}
          </p>
          <button
            onClick={() => setCreateReqOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#174D32] text-white text-xs font-bold"
          >
            {lang === 'hi' ? 'अनुरोध बनाएं' : 'Create Request'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((req) => (
            <Link
              key={req.id}
              to={`/farmer/requests/${req.id}`}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#84B547] hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                    REQ-{req.id} • {req.category_details?.name_en}
                  </span>
                  <StatusBadge status={req.status} />
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-[#174D32] transition">
                  {req.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {req.description}
                </p>

                <div className="my-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{lang === 'hi' ? 'दायरा:' : 'Scope:'}</span>
                    <span className="font-semibold text-slate-800">{req.scope_quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{lang === 'hi' ? 'तारीख:' : 'Target Date:'}</span>
                    <span className="font-semibold text-slate-800">{req.required_date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{lang === 'hi' ? 'स्थान:' : 'Village:'}</span>
                    <span className="font-semibold text-slate-800">{req.village}, {req.district}</span>
                  </div>
                  {req.farm_project && (
                    <div className="flex items-center justify-between text-purple-800 font-semibold bg-purple-50 p-1.5 rounded-lg text-[11px]">
                      <span>Project:</span>
                      <span>{req.project_name || 'Linked Project'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                  {lang === 'hi' ? `${req.quotations_count || 0} कोटेशन प्राप्त` : `${req.quotations_count || 0} Quotes Received`}
                </span>
                <span className="font-bold text-[#174D32] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>{lang === 'hi' ? 'समीक्षा करें' : 'Review Quotes'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateRequestModal
        isOpen={createReqOpen}
        onClose={() => setCreateReqOpen(false)}
        onCreated={() => fetchRequests()}
      />
    </div>
  );
}
