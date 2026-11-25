import React, { useState, useEffect } from 'react';
import {
  Users, Wrench, Droplet, Tractor, Waves, Sprout, Truck,
  Building2, Search, MapPin, Star, Plus, ShieldCheck, ArrowRight, Loader2, Info, X
} from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import CreateRequestModal from '../../components/CreateRequestModal';
import NationwideLocationSelector from '../../components/NationwideLocationSelector';

export default function FarmerServices() {
  const { lang, t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' or 'providers'
  const [createReqOpen, setCreateReqOpen] = useState(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(null);
  const [locationFilter, setLocationFilter] = useState({
    state: '',
    district: '',
    subdistrict: '',
    village: ''
  });

  const fetchProviders = async (loc = locationFilter) => {
    let params = [];
    if (loc.village) params.push(`village=${encodeURIComponent(loc.village)}`);
    if (loc.district) params.push(`district=${encodeURIComponent(loc.district)}`);
    if (loc.state) params.push(`state=${encodeURIComponent(loc.state)}`);

    try {
      const url = params.length > 0 ? `/services/providers/?${params.join('&')}` : '/services/providers/';
      const provRes = await api.get(url);
      setProviders(provRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, provRes] = await Promise.all([
          api.get('/services/categories/'),
          api.get('/services/providers/')
        ]);
        setCategories(catRes.data);
        setProviders(provRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Users': return Users;
      case 'Wrench': return Wrench;
      case 'Droplet': return Droplet;
      case 'Tractor': return Tractor;
      case 'Waves': return Waves;
      case 'Sprout': return Sprout;
      case 'Truck': return Truck;
      case 'Building2': return Building2;
      default: return Wrench;
    }
  };

  const handleRequestClick = (cat) => {
    if (!cat.is_active) return;
    setSelectedCategorySlug(cat.slug);
    setCreateReqOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {lang === 'hi' ? 'कृषि सेवाएं एवं प्रदाता निर्देशिका' : 'Services & Provider Directory'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'hi'
              ? 'सत्यापित मैकेनिक, कुशल श्रमिक और मशीनरी प्रदाता खोजें या सीधा अनुरोध दर्ज करें।'
              : 'Browse active MVP categories and verified local service providers in your district.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'categories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {lang === 'hi' ? 'सेवा श्रेणियां' : 'Categories'}
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'providers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {lang === 'hi' ? 'सत्यापित प्रदाता सूची' : 'Providers Directory'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
          <span className="text-xs">Loading services...</span>
        </div>
      ) : activeTab === 'categories' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <div
                key={cat.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                  cat.is_active
                    ? 'bg-white border-slate-200 hover:border-[#84B547] shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/60 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-slate-50 text-[#174D32] border border-slate-100 shadow-2xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    {cat.is_active ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Active MVP
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900">
                    {lang === 'hi' ? cat.name_hi : cat.name_en}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {lang === 'hi' ? cat.description_hi : cat.description_en}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 mb-3">
                    Typical: {cat.typical_price_range}
                  </div>
                  {cat.is_active ? (
                    <button
                      onClick={() => handleRequestClick(cat)}
                      className="w-full py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'अनुरोध बनाएं' : 'Request Service'}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed"
                    >
                      {lang === 'hi' ? 'जल्द उपलब्ध होगा' : 'Coming Soon'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Provider Directory */
        <div className="space-y-6">
          {/* Pan-India Location Filter Card */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#174D32]" />
                <span className="text-xs font-bold text-slate-900">
                  {lang === 'hi' ? 'स्थान अनुसार प्रदाता खोजें (Pan-India Location Engine)' : 'Filter Providers Nationwide (LGD Engine)'}
                </span>
              </div>
              {(locationFilter.state || locationFilter.district || locationFilter.village) && (
                <button
                  type="button"
                  onClick={() => {
                    const empty = { state: '', district: '', subdistrict: '', village: '' };
                    setLocationFilter(empty);
                    fetchProviders(empty);
                  }}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'फ़िल्टर हटाएं (सभी देखें)' : 'Clear Filter (Show All)'}</span>
                </button>
              )}
            </div>

            <NationwideLocationSelector
              value={locationFilter}
              onChange={(loc) => {
                setLocationFilter(loc);
                fetchProviders(loc);
              }}
              compact
            />

            {/* Nationwide Coverage vs Provider Density Clarification Notice */}
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                {lang === 'hi'
                  ? 'सूचना: सम्पूर्ण भारत के सभी 36 राज्यों/केंद्र शासित प्रदेशों के 6.6 लाख+ गाँवों में सेवा अनुरोध दर्ज किए जा सकते हैं। वर्तमान में तुरंत उपलब्ध ऑन-ग्राउंड सत्यापित मैकेनिक व श्रमिक दल मेरठ क्लस्टर में केंद्रित हैं।'
                  : 'Notice: Nationwide location coverage is active across all 36 States/UTs (662k+ villages). Registered on-ground active providers are currently concentrated in the launch cluster (Meerut baseline).'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.length === 0 ? (
              <div className="col-span-full py-16 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">
                  {lang === 'hi'
                    ? 'इस चयनित क्षेत्र में कोई पंजीकृत प्रदाता नहीं मिला।'
                    : 'No registered providers found in this selected location.'}
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  {lang === 'hi'
                    ? 'आप फिर भी अपना सेवा अनुरोध दर्ज कर सकते हैं, हमारी टीम प्रदाता नेटवर्क का विस्तार करेगी।'
                    : 'You can still post a service request; providers serving neighboring areas or our expansion team will be alerted.'}
                </p>
              </div>
            ) : (
            providers.map((p) => {
              const isWorker = p.role === 'worker';
              const rating = isWorker ? p.worker_profile?.rating : p.provider_profile?.rating;
              const jobs = isWorker ? p.worker_profile?.completed_jobs_count : p.provider_profile?.completed_bookings_count;
              const businessName = p.provider_profile?.business_name || (isWorker ? 'Agricultural Worker Team' : 'Agro Services');

              return (
                <div
                  key={p.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-[#84B547] transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">{p.first_name} {p.last_name}</h3>
                          <span className="p-0.5 rounded-full bg-emerald-100 text-emerald-800" title="Verified">
                            <ShieldCheck className="w-4 h-4 text-[#84B547]" />
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{businessName}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{rating || 4.8}★</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-[#174D32]" />
                      <span>{p.village}, {p.district}</span>
                      <span className="text-slate-400">•</span>
                      <span>{jobs || 0} jobs completed</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {isWorker ? p.worker_profile?.bio : p.provider_profile?.bio || 'Verified local service provider.'}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">
                      {isWorker ? `₹${p.worker_profile?.daily_wage_rate}/day` : 'Competitive Quotes'}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedCategorySlug(isWorker ? 'labour' : 'tractor_mechanic');
                        setCreateReqOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>{lang === 'hi' ? 'काम मांगें' : 'Book'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    )}

      <CreateRequestModal
        isOpen={createReqOpen}
        onClose={() => setCreateReqOpen(false)}
        defaultCategorySlug={selectedCategorySlug}
      />
    </div>
  );
}
