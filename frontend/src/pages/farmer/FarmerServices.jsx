import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, Wrench, Droplet, Tractor, Sprout, Truck,
  Building2, TestTube, Trees, Flower2, Wheat, Boxes,
  TrendingUp, Recycle, Cog, Search, MapPin, Star,
  ShieldCheck, ArrowRight, Loader2, Info, X, Calendar,
  Clock, AlertTriangle, CheckCircle2, SlidersHorizontal,
  ChevronRight, ChevronDown, ChevronUp, FileText, Check,
  RotateCcw, Sparkles, Plus, AlertCircle, Globe
} from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import NationwideLocationSelector from '../../components/NationwideLocationSelector';
import CreateRequestModal from '../../components/CreateRequestModal';

// Category icon registry mapping backend icon identifiers to Lucide components
const CATEGORY_ICONS = {
  Users,
  Wrench,
  Droplet,
  Tractor,
  Sprout,
  Truck,
  Building2,
  TestTube,
  Trees,
  Flower2,
  Wheat,
  Boxes,
  TrendingUp,
  Recycle,
  Cog
};

// Service-specific unit configurations based on catalogue and resource models
const CATEGORY_UNIT_CONFIGS = {
  tractor_mechanic: {
    unitLabelEn: 'Machines / Visits',
    unitLabelHi: 'मशीनों / सर्विस संख्या',
    defaultUnit: 'Visits',
    units: ['Visits', 'Machines', 'Hours'],
    defaultQty: 1
  },
  equipment_repair: {
    unitLabelEn: 'Repair Jobs',
    unitLabelHi: 'मरम्मत कार्य संख्या',
    defaultUnit: 'Jobs',
    units: ['Jobs', 'Machines', 'Visits'],
    defaultQty: 1
  },
  tubewell_repair: {
    unitLabelEn: 'Motors / Points',
    unitLabelHi: 'मोटर / पॉइंट संख्या',
    defaultUnit: 'Motors',
    units: ['Motors', 'Visits', 'Jobs'],
    defaultQty: 1
  },
  labour: {
    unitLabelEn: 'Labourers Required',
    unitLabelHi: 'आवश्यक श्रमिकों की संख्या',
    defaultUnit: 'Labourers',
    units: ['Labourers', 'Days', 'Worker-Days'],
    defaultQty: 4
  },
  land_preparation: {
    unitLabelEn: 'Field Area',
    unitLabelHi: 'खेत का क्षेत्रफल',
    defaultUnit: 'Acres',
    units: ['Acres', 'Bigha', 'Hectares', 'Hours'],
    defaultQty: 5
  },
  sowing_planting: {
    unitLabelEn: 'Sowing Area',
    unitLabelHi: 'बुवाई क्षेत्रफल',
    defaultUnit: 'Acres',
    units: ['Acres', 'Bigha', 'Hectares'],
    defaultQty: 5
  },
  nursery_transplanting: {
    unitLabelEn: 'Transplanting Area',
    unitLabelHi: 'रोपाई क्षेत्रफल',
    defaultUnit: 'Acres',
    units: ['Acres', 'Bigha', 'Hectares'],
    defaultQty: 3
  },
  harvesting: {
    unitLabelEn: 'Harvest Area',
    unitLabelHi: 'कटाई क्षेत्रफल',
    defaultUnit: 'Acres',
    units: ['Acres', 'Bigha', 'Hectares', 'Hours'],
    defaultQty: 5
  },
  machinery_rental: {
    unitLabelEn: 'Rental Working Area',
    unitLabelHi: 'मशीनरी कार्य क्षेत्रफल',
    defaultUnit: 'Acres',
    units: ['Acres', 'Hours', 'Days'],
    defaultQty: 5
  },
  irrigation: {
    unitLabelEn: 'Irrigation Rounds',
    unitLabelHi: 'सिंचाई राउंड / विजिट',
    defaultUnit: 'Visits',
    units: ['Visits', 'Hours', 'Acres'],
    defaultQty: 2
  },
  soil_testing: {
    unitLabelEn: 'Soil Samples / Plots',
    unitLabelHi: 'मिट्टी नमूने / खेत संख्या',
    defaultUnit: 'Samples',
    units: ['Samples', 'Plots'],
    defaultQty: 2
  },
  input_supply: {
    unitLabelEn: 'Input Quantity',
    unitLabelHi: 'सामग्री मात्रा',
    defaultUnit: 'Bags',
    units: ['Bags', 'Quintals', 'Kg'],
    defaultQty: 10
  },
  transportation: {
    unitLabelEn: 'Transport Trips / Load',
    unitLabelHi: 'ढुलाई ट्रिप / मात्रा',
    defaultUnit: 'Trips',
    units: ['Trips', 'Quintals', 'Trolleys'],
    defaultQty: 1
  },
  storage: {
    unitLabelEn: 'Storage Space Needed',
    unitLabelHi: 'आवश्यक भंडारण क्षमता',
    defaultUnit: 'Bags',
    units: ['Bags', 'Quintals'],
    defaultQty: 50
  },
  post_harvest: {
    unitLabelEn: 'Threshing / Processing Scope',
    unitLabelHi: 'मड़ाई / प्रसंस्करण मात्रा',
    defaultUnit: 'Quintals',
    units: ['Quintals', 'Hours', 'Bags'],
    defaultQty: 20
  },
  residue_management: {
    unitLabelEn: 'Residue Management Area',
    unitLabelHi: 'पराली प्रबंधन क्षेत्रफल',
    defaultUnit: 'Acres',
    units: ['Acres', 'Bigha', 'Hours'],
    defaultQty: 5
  },
  market_assistance: {
    unitLabelEn: 'Market Produce Lots',
    unitLabelHi: 'मंडी लॉट मात्रा',
    defaultUnit: 'Lots',
    units: ['Lots', 'Quintals'],
    defaultQty: 1
  },
  equipment_maintenance: {
    unitLabelEn: 'Machines for Servicing',
    unitLabelHi: 'सर्विस योग्य मशीनें',
    defaultUnit: 'Machines',
    units: ['Machines', 'Visits'],
    defaultQty: 1
  },
  'sec-tillage': {
    unitLabelEn: 'Tillage Area / Days',
    unitLabelHi: 'जुताई क्षेत्रफल / दिन',
    defaultUnit: 'Acres',
    units: ['Acres', 'Days', 'Hours'],
    defaultQty: 5
  }
};

// Helper to strip internal LGD terminology and task codes from user-facing text
const cleanLgdText = (str) => {
  if (!str) return '';
  return str
    .replace(/\s*\(LGD:?\s*\d+\)/gi, '')
    .replace(/\bLGD\b:?/gi, '')
    .replace(/BOOK-\d+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export default function FarmerServices() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // 1. Core State
  const [categories, setCategories] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('tractor_mechanic');

  // Location selector expand state
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [showAdvancedLocation, setShowAdvancedLocation] = useState(false);

  // Active Location Filter
  const [locationFilter, setLocationFilter] = useState({
    state: user?.state || 'Uttar Pradesh',
    district: user?.district || 'Meerut',
    subdistrict: '',
    village: user?.village || 'Daurala',
    village_id: null,
    district_id: null,
    subdistrict_id: null,
    state_id: null,
    is_unverified: false,
    latitude: null,
    longitude: null
  });

  // Requirements State (Preserved across category navigation)
  const [quantity, setQuantity] = useState('1');
  const [quantityUnit, setQuantityUnit] = useState('Visits');
  const [scheduledDate, setScheduledDate] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [searchNotes, setSearchNotes] = useState('');

  // Provider Matching State
  const [matchingData, setMatchingData] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [resultFilterTab, setResultFilterTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Stale request race condition protector
  const searchRequestIdRef = useRef(0);
  const debounceTimerRef = useRef(null);

  // Quotation Request Modal State
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedProviderForQuote, setSelectedProviderForQuote] = useState(null);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [quoteSuccess, setQuoteSuccess] = useState(null);
  const [quoteDate, setQuoteDate] = useState('');
  const [quoteQuantity, setQuoteQuantity] = useState('');
  const [quoteUnit, setQuoteUnit] = useState('');
  const [quoteBudget, setQuoteBudget] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const isSubmittingQuoteRef = useRef(false);

  // General Open Request Modal State
  const [openRequestModal, setOpenRequestModal] = useState(false);

  // Active selected category object
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.slug === selectedCategorySlug) || null;
  }, [categories, selectedCategorySlug]);

  // Active selected farm object
  const activeFarm = useMemo(() => {
    if (!selectedFarmId || selectedFarmId === 'custom') return null;
    return farms.find((f) => f.id.toString() === selectedFarmId.toString()) || null;
  }, [farms, selectedFarmId]);

  // Unit configuration for selected category
  const activeUnitConfig = useMemo(() => {
    if (selectedCategorySlug && CATEGORY_UNIT_CONFIGS[selectedCategorySlug]) {
      return CATEGORY_UNIT_CONFIGS[selectedCategorySlug];
    }
    // Dynamic fallback from category.base_unit
    const base = activeCategory?.base_unit || 'Per Unit';
    let defaultU = 'Units';
    if (/acre/i.test(base)) defaultU = 'Acres';
    else if (/day/i.test(base)) defaultU = 'Days';
    else if (/hour/i.test(base)) defaultU = 'Hours';
    else if (/visit/i.test(base)) defaultU = 'Visits';
    else if (/bag/i.test(base)) defaultU = 'Bags';
    else if (/quintal/i.test(base)) defaultU = 'Quintals';

    return {
      unitLabelEn: 'Quantity / Work Scope',
      unitLabelHi: 'मात्रा / कार्य दायरा',
      defaultUnit: defaultU,
      units: [defaultU],
      defaultQty: 1
    };
  }, [selectedCategorySlug, activeCategory]);

  // 1. Initial Load: Fetch categories & farmer's saved farms
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [catRes, farmRes] = await Promise.all([
          api.get('/services/categories/'),
          api.get('/farm-projects/farms/').catch(() => ({ data: [] }))
        ]);

        if (!isMounted) return;

        // Filter to active catalogue categories
        const activeCats = (catRes.data || []).filter((c) => c.is_active);
        setCategories(activeCats);

        const userFarms = farmRes.data || [];
        setFarms(userFarms);

        // Prefill with first saved farm if exists
        if (userFarms.length > 0) {
          const firstFarm = userFarms[0];
          setSelectedFarmId(firstFarm.id.toString());
          const newLoc = {
            state: firstFarm.state || 'Uttar Pradesh',
            district: firstFarm.district || 'Meerut',
            subdistrict: firstFarm.block || '',
            village: firstFarm.village || 'Daurala',
            village_id: null,
            district_id: null,
            subdistrict_id: null,
            state_id: null,
            is_unverified: false,
            latitude: firstFarm.latitude,
            longitude: firstFarm.longitude,
            farm_id: firstFarm.id
          };
          setLocationFilter(newLoc);

          // If first category uses acres, prefill farm size
          if (firstFarm.size_acres) {
            setQuantity(parseFloat(firstFarm.size_acres).toString());
          }
        } else {
          setSelectedFarmId('custom');
        }

        // Default to tractor_mechanic or first active category
        if (activeCats.length > 0) {
          const defaultCat = activeCats.find((c) => c.slug === 'tractor_mechanic') || activeCats[0];
          setSelectedCategorySlug(defaultCat.slug);
          const cfg = CATEGORY_UNIT_CONFIGS[defaultCat.slug];
          if (cfg) {
            setQuantityUnit(cfg.defaultUnit);
            if (!userFarms.length || !cfg.units.includes('Acres')) {
              setQuantity(cfg.defaultQty.toString());
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial marketplace data:', err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update unit & quantity suggestions when category changes
  const handleCategorySelect = (catSlug) => {
    setSelectedCategorySlug(catSlug);
    const cfg = CATEGORY_UNIT_CONFIGS[catSlug];
    if (cfg) {
      setQuantityUnit(cfg.defaultUnit);
      // If category uses acres and we have a saved farm, suggest farm size
      if (cfg.units.includes('Acres') && activeFarm?.size_acres) {
        setQuantity(parseFloat(activeFarm.size_acres).toString());
      } else if (!quantity || quantity === '0') {
        setQuantity(cfg.defaultQty.toString());
      }
    }
    setCurrentPage(1);
    setResultFilterTab('all');
  };

  // Handle saved farm change
  const handleFarmSelect = (fId) => {
    setSelectedFarmId(fId);
    if (fId === 'custom') {
      setShowLocationEditor(true);
      return;
    }
    const farm = farms.find((f) => f.id.toString() === fId.toString());
    if (farm) {
      const newLoc = {
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
        longitude: farm.longitude,
        farm_id: farm.id
      };
      setLocationFilter(newLoc);

      // Auto update quantity if unit is acres
      if (activeUnitConfig.units.includes('Acres') && farm.size_acres) {
        setQuantity(parseFloat(farm.size_acres).toString());
      }
      setShowLocationEditor(false);
    }
  };

  // 2. Execute Matching Search with Debounce & Sequence Guard
  const performSearch = useCallback(
    async (params = {}) => {
      const cat = params.category !== undefined ? params.category : selectedCategorySlug;
      if (!cat) return;

      const currentReqId = ++searchRequestIdRef.current;
      setLoadingMatches(true);
      setSearchError('');

      const loc = params.location || locationFilter;
      const dateVal = params.date !== undefined ? params.date : scheduledDate;
      const qtyVal = params.quantity !== undefined ? params.quantity : quantity;
      const unitVal = params.unit !== undefined ? params.unit : quantityUnit;
      const sortVal = params.sortBy !== undefined ? params.sortBy : sortBy;
      const farmIdVal = params.farmId !== undefined ? params.farmId : selectedFarmId;

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
        quantity: qtyVal ? parseFloat(qtyVal) : undefined,
        unit: unitVal || undefined,
        sort_by: sortVal,
        farm_id: farmIdVal && farmIdVal !== 'custom' ? parseInt(farmIdVal) : undefined
      };

      try {
        const res = await api.post('/matching/providers/', payload);
        // Discard stale responses if a newer search was dispatched
        if (currentReqId === searchRequestIdRef.current) {
          setMatchingData(res.data);
          setCurrentPage(1);
        }
      } catch (err) {
        if (currentReqId === searchRequestIdRef.current) {
          console.error('Matching engine search error:', err);
          setSearchError(
            err.response?.data?.error ||
              (lang === 'hi'
                ? 'इस स्थान व सेवा के लिए प्रदाता लोड करने में त्रुटि। कृपया पुनः प्रयास करें।'
                : 'Failed to load providers for this service and location. Please retry.')
          );
        }
      } finally {
        if (currentReqId === searchRequestIdRef.current) {
          setLoadingMatches(false);
        }
      }
    },
    [selectedCategorySlug, locationFilter, scheduledDate, quantity, quantityUnit, sortBy, selectedFarmId, lang]
  );

  // Debounced search trigger when filter values change
  useEffect(() => {
    if (!selectedCategorySlug) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch();
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [selectedCategorySlug, selectedFarmId, locationFilter, scheduledDate, sortBy]);

  // Explicit quantity search on blur or Enter
  const handleQuantityBlur = () => {
    performSearch();
  };

  // 3. Filtered provider results by status tab
  const allResults = matchingData?.results || [];
  const eligibleResults = useMemo(() => allResults.filter((r) => r.matching_status === 'ELIGIBLE'), [allResults]);
  const unknownResults = useMemo(() => allResults.filter((r) => r.matching_status === 'AVAILABILITY_UNKNOWN'), [allResults]);
  const widerResults = useMemo(() => allResults.filter((r) => r.matching_status === 'WIDER_AREA_ALTERNATIVE'), [allResults]);
  const unavailResults = useMemo(() => allResults.filter((r) => r.matching_status === 'UNAVAILABLE'), [allResults]);

  const activeFilteredList = useMemo(() => {
    switch (resultFilterTab) {
      case 'eligible':
        return eligibleResults;
      case 'unknown':
        return unknownResults;
      case 'wider':
        return widerResults;
      case 'unavailable':
        return unavailResults;
      default:
        return allResults;
    }
  }, [resultFilterTab, allResults, eligibleResults, unknownResults, widerResults, unavailResults]);

  // Paginated slice
  const totalPages = Math.ceil(activeFilteredList.length / pageSize) || 1;
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeFilteredList.slice(start, start + pageSize);
  }, [activeFilteredList, currentPage, pageSize]);

  // 4. Quotation Request Flow
  const handleOpenQuotation = (provider) => {
    setSelectedProviderForQuote(provider);
    setQuoteDate(scheduledDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
    setQuoteQuantity(quantity || activeUnitConfig.defaultQty.toString());
    setQuoteUnit(quantityUnit || activeUnitConfig.defaultUnit);
    setQuoteBudget('');
    setQuoteNotes('');
    setQuoteError('');
    setQuoteSuccess(null);
    isSubmittingQuoteRef.current = false;
    setQuoteModalOpen(true);
  };

  const handleConfirmQuotation = async (e) => {
    e.preventDefault();
    if (isSubmittingQuoteRef.current) return;

    if (!quoteDate) {
      setQuoteError(
        lang === 'hi'
          ? 'कोटेशन अनुरोध भेजने के लिए कृपया आवश्यक सेवा तारीख चुनें।'
          : 'Please select a required service date to submit your quotation request.'
      );
      return;
    }
    if (!quoteQuantity) {
      setQuoteError(lang === 'hi' ? 'कृपया कार्य मात्रा भरें।' : 'Please specify the work quantity / scope.');
      return;
    }

    isSubmittingQuoteRef.current = true;
    setQuoteSubmitting(true);
    setQuoteError('');

    try {
      const categoryId = activeCategory?.id || (categories[0] ? categories[0].id : null);
      const provName = selectedProviderForQuote?.name || 'Verified Provider';
      const provBiz = selectedProviderForQuote?.business_name || '';

      const payload = {
        category: categoryId,
        title: `${activeCategory?.name_en || 'Farm Service'} — Quotation Request for ${provName}`,
        description: `Direct quotation requested for provider ${provName} ${provBiz ? `(${provBiz})` : ''}. Scope: ${quoteQuantity} ${quoteUnit}. Location: ${locationFilter.village || ''}, ${locationFilter.district || ''}. ${quoteNotes ? `Notes: ${quoteNotes}` : ''}`,
        village: locationFilter.village || user?.village || 'Daurala',
        district: locationFilter.district || user?.district || 'Meerut',
        state: locationFilter.state || user?.state || 'Uttar Pradesh',
        required_date: quoteDate,
        scope_quantity: `${quoteQuantity} ${quoteUnit}`,
        budget_max: quoteBudget ? parseFloat(quoteBudget) : null,
        farm_project: null
      };

      const res = await api.post('/bookings/requests/', payload);
      setQuoteSuccess(res.data);
    } catch (err) {
      console.error('Failed to submit quotation request:', err);
      setQuoteError(
        err.response?.data?.error ||
          (lang === 'hi'
            ? 'कोटेशन अनुरोध दर्ज करने में विफलता। कृपया पुनः प्रयास करें।'
            : 'Failed to submit quotation request. Please check details and try again.')
      );
    } finally {
      setQuoteSubmitting(false);
      isSubmittingQuoteRef.current = false;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with simple title & shortcuts */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#174D32]/10 text-[#174D32]">
                <Sparkles className="w-3.5 h-3.5 text-[#84B547]" />
                <span>{lang === 'hi' ? 'सत्यापित ग्रामीण सेवा नेटवर्क' : 'Verified Farm Service Network'}</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {lang === 'hi' ? 'खेती की सेवाएँ' : 'Find Farm Services'}
            </h1>
            <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {lang === 'hi'
                ? 'सत्यापित स्थानीय ट्रैक्टर मैकेनिक, मशीनरी एवं कृषि श्रमिकों से सीधे जुड़ें — पारदर्शी दरें और सुरक्षित सेवा।'
                : 'Connect directly with verified local equipment mechanics, machinery rentals, and farm operators.'}
            </p>
          </div>

          {/* Quick Shortcuts: My Requests & My Bookings */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/farmer/requests"
              className="min-h-[44px] px-4 py-2.5 rounded-2xl border border-slate-200 bg-[#FAF8F2] hover:bg-amber-50/70 text-slate-800 text-xs font-bold transition flex items-center gap-2 shadow-2xs"
            >
              <FileText className="w-4 h-4 text-[#174D32]" />
              <span>{lang === 'hi' ? 'मेरी मांगें' : 'My Requests'}</span>
            </Link>
            <Link
              to="/farmer/bookings"
              className="min-h-[44px] px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center gap-2 shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4 text-[#84B547]" />
              <span>{lang === 'hi' ? 'मेरी बुकिंग्स' : 'My Bookings'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Step 1: Responsive Icon-Based Service Category Grid (2 to 3 columns) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#174D32] text-white flex items-center justify-center font-black text-xs">
              1
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              {lang === 'hi' ? 'सेवा श्रेणी चुनें' : 'Select Service Category'}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {categories.length} {lang === 'hi' ? 'उपलब्ध सेवाएँ' : 'Active Services'}
          </span>
        </div>

        {/* Responsive grid: 2 cols on mobile, 3 cols on medium/large screens */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-3.5">
          {categories.map((cat) => {
            const IconComponent = CATEGORY_ICONS[cat.icon] || Wrench;
            const isSelected = selectedCategorySlug === cat.slug;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={`min-h-[68px] p-3.5 md:p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#174D32] text-white border-[#174D32] shadow-sm ring-2 ring-[#84B547] ring-offset-1'
                    : 'bg-[#FDFBF7] hover:bg-white text-slate-800 border-slate-200/90 hover:border-[#84B547]'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 transition-colors ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-[#174D32] border border-emerald-100'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <div className="font-bold text-xs md:text-sm truncate">
                    {lang === 'hi' ? cat.name_hi : cat.name_en}
                  </div>
                  <div
                    className={`text-[10px] md:text-[11px] truncate mt-0.5 ${
                      isSelected ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    {cat.base_unit || 'Per Service'}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-[#84B547] shrink-0 self-center hidden sm:block" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Step 2 & 3: Farm / Location Selector & Progressive Service Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Farm / Location Selector with Change Location */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#174D32] text-white flex items-center justify-center font-black text-xs">
                2
              </div>
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'hi' ? 'खेत एवं गंतव्य स्थान' : 'Delivery Destination'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowLocationEditor(!showLocationEditor)}
              className="text-xs font-bold text-[#174D32] hover:text-[#0e3321] underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showLocationEditor ? (lang === 'hi' ? 'पूर्ण' : 'Close') : (lang === 'hi' ? 'स्थान बदलें' : 'Change Location')}</span>
            </button>
          </div>

          {/* Location Summary Card */}
          <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-amber-200/60 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-900">
                <MapPin className="w-4 h-4 text-[#174D32] shrink-0" />
                <span className="font-bold text-sm">
                  {activeFarm
                    ? activeFarm.name
                    : locationFilter.village || locationFilter.district || 'All India'}
                </span>
              </div>
              {activeFarm && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                  {activeFarm.size_acres} Acres
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 pl-6">
              {locationFilter.village ? `${locationFilter.village}, ` : ''}
              {locationFilter.district ? `${locationFilter.district}, ` : ''}
              {locationFilter.state || 'Uttar Pradesh'}
            </p>
          </div>

          {/* Collapsible Location Controls (Shown when farmer clicks Change Location or has no saved farm) */}
          {showLocationEditor && (
            <div className="pt-2 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
              {farms.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {lang === 'hi' ? 'सहेजे गए खेतों में से चुनें:' : 'Select from Saved Farms:'}
                  </label>
                  <select
                    value={selectedFarmId}
                    onChange={(e) => handleFarmSelect(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-[#174D32] focus:ring-1 focus:ring-[#174D32]"
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        🌱 {f.name} ({f.size_acres} Acres • {f.village}, {f.district})
                      </option>
                    ))}
                    <option value="custom">
                      📍 {lang === 'hi' ? 'अन्य गाँव / कस्टम स्थान चुनें' : 'Other Village / Custom Location'}
                    </option>
                  </select>
                </div>
              )}

              {/* Nationwide Location Selector for custom location */}
              {(selectedFarmId === 'custom' || farms.length === 0) && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {lang === 'hi' ? 'गाँव एवं जिला चुनें:' : 'Select Delivery Village & District:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedLocation(!showAdvancedLocation)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                    >
                      <span>{showAdvancedLocation ? 'Simple View' : 'More Options'}</span>
                      {showAdvancedLocation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  <NationwideLocationSelector
                    value={locationFilter}
                    onChange={(loc) => {
                      setLocationFilter((prev) => ({ ...prev, ...loc }));
                      setSelectedFarmId('custom');
                    }}
                    compact
                    showBlock={showAdvancedLocation}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowLocationEditor(false)}
                className="w-full min-h-[44px] py-2 px-4 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {lang === 'hi' ? 'स्थान लागू करें' : 'Apply Location'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Progressive Service Requirements */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#174D32] text-white flex items-center justify-center font-black text-xs">
                3
              </div>
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'hi' ? 'कार्य की आवश्यकता दर्ज करें' : 'Enter Service Requirements'}
              </h2>
            </div>
            <span className="text-xs text-[#174D32] font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {lang === 'hi' ? activeCategory?.name_hi : activeCategory?.name_en}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scope / Quantity input with service-specific unit */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {lang === 'hi' ? activeUnitConfig.unitLabelHi : activeUnitConfig.unitLabelEn}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onBlur={handleQuantityBlur}
                  placeholder="e.g. 5"
                  className="w-1/2 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 bg-white outline-none focus:border-[#174D32] focus:ring-1 focus:ring-[#174D32]"
                />
                <select
                  value={quantityUnit}
                  onChange={(e) => {
                    setQuantityUnit(e.target.value);
                    performSearch({ unit: e.target.value });
                  }}
                  className="w-1/2 min-h-[44px] px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:border-[#174D32]"
                >
                  {activeUnitConfig.units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {lang === 'hi'
                  ? 'इकाई एवं कार्य मात्रा के अनुसार सटीक प्रदाता क्षमता जांची जाती है।'
                  : 'Capacity and scheduling are evaluated against this scope.'}
              </p>
            </div>

            {/* Scheduled Date (Optional for browsing, required for quotation) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  {lang === 'hi' ? 'आवश्यक सेवा तारीख' : 'Service Date'}
                </label>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {scheduledDate ? (lang === 'hi' ? 'शेड्यूल सक्रिय' : 'Scheduled') : (lang === 'hi' ? 'वैकल्पिक' : 'Optional')}
                </span>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={scheduledDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setScheduledDate(e.target.value);
                    performSearch({ date: e.target.value });
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-[#174D32] focus:ring-1 focus:ring-[#174D32]"
                />
                {scheduledDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setScheduledDate('');
                      performSearch({ date: '' });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    title="Clear date"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {scheduledDate
                  ? (lang === 'hi' ? '✓ निश्चित उपलब्धता की जांच सक्रिय।' : '✓ Evaluating confirmed provider schedule windows.')
                  : (lang === 'hi' ? 'तारीख के बिना अनुमानित दरों सहित ब्राउज़ करें।' : 'Browse indicative pricing without date restrictions.')}
              </p>
            </div>
          </div>

          {/* Sort By Filter & Search Button */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">
                {lang === 'hi' ? 'क्रम:' : 'Sort By:'}
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  performSearch({ sortBy: e.target.value });
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-[#174D32]"
              >
                <option value="default">{lang === 'hi' ? 'श्रेष्ठ मिलान (उपलब्ध पहले)' : 'Best Match (Eligible First)'}</option>
                <option value="price_asc">{lang === 'hi' ? 'दर: कम से ज्यादा' : 'Price: Low to High'}</option>
                <option value="price_desc">{lang === 'hi' ? 'दर: ज्यादा से कम' : 'Price: High to Low'}</option>
                <option value="distance">{lang === 'hi' ? 'निकटतम दूरी' : 'Nearest Distance'}</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => performSearch()}
              disabled={loadingMatches}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loadingMatches ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#84B547]" />
                  <span>{lang === 'hi' ? 'खोज जारी...' : 'Finding Providers...'}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#84B547]" />
                  <span>{lang === 'hi' ? 'प्रदाता खोजें' : 'Find Providers'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Step 4: Provider Results & Classification Tabs */}
      <div className="space-y-4">
        {/* Results Header & Classification Tabs */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#174D32] text-white flex items-center justify-center font-black text-xs">
              4
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {lang === 'hi' ? 'उपलब्ध सेवा प्रदाता' : 'Matched Providers'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {lang === 'hi'
                  ? `${allResults.length} प्रदाता मिले (${locationFilter.village || locationFilter.district || 'सभी क्षेत्र'})`
                  : `${allResults.length} providers found for ${locationFilter.village || locationFilter.district || 'All Areas'}`}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          {matchingData?.counts && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setResultFilterTab('all');
                  setCurrentPage(1);
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  resultFilterTab === 'all'
                    ? 'bg-[#174D32] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{lang === 'hi' ? 'सभी' : 'All'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
                  {matchingData.counts.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResultFilterTab('eligible');
                  setCurrentPage(1);
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  resultFilterTab === 'eligible'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'hi' ? 'उपलब्ध' : 'Eligible'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {matchingData.counts.eligible}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResultFilterTab('unknown');
                  setCurrentPage(1);
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  resultFilterTab === 'unknown'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-200" />
                <span>{lang === 'hi' ? 'अनिर्धारित' : 'Date Needed'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {matchingData.counts.availability_unknown}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResultFilterTab('wider');
                  setCurrentPage(1);
                }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  resultFilterTab === 'wider'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-indigo-200" />
                <span>{lang === 'hi' ? 'आसपास' : 'Nearby Area'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {matchingData.counts.wider_area_alternatives}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loadingMatches && (
          <div className="py-20 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#174D32] mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              {lang === 'hi'
                ? 'सत्यापित स्थानीय प्रदाताओं और कार्य क्षमता की जांच हो रही है...'
                : 'Evaluating verified providers, local coverage, and scheduling availability...'}
            </p>
          </div>
        )}

        {/* Error State with Retry Button */}
        {searchError && !loadingMatches && (
          <div className="p-5 rounded-3xl bg-red-50 border border-red-200 text-red-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{searchError}</span>
            </div>
            <button
              type="button"
              onClick={() => performSearch()}
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loadingMatches && !searchError && paginatedResults.length === 0 && (
          <div className="bg-white rounded-3xl p-10 md:p-12 border border-slate-200 text-center space-y-4 max-w-2xl mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#174D32] flex items-center justify-center mx-auto border border-emerald-100">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-900">
                {lang === 'hi' ? 'इस श्रेणी व स्थान में कोई प्रदाता नहीं मिला' : 'No Providers Found in This Area'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                {lang === 'hi'
                  ? 'आप खुली सेवा मांग पोस्ट कर सकते हैं ताकि आसपास के सत्यापित प्रदाता और श्रमिक आपको सीधे कोटेशन भेज सकें।'
                  : 'Try clearing date restrictions or post an open service request so nearby verified providers and operators can review your scope.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpenRequestModal(true)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#84B547]" />
                <span>{lang === 'hi' ? 'खुली सेवा मांग पोस्ट करें' : 'Post Open Service Request'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setScheduledDate('');
                  setResultFilterTab('all');
                  performSearch({ date: '' });
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
              >
                {lang === 'hi' ? 'फ़िल्टर रीसेट करें' : 'Reset Filters'}
              </button>
            </div>
          </div>
        )}

        {/* Provider Result Cards Grid */}
        {!loadingMatches && paginatedResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedResults.map((prov) => {
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
                          : 'border-slate-200 opacity-80 bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Status Badge & Star Rating */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        {isEligible && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            {lang === 'hi' ? 'उपलब्ध एवं सत्यापित' : 'Available & Eligible'}
                          </span>
                        )}
                        {isUnknown && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700" />
                            {lang === 'hi' ? 'उपलब्धता अनिर्धारित' : 'Availability Unconfirmed'}
                          </span>
                        )}
                        {isWider && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                            <Globe className="w-3 h-3 text-indigo-700" />
                            {lang === 'hi' ? 'आसपास के विकल्प' : 'Nearby Alternative'}
                          </span>
                        )}
                        {isUnavail && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                            <X className="w-3 h-3 text-slate-500" />
                            {lang === 'hi' ? 'अनुपलब्ध' : 'Unavailable'}
                          </span>
                        )}

                        <h3 className="font-bold text-base text-slate-900 mt-1">
                          {prov.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {prov.business_name}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{prov.rating}★</span>
                      </div>
                    </div>

                    {/* Offered Service & Verified Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#174D32] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#174D32]" />
                        <span>{lang === 'hi' ? 'सत्यापित प्रदाता' : 'Verified Provider'}</span>
                      </span>
                      {prov.completed_jobs > 0 && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          {prov.completed_jobs} {lang === 'hi' ? 'कार्य पूरे किए' : 'jobs completed'}
                        </span>
                      )}
                    </div>

                    {prov.service_title && (
                      <div className="text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        {prov.service_title}
                      </div>
                    )}

                    {/* Base Location & Coverage Details */}
                    <div className="p-3 rounded-2xl bg-[#FAF8F2] border border-amber-200/50 text-[11px] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-[#174D32] shrink-0" />
                        <span className="font-semibold">
                          {prov.village}, {prov.district}
                        </span>
                        {prov.distance_km !== null && (
                          <span className="text-[10px] font-bold text-[#174D32] bg-emerald-100 px-1.5 py-0.2 rounded">
                            {prov.distance_km} km
                          </span>
                        )}
                      </div>

                      <div className="text-slate-600 leading-tight">
                        <span className="font-bold text-slate-800">
                          {lang === 'hi' ? 'कवरेज क्षेत्र: ' : 'Coverage: '}
                        </span>
                        {cleanLgdText(prov.coverage?.description)}
                      </div>

                      <div className="text-slate-600 leading-tight">
                        <span className="font-bold text-slate-800">
                          {lang === 'hi' ? 'उपलब्धता: ' : 'Availability: '}
                        </span>
                        {isEligible
                          ? (lang === 'hi' ? 'चयनित तारीख पर उपलब्ध।' : 'Available on requested schedule.')
                          : cleanLgdText(prov.availability?.reason) || (lang === 'hi' ? 'तारीख का चयन आवश्यक।' : 'Schedule date needed.')}
                      </div>
                    </div>

                    {/* Machine or Labour Resource Info */}
                    {prov.availability?.resource_name && (
                      <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                        <span className="truncate">
                          {lang === 'hi' ? 'उपकरण: ' : 'Resource: '}
                          <strong className="text-slate-800">{prov.availability.resource_name}</strong>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 shrink-0">
                          {prov.availability.resource_type}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price & Primary Action (Min 44px touch target) */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-emerald-950">
                        {prov.pricing?.formatted || 'Quotation on Request'}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {lang === 'hi' ? 'प्रदाता अनुमानित दर' : 'Indicative Provider Rate'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenQuotation(prov)}
                      disabled={isUnavail}
                      className={`min-h-[44px] px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs shrink-0 ${
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

        {/* Pagination Controls */}
        {!loadingMatches && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              {lang === 'hi' ? 'पिछला' : 'Previous'}
            </button>
            <span className="text-xs text-slate-500 font-semibold px-2">
              {lang === 'hi' ? `पेज ${currentPage} / ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              {lang === 'hi' ? 'अगला' : 'Next'}
            </button>
          </div>
        )}
      </div>

      {/* 5. Quotation Confirmation & Submission Modal */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold">
                  {quoteSuccess
                    ? (lang === 'hi' ? 'कोटेशन अनुरोध सफलतापूर्वक भेजा गया!' : 'Quotation Request Submitted!')
                    : (lang === 'hi' ? 'कोटेशन अनुरोध की पुष्टि करें' : 'Confirm Quotation Request')}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  {lang === 'hi'
                    ? 'सत्यापित प्रदाता को कार्य मांग भेजी जाएगी — पारदर्शी कोटेशन प्राप्त होगा।'
                    : 'Your scope will be sent to the provider to receive an official quotation proposal.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteModalOpen(false)}
                className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success State View */}
            {quoteSuccess ? (
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-[#174D32] mx-auto" />
                  <h4 className="text-base font-bold text-emerald-950">
                    {lang === 'hi' ? 'अनुरोध सफलतापूर्वक दर्ज हुआ' : 'Request Published Successfully'}
                  </h4>
                  <div className="text-xs font-bold text-[#174D32] bg-white inline-block px-3 py-1 rounded-full border border-emerald-200">
                    Reference: REQ-{quoteSuccess.id}
                  </div>
                  <p className="text-xs text-slate-600 max-w-md mx-auto pt-1 leading-relaxed">
                    {lang === 'hi'
                      ? 'प्रदाता को आपकी मांग की सूचना दे दी गई है। जैसे ही वे कोटेशन भेजेंगे, आपको अलर्ट मिलेगा।'
                      : 'The provider has received your requirement. You can review and approve their formal price quote before confirming.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteModalOpen(false);
                      navigate('/farmer/requests');
                    }}
                    className="w-full min-h-[44px] py-3 px-5 rounded-2xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#84B547]" />
                    <span>{lang === 'hi' ? 'मेरी मांगें देखें (Track in My Requests)' : 'Track in My Requests'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuoteModalOpen(false);
                      navigate('/farmer/bookings');
                    }}
                    className="w-full min-h-[44px] py-3 px-5 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#84B547]" />
                    <span>{lang === 'hi' ? 'मेरी बुकिंग्स देखें' : 'View My Bookings'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuoteModalOpen(false);
                      performSearch();
                    }}
                    className="w-full text-center text-xs text-slate-500 font-semibold hover:text-slate-800 py-1"
                  >
                    {lang === 'hi' ? 'अन्य सेवा खोजें' : 'Find Another Service'}
                  </button>
                </div>
              </div>
            ) : (
              /* Quotation Submission Form */
              <form onSubmit={handleConfirmQuotation} className="p-6 overflow-y-auto space-y-4 flex-1">
                {quoteError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{quoteError}</span>
                  </div>
                )}

                {/* Summary Card */}
                <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-amber-200/70 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/50">
                    <span className="font-bold text-slate-800">
                      {lang === 'hi' ? 'चयनित प्रदाता:' : 'Target Provider:'}
                    </span>
                    <span className="font-black text-[#174D32]">
                      {selectedProviderForQuote?.name} ({selectedProviderForQuote?.business_name})
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/50">
                    <span className="font-bold text-slate-800">
                      {lang === 'hi' ? 'सेवा श्रेणी:' : 'Service Category:'}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {lang === 'hi' ? activeCategory?.name_hi : activeCategory?.name_en}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/50">
                    <span className="font-bold text-slate-800">
                      {lang === 'hi' ? 'डिलीवरी स्थान:' : 'Delivery Location:'}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {locationFilter.village ? `${locationFilter.village}, ` : ''}
                      {locationFilter.district}, {locationFilter.state}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {lang === 'hi' ? 'प्रदाता अनुमानित दर:' : 'Indicative Price:'}
                    </span>
                    <span className="font-black text-emerald-900">
                      {selectedProviderForQuote?.pricing?.formatted || 'Quotation Required'}
                    </span>
                  </div>
                </div>

                {/* Scope & Date Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'कार्य मात्रा / दायरा *' : 'Work Quantity / Scope *'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        value={quoteQuantity}
                        onChange={(e) => setQuoteQuantity(e.target.value)}
                        className="w-1/2 min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none focus:border-[#174D32]"
                      />
                      <input
                        type="text"
                        readOnly
                        value={quoteUnit}
                        className="w-1/2 min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'आवश्यक तारीख *' : 'Required Date *'}
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none focus:border-[#174D32]"
                    />
                  </div>
                </div>

                {/* Optional Budget & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'अधिकतम बजट (₹) (वैकल्पिक)' : 'Estimated Budget (₹) (Optional)'}
                    </label>
                    <input
                      type="number"
                      placeholder="₹"
                      value={quoteBudget}
                      onChange={(e) => setQuoteBudget(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none focus:border-[#174D32]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {lang === 'hi' ? 'विशेष निर्देश (वैकल्पिक)' : 'Field Notes (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'hi' ? 'खेत की स्थिति, समय आदि...' : 'Timings, soil condition, etc.'}
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-none focus:border-[#174D32]"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 italic pt-1">
                  {lang === 'hi'
                    ? 'सूचना: कोटेशन भेजने के बाद प्रदाता अपनी औपचारिक दरें प्रस्तुत करेंगे। किसान द्वारा प्रस्ताव स्वीकार करने से पूर्व कोई भुगतान बाध्यता नहीं है।'
                    : 'Note: Submitting this request commits zero payment. The provider will review and return an official quotation for your acceptance.'}
                </p>

                {/* Submit Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(false)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={quoteSubmitting}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {quoteSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#84B547]" />
                        <span>{lang === 'hi' ? 'भेजा जा रहा है...' : 'Sending Request...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#84B547]" />
                        <span>{lang === 'hi' ? 'पुष्टि करें और कोटेशन मांगें' : 'Confirm & Request Quote'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. Create General Open Request Modal */}
      <CreateRequestModal
        isOpen={openRequestModal}
        onClose={() => setOpenRequestModal(false)}
        defaultCategorySlug={selectedCategorySlug}
        onCreated={() => {
          performSearch();
        }}
      />
    </div>
  );
}
