import React, { useState, useEffect } from 'react';
import {
  Users, Wrench, Droplet, Tractor, Waves, Sprout, Truck,
  Building2, Search, MapPin, Star, Plus, ShieldCheck, ArrowRight,
  Loader2, Info, X, Calendar, Layers, Clock, AlertTriangle, CheckCircle2,
  SlidersHorizontal, ChevronRight, HelpCircle, Phone, Globe
} from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import CreateRequestModal from '../../components/CreateRequestModal';
import NationwideLocationSelector from '../../components/NationwideLocationSelector';

export default function FarmerServices() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  // Primary data states
  const [categories, setCategories] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('tractor_mechanic');

  // Search parameters
  const [locationFilter, setLocationFilter] = useState({
    state: user?.state || 'Uttar Pradesh',
    district: user?.district || 'Meerut',
    subdistrict: '',
    village: user?.village || 'Daurala',
    village_id: null,
    district_id: null,
    subdistrict_id: null,
    state_id: null,
    is_unverified: false
  });
  const [scheduledDate, setScheduledDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('acre');
  const [sortBy, setSortBy] = useState('default');

  // Matching engine results
  const [matchingData, setMatchingData] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Active section tab: 'all' | 'eligible' | 'unknown' | 'wider' | 'unavailable'
  const [resultFilterTab, setResultFilterTab] = useState('all');

  // Modal
  const [createReqOpen, setCreateReqOpen] = useState(false);
  const [selectedProviderForQuote, setSelectedProviderForQuote] = useState(null);

  // 1. Initial Load: Fetch categories & farmer's saved farms
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, farmRes] = await Promise.all([
          api.get('/services/categories/'),
          api.get('/farm-projects/farms/').catch(() => ({ data: [] }))
        ]);
        setCategories(catRes.data);
        const userFarms = farmRes.data || [];
        setFarms(userFarms);

        // Default to first saved farm if available, otherwise user residential location
        if (userFarms.length > 0) {
          const defaultFarm = userFarms[0];
          setSelectedFarmId(defaultFarm.id.toString());
          setLocationFilter({
            state: defaultFarm.state || 'Uttar Pradesh',
            district: defaultFarm.district || 'Meerut',
            subdistrict: defaultFarm.block || '',
            village: defaultFarm.village || 'Daurala',
            village_id: null,
            district_id: null,
            subdistrict_id: null,
            state_id: null,
            is_unverified: false,
            latitude: defaultFarm.latitude,
            longitude: defaultFarm.longitude
          });
        }
      } catch (e) {
        console.error('Error fetching initial data:', e);
      }
    };
    fetchInitialData();
  }, []);

  // 2. When saved farm changes -> update location filter
  const handleFarmChange = (e) => {
    const fId = e.target.value;
    setSelectedFarmId(fId);

    if (fId === 'custom') {
      // Keep current location or reset
      return;
    }

    const farm = farms.find((f) => f.id.toString() === fId);
    if (farm) {
      setLocationFilter({
        state: farm.state || 'Uttar Pradesh',
        district: farm.district || 'Meerut',
        subdistrict: farm.block || '',
        village: farm.village || '',
        village_id: null,
        district_id: null,
        subdistrict_id: null,
        state_id: null,
        is_unverified: false,
        latitude: farm.latitude,
        longitude: farm.longitude
      });
    }
  };

  // 3. Execute Matching Search
  const executeSearch = async (overrideParams = {}) => {
    const cat = overrideParams.category !== undefined ? overrideParams.category : selectedCategorySlug;
    if (!cat) return;

    setLoadingMatches(true);
    setSearchError('');

    const loc = overrideParams.location || locationFilter;
    const dateVal = overrideParams.date !== undefined ? overrideParams.date : scheduledDate;
    const qtyVal = overrideParams.quantity !== undefined ? overrideParams.quantity : quantity;
    const sortVal = overrideParams.sortBy !== undefined ? overrideParams.sortBy : sortBy;

    const payload = {
      category: cat,
      state: loc.state,
      state_id: loc.state_id,
      district: loc.district,
      district_id: loc.district_id,
      subdistrict: loc.subdistrict,
      subdistrict_id: loc.subdistrict_id,
      village: loc.village,
      village_id: loc.village_id,
      village_lgd: loc.village_lgd,
      is_unverified: loc.is_unverified,
      latitude: loc.latitude,
      longitude: loc.longitude,
      start_date: dateVal || undefined,
      quantity: qtyVal || undefined,
      unit: quantityUnit || undefined,
      sort_by: sortVal,
      farm_id: selectedFarmId && selectedFarmId !== 'custom' ? parseInt(selectedFarmId) : undefined
    };

    try {
      const res = await api.post('/matching/providers/', payload);
      setMatchingData(res.data);
    } catch (err) {
      console.error('Matching error:', err);
      setSearchError(err.response?.data?.error || 'Failed to match providers for this location.');
    } finally {
      setLoadingMatches(false);
    }
  };

  // Trigger search whenever category or farm changes initially
  useEffect(() => {
    if (selectedCategorySlug) {
      executeSearch();
    }
  }, [selectedCategorySlug, selectedFarmId]);

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

  const handleOpenQuote = (provider) => {
    setSelectedProviderForQuote(provider);
    setCreateReqOpen(true);
  };

  // Filter results by sub-tab
  const allResults = matchingData?.results || [];
  const eligibleResults = allResults.filter(r => r.matching_status === 'ELIGIBLE');
  const unknownResults = allResults.filter(r => r.matching_status === 'AVAILABILITY_UNKNOWN');
  const widerResults = allResults.filter(r => r.matching_status === 'WIDER_AREA_ALTERNATIVE');
  const unavailResults = allResults.filter(r => r.matching_status === 'UNAVAILABLE');

  const displayedResults = resultFilterTab === 'all'
    ? allResults
    : resultFilterTab === 'eligible'
      ? eligibleResults
      : resultFilterTab === 'unknown'
        ? unknownResults
        : resultFilterTab === 'wider'
          ? widerResults
          : unavailResults;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#174D32]/10 text-[#174D32]">
              KS-DEV-SME-001 • Matching Engine
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              Official LGD Hierarchy
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            {lang === 'hi' ? 'कृषि सेवा बाज़ार एवं प्रदाता मैचिंग' : 'Agricultural Service Matching Marketplace'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'hi'
              ? 'आधिकारिक LGD स्थान, वास्तविक कार्य क्षमता और सत्यापित उपलब्धता के आधार पर पारदर्शी मिलान।'
              : 'Rule-based matching using registered LGD administrative coverage, confirmed resources, and scheduling windows.'}
          </p>
        </div>
      </div>

      {/* Control Bar: Farm Selector & Location & Dates */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Saved Farm Destination Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              {lang === 'hi' ? '1. सेवा गंतव्य (खेत चुनें)' : '1. Delivery Destination (Saved Farm)'}
            </label>
            <select
              value={selectedFarmId}
              onChange={handleFarmChange}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-[#174D32]"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  🌱 {f.name} ({f.size_acres} Acres • {f.village}, {f.district})
                </option>
              ))}
              <option value="custom">
                📍 {lang === 'hi' ? 'अन्य / कस्टम स्थान (नीचे चुनें)' : 'Custom Location (Select Below)'}
              </option>
            </select>
          </div>

          {/* Optional Schedule Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              {lang === 'hi' ? '2. आवश्यक तिथि (वैकल्पिक)' : '2. Required Service Date (Optional)'}
            </label>
            <div className="relative">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => {
                  setScheduledDate(e.target.value);
                  executeSearch({ date: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-[#174D32]"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {scheduledDate ? 'Dates checked with half-open intervals' : 'Leave empty to browse without schedule restrictions'}
            </p>
          </div>

          {/* Optional Scope & Sorting */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'मात्रा' : 'Scope/Qty'}
              </label>
              <input
                type="number"
                placeholder="e.g. 5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={() => executeSearch()}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'क्रम' : 'Sort By'}
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  executeSearch({ sortBy: e.target.value });
                }}
                className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white outline-none"
              >
                <option value="default">{lang === 'hi' ? 'योग्यता अनुसार' : 'Eligible First'}</option>
                <option value="price_asc">{lang === 'hi' ? 'दर: कम से ज्यादा' : 'Price: Low to High'}</option>
                <option value="price_desc">{lang === 'hi' ? 'दर: ज्यादा से कम' : 'Price: High to Low'}</option>
                <option value="distance">{lang === 'hi' ? 'दूरी (किमी)' : 'Distance'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* LGD Nationwide Location Hierarchy Filter */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#174D32]" />
              <span>{lang === 'hi' ? 'गंतव्य स्थान (LGD प्रशासनिक पदानुक्रम)' : 'Administrative Delivery Location (LGD)'}</span>
            </span>
            {(locationFilter.village || locationFilter.subdistrict) && (
              <button
                type="button"
                onClick={() => {
                  const fallback = {
                    state: user?.state || 'Uttar Pradesh',
                    district: user?.district || 'Meerut',
                    subdistrict: '',
                    village: '',
                    village_id: null,
                    district_id: null,
                    subdistrict_id: null,
                    state_id: null,
                    is_unverified: false
                  };
                  setLocationFilter(fallback);
                  executeSearch({ location: fallback });
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>{lang === 'hi' ? 'स्थान रीसेट करें' : 'Reset Location'}</span>
              </button>
            )}
          </div>

          <NationwideLocationSelector
            value={locationFilter}
            onChange={(loc) => {
              setLocationFilter(loc);
              executeSearch({ location: loc });
            }}
            compact
          />
        </div>
      </div>

      {/* Service Category Carousel / Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {lang === 'hi' ? '3. सेवा श्रेणी चुनें' : '3. Select Service Category'}
          </span>
          <span className="text-[11px] text-slate-500">
            {categories.filter(c => c.is_active).length} {lang === 'hi' ? 'सक्रिय श्रेणियां' : 'Active MVP Categories'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (!cat.is_active) return;
                  setSelectedCategorySlug(cat.slug);
                  executeSearch({ category: cat.slug });
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#174D32] border-[#174D32] text-white shadow-xs ring-2 ring-[#84B547]'
                    : cat.is_active
                      ? 'bg-white border-slate-200 text-slate-800 hover:border-[#84B547]'
                      : 'bg-slate-50 border-slate-200/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#174D32]'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {cat.is_active ? (
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Live
                    </span>
                  ) : (
                    <span className="text-[8px] font-semibold text-slate-400">Soon</span>
                  )}
                </div>
                <div className="font-bold text-xs truncate leading-snug">
                  {lang === 'hi' ? cat.name_hi : cat.name_en}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Historical Planning Benchmark Banner (Distinguishing Benchmark from Quotations) */}
      {matchingData?.historical_reference_benchmark && (
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200/70 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-200/60 rounded-xl text-amber-900 shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-900 flex items-center gap-2">
                <span>Official Statistical Planning Benchmark (Mission 01 Reference)</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-white border border-amber-300">
                  Reference Only
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {matchingData.historical_reference_benchmark.operation || matchingData.historical_reference_benchmark.equipment_type}:
                {' '}
                <span className="font-bold">
                  {matchingData.historical_reference_benchmark.daily_wage_rate
                    ? `₹${matchingData.historical_reference_benchmark.daily_wage_rate}/day`
                    : `₹${matchingData.historical_reference_benchmark.min_price} - ₹${matchingData.historical_reference_benchmark.max_price} ${matchingData.historical_reference_benchmark.rate_unit}`}
                </span>
                {' '}({matchingData.historical_reference_benchmark.source}, {matchingData.historical_reference_benchmark.reference_year}).
              </p>
              <p className="text-[10px] text-amber-700/90 italic mt-0.5">
                STRICT RULE: Historical reference benchmarks are never binding quotations. Actual service prices depend on provider commercial proposals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Classification Counts and Tab Filter */}
      {matchingData?.counts && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setResultFilterTab('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                resultFilterTab === 'all' ? 'bg-[#174D32] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{lang === 'hi' ? 'सभी प्रदाता' : 'All Providers'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {matchingData.counts.total}
              </span>
            </button>

            <button
              onClick={() => setResultFilterTab('eligible')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                resultFilterTab === 'eligible' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'hi' ? 'योग्य (सत्यापित)' : 'Eligible'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {matchingData.counts.eligible}
              </span>
            </button>

            <button
              onClick={() => setResultFilterTab('unknown')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                resultFilterTab === 'unknown' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-200" />
              <span>{lang === 'hi' ? 'उपलब्धता अनिर्धारित' : 'Availability Unknown'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {matchingData.counts.availability_unknown}
              </span>
            </button>

            <button
              onClick={() => setResultFilterTab('wider')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                resultFilterTab === 'wider' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-200" />
              <span>{lang === 'hi' ? 'आसपास के विकल्प' : 'Wider-Area Alternatives'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {matchingData.counts.wider_area_alternatives}
              </span>
            </button>

            <button
              onClick={() => setResultFilterTab('unavailable')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                resultFilterTab === 'unavailable' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <X className="w-3.5 h-3.5 text-red-300" />
              <span>{lang === 'hi' ? 'अनुपलब्ध' : 'Unavailable'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {matchingData.counts.unavailable}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium px-2">
            Target: <span className="font-bold text-slate-800">{matchingData.delivery_location?.display_name || 'All India'}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loadingMatches && (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
          <span className="text-xs font-semibold">Running Rule-Based Location & Availability Engine...</span>
        </div>
      )}

      {/* Error Message */}
      {searchError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Provider Results Grid */}
      {!loadingMatches && displayedResults.length === 0 && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">
            {lang === 'hi' ? 'इस श्रेणी व स्थान में कोई प्रदाता नहीं मिला।' : 'No matching providers found in this view.'}
          </p>
          <p className="text-slate-500 max-w-md mx-auto text-[11px]">
            {lang === 'hi'
              ? 'आप सेवा मांग बना सकते हैं ताकि आसपास के ब्लॉक अथवा जिले के प्रदाता आपको कोटेशन भेज सकें।'
              : 'Try clearing date or village filters, or post a service request so neighboring verified providers can review your requirements.'}
          </p>
        </div>
      )}

      {!loadingMatches && displayedResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedResults.map((prov) => {
            const isEligible = prov.matching_status === 'ELIGIBLE';
            const isUnknown = prov.matching_status === 'AVAILABILITY_UNKNOWN';
            const isWider = prov.matching_status === 'WIDER_AREA_ALTERNATIVE';
            const isUnavail = prov.matching_status === 'UNAVAILABLE';

            return (
              <div
                key={prov.provider_id}
                className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-xs ${
                  isEligible
                    ? 'border-emerald-300 hover:border-[#174D32] hover:shadow-md'
                    : isUnknown
                      ? 'border-amber-200 hover:border-amber-400'
                      : isWider
                        ? 'border-indigo-200 bg-slate-50/40'
                        : 'border-slate-200 opacity-75 bg-slate-50/60'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Status Badge & Star Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {isEligible && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          Eligible
                        </span>
                      )}
                      {isUnknown && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Availability Unknown
                        </span>
                      )}
                      {isWider && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                          <Globe className="w-3 h-3 text-indigo-700" />
                          Wider-Area Alternative
                        </span>
                      )}
                      {isUnavail && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                          <X className="w-3 h-3 text-slate-500" />
                          Unavailable
                        </span>
                      )}
                      <h4 className="font-bold text-base text-slate-900 mt-1">
                        {prov.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">{prov.business_name}</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full bg-white shadow-2xs border border-slate-200">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{prov.rating}★</span>
                    </div>
                  </div>

                  {/* Coverage Level & Location */}
                  <div className="p-3 rounded-2xl bg-[#FAF8F2] border border-amber-200/50 text-[11px] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-[#174D32] shrink-0" />
                      <span className="font-semibold">Base: {prov.village}, {prov.district}</span>
                      {prov.distance_km !== null && (
                        <span className="text-[10px] font-bold text-[#174D32] bg-emerald-100 px-1.5 py-0.2 rounded">
                          {prov.distance_km} km
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 leading-tight">
                      <span className="font-bold text-slate-800">Coverage: </span>
                      {prov.coverage.description}
                    </div>
                    {prov.availability.reason && (
                      <div className="text-slate-600 leading-tight">
                        <span className="font-bold text-slate-800">Availability: </span>
                        {prov.availability.reason}
                      </div>
                    )}
                  </div>

                  {/* Resource & Capacity */}
                  {prov.availability.resource_name && (
                    <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                      <span>Resource: <strong className="text-slate-800">{prov.availability.resource_name}</strong></span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100">
                        {prov.availability.resource_type}
                      </span>
                    </div>
                  )}

                  {/* Match reasons */}
                  <div className="flex flex-wrap gap-1">
                    {prov.match_reasons.slice(0, 2).map((m, idx) => (
                      <span key={idx} className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        ✓ {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-emerald-900">
                      {prov.pricing.formatted}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Provider Indicative Price
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenQuote(prov)}
                    disabled={isUnavail}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      isUnavail
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : isEligible
                          ? 'bg-[#174D32] hover:bg-[#0e3321] text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    <span>{lang === 'hi' ? 'कोटेशन मांगें' : 'Request Quote'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={createReqOpen}
        onClose={() => {
          setCreateReqOpen(false);
          setSelectedProviderForQuote(null);
        }}
        defaultCategorySlug={selectedCategorySlug}
        onCreated={() => {
          executeSearch();
        }}
      />
    </div>
  );
}
