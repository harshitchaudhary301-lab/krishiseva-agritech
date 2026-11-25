import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FolderKanban, Plus, CheckCircle2, Clock, Calendar,
  Tractor, Users, Wrench, Droplet, Truck, Building2, AlertTriangle,
  ArrowRight, IndianRupee, Loader2, Sparkles, ShieldCheck,
  Sprout, Eye, PackageCheck, Warehouse, ShieldAlert, Check, CloudSun
} from 'lucide-react';
import api from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';
import CreateRequestModal from '../../components/CreateRequestModal';

export default function FarmerProjectDetail() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [categories, setCategories] = useState([]);
  const [seeds, setSeeds] = useState([]);
  const [observations, setObservations] = useState([]);
  const [postHarvestRecords, setPostHarvestRecords] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const [createReqOpen, setCreateReqOpen] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [scopeDesc, setScopeDesc] = useState('');
  const [addingService, setAddingService] = useState(false);

  // Edit task modal state
  const [editingOp, setEditingOp] = useState(null);
  const [editOpForm, setEditOpForm] = useState({
    operation_name_en: '',
    operation_name_hi: '',
    planned_start_date: '',
    planned_end_date: '',
    service_category: '',
    notes: ''
  });
  const [savingOp, setSavingOp] = useState(false);

  const handleOpenEditOp = (op) => {
    setEditingOp(op);
    setEditOpForm({
      operation_name_en: op.operation_name_en || '',
      operation_name_hi: op.operation_name_hi || '',
      planned_start_date: op.planned_start_date || '',
      planned_end_date: op.planned_end_date || '',
      service_category: op.service_category || '',
      notes: op.notes || ''
    });
  };

  const handleSaveEditOp = async (e) => {
    e.preventDefault();
    if (!editingOp) return;
    setSavingOp(true);
    try {
      await api.patch(`/farm-projects/operations/${editingOp.id}/`, {
        ...editOpForm,
        service_category: editOpForm.service_category ? parseInt(editOpForm.service_category) : null
      });
      setEditingOp(null);
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to update task operation.');
    } finally {
      setSavingOp(false);
    }
  };

  // Modals for new modules
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showObsModal, setShowObsModal] = useState(false);
  const [showPostHarvestModal, setShowPostHarvestModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [selectedPhForRevenue, setSelectedPhForRevenue] = useState(null);
  const [submittingModal, setSubmittingModal] = useState(false);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState('operations'); // 'operations' | 'services' | 'finance' | 'seeds' | 'monitoring' | 'post_harvest'
  const [error, setError] = useState('');

  // Form states
  const [seedForm, setSeedForm] = useState({
    crop: '',
    variety: 'HD-3226 (Pusa Yashasvi)',
    breeder_source: 'ICAR-IIWBR Karnal / NSC',
    required_quantity: '40.0',
    unit: 'kg',
    procurement_status: 'procured',
    supplier_name: 'National Seeds Corporation Meerut',
    purchase_date: new Date().toISOString().split('T')[0],
    lot_number: 'NSC-2026-WHT-89',
    recorded_cost: '1800.00',
    operation: ''
  });

  const [obsForm, setObsForm] = useState({
    growth_stage: 'Tillering / Vegetative',
    crop_condition: 'healthy',
    field_notes: 'Uniform emergence across plots. Irrigation completed smoothly.',
    reported_concerns: 'None',
    operation: '',
    field: ''
  });

  const [postHarvestForm, setPostHarvestForm] = useState({
    harvest_date: new Date().toISOString().split('T')[0],
    produce_quantity: '220.0',
    unit: 'quintal',
    quality_grade: 'Grade A',
    storage_type: 'commercial_warehouse',
    storage_location: 'Central Warehousing Corporation Meerut',
    storage_days: '45',
    storage_cost: '2200.00',
    transport_required: true,
    transport_cost: '1500.00',
    sale_status: 'unsold'
  });

  const [revenueForm, setRevenueForm] = useState({
    quantity_quintals: '',
    rate_per_quintal: '',
    buyer_name: '',
    mandi_or_mill: '',
    sale_date: new Date().toISOString().split('T')[0]
  });

  const handleCompleteOperation = async (opId) => {
    try {
      await api.post(`/farm-projects/operations/${opId}/mark-completed/`, {
        notes: 'Completed by farmer via platform manager.'
      });
      fetchProjectDetails();
    } catch (err) {
      console.warn('Fallback to patch operation status', err);
      try {
        await api.patch(`/farm-projects/operations/${opId}/`, { status: 'completed' });
        fetchProjectDetails();
      } catch (patchErr) {
        console.error(patchErr);
        alert('Failed to mark operation completed.');
      }
    }
  };

  const handleRequestServiceForOperation = async (op) => {
    try {
      const catId = op.service_category || (categories.find(c => c.is_active)?.id);
      await api.post(`/farm-projects/operations/${op.id}/request-service/`, {
        category_id: catId
      });
      alert(lang === 'hi' ? 'सेवा मांग सफलतापूर्वक बनाई गई! आप प्रदाता कोटेशन प्राप्त कर सकते हैं।' : 'Service requirement linked! Request created.');
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to request service for this operation.');
    }
  };

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const [projRes, catRes, seedsRes, obsRes, phRes, revRes] = await Promise.all([
        api.get(`/farm-projects/projects/${id}/`),
        api.get('/services/categories/'),
        api.get(`/farm-projects/projects/${id}/seeds/`).catch(() => ({ data: [] })),
        api.get(`/farm-projects/projects/${id}/observations/`).catch(() => ({ data: [] })),
        api.get(`/farm-projects/projects/${id}/post-harvest/`).catch(() => ({ data: [] })),
        api.get(`/farm-projects/projects/${id}/revenues/`).catch(() => ({ data: [] }))
      ]);
      setProject(projRes.data);
      setCategories(catRes.data);
      setSeeds(seedsRes.data);
      setObservations(obsRes.data);
      setPostHarvestRecords(phRes.data);
      setRevenues(revRes.data);

      if (projRes.data?.crop && !seedForm.crop) {
        setSeedForm(prev => ({ ...prev, crop: projRes.data.crop }));
      }

      // Fetch Weather Intelligence for project locality
      const districtName = projRes.data?.farm_name ? projRes.data.farm_name.split('—')[1]?.trim() || 'Meerut' : 'Meerut';
      api.get(`/services/weather/?district=${encodeURIComponent(districtName)}`).then(wRes => {
        if (wRes?.data) setWeather(wRes.data);
      }).catch(() => {});
    } catch (err) {
      console.error(err);
      setError('Failed to load farm project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setAddingService(true);
    try {
      await api.post(`/farm-projects/projects/${id}/add-service/`, {
        category: selectedCategory,
        scope_description: scopeDesc || 'Required farm operation',
        create_request: true
      });
      setShowAddServiceModal(false);
      setSelectedCategory('');
      setScopeDesc('');
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to attach service to project.');
    } finally {
      setAddingService(false);
    }
  };

  const handleAddSeed = async (e) => {
    e.preventDefault();
    setSubmittingModal(true);
    try {
      await api.post(`/farm-projects/projects/${id}/seeds/`, {
        ...seedForm,
        operation: seedForm.operation ? parseInt(seedForm.operation, 10) : null,
        required_quantity: parseFloat(seedForm.required_quantity),
        recorded_cost: parseFloat(seedForm.recorded_cost)
      });
      setShowSeedModal(false);
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to save seed procurement record.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleAddObservation = async (e) => {
    e.preventDefault();
    setSubmittingModal(true);
    try {
      await api.post(`/farm-projects/projects/${id}/observations/`, {
        ...obsForm,
        operation: obsForm.operation ? parseInt(obsForm.operation, 10) : null,
        field: obsForm.field ? parseInt(obsForm.field, 10) : (project.field || null)
      });
      setShowObsModal(false);
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to save crop observation.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleAddPostHarvest = async (e) => {
    e.preventDefault();
    setSubmittingModal(true);
    try {
      await api.post(`/farm-projects/projects/${id}/post-harvest/`, {
        ...postHarvestForm,
        produce_quantity: parseFloat(postHarvestForm.produce_quantity),
        storage_duration_days: parseInt(postHarvestForm.storage_days || 0, 10),
        storage_cost_inr: parseFloat(postHarvestForm.storage_cost || 0),
        transport_cost_inr: parseFloat(postHarvestForm.transport_cost || 0)
      });
      setShowPostHarvestModal(false);
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to save post-harvest record.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleRequestPostHarvestService = async (phId, serviceType) => {
    try {
      await api.post(`/farm-projects/post-harvest/${phId}/request-service/`, {
        service_type: serviceType
      });
      alert(lang === 'hi'
        ? `कटाई-उपरांत ${serviceType === 'transportation' ? 'परिवहन' : 'भंडारण'} के लिए सेवा मांग (Marketplace Service Request) सफलतापूर्वक बनाई गई!`
        : `Post-harvest ${serviceType} service request successfully created in Marketplace!`);
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || `Failed to request ${serviceType} service.`);
    }
  };

  const handleSaveRevenue = async (e) => {
    e.preventDefault();
    setSubmittingModal(true);
    try {
      await api.post(`/farm-projects/projects/${id}/revenues/`, {
        crop: project.crop,
        quantity_quintals: parseFloat(revenueForm.quantity_quintals),
        rate_per_quintal: parseFloat(revenueForm.rate_per_quintal),
        buyer_name: revenueForm.buyer_name,
        mandi_or_mill: revenueForm.mandi_or_mill,
        sale_date: revenueForm.sale_date,
        post_harvest_id: selectedPhForRevenue?.id || null
      });
      setShowRevenueModal(false);
      setSelectedPhForRevenue(null);
      setRevenueForm({
        quantity_quintals: '',
        rate_per_quintal: '',
        buyer_name: '',
        mandi_or_mill: '',
        sale_date: new Date().toISOString().split('T')[0]
      });
      alert(lang === 'hi' ? 'फसल बिक्री व राजस्व सफलतापूर्वक दर्ज किया गया।' : 'Crop sale & realized revenue recorded successfully.');
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to record crop revenue.');
    } finally {
      setSubmittingModal(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#174D32]" />
        <span className="text-xs">Loading project details...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Project not found.
      </div>
    );
  }

  // Calculate unconfirmed count
  const unconfirmedServices = project.project_services?.filter(
    s => !['confirmed', 'scheduled', 'completed'].includes(s.booking_status)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/farmer/projects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#174D32] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'hi' ? 'सभी प्रोजेक्ट्स पर वापस जाएं' : 'Back to projects'}</span>
        </Link>
      </div>

      {/* Main Project Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 tracking-wider">
                ⭐ Farm Task Manager USP
              </span>
              <span className="text-xs font-bold text-slate-500">
                {project.farm_name || 'Farm Plot'}{project.field_name ? ` • Field: ${project.field_name}` : ''} • {project.target_area_acres} Acres
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {project.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Crop: <strong className="text-slate-800">{project.crop}</strong> • Schedule: {project.start_date} to {project.expected_completion_date}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={project.status} />
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-4 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'hi' ? 'सेवा जोड़ें' : 'Add Service'}</span>
            </button>
          </div>
        </div>

        {/* Coordination Progress & Cost Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">{lang === 'hi' ? 'समन्वय एवं तैयारी प्रगति:' : 'Operations Coordination Readiness:'}</span>
              <span className="text-base text-[#174D32]">
                {project.completion_percentage !== null && project.completion_percentage !== undefined
                  ? `${project.completion_percentage}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-[#84B547] to-[#174D32] h-full rounded-full transition-all duration-500"
                style={{ width: `${project.completion_percentage ?? 0}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500">
              {project.confirmed_count ?? (project.project_services?.filter(s => ['confirmed', 'scheduled', 'completed'].includes(s.booking_status)).length || 0)} of {project.services_count ?? (project.project_services?.length || 0)} essential agricultural services confirmed.
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-amber-200/60">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                {lang === 'hi' ? 'अनुमानित कुल बजट' : 'Estimated Budget'}
              </span>
              <span className="text-lg font-black text-slate-900">
                ₹{project.estimated_budget?.toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                {lang === 'hi' ? 'पक्का खर्च (तय कोटेशन्स)' : 'Committed Costs'}
              </span>
              <span className="text-lg font-black text-[#174D32]">
                ₹{project.actual_cost?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Crucial Readiness Guarantee Alert */}
        {unconfirmedServices.length > 0 ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold text-sm block">
                {lang === 'hi' ? 'तैयारी जांच — प्रोजेक्ट अभी पूरी तरह तैयार नहीं है' : 'Readiness Check — Project is not yet fully ready'}
              </strong>
              <p className="leading-relaxed">
                {lang === 'hi'
                  ? `इस प्रोजेक्ट में ${unconfirmedServices.length} सेवा अभी भी पुष्टि की प्रतीक्षा में है। जब तक सभी आवश्यक सेवाओं की बुकिंग पक्की नहीं हो जाती, प्रोजेक्ट को "तैयार" मार्क नहीं किया जा सकता।`
                  : `Essential services (${unconfirmedServices.map(s => s.category_details?.name_en).join(', ')}) are still unconfirmed. As per KrishiSeva platform rules, the project cannot be marked Ready until all bookings are verified.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="font-bold text-sm block">
                {lang === 'hi' ? 'सभी सेवाएं पक्की हैं — प्रोजेक्ट संचालन हेतु तैयार!' : 'All Essential Services Confirmed — Operation Ready!'}
              </strong>
              <p>Machinery, labour, and maintenance schedules are fully locked with zero double-booking conflicts.</p>
            </div>
          </div>
        )}
      </div>

      {/* Weather Intelligence Reference Card (Module 05) */}
      {weather && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <CloudSun className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  Weather Intelligence
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  weather.freshness_status === 'fresh' || weather.is_live
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {weather.freshness_status === 'fresh' || weather.is_live
                    ? (lang === 'hi' ? 'लाइव मौसम' : 'Live Verified')
                    : (lang === 'hi' ? 'मौसमी मानक संदर्भ' : 'Offline Reference')}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                <span>{weather.location?.district || 'Meerut'}</span>
                <span>•</span>
                <span className="text-emerald-700 font-extrabold">{weather.current?.temperature_c ?? weather.temperature_c}°C</span>
                <span>•</span>
                <span className="font-medium text-slate-600">
                  {lang === 'hi' ? weather.current?.condition_hi : weather.current?.condition_en}
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Rainfall: <strong>{weather.current?.rainfall_mm ?? weather.current?.precipitation_mm ?? 0} mm</strong> · Humidity: <strong>{weather.current?.humidity_percent}%</strong> · Wind: <strong>{weather.current?.wind_speed_kmh} km/h</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {weather.forecast_3_day && (
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                {weather.forecast_3_day.slice(0, 3).map((f, i) => (
                  <div key={i} className="text-center px-2 py-1">
                    <span className="text-[9px] font-bold text-slate-400 block">{f.date}</span>
                    <span className="text-xs font-black text-slate-800">{f.temp_max}°</span>
                    <span className="text-[9px] text-slate-500 block">{f.precipitation_mm > 0 ? `${f.precipitation_mm}mm` : (lang === 'hi' ? f.condition_hi : f.condition_en)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-[10px] text-slate-400 max-w-xs leading-tight">
              <div>Source: {weather.data_source || weather.attribution}</div>
              <div className="text-slate-500 font-medium mt-0.5">{weather.booking_policy}</div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Operations Timeline & Milestones */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#174D32]" />
            <h3 className="text-lg font-bold text-slate-900">
              {lang === 'hi' ? 'संचालन समय-सीमा और मुख्य पड़ाव' : 'Operations Timeline & Milestones'}
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {project.start_date} → {project.expected_completion_date}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Milestone 1 */}
          <div className="p-4 rounded-2xl bg-[#F7F9F5] border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Step 1 • Completed
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-1">
                {lang === 'hi' ? 'गतिविधि रूपरेखा' : 'Operation Scoping'}
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                {project.crop} across {project.target_area_acres} acres scoped with required services.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Start: {project.start_date}
            </span>
          </div>

          {/* Milestone 2 */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
            unconfirmedServices.length === 0
              ? 'bg-[#F7F9F5] border-slate-200'
              : 'bg-amber-50/70 border-amber-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  unconfirmedServices.length === 0
                    ? 'text-emerald-800 bg-emerald-100'
                    : 'text-amber-800 bg-amber-100'
                }`}>
                  {unconfirmedServices.length === 0 ? 'Step 2 • Completed' : 'Step 2 • Active'}
                </span>
                {unconfirmedServices.length === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-1">
                {lang === 'hi' ? 'कोटेशन व बोली समीक्षा' : 'Quotes & Bids Review'}
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                {unconfirmedServices.length === 0
                  ? 'All service quotes reviewed & confirmed by providers.'
                  : `${unconfirmedServices.length} service quotation(s) awaiting farmer approval.`}
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {project.confirmed_count ?? (project.project_services?.filter(s => ['confirmed', 'scheduled', 'completed'].includes(s.booking_status)).length || 0)} of {project.services_count ?? (project.project_services?.length || 0)} Confirmed
            </span>
          </div>

          {/* Milestone 3 */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
            project.status === 'in_progress'
              ? 'bg-emerald-50/60 border-emerald-300'
              : project.status === 'completed'
              ? 'bg-[#F7F9F5] border-slate-200'
              : 'bg-slate-50 border-slate-200 opacity-80'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  project.status === 'completed'
                    ? 'text-emerald-800 bg-emerald-100'
                    : project.status === 'in_progress'
                    ? 'text-emerald-800 bg-emerald-100'
                    : 'text-slate-600 bg-slate-200'
                }`}>
                  {project.status === 'completed'
                    ? 'Step 3 • Completed'
                    : project.status === 'in_progress'
                    ? 'Step 3 • In Progress'
                    : 'Step 3 • Scheduled'}
                </span>
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-1">
                {lang === 'hi' ? 'खेत में कार्य निष्पादन' : 'Field Operations'}
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                Machinery on-site, labour deployed, mechanic standby active.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Committed: ₹{project.actual_cost?.toLocaleString()}
            </span>
          </div>

          {/* Milestone 4 */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
            project.status === 'completed'
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-slate-50 border-slate-200 opacity-80'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  project.status === 'completed'
                    ? 'text-emerald-800 bg-emerald-100'
                    : 'text-slate-600 bg-slate-200'
                }`}>
                  {project.status === 'completed' ? 'Step 4 • Completed' : 'Step 4 • Final Sign-off'}
                </span>
                <Sparkles className="w-4 h-4 text-[#E8B44C]" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-1">
                {lang === 'hi' ? 'कार्य समाप्ति व समीक्षा' : 'Harvesting Handover'}
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                Final inspection, rating & review of service providers.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Target: {project.expected_completion_date}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Module Project Workspace Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'operations'
                  ? 'bg-[#174D32] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'कार्य सूची' : 'Operations'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'operations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {project.project_operations?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-[#174D32] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Tractor className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'सेवा बुकिंग' : 'Bookings'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'services' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {project.project_services?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'finance'
                  ? 'bg-[#174D32] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'वित्तीय खाता' : 'Financial Ledger'}</span>
            </button>

            <button
              onClick={() => setActiveTab('seeds')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'seeds'
                  ? 'bg-[#174D32] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'बीज संदर्भ (Seed)' : 'Seed Records'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'seeds' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {seeds.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'monitoring'
                  ? 'bg-[#174D32] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'फसल निगरानी' : 'Crop Observations'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'monitoring' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {observations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('post_harvest')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'post_harvest'
                  ? 'bg-[#174D32] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'कटाई उपरांत' : 'Post-Harvest'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'post_harvest' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {postHarvestRecords.length}
              </span>
            </button>
          </div>

          {/* Action button inside tab bar */}
          <div>
            {activeTab === 'seeds' && (
              <button
                onClick={() => setShowSeedModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#174D32] text-white text-xs font-bold hover:bg-[#0e3321] transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'बीज खरीद दर्ज करें' : 'Log Seed Procurement'}</span>
              </button>
            )}
            {activeTab === 'monitoring' && (
              <button
                onClick={() => setShowObsModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#174D32] text-white text-xs font-bold hover:bg-[#0e3321] transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'निगरानी नोट जोड़ें' : 'Log Field Observation'}</span>
              </button>
            )}
            {activeTab === 'post_harvest' && (
              <button
                onClick={() => setShowPostHarvestModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#174D32] text-white text-xs font-bold hover:bg-[#0e3321] transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'कटाई उपज दर्ज करें' : 'Record Harvest Yield'}</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: Crop Operations Checklist */}
        {activeTab === 'operations' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
              <span>{lang === 'hi' ? 'फसल की कालक्रमिक कार्य सूची (क्रमबद्ध निष्पादन)' : 'Sequential Agricultural Task List (Template Workflow)'}</span>
              <span>{project.project_operations?.filter(o => o.status === 'completed').length || 0} Completed</span>
            </div>

            {project.project_operations && project.project_operations.length > 0 ? (
              <div className="space-y-3">
                {project.project_operations.map((op) => {
                  const isDone = op.status === 'completed';
                  const isReady = op.status === 'ready' || op.status === 'in_progress';
                  const isAwaiting = op.status === 'awaiting_prerequisite';

                  return (
                    <div
                      key={op.id}
                      className={`bg-white rounded-3xl p-5 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isDone
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : isReady
                          ? 'border-amber-300 shadow-xs'
                          : 'border-slate-200 opacity-90'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isReady
                            ? 'bg-[#174D32] text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {op.sequence_order}
                        </span>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm">
                              {lang === 'hi' && op.operation_name_hi ? op.operation_name_hi : op.operation_name_en}
                            </h4>
                            {lang === 'hi' && op.operation_name_en && (
                              <span className="text-xs text-slate-400">({op.operation_name_en})</span>
                            )}
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {op.stage}
                            </span>
                            <StatusBadge status={op.status} />
                          </div>

                          <p className="text-xs text-slate-500">
                            Planned: <strong className="text-slate-700">{op.planned_start_date}</strong> to <strong className="text-slate-700">{op.planned_end_date}</strong>
                            {op.prerequisite_name && isAwaiting && (
                              <span className="text-amber-700 ml-2 font-medium">
                                • Awaiting Prerequisite: {op.prerequisite_name}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                        {!isDone && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditOp(op)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 bg-white text-xs font-semibold transition cursor-pointer"
                            title="Edit task dates, notes, or service category"
                          >
                            {lang === 'hi' ? 'संपादित करें' : 'Edit'}
                          </button>
                        )}
                        {!isDone && !op.service_request && (
                          <button
                            onClick={() => handleRequestServiceForOperation(op)}
                            className="px-3.5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Generate linked service request to find matching providers"
                          >
                            <Wrench className="w-3.5 h-3.5 text-[#E8B44C]" />
                            <span>{lang === 'hi' ? 'सेवा मांगें (SME)' : 'Find & Request Service'}</span>
                          </button>
                        )}
                        {!isDone && op.service_request && (
                          <Link
                            to={`/farmer/requests/${op.service_request}`}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition flex items-center gap-1"
                          >
                            <span>REQ-{op.service_request} Linked</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        {isReady && !isDone && (
                          <button
                            onClick={() => handleCompleteOperation(op.id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Mark completed directly and unlock dependent tasks"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{lang === 'hi' ? 'स्वयं पूर्ण' : 'Manual Complete'}</span>
                          </button>
                        )}
                        {isDone && (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            {lang === 'hi' ? 'कार्य पूर्ण' : 'Done'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
                No operations recorded for this project.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Synchronized Services */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
              <span>{lang === 'hi' ? 'बाज़ार से जुड़ी सेवाएं एवं बुकिंग्स' : 'Marketplace Service Requests & Assigned Bookings'}</span>
              <span>{project.project_services?.length || 0} Connected Services</span>
            </div>

            <div className="space-y-4">
              {project.project_services?.map((ps, idx) => {
                const req = ps.service_request_details;
                const hasBooking = req && req.status === 'booked';

                return (
                  <div
                    key={ps.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-[#84B547] transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-[#174D32] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-base text-slate-900">
                          {ps.category_details?.name_en} ({lang === 'hi' ? ps.category_details?.name_hi : ''})
                        </span>
                        <StatusBadge status={ps.booking_status} />
                      </div>

                      <p className="text-xs text-slate-600 font-medium">
                        {ps.scope_description} • Target Date: <strong className="text-slate-800">{ps.target_date || project.start_date}</strong>
                      </p>

                      {req && (
                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                          <span>Request ID: <strong>REQ-{req.id}</strong></span>
                          <span>•</span>
                          <span>Quotes Received: <strong>{req.quotations_count || 0}</strong></span>
                          {ps.agreed_cost > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-800 font-black">
                                Amount: ₹{ps.agreed_cost.toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-3 w-full md:w-auto justify-end">
                      {req ? (
                        <Link
                          to={`/farmer/requests/${req.id}`}
                          className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span>
                            {hasBooking
                              ? (lang === 'hi' ? 'बुकिंग विवरण देखें' : 'View Booking')
                              : (lang === 'hi' ? 'कोटेशन देखें' : 'Review Quotes')}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedCategory(ps.category);
                            setShowAddServiceModal(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#84B547] text-white text-xs font-bold"
                        >
                          Create Request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Farm Financial Planner (FIN-01 to FIN-12) */}
        {activeTab === 'finance' && project.financial_summary && (
          <div className="space-y-6">
            {/* Core 4-KPI Row strictly separating estimates, commitments, incurred, balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  {lang === 'hi' ? '१. अनुमानित बजट' : '1. Planned Estimates'}
                </span>
                <span className="text-xl font-black text-slate-800 block">
                  ₹{Number(project.financial_summary.planned_estimates).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">FIN-01 • Pre-contracting budget</span>
              </div>

              <div className="bg-amber-50/50 rounded-3xl p-5 border border-amber-200 shadow-xs space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block">
                  {lang === 'hi' ? '२. पक्की प्रतिबद्धताएं' : '2. Confirmed Commitments'}
                </span>
                <span className="text-xl font-black text-amber-900 block">
                  ₹{Number(project.financial_summary.confirmed_commitments).toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-700">FIN-02 • Accepted Quotations</span>
              </div>

              <div className="bg-indigo-50/50 rounded-3xl p-5 border border-indigo-200 shadow-xs space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider block">
                  {lang === 'hi' ? '३. वास्तविक देय खर्च' : '3. Incurred Liabilities'}
                </span>
                <span className="text-xl font-black text-indigo-900 block">
                  ₹{Number(project.financial_summary.incurred_expenditure).toLocaleString()}
                </span>
                <span className="text-[10px] text-indigo-700">FIN-03 • Approved Completed Work</span>
              </div>

              <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-300 shadow-xs space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider block">
                  {lang === 'hi' ? '४. देय बकाया राशि' : '4. Outstanding Balance'}
                </span>
                <span className="text-xl font-black text-emerald-900 block">
                  ₹{Number(project.financial_summary.outstanding_balance).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">FIN-06 • Incurred less Payments</span>
              </div>
            </div>

            {/* Detailed Ledger & Breakdown Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-[#174D32]" />
                <span>{lang === 'hi' ? 'भुगतान एवं परिचालन विवरण (लेखा)' : 'Operational Payment Ledger & Surplus Breakdown'}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Left: Payment tracking */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block text-xs border-b border-slate-200 pb-2">
                    Payment Ledger Tracking
                  </span>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Advance Payments (FIN-04):</span>
                    <strong className="text-slate-900">₹{Number(project.financial_summary.recorded_advance_payments).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Partial Payments (FIN-05):</span>
                    <strong className="text-slate-900">₹{Number(project.financial_summary.recorded_partial_payments).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Total Payments Recorded:</span>
                    <strong className="text-slate-900">₹{Number(project.financial_summary.total_recorded_payments).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-rose-600">Refunds Recorded (FIN-11):</span>
                    <strong className="text-rose-700">- ₹{Number(project.financial_summary.refunds).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-slate-900">
                    <span>Net Recorded Payments:</span>
                    <span className="text-emerald-700">₹{Number(project.financial_summary.net_recorded_payments).toLocaleString()}</span>
                  </div>
                </div>

                {/* Right: Revenue & Surplus */}
                <div className="space-y-3 p-4 rounded-2xl bg-[#FAF8F2] border border-amber-200">
                  <span className="font-bold text-slate-800 block text-xs border-b border-amber-200 pb-2">
                    Harvest Revenue & Operational Margin (FIN-12)
                  </span>
                  <div className="flex justify-between py-1 border-b border-amber-100">
                    <span className="text-slate-600">Cultivated Area:</span>
                    <strong className="text-slate-900">{project.financial_summary.cultivated_area_acres} Acres</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-amber-100">
                    <span className="text-slate-600">Cost Per Acre:</span>
                    <strong className="text-slate-900">₹{Number(project.financial_summary.cost_per_acre).toLocaleString()} / Acre</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-amber-100">
                    <span className="text-slate-600">Realized Harvest Revenue:</span>
                    <strong className="text-emerald-800 font-black">₹{Number(project.financial_summary.realized_revenue).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-amber-100">
                    <span className="text-slate-600">Incurred Cost Deductions:</span>
                    <strong className="text-rose-700">- ₹{Number(project.financial_summary.incurred_expenditure).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-2 font-black text-sm bg-emerald-100/70 text-emerald-950 px-3 rounded-xl mt-2">
                    <span>Recorded Net Surplus:</span>
                    <span>₹{Number(project.financial_summary.recorded_surplus).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Statutory Economic Disclaimer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                <strong className="text-slate-700 font-bold block mb-0.5">⚠️ Platform Economic Notice:</strong>
                {project.financial_summary.economic_disclaimer} Live payment collection is disabled in this MVP; entries record direct provider settlements on the platform ledger.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Seed Intelligence (Module 04) */}
        {activeTab === 'seeds' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
              <span>{lang === 'hi' ? 'बीज विविधता, स्रोत एवं खरीद विवरण' : 'Seed Variety Reference, Breeder Source & Procurement Records'}</span>
              <span>{seeds.length} Records</span>
            </div>

            {seeds.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <Sprout className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {lang === 'hi' ? 'कोई बीज खरीद रिकॉर्ड नहीं है' : 'No seed procurement records yet'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Record breeder sources (ICAR/NSC), certified lot numbers, and costs for transparent crop input tracking.
                </p>
                <button
                  onClick={() => setShowSeedModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#174D32] text-white text-xs font-bold"
                >
                  {lang === 'hi' ? 'बीज रिकॉर्ड जोड़ें' : 'Add First Seed Record'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seeds.map((s) => (
                  <div key={s.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Crop Variety</span>
                        <h4 className="font-bold text-slate-900 text-base">{s.variety || s.variety_name}</h4>
                        <span className="text-xs text-slate-500">{s.crop}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        s.procurement_status === 'procured' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.procurement_status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div><strong>Breeder Source:</strong> {s.breeder_source || s.source_breeder}</div>
                      <div><strong>Supplier:</strong> {s.supplier_name || 'Direct / NSC'}</div>
                      <div><strong>Lot Number:</strong> <span className="font-mono text-slate-700">{s.lot_number || 'N/A'}</span></div>
                      {s.operation_name && (
                        <div className="text-slate-700">
                          <strong>Linked Operation:</strong> #{s.operation_sequence} {s.operation_name}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span>Quantity: <strong>{s.required_quantity} {s.unit || s.quantity_unit}</strong></span>
                        <div className="text-right">
                          <span className="font-bold text-[#174D32] block">Cost: ₹{Number(s.recorded_cost).toLocaleString()}</span>
                          {s.expense && (
                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Ledger Linked (FIN-03)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Crop Monitoring & Observations (Module 09) */}
        {activeTab === 'monitoring' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
              <span>{lang === 'hi' ? 'खेत निरीक्षण एवं कीट/रोग स्थिति' : 'Field Inspection, Phenological Growth Stages & Pest Status'}</span>
              <span>{observations.length} Observations</span>
            </div>

            {observations.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <Eye className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {lang === 'hi' ? 'कोई फसल निरीक्षण रिकॉर्ड नहीं है' : 'No crop observations recorded yet'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Log crop growth stages, vegetative vigor, and pest alerts to maintain historical field health records.
                </p>
                <button
                  onClick={() => setShowObsModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#174D32] text-white text-xs font-bold"
                >
                  {lang === 'hi' ? 'पहला निरीक्षण जोड़ें' : 'Log First Observation'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {observations.map((obs) => (
                  <div key={obs.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{obs.growth_stage}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          obs.crop_condition === 'healthy' ? 'bg-emerald-100 text-emerald-800' :
                          obs.crop_condition === 'pest_attack' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Condition: {obs.crop_condition}
                        </span>
                        <span className="text-[11px] text-slate-400">Date: {obs.observation_date}</span>
                        {obs.operation_name && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                            Op: {obs.operation_name}
                          </span>
                        )}
                        {obs.field_name && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Field: {obs.field_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{obs.field_notes}</p>
                      {obs.reported_concerns && obs.reported_concerns !== 'None' && (
                        <div className="text-[11px] text-rose-700 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Concern: {obs.reported_concerns}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: Post-Harvest Management (Module 10) */}
        {activeTab === 'post_harvest' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
              <span>{lang === 'hi' ? 'उपज मात्रा, भंडारण एवं परिवहन लागत' : 'Harvested Yield, Storage Type & Transport Integration'}</span>
              <span>{postHarvestRecords.length} Records</span>
            </div>

            {postHarvestRecords.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <Warehouse className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {lang === 'hi' ? 'कोई कटाई-उपरांत रिकॉर्ड नहीं है' : 'No post-harvest records logged yet'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Record actual harvested yield, quality grading, storage facilities, and transportation to mandis.
                </p>
                <button
                  onClick={() => setShowPostHarvestModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#174D32] text-white text-xs font-bold"
                >
                  {lang === 'hi' ? 'उपज रिकॉर्ड दर्ज करें' : 'Record Harvest Yield'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {postHarvestRecords.map((ph) => (
                  <div key={ph.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Yield Record</span>
                        <h4 className="font-black text-slate-900 text-lg">
                          {ph.produce_quantity} {ph.unit}
                        </h4>
                        <span className="text-xs text-slate-500">Harvest Date: {ph.harvest_date}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        {ph.quality_grade}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div><strong>Storage:</strong> {ph.storage_type_display || ph.storage_type} ({ph.storage_days ?? ph.storage_duration_days ?? 0} days)</div>
                      <div><strong>Location:</strong> {ph.storage_location || 'Local facility'}</div>
                      <div className="flex justify-between py-1 border-t border-slate-100">
                        <span>Storage Cost: <strong>₹{Number(ph.storage_cost ?? ph.storage_cost_inr ?? 0).toLocaleString()}</strong></span>
                        <span>Transport Cost: <strong>₹{Number(ph.transport_cost ?? ph.transport_cost_inr ?? 0).toLocaleString()}</strong></span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400">Sale Status:</span>
                        <span className="font-bold text-[#174D32] uppercase text-[11px]">{ph.sale_status_display || ph.sale_status}</span>
                      </div>

                      {/* Post-Harvest Marketplace Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!ph.transport_request_id && !ph.transport_service_request && (
                            <button
                              type="button"
                              onClick={() => handleRequestPostHarvestService(ph.id, 'transportation')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                              title="Create transportation service request in Marketplace"
                            >
                              <Truck className="w-3.5 h-3.5 text-[#174D32]" />
                              <span>{lang === 'hi' ? 'परिवहन मांगें' : 'Book Transport'}</span>
                            </button>
                          )}
                          {(ph.transport_request_id || ph.transport_service_request) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                              Transport Req #{ph.transport_request_id || ph.transport_service_request}
                            </span>
                          )}

                          {!ph.storage_request_id && !ph.storage_service_request && (
                            <button
                              type="button"
                              onClick={() => handleRequestPostHarvestService(ph.id, 'storage')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                              title="Create warehouse/storage service request in Marketplace"
                            >
                              <Warehouse className="w-3.5 h-3.5 text-[#174D32]" />
                              <span>{lang === 'hi' ? 'भंडारण मांगें' : 'Book Storage'}</span>
                            </button>
                          )}
                          {(ph.storage_request_id || ph.storage_service_request) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                              Storage Req #{ph.storage_request_id || ph.storage_service_request}
                            </span>
                          )}
                        </div>

                        {ph.sale_status !== 'sold' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPhForRevenue(ph);
                              setRevenueForm(prev => ({
                                ...prev,
                                quantity_quintals: ph.produce_quantity || '',
                                rate_per_quintal: ''
                              }));
                              setShowRevenueModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            <IndianRupee className="w-3 h-3 text-[#E8B44C]" />
                            <span>{lang === 'hi' ? 'बिक्री दर्ज करें' : 'Record Sale'}</span>
                          </button>
                        )}
                        {ph.sale_status === 'sold' && (ph.revenue_amount || ph.revenue_record) && (
                          <span className="text-[11px] font-bold text-emerald-700">
                            Sold: ₹{Number(ph.revenue_amount || 0).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {lang === 'hi' ? 'प्रोजेक्ट में नई सेवा जोड़ें' : 'Attach Service to Project'}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">{project.name}</p>
              </div>
              <button onClick={() => setShowAddServiceModal(false)} className="p-2 text-white/80 hover:text-white rounded-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddService} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'सेवा श्रेणी चुनें *' : 'Service Category *'}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_en} ({c.name_hi}) - {c.is_active ? 'Active' : 'Upcoming'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'कार्य का दायरा / विवरण *' : 'Scope / Description *'}
                </label>
                <input
                  type="text"
                  value={scopeDesc}
                  onChange={(e) => setScopeDesc(e.target.value)}
                  placeholder="e.g. Grain transport trolleys to Daurala mandi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={addingService}
                  className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {addingService ? 'Adding...' : (lang === 'hi' ? 'सेवा जोड़ें' : 'Add Service')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Seed Record (Module 04) */}
      {showSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Log Seed Procurement</h3>
                <p className="text-xs text-emerald-100 mt-0.5">Module 04 • Seed Intelligence</p>
              </div>
              <button onClick={() => setShowSeedModal(false)} className="p-2 text-white/80 hover:text-white rounded-xl">✕</button>
            </div>

            <form onSubmit={handleAddSeed} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'संबंधित कार्य (Operation)' : 'Linked Project Operation'}
                </label>
                <select
                  value={seedForm.operation || ''}
                  onChange={(e) => setSeedForm({ ...seedForm, operation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                >
                  <option value="">-- {lang === 'hi' ? 'सामान्य बीज खरीद' : 'General Project Seed Requirement'} --</option>
                  {(project.project_operations || []).map((op) => (
                    <option key={op.id} value={op.id}>
                      #{op.sequence_order} {op.operation_name_en} ({op.stage})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Variety *</label>
                <input
                  type="text"
                  value={seedForm.variety}
                  onChange={(e) => setSeedForm({ ...seedForm, variety: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Breeder Source</label>
                  <input
                    type="text"
                    value={seedForm.breeder_source}
                    onChange={(e) => setSeedForm({ ...seedForm, breeder_source: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={seedForm.supplier_name}
                    onChange={(e) => setSeedForm({ ...seedForm, supplier_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Qty</label>
                  <input
                    type="number"
                    step="0.5"
                    value={seedForm.required_quantity}
                    onChange={(e) => setSeedForm({ ...seedForm, required_quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Unit</label>
                  <select
                    value={seedForm.unit}
                    onChange={(e) => setSeedForm({ ...seedForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">quintal</option>
                    <option value="packets">packets</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={seedForm.recorded_cost}
                    onChange={(e) => setSeedForm({ ...seedForm, recorded_cost: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Lot Number</label>
                  <input
                    type="text"
                    value={seedForm.lot_number}
                    onChange={(e) => setSeedForm({ ...seedForm, lot_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Status</label>
                  <select
                    value={seedForm.procurement_status}
                    onChange={(e) => setSeedForm({ ...seedForm, procurement_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="procured">Procured</option>
                    <option value="pending">Pending</option>
                    <option value="sown">Sown</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSeedModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 rounded-xl bg-[#174D32] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {submittingModal ? 'Saving...' : 'Save Seed Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Observation (Module 09) */}
      {showObsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Log Crop Observation</h3>
                <p className="text-xs text-emerald-100 mt-0.5">Module 09 • Crop Monitoring</p>
              </div>
              <button onClick={() => setShowObsModal(false)} className="p-2 text-white/80 hover:text-white rounded-xl">✕</button>
            </div>

            <form onSubmit={handleAddObservation} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'संबंधित कार्य (Operation)' : 'Linked Operation (Optional)'}
                </label>
                <select
                  value={obsForm.operation || ''}
                  onChange={(e) => setObsForm({ ...obsForm, operation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                >
                  <option value="">-- {lang === 'hi' ? 'सामान्य खेत निरीक्षण' : 'General Field Observation'} --</option>
                  {(project.project_operations || []).map((op) => (
                    <option key={op.id} value={op.id}>#{op.sequence_order} {op.operation_name_en} ({op.stage})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Growth Stage *</label>
                <input
                  type="text"
                  value={obsForm.growth_stage}
                  onChange={(e) => setObsForm({ ...obsForm, growth_stage: e.target.value })}
                  placeholder="e.g. Vegetative, Tillering, Flowering"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Crop Condition</label>
                <select
                  value={obsForm.crop_condition}
                  onChange={(e) => setObsForm({ ...obsForm, crop_condition: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  <option value="healthy">Healthy (स्वस्थ)</option>
                  <option value="normal">Normal (सामान्य)</option>
                  <option value="stressed">Stressed (तनावग्रस्त - नमी/गर्मी)</option>
                  <option value="pest_attack">Pest Attack (कीट प्रकोप)</option>
                  <option value="disease">Disease (रोग प्रकोप)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Field Notes</label>
                <textarea
                  rows={2}
                  value={obsForm.field_notes}
                  onChange={(e) => setObsForm({ ...obsForm, field_notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder="Notes on stand, vigor, moisture..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Reported Concerns</label>
                <input
                  type="text"
                  value={obsForm.reported_concerns}
                  onChange={(e) => setObsForm({ ...obsForm, reported_concerns: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder="e.g. Mild aphid presence near border"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowObsModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 rounded-xl bg-[#174D32] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {submittingModal ? 'Saving...' : 'Save Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Post Harvest (Module 10) */}
      {showPostHarvestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Record Harvest Yield</h3>
                <p className="text-xs text-emerald-100 mt-0.5">Module 10 • Post-Harvest Management</p>
              </div>
              <button onClick={() => setShowPostHarvestModal(false)} className="p-2 text-white/80 hover:text-white rounded-xl">✕</button>
            </div>

            <form onSubmit={handleAddPostHarvest} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={postHarvestForm.produce_quantity}
                    onChange={(e) => setPostHarvestForm({ ...postHarvestForm, produce_quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Unit</label>
                  <select
                    value={postHarvestForm.unit}
                    onChange={(e) => setPostHarvestForm({ ...postHarvestForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="quintal">quintal</option>
                    <option value="ton">ton</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Grade</label>
                  <input
                    type="text"
                    value={postHarvestForm.quality_grade}
                    onChange={(e) => setPostHarvestForm({ ...postHarvestForm, quality_grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Storage Type</label>
                  <select
                    value={postHarvestForm.storage_type}
                    onChange={(e) => setPostHarvestForm({ ...postHarvestForm, storage_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="warehouse">Warehouse</option>
                    <option value="farm_storage">Farm Storage</option>
                    <option value="cold_storage">Cold Storage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Storage Facility Location</label>
                <input
                  type="text"
                  value={postHarvestForm.storage_location}
                  onChange={(e) => setPostHarvestForm({ ...postHarvestForm, storage_location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Storage Cost (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={postHarvestForm.storage_cost}
                    onChange={(e) => setPostHarvestForm({ ...postHarvestForm, storage_cost: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Transport Cost (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={postHarvestForm.transport_cost}
                    onChange={(e) => setPostHarvestForm({ ...postHarvestForm, transport_cost: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPostHarvestModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 rounded-xl bg-[#174D32] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {submittingModal ? 'Saving...' : 'Save Harvest Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Sale & Revenue (Module 10 / FIN-12) */}
      {showRevenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-[#174D32] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {lang === 'hi' ? 'फसल बिक्री व राजस्व दर्ज करें' : 'Record Crop Sale & Revenue'}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">FIN-12 • Post-Harvest Realized Revenue</p>
              </div>
              <button
                onClick={() => {
                  setShowRevenueModal(false);
                  setSelectedPhForRevenue(null);
                }}
                className="p-2 text-white/80 hover:text-white rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRevenue} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'बिक्री मात्रा (क्विंटल) *' : 'Quantity (Quintals) *'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={revenueForm.quantity_quintals}
                    onChange={(e) => setRevenueForm({ ...revenueForm, quantity_quintals: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'दर प्रति क्विंटल (₹) *' : 'Rate / Quintal (₹) *'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={revenueForm.rate_per_quintal}
                    onChange={(e) => setRevenueForm({ ...revenueForm, rate_per_quintal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    placeholder="e.g. 2275"
                    required
                  />
                </div>
              </div>

              {/* Calculated Total Revenue preview */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">
                  {lang === 'hi' ? 'कुल अनुमानित राजस्व:' : 'Total Realized Revenue:'}
                </span>
                <span className="text-base font-black text-[#174D32]">
                  ₹{(
                    (parseFloat(revenueForm.quantity_quintals) || 0) *
                    (parseFloat(revenueForm.rate_per_quintal) || 0)
                  ).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'खरीदार / एजेंसी का नाम *' : 'Buyer / Agency Name *'}
                </label>
                <input
                  type="text"
                  value={revenueForm.buyer_name}
                  onChange={(e) => setRevenueForm({ ...revenueForm, buyer_name: e.target.value })}
                  placeholder="e.g. ITC e-Choupal / Meerut Grain Merchant"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'मंडी या मिल का नाम' : 'Mandi or Processing Mill'}
                </label>
                <input
                  type="text"
                  value={revenueForm.mandi_or_mill}
                  onChange={(e) => setRevenueForm({ ...revenueForm, mandi_or_mill: e.target.value })}
                  placeholder="e.g. Daurala Mandi Yard"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'बिक्री तारीख *' : 'Sale Date *'}
                </label>
                <input
                  type="date"
                  value={revenueForm.sale_date}
                  onChange={(e) => setRevenueForm({ ...revenueForm, sale_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowRevenueModal(false);
                    setSelectedPhForRevenue(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {submittingModal ? 'Saving...' : (lang === 'hi' ? 'राजस्व सहेजें' : 'Save Revenue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-[#174D32] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {lang === 'hi' ? 'कार्य संपादित करें' : 'Edit Project Task'}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  #{editingOp.sequence_order}: {editingOp.operation_name_en}
                </p>
              </div>
              <button onClick={() => setEditingOp(null)} className="p-2 text-white/80 hover:text-white rounded-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditOp} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'कार्य का नाम (अंग्रेज़ी)' : 'Operation Name (English)'}
                </label>
                <input
                  type="text"
                  value={editOpForm.operation_name_en}
                  onChange={(e) => setEditOpForm({ ...editOpForm, operation_name_en: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'कार्य का नाम (हिंदी)' : 'Operation Name (Hindi)'}
                </label>
                <input
                  type="text"
                  value={editOpForm.operation_name_hi}
                  onChange={(e) => setEditOpForm({ ...editOpForm, operation_name_hi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'शुरुआत तारीख' : 'Planned Start'}
                  </label>
                  <input
                    type="date"
                    value={editOpForm.planned_start_date}
                    onChange={(e) => setEditOpForm({ ...editOpForm, planned_start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {lang === 'hi' ? 'समाप्ति तारीख' : 'Planned End'}
                  </label>
                  <input
                    type="date"
                    value={editOpForm.planned_end_date}
                    onChange={(e) => setEditOpForm({ ...editOpForm, planned_end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'संबंधित सेवा श्रेणी' : 'Linked Service Category'}
                </label>
                <select
                  value={editOpForm.service_category}
                  onChange={(e) => setEditOpForm({ ...editOpForm, service_category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                >
                  <option value="">-- No Linked Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_en} ({c.name_hi})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'विशेष निर्देश / नोट्स' : 'Notes / Instructions'}
                </label>
                <textarea
                  rows="2"
                  value={editOpForm.notes}
                  onChange={(e) => setEditOpForm({ ...editOpForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#84B547] outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOp(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingOp}
                  className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {savingOp ? 'Saving...' : (lang === 'hi' ? 'सहेजें' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
