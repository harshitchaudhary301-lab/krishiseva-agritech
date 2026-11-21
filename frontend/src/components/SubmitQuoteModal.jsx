import React, { useState } from 'react';
import { X, IndianRupee, Calendar, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function SubmitQuoteModal({ isOpen, onClose, requestItem, onSubmitted }) {
  const { lang } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    quote_amount: '',
    price_breakdown: '',
    notes: '',
    proposed_schedule: requestItem?.required_date || new Date().toISOString().split('T')[0]
  });

  if (!isOpen || !requestItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quote_amount || !formData.proposed_schedule) {
      setError(lang === 'hi' ? 'कृपया कोटेशन राशि और तारीख भरें।' : 'Please enter quote amount and schedule date.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        request: requestItem.id,
        quote_amount: parseFloat(formData.quote_amount),
        price_breakdown: formData.price_breakdown,
        notes: formData.notes,
        proposed_schedule: formData.proposed_schedule
      };

      const res = await api.post('/bookings/quotations/', payload);
      if (onSubmitted) {
        onSubmitted(res.data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">
              {lang === 'hi' ? 'कोटेशन भेजें' : 'Submit Quotation'}
            </h3>
            <p className="text-xs text-emerald-100 mt-1 line-clamp-1">
              {requestItem.title} • {requestItem.village}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Request summary banner */}
        <div className="bg-[#FAF8F2] px-6 py-3 border-b border-amber-200/60 text-xs text-slate-700 flex items-center justify-between">
          <span><strong>{lang === 'hi' ? 'कार्य का दायरा:' : 'Scope:'}</strong> {requestItem.scope_quantity}</span>
          <span><strong>{lang === 'hi' ? 'तारीख:' : 'Target:'}</strong> {requestItem.required_date}</span>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs border-b border-red-200">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quote Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'hi' ? 'आपकी कोटेशन राशि (₹) *' : 'Your Proposed Total Amount (₹) *'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="50"
                value={formData.quote_amount}
                onChange={(e) => setFormData({ ...formData, quote_amount: e.target.value })}
                placeholder="उदा: 950"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-bold text-slate-800 focus:ring-2 focus:ring-[#84B547] outline-none"
                required
              />
            </div>
            {requestItem.budget_max && (
              <p className="text-[11px] text-slate-500 mt-1">
                {lang === 'hi' ? `किसान का अपेक्षित बजट: ₹${requestItem.budget_max}` : `Farmer's estimated budget: ₹${requestItem.budget_max}`}
              </p>
            )}
          </div>

          {/* Proposed Schedule Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'hi' ? 'प्रस्तावित सेवा तारीख *' : 'Proposed Service Date *'}
            </label>
            <input
              type="date"
              value={formData.proposed_schedule}
              onChange={(e) => setFormData({ ...formData, proposed_schedule: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
              required
            />
          </div>

          {/* Breakdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'hi' ? 'दर व खर्च का विवरण' : 'Price Breakdown & Inclusions'}
            </label>
            <textarea
              rows={2}
              value={formData.price_breakdown}
              onChange={(e) => setFormData({ ...formData, price_breakdown: e.target.value })}
              placeholder={lang === 'hi' ? 'उदा: ₹500/दिन x 2 श्रमिक + ₹100 यात्रा खर्च' : 'e.g. ₹750 repair charges + ₹200 on-site testing and travel'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'hi' ? 'किसान के लिए संदेश / उपकरण विवरण' : 'Notes & Availability Details'}
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={lang === 'hi' ? 'उदा: सुबह 8 बजे औजारों के साथ पहुँचेंगे...' : 'e.g. Will arrive with spare filters and pressure gauge at 8:00 AM.'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174D32] text-white text-sm font-bold hover:bg-[#0e3321] transition shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'hi' ? 'भेजा जा रहा है...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#84B547]" />
                  <span>{lang === 'hi' ? 'कोटेशन सबमिट करें' : 'Send Quotation'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
