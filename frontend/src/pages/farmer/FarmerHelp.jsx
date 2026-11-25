import React, { useState, useEffect } from 'react';
import {
  HelpCircle, MessageSquare, AlertCircle, CheckCircle2, Phone, Mail,
  ShieldAlert, Loader2, Building2, ExternalLink, Globe, Landmark,
  BookOpen, Search, Filter, Sparkles
} from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerHelp() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('schemes'); // 'schemes' | 'complaints' | 'contact'

  // Complaints State
  const [complaints, setComplaints] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Schemes State
  const [schemes, setSchemes] = useState([]);
  const [schemeCategory, setSchemeCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, bookRes, schemeRes] = await Promise.all([
        api.get('/bookings/complaints/'),
        api.get('/bookings/'),
        api.get('/services/government-connect/').catch(() => ({ data: [] }))
      ]);
      setComplaints(compRes.data);
      setBookings(bookRes.data);
      if (bookRes.data.length > 0) {
        setSelectedBooking(bookRes.data[0].id);
      }
      setSchemes(schemeRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!title || !description || !selectedBooking) {
      setFeedback({ error: 'Please fill all complaint fields.', success: '' });
      return;
    }
    setSubmitting(true);
    setFeedback({ error: '', success: '' });

    try {
      await api.post('/bookings/complaints/', {
        booking: selectedBooking,
        title,
        description
      });
      setFeedback({
        error: '',
        success: lang === 'hi'
          ? 'शिकायत सफलतापूर्वक दर्ज हो गई है। एडमिन टीम 24 घंटे में समीक्षा करेगी।'
          : 'Complaint submitted successfully. Operations team will review within 24 hours.'
      });
      setTitle('');
      setDescription('');
      fetchData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Failed to submit complaint.', success: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSchemes = schemes.filter(s => {
    const matchesCat = schemeCategory === 'all' || s.category === schemeCategory;
    const matchesSearch = !searchQuery ||
      s.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name_hi.includes(searchQuery) ||
      s.description_en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#174D32] flex items-center gap-2">
            <Landmark className="w-7 h-7 text-[#84B547]" />
            <span>{lang === 'hi' ? 'सरकारी योजनाएं एवं सहायता केंद्र' : 'Government Connect & Farmer Support'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'hi'
              ? 'सत्यापित केन्द्रीय व राज्य कृषि योजनाएं, केवीके (KVK) निर्देशिका, और सेवा विवाद समाधान केंद्र।'
              : 'Verified directory of official agricultural schemes, KVK research centers, and platform dispute support.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'schemes' ? 'bg-[#174D32] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'सरकारी योजनाएं' : 'Govt Schemes'}
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'complaints' ? 'bg-[#174D32] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'शिकायत व विवाद' : 'Disputes'}
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'contact' ? 'bg-[#174D32] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'hi' ? 'सीधा संपर्क' : 'Helplines'}
          </button>
        </div>
      </div>

      {/* TAB 1: Government & Institutional Connect Directory (Module 12) */}
      {activeTab === 'schemes' && (
        <div className="space-y-6">
          {/* Disclaimer Banner */}
          <div className="bg-[#F5F1E6] border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#84B547] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">
                {lang === 'hi' ? 'आधिकारिक सरकारी सूचना निर्देशिका:' : 'Official Government Information Directory:'}
              </span>
              <p className="text-[11px] leading-relaxed text-amber-900">
                {lang === 'hi'
                  ? 'यह कृषि सेवा पर किसानों की सुविधा के लिए आधिकारिक सरकारी पोर्टलों और अनुसंधान संस्थानों की सत्यापित निर्देशिका है। कृषि सेवा कोई प्रत्यक्ष आवेदन जमा नहीं करता और न ही अनुदान की गारंटी देता है।'
                  : 'Verified reference directory of official portals and ICAR research centers. KrishiSeva provides informational links and does not promise eligibility or collect private banking credentials.'}
              </p>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={lang === 'hi' ? 'योजना या संस्थान खोजें (उदा. PM-KISAN, केवीके, फसल बीमा)...' : 'Search schemes or institutes (e.g. PM-KISAN, KVK, SMAM)...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#84B547] outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label_en: 'All', label_hi: 'सभी' },
                { id: 'central_scheme', label_en: 'Central Schemes', label_hi: 'केन्द्रीय योजनाएं' },
                { id: 'state_scheme', label_en: 'State Schemes', label_hi: 'राज्य योजनाएं' },
                { id: 'icar_institute', label_en: 'ICAR Institutes', label_hi: 'अनुसंधान संस्थान' },
                { id: 'kvk', label_en: 'KVK Centers', label_hi: 'केवीके' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSchemeCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                    schemeCategory === cat.id
                      ? 'bg-[#174D32] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'hi' ? cat.label_hi : cat.label_en}
                </button>
              ))}
            </div>
          </div>

          {/* Schemes Directory Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#174D32]" />
              <span className="text-xs">Loading directory...</span>
            </div>
          ) : filteredSchemes.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400 text-xs">
              {lang === 'hi' ? 'कोई योजना नहीं मिली।' : 'No matching schemes found.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchemes.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#84B547] transition shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                        {s.category_display || s.category}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {s.geographic_coverage}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {lang === 'hi' ? s.name_hi || s.name_en : s.name_en}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {lang === 'hi' ? s.description_hi || s.description_en : s.description_en}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-[11px]">
                    <div className="text-slate-500 truncate">
                      {s.contact_info && <span>📞 {s.contact_info}</span>}
                    </div>

                    <a
                      href={s.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white font-bold text-[11px] transition shrink-0"
                    >
                      <span>{lang === 'hi' ? 'आधिकारिक पोर्टल' : 'Official Portal'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Complaints & Dispute Resolution */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>{lang === 'hi' ? 'नई शिकायत दर्ज करें' : 'File a New Dispute / Complaint'}</span>
            </h3>

            {feedback.error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{feedback.error}</span>
              </div>
            )}
            {feedback.success && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedback.success}</span>
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {lang === 'hi' ? 'संबंधित बुकिंग चुनें' : 'Select Associated Booking'}
                </label>
                <select
                  value={selectedBooking}
                  onChange={(e) => setSelectedBooking(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                >
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>
                      #{b.id} - {b.service_title || 'Service'} ({b.scheduled_date}) [{b.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {lang === 'hi' ? 'शिकायत का विषय' : 'Complaint Title'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'hi' ? 'उदा. मशीन समय पर नहीं पहुंची / कार्य अधूरा' : 'e.g. Delay in arrival, incomplete depth'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {lang === 'hi' ? 'विस्तृत विवरण' : 'Detailed Description'}
                </label>
                <textarea
                  rows="4"
                  placeholder={lang === 'hi' ? 'विवाद या समस्या का पूरा विवरण लिखें...' : 'Provide complete details regarding the service dispute...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : (lang === 'hi' ? 'शिकायत दर्ज करें' : 'Submit Dispute')}
              </button>
            </form>
          </div>

          {/* Past Complaints */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
              {lang === 'hi' ? 'आपकी दर्ज शिकायतें' : 'Your Past Complaints'}
            </h3>

            {complaints.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">
                {lang === 'hi' ? 'कोई पूर्व शिकायत दर्ज नहीं है।' : 'No complaints filed.'}
              </p>
            ) : (
              <div className="space-y-3">
                {complaints.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{c.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{c.description}</p>
                    {c.resolution_notes && (
                      <div className="mt-2 p-2 bg-emerald-50/80 rounded-xl text-[10px] text-emerald-900">
                        <span className="font-bold">Admin Resolution:</span> {c.resolution_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Helplines */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#174D32] flex items-center justify-center mx-auto">
              <Phone className="w-6 h-6 text-[#84B547]" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Kisan Call Centre (KCC)</h3>
            <p className="text-xs text-slate-500">Toll-free agricultural technical expert helpline in Hindi & English.</p>
            <div className="font-black text-[#174D32] text-lg">1800-180-1551</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#174D32] flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6 text-[#174D32]" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">District Agriculture Office Meerut</h3>
            <p className="text-xs text-slate-500">Vikas Bhawan, Meerut, Uttar Pradesh for seed & fertilizer DBT assistance.</p>
            <div className="font-bold text-slate-700 text-sm">0121-2660144</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#174D32] flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 text-[#84B547]" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">KrishiSeva Helpdesk</h3>
            <p className="text-xs text-slate-500">Platform operations, booking verification, and farmer assistance.</p>
            <div className="font-bold text-slate-700 text-xs">support@krishiseva.internal</div>
          </div>
        </div>
      )}
    </div>
  );
}
