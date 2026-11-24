import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FolderKanban, Plus, CheckCircle2, Clock, Calendar,
  Tractor, Users, Wrench, Droplet, Truck, Building2, AlertTriangle,
  ArrowRight, IndianRupee, Loader2, Sparkles, ShieldCheck
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
  const [loading, setLoading] = useState(true);
  const [createReqOpen, setCreateReqOpen] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [scopeDesc, setScopeDesc] = useState('');
  const [addingService, setAddingService] = useState(false);
  const [activeTab, setActiveTab] = useState('operations'); // 'operations' | 'services' | 'finance'
  const [error, setError] = useState('');

  const handleCompleteOperation = async (opId) => {
    try {
      await api.patch(`/farm-projects/operations/${opId}/`, { status: 'completed' });
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to mark operation completed.');
    }
  };

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const [projRes, catRes] = await Promise.all([
        api.get(`/farm-projects/projects/${id}/`),
        api.get('/services/categories/')
      ]);
      setProject(projRes.data);
      setCategories(catRes.data);
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
                {project.farm_name || 'Farm Plot'} • {project.target_area_acres} Acres
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
              <span className="text-base text-[#174D32]">{project.completion_percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-[#84B547] to-[#174D32] h-full rounded-full transition-all duration-500"
                style={{ width: `${project.completion_percentage}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500">
              {project.confirmed_count} of {project.services_count} essential agricultural services confirmed.
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
                  ? `इस प्रोजेक्ट में ${unconfirmedServices.length} सेवा अभी भी पुष्टि की प्रतीक्षा में है (जैसे ट्रैक्टर मैकेनिक)। जब तक सभी आवश्यक सेवाओं की बुकिंग पक्की नहीं हो जाती, प्रोजेक्ट को "तैयार" मार्क नहीं किया जा सकता।`
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
              {project.confirmed_count} of {project.services_count} Confirmed
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

      {/* 3-Way Project Workspace Tabs: Operations, Services, Financials */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('operations')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'operations'
                  ? 'bg-[#174D32] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'hi' ? 'फसल कार्य सूची' : 'Crop Operations'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'operations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {project.project_operations?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-[#174D32] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Tractor className="w-4 h-4" />
              <span>{lang === 'hi' ? 'समन्वित सेवाएं' : 'Service Bookings'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'services' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {project.project_services?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'finance'
                  ? 'bg-[#174D32] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <IndianRupee className="w-4 h-4" />
              <span>{lang === 'hi' ? 'फार्म वित्तीय योजना' : 'Financial Planner'}</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-black">
                FIN-01..12
              </span>
            </button>
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

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isReady && !isDone && (
                          <button
                            onClick={() => handleCompleteOperation(op.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{lang === 'hi' ? 'पूर्ण मार्क करें' : 'Mark Completed'}</span>
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
                  {Number(project.financial_summary.overpayment_balance) > 0 && (
                    <div className="flex justify-between py-1 text-amber-800 font-bold bg-amber-50 px-2 rounded-lg">
                      <span>Overpayment Balance (FIN-07):</span>
                      <span>₹{Number(project.financial_summary.overpayment_balance).toLocaleString()}</span>
                    </div>
                  )}
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
                <p className="text-xs text-emerald-100 mt-0.5">
                  {project.name}
                </p>
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
    </div>
  );
}
