import React, { useState, useEffect } from 'react';
import { IndianRupee, CheckCircle2, Calendar, MapPin, Loader2 } from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';

export default function WorkerEarnings() {
  const { lang } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/bookings/');
        setBookings(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  const total = bookings
    .filter(b => ['confirmed', 'scheduled', 'completed'].includes(b.status))
    .reduce((acc, b) => acc + parseFloat(b.agreed_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {lang === 'hi' ? 'श्रमिक कमाई एवं कार्य इतिहास' : 'Worker Earnings & Work History'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'hi'
            ? 'किसानों से सीधे प्राप्त व पुष्टीकृत मजदूरी का वास्तविक डेटाबेस रिकॉर्ड।'
            : 'Genuine work history and earnings verified by direct farmer bookings.'}
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-[#174D32] p-6 rounded-3xl text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 block">
            {lang === 'hi' ? 'कुल संचित कमाई' : 'Total Confirmed Earnings'}
          </span>
          <span className="text-3xl font-black text-white mt-1 block">
            ₹{total.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-white/10 rounded-2xl">
          <IndianRupee className="w-8 h-8 text-[#84B547]" />
        </div>
      </div>

      {/* Bookings table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            {lang === 'hi' ? 'कार्य वार कमाई विवरण' : 'Job-by-Job Earnings Breakdown'}
          </h3>
          <span className="text-xs text-slate-500">{bookings.length} Records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading records...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No earnings records yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{b.reference_id}</span>
                    <span className="text-slate-500">• {b.request_title}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Farmer: {b.farmer_name} ({b.farmer_village}) • Date: {b.scheduled_date}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="font-black text-sm text-emerald-800 block">
                    ₹{b.agreed_amount?.toLocaleString()}
                  </span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
