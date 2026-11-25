import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Search, ChevronDown, Check, AlertCircle,
  RefreshCw, Loader2, Globe, Building2, CheckCircle2, X, PlusCircle
} from 'lucide-react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

/**
 * NationwideLocationSelector
 * Centralized, pan-India hierarchical location engine component.
 * Implements: State/UT -> District -> Sub-district (Tehsil) -> Village
 * Optional tiers: Development Block, Local Body (Panchayat / ULB), Ward
 * Features:
 *  - 1-click nationwide instant search autocomplete
 *  - Dependent cascading dropdowns with auto-reset
 *  - Hindi & English bilingual display
 *  - Unverified manual location fallback
 *  - Low-bandwidth friendly indexed paging
 */
export default function NationwideLocationSelector({
  value = {},
  onChange,
  showBlock = false,
  showLocalBody = false,
  compact = false,
  required = false,
  disabled = false,
  className = ""
}) {
  const { lang } = useLanguage();

  // State collections
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [localBodies, setLocalBodies] = useState([]);

  // Loaders
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef(null);

  // Village search inside subdistrict
  const [villageSearch, setVillageSearch] = useState('');

  // Unverified fallback toggle
  const [manualFallback, setManualFallback] = useState(value.is_unverified || false);
  const [manualVillage, setManualVillage] = useState(value.village || '');
  const [unverifiedDetails, setUnverifiedDetails] = useState(value.unverified_details || '');

  // Validation feedback
  const [errorMsg, setErrorMsg] = useState('');

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Initial load: fetch States
  useEffect(() => {
    let isMounted = true;
    const fetchStates = async () => {
      setLoadingStates(true);
      try {
        const res = await api.get('/services/locations/states/');
        if (isMounted) {
          setStates(res.data);
        }
      } catch (err) {
        console.error('Failed to load states:', err);
      } finally {
        if (isMounted) setLoadingStates(false);
      }
    };
    fetchStates();
    return () => { isMounted = false; };
  }, []);

  // 2. When state changes -> fetch districts
  useEffect(() => {
    if (!value.state_id && !value.state) {
      setDistricts([]);
      return;
    }

    let isMounted = true;
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const param = value.state_id ? `state_id=${value.state_id}` : `state=${encodeURIComponent(value.state)}`;
        const res = await api.get(`/services/locations/districts/?${param}`);
        if (isMounted) {
          setDistricts(res.data);
        }
      } catch (err) {
        console.error('Failed to load districts:', err);
      } finally {
        if (isMounted) setLoadingDistricts(false);
      }
    };
    fetchDistricts();
    return () => { isMounted = false; };
  }, [value.state_id, value.state]);

  // 3. When district changes -> fetch subdistricts & blocks
  useEffect(() => {
    if (!value.district_id && !value.district) {
      setSubdistricts([]);
      setBlocks([]);
      return;
    }

    let isMounted = true;
    const fetchSubsAndBlocks = async () => {
      setLoadingSubdistricts(true);
      if (showBlock) setLoadingBlocks(true);

      try {
        const param = value.district_id ? `district_id=${value.district_id}` : `district=${encodeURIComponent(value.district)}`;
        const [sdRes, blkRes] = await Promise.all([
          api.get(`/services/locations/subdistricts/?${param}`),
          showBlock ? api.get(`/services/locations/blocks/?${param}`) : Promise.resolve({ data: [] })
        ]);

        if (isMounted) {
          setSubdistricts(sdRes.data);
          if (showBlock) setBlocks(blkRes.data);
        }
      } catch (err) {
        console.error('Failed to load subdistricts/blocks:', err);
      } finally {
        if (isMounted) {
          setLoadingSubdistricts(false);
          setLoadingBlocks(false);
        }
      }
    };
    fetchSubsAndBlocks();
    return () => { isMounted = false; };
  }, [value.district_id, value.district, showBlock]);

  // 4. When subdistrict or village search changes -> fetch villages
  useEffect(() => {
    if (!value.subdistrict_id && !value.district_id && !value.district) {
      setVillages([]);
      return;
    }

    let isMounted = true;
    const fetchVillages = async () => {
      setLoadingVillages(true);
      try {
        let params = [];
        if (value.subdistrict_id) params.push(`subdistrict_id=${value.subdistrict_id}`);
        else if (value.district_id) params.push(`district_id=${value.district_id}`);
        else if (value.district) params.push(`district=${encodeURIComponent(value.district)}`);

        if (villageSearch.trim()) {
          params.push(`search=${encodeURIComponent(villageSearch.trim())}`);
        }

        const res = await api.get(`/services/locations/villages/?${params.join('&')}`);
        if (isMounted) {
          setVillages(res.data.results || []);
        }
      } catch (err) {
        console.error('Failed to load villages:', err);
      } finally {
        if (isMounted) setLoadingVillages(false);
      }
    };

    const timer = setTimeout(fetchVillages, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [value.subdistrict_id, value.district_id, value.district, villageSearch]);

  // Handle Pan-India quick search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/services/locations/search/?q=${encodeURIComponent(searchQuery.trim())}`);
        if (isMounted) {
          setSearchResults(res.data.results || []);
          setShowSearchResults(true);
        }
      } catch (e) {
        console.error('Location search failed:', e);
      } finally {
        if (isMounted) setSearching(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Apply search selection
  const handleSelectSearchResult = (item) => {
    setShowSearchResults(false);
    setSearchQuery('');
    setManualFallback(false);

    if (item.type === 'village') {
      onChange({
        state: item.state,
        state_id: item.state_id,
        district: item.district,
        district_id: item.district_id,
        subdistrict: item.subdistrict,
        subdistrict_id: item.subdistrict_id,
        village: item.name,
        village_id: item.id,
        village_lgd_code: item.lgd_code,
        pincode: item.pincode,
        is_unverified: false
      });
    } else if (item.type === 'subdistrict') {
      onChange({
        state: item.state,
        state_id: item.state_id,
        district: item.district,
        district_id: item.district_id,
        subdistrict: item.name,
        subdistrict_id: item.id,
        village: '',
        village_id: null,
        is_unverified: false
      });
    } else if (item.type === 'district') {
      onChange({
        state: item.state,
        state_id: item.state_id,
        district: item.name,
        district_id: item.id,
        subdistrict: '',
        subdistrict_id: null,
        village: '',
        village_id: null,
        is_unverified: false
      });
    }
  };

  // State selector handler
  const handleStateChange = (e) => {
    const sId = parseInt(e.target.value, 10);
    const selected = states.find((s) => s.id === sId);
    if (!selected) {
      onChange({
        state: '', state_id: null,
        district: '', district_id: null,
        subdistrict: '', subdistrict_id: null,
        village: '', village_id: null,
        is_unverified: false
      });
      return;
    }

    onChange({
      ...value,
      state: selected.name_en,
      state_id: selected.id,
      state_lgd_code: selected.lgd_code,
      district: '',
      district_id: null,
      subdistrict: '',
      subdistrict_id: null,
      village: '',
      village_id: null,
      is_unverified: false
    });
  };

  // District selector handler
  const handleDistrictChange = (e) => {
    const dId = parseInt(e.target.value, 10);
    const selected = districts.find((d) => d.id === dId);
    if (!selected) {
      onChange({
        ...value,
        district: '', district_id: null,
        subdistrict: '', subdistrict_id: null,
        village: '', village_id: null,
        is_unverified: false
      });
      return;
    }

    onChange({
      ...value,
      district: selected.name_en,
      district_id: selected.id,
      district_lgd_code: selected.lgd_code,
      subdistrict: '',
      subdistrict_id: null,
      village: '',
      village_id: null,
      is_unverified: false
    });
  };

  // SubDistrict selector handler
  const handleSubDistrictChange = (e) => {
    const sdId = parseInt(e.target.value, 10);
    const selected = subdistricts.find((sd) => sd.id === sdId);
    if (!selected) {
      onChange({
        ...value,
        subdistrict: '', subdistrict_id: null,
        village: '', village_id: null,
        is_unverified: false
      });
      return;
    }

    onChange({
      ...value,
      subdistrict: selected.name_en,
      subdistrict_id: selected.id,
      subdistrict_lgd_code: selected.lgd_code,
      village: '',
      village_id: null,
      is_unverified: false
    });
  };

  // Village selector handler
  const handleVillageChange = (e) => {
    const vId = parseInt(e.target.value, 10);
    const selected = villages.find((v) => v.id === vId);
    if (!selected) {
      onChange({
        ...value,
        village: '', village_id: null,
        is_unverified: false
      });
      return;
    }

    onChange({
      ...value,
      village: selected.name,
      village_id: selected.id,
      village_lgd_code: selected.lgd_code,
      pincode: selected.pincode || value.pincode,
      latitude: selected.latitude,
      longitude: selected.longitude,
      is_unverified: false
    });
  };

  // Manual fallback input handler
  const handleManualVillageSubmit = () => {
    if (!manualVillage.trim()) return;
    onChange({
      ...value,
      village: manualVillage.trim(),
      village_id: null,
      is_unverified: true,
      unverified_details: unverifiedDetails.trim()
    });
  };

  // Toggle manual fallback
  const toggleManualFallback = () => {
    const nextState = !manualFallback;
    setManualFallback(nextState);
    if (nextState) {
      onChange({
        ...value,
        is_unverified: true,
        village: manualVillage || value.village || ''
      });
    } else {
      onChange({
        ...value,
        is_unverified: false
      });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Nationwide Quick Search Bar */}
      <div className="relative" ref={searchContainerRef}>
        <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-slate-300 focus-within:border-[#84B547] focus-within:ring-2 focus-within:ring-[#84B547]/20 shadow-xs transition">
          <Search className="w-4 h-4 text-[#174D32] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true); }}
            placeholder={lang === 'hi' ? 'पूरे भारत में गाँव, तहसील या जिला खोजें (उदा: Daurala, Mawana)...' : 'Search any village, tehsil or district pan-India...'}
            className="w-full text-xs text-slate-800 bg-transparent outline-none placeholder:text-slate-400 font-medium"
            disabled={disabled}
          />
          {searching && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" />}
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 text-xs divide-y divide-slate-100">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'hi' ? 'राष्ट्रीय LGD खोज परिणाम' : 'Pan-India LGD Search Matches'}
            </div>
            {searchResults.map((item, idx) => (
              <button
                key={`${item.type}-${item.id}-${idx}`}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full px-3 py-2 text-left hover:bg-emerald-50/80 flex items-center justify-between gap-2 transition cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#174D32] shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">{item.display}</span>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold capitalize">
                  {item.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cascading Dependent Dropdowns */}
      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-3 lg:grid-cols-4'} gap-2.5`}>
        {/* 1. State / UT */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            {lang === 'hi' ? 'राज्य / केंद्र शासित प्रदेश *' : 'State / UT *'}
          </label>
          <div className="relative">
            <select
              value={value.state_id || (states.find(s => s.name_en.toLowerCase() === (value.state || '').toLowerCase())?.id || '')}
              onChange={handleStateChange}
              disabled={disabled || loadingStates}
              required={required}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#84B547] outline-none appearance-none pr-8 cursor-pointer disabled:bg-slate-100 font-medium"
            >
              <option value="">{lang === 'hi' ? '-- राज्य चुनें --' : '-- Select State/UT --'}</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_en} {s.name_local ? `(${s.name_local})` : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              {loadingStates ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* 2. District */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            {lang === 'hi' ? 'जिला (District) *' : 'District *'}
          </label>
          <div className="relative">
            <select
              value={value.district_id || (districts.find(d => d.name_en.toLowerCase() === (value.district || '').toLowerCase())?.id || '')}
              onChange={handleDistrictChange}
              disabled={disabled || loadingDistricts || (!value.state_id && !value.state)}
              required={required}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#84B547] outline-none appearance-none pr-8 cursor-pointer disabled:bg-slate-100 font-medium"
            >
              <option value="">{lang === 'hi' ? '-- जिला चुनें --' : '-- Select District --'}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_en} {d.name_local ? `(${d.name_local})` : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              {loadingDistricts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* 3. Sub-district / Tehsil */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            {lang === 'hi' ? 'तहसील / उप-जिला *' : 'Tehsil / Sub-District *'}
          </label>
          <div className="relative">
            <select
              value={value.subdistrict_id || (subdistricts.find(sd => sd.name_en.toLowerCase() === (value.subdistrict || '').toLowerCase())?.id || '')}
              onChange={handleSubDistrictChange}
              disabled={disabled || loadingSubdistricts || (!value.district_id && !value.district)}
              required={required && !manualFallback}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#84B547] outline-none appearance-none pr-8 cursor-pointer disabled:bg-slate-100 font-medium"
            >
              <option value="">{lang === 'hi' ? '-- तहसील चुनें --' : '-- Select Tehsil --'}</option>
              {subdistricts.map((sd) => (
                <option key={sd.id} value={sd.id}>
                  {sd.name_en} {sd.name_local ? `(${sd.name_local})` : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              {loadingSubdistricts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* 4. Village Selector OR Unverified Manual Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
              {lang === 'hi' ? 'गाँव (Village) *' : 'Village *'}
            </label>
            <button
              type="button"
              onClick={toggleManualFallback}
              className="text-[10px] text-[#174D32] hover:text-[#0e3321] font-semibold underline cursor-pointer"
            >
              {manualFallback
                ? (lang === 'hi' ? 'आधिकारिक सूची देखें' : 'Use Official List')
                : (lang === 'hi' ? 'गाँव नहीं मिला?' : 'Not listed?')}
            </button>
          </div>

          {manualFallback ? (
            <div className="space-y-1.5">
              <input
                type="text"
                value={manualVillage}
                onChange={(e) => {
                  setManualVillage(e.target.value);
                  onChange({
                    ...value,
                    village: e.target.value,
                    village_id: null,
                    is_unverified: true,
                    unverified_details: unverifiedDetails
                  });
                }}
                placeholder={lang === 'hi' ? 'गाँव / ढाणी का नाम लिखें...' : 'Enter village / hamlet name...'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-amber-50/40 text-slate-800 focus:ring-2 focus:ring-amber-400 outline-none font-medium"
                required={required}
              />
              <span className="text-[10px] text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>{lang === 'hi' ? 'गैर-सत्यापित स्थानीय प्रविष्टि' : 'Unverified manual location entry'}</span>
              </span>
            </div>
          ) : (
            <div className="relative">
              <select
                value={value.village_id || (villages.find(v => v.name.toLowerCase() === (value.village || '').toLowerCase())?.id || '')}
                onChange={handleVillageChange}
                disabled={disabled || loadingVillages || (!value.subdistrict_id && !value.district_id)}
                required={required}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#84B547] outline-none appearance-none pr-8 cursor-pointer disabled:bg-slate-100 font-medium"
              >
                <option value="">{lang === 'hi' ? '-- गाँव चुनें --' : '-- Select Village --'}</option>
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.name_local ? `(${v.name_local})` : ''} {v.lgd_code ? `[LGD: ${v.lgd_code}]` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                {loadingVillages ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional Block Tier */}
      {showBlock && blocks.length > 0 && (
        <div className="pt-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            {lang === 'hi' ? 'विकास खंड (Development Block)' : 'Development Block'}
          </label>
          <div className="relative max-w-xs">
            <select
              value={value.block_id || ''}
              onChange={(e) => {
                const bId = parseInt(e.target.value, 10);
                const blk = blocks.find(b => b.id === bId);
                onChange({
                  ...value,
                  block: blk ? blk.name_en : '',
                  block_id: blk ? blk.id : null,
                  block_lgd_code: blk ? blk.lgd_code : null
                });
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-[#84B547] outline-none appearance-none pr-8 cursor-pointer font-medium"
            >
              <option value="">{lang === 'hi' ? '-- विकास खंड चुनें (वैकल्पिक) --' : '-- Select Block (Optional) --'}</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name_en} {b.name_local ? `(${b.name_local})` : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              {loadingBlocks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>
      )}

      {/* Selected Location Confirmation Pill */}
      {value.village && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-900 flex-wrap">
          <CheckCircle2 className="w-4 h-4 text-[#84B547] shrink-0" />
          <span className="font-bold">{value.village}</span>
          {value.subdistrict && <span className="text-emerald-700 font-medium">({value.subdistrict} Tehsil)</span>}
          {value.district && <span className="text-emerald-700 font-medium">• {value.district}</span>}
          {value.state && <span className="text-emerald-700 font-medium">, {value.state}</span>}
          {value.village_lgd_code && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              LGD: {value.village_lgd_code}
            </span>
          )}
          {value.is_unverified && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
              {lang === 'hi' ? 'गैर-सत्यापित' : 'Unverified'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
