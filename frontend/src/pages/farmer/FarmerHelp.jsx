import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageSquare, AlertCircle, CheckCircle2, Phone, Mail, ShieldAlert, Loader2 } from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerHelp() {
  const { lang } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, bookRes] = await Promise.all([
        api.get('/bookings/complaints/'),
        api.get('/bookings/')
      ]);
      setComplaints(compRes.data);
      setBookings(bookRes.data);
      if (bookRes.data.length > 0) {
        setSelectedBooking(bookRes.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
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
      setFeedback({ error: '', success: lang === 'hi' ? 'शिकायत दर्ज हो गई है। एडमिन टीम 24 घंटे में जांच करेगी।' : 'Complaint submitted successfully.' });
      setTitle('');
      setDescription('');
      fetchData();
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Failed to submit complaint.', success: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {lang === 'hi' ? 'सहायता केंद्र एवं शिकायत निवारण' : 'Help & Support / Dispute Resolution'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'hi'
            ? 'किसी भी सेवा प्रदाता, कार्य की गुणवत्ता या समय विवाद के संबंध में सीधा संपर्क व शिकायत।'
            : 'File dispute complaints and get administrative assistance for any farm service issue.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Support contact cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {lang === 'hi' ? 'कृषि सेवा हेल्पलाइन' : 'KrishiSeva Farmer Support'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our operations team in Meerut verifies all service complaints, checks booking audit trails, and assists with alternative provider coordination.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F2] border border-amber-200/60">
                <Phone className="w-4 h-4 text-[#174D32]" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Toll-Free Helpline</span>
                  <span className="font-bold text-slate-900">1800-KRISHI-SEVA (9:00 AM - 7:00 PM)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F9F5] border border-slate-200">
                <Mail className="w-4 h-4 text-[#84B547]" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Support Desk</span>
                  <span className="font-bold text-slate-900">support@krishiseva.in</span>
                </div>
              </div>
            </div>
          </div>

          {/* Past complaints list */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              {lang === 'hi' ? 'आपकी दर्ज शिकायतें' : 'Your Complaint History'}
            </h4>
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No past complaints recorded.</p>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{c.title}</span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">{c.status}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">Booking: {c.booking_ref}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* File Complaint Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="font-bold text-base text-slate-900 pb-2 border-b border-slate-100">
            {lang === 'hi' ? 'नई शिकायत दर्ज करें' : 'File a Service Dispute / Complaint'}
          </h3>

          {feedback.error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {feedback.error}
            </div>
          )}
          {feedback.success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
              {feedback.success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'संबंधित बुकिंग चुनें *' : 'Select Associated Booking *'}
              </label>
              <select
                value={selectedBooking}
                onChange={(e) => setSelectedBooking(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 outline-none"
                required
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.reference_id} — {b.request_title} ({b.provider_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'शिकायत का शीर्षक *' : 'Issue Subject *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Technician delayed by 4 hours without notice"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'समस्या का पूरा विवरण *' : 'Detailed Explanation *'}
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred, impact on farm operations..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : (lang === 'hi' ? 'शिकायत सबमिट करें' : 'Submit Complaint')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
