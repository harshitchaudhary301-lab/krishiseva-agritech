import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Tractor, Users, Wrench, Droplet, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';

export default function FarmerCalendar() {
  const { lang, t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/bookings/');
        // Sort chronologically by scheduled date
        const sorted = res.data.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
        setBookings(sorted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {lang === 'hi' ? 'फार्म ऑपरेशन्स कैलेंडर' : 'Farm Operations Calendar & Schedule'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'hi'
            ? 'आपके खेत पर आने वाले सभी कृषि श्रमिकों, मशीनरी और मैकेनिक सेवाओं की समय-सारणी।'
            : 'Synchronized timeline of upcoming machinery arrivals, labour teams, and maintenance visits.'}
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
          <span className="text-xs">Loading schedule...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <CalendarIcon className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">
            {lang === 'hi' ? 'कोई आगामी सेवा निर्धारित नहीं है' : 'No upcoming services scheduled'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {lang === 'hi' ? 'सेवा अनुरोध बनाएं और कोटेशन स्वीकार करें।' : 'Post requests and confirm bookings to see them populated here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#84B547] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            >
              <div className="flex items-start sm:items-center gap-5">
                {/* Date Block */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-amber-200 text-center shrink-0 w-20">
                  <span className="text-[10px] font-black uppercase text-amber-800 block">
                    {new Date(b.scheduled_date).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-2xl font-black text-slate-900 block leading-tight">
                    {new Date(b.scheduled_date).getDate()}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    {new Date(b.scheduled_date).getFullYear()}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900">{b.request_title}</span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {b.category_name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-3">
                    <span>Provider: <strong className="text-slate-900">{b.provider_name}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#174D32]" />
                      {b.provider_village}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-emerald-900">₹{b.agreed_amount?.toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Scope: {b.request_scope} • Ref: {b.reference_id}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto justify-end">
                <StatusBadge status={b.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
