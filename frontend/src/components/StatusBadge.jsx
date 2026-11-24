import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, PlayCircle, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function StatusBadge({ status }) {
  const { lang, t } = useLanguage();

  const config = {
    open: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: Clock,
      label_en: 'Open for Quotes',
      label_hi: 'कोटेशन खुला है'
    },
    quote_accepted: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Clock,
      label_en: 'Awaiting Provider Confirmation',
      label_hi: 'प्रदाता सहमति प्रतीक्षारत'
    },
    pending_confirmation: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Clock,
      label_en: 'Pending Confirmation',
      label_hi: 'पुष्टि प्रतीक्षारत'
    },
    confirmed: {
      bg: 'bg-green-50 text-green-800 border-green-200',
      icon: CheckCircle2,
      label_en: 'Booking Confirmed',
      label_hi: 'बुकिंग पक्की'
    },
    scheduled: {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: Calendar,
      label_en: 'Scheduled',
      label_hi: 'शेड्यूल किया गया'
    },
    in_progress: {
      bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: PlayCircle,
      label_en: 'In Progress',
      label_hi: 'कार्य जारी है'
    },
    completion_pending: {
      bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      icon: Clock,
      label_en: 'Review Pending',
      label_hi: 'निरीक्षण प्रतीक्षारत'
    },
    partially_completed: {
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      icon: AlertTriangle,
      label_en: 'Partially Completed',
      label_hi: 'आंशिक रूप से पूर्ण'
    },
    under_administrative_review: {
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: AlertTriangle,
      label_en: 'Under Admin Review',
      label_hi: 'प्रशासनिक समीक्षाधीन'
    },
    disputed: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: AlertTriangle,
      label_en: 'Disputed',
      label_hi: 'विवादित'
    },
    awaiting_prerequisite: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Clock,
      label_en: 'Awaiting Prerequisite',
      label_hi: 'पूर्व कार्य प्रतीक्षारत'
    },
    completed: {
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: CheckCircle2,
      label_en: 'Completed',
      label_hi: 'पूर्ण हुआ'
    },
    cancelled: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: XCircle,
      label_en: 'Cancelled',
      label_hi: 'रद्द'
    },
    cancelled_by_farmer: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: XCircle,
      label_en: 'Cancelled by Farmer',
      label_hi: 'किसान द्वारा रद्द'
    },
    cancelled_by_provider: {
      bg: 'bg-red-50 text-red-800 border-red-200',
      icon: AlertTriangle,
      label_en: 'Cancelled by Provider',
      label_hi: 'प्रदाता द्वारा रद्द'
    },
    planning: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Clock,
      label_en: 'Planning & Quoting',
      label_hi: 'नियोजन एवं कोटेशन'
    },
    ready: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      label_en: 'Services Confirmed (Ready)',
      label_hi: 'सेवाएं पक्की (तैयार)'
    }
  };

  const item = config[status] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Clock,
    label_en: status,
    label_hi: status
  };

  const Icon = item.icon;
  const label = lang === 'hi' ? item.label_hi : item.label_en;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${item.bg}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
