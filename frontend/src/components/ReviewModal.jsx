import React, { useState } from 'react';
import { X, Star, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function ReviewModal({ isOpen, onClose, booking, onReviewed }) {
  const { lang } = useLanguage();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError(lang === 'hi' ? 'कृपया अपनी समीक्षा टिप्पणी दर्ज करें।' : 'Please enter your feedback comments.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/services/reviews/', {
        target_user: booking.provider,
        rating,
        comment
      });
      if (onReviewed) {
        onReviewed();
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {lang === 'hi' ? 'सेवा समीक्षा व रेटिंग दें' : 'Rate & Review Service'}
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              {booking.provider_name} • {booking.request_title}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs border-b border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Star selector */}
          <div className="text-center py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              {lang === 'hi' ? 'रेटिंग चुनें (1 से 5 सितारे)' : 'Select Star Rating'}
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-black text-slate-700 mt-1 block">
              {rating} / 5 Stars
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {lang === 'hi' ? 'समीक्षा व अनुभव *' : 'Honest Service Feedback *'}
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={lang === 'hi' ? 'काम समय पर हुआ, कारीगर का व्यवहार, औजार और गुणवत्ता कैसी रही...' : 'Was the work punctual, machine clean, and technician helpful?'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#84B547] outline-none resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#84B547]" />
                  <span>{lang === 'hi' ? 'समीक्षा सबमिट करें' : 'Submit Review'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
