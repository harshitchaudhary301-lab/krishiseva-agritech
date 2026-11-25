import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Star, MapPin, Wrench, CheckCircle2, Loader2,
  AlertCircle, Plus, Trash2, Calendar, Layers, Clock, Globe,
  IndianRupee, Tag, Check, X
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import NationwideLocationSelector from '../../components/NationwideLocationSelector';

export default function ProviderProfileView() {
  const { user, refreshProfile } = useAuth();
  const { lang } = useLanguage();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'coverage' | 'services' | 'resources' | 'availability'
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ error: '', success: '' });

  // 1. Basic Profile Form State
  const [profileData, setProfileData] = useState({
    business_name: user?.provider_profile?.business_name || '',
    phone: user?.phone || '',
    village: user?.village || 'Daurala',
    district: user?.district || 'Meerut',
    service_radius_km: user?.provider_profile?.service_radius_km || 25,
    qualifications: user?.provider_profile?.qualifications || '',
    machinery_details: user?.provider_profile?.machinery_details || '',
    bio: user?.provider_profile?.bio || ''
  });

  // 2. Coverage Areas State
  const [coverageAreas, setCoverageAreas] = useState([]);
  const [showAddCoverage, setShowAddCoverage] = useState(false);
  const [newCoverageLevel, setNewCoverageLevel] = useState('village');
  const [newCoverageLoc, setNewCoverageLoc] = useState({
    state: user?.state || 'Uttar Pradesh',
    district: user?.district || 'Meerut',
    subdistrict: '',
    village: '',
    village_id: null,
    subdistrict_id: null,
    district_id: null,
    state_id: null
  });
  const [includesSubordinates, setIncludesSubordinates] = useState(true);

  // 3. Offered Services & Pricing State
  const [offeredServices, setOfferedServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    category_id: '',
    title: '',
    description: '',
    pricing_method: 'per_day',
    price_amount: '',
    rate_unit: 'per day',
    equipment_models: ''
  });

  // 4. Resources & Capacity State
  const [resources, setResources] = useState([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [newResource, setNewResource] = useState({
    name: '',
    resource_type: 'exclusive',
    capacity: '1.0',
    capacity_unit: 'machine',
    identifier: '',
    category: ''
  });

  // 5. Availability Windows State
  const [availabilityWindows, setAvailabilityWindows] = useState([]);
  const [showAddWindow, setShowAddWindow] = useState(false);
  const [newWindow, setNewWindow] = useState({
    start_date: '',
    end_date: '',
    is_available: true,
    notes: ''
  });

  // Fetch all provider settings
  const fetchProviderData = async () => {
    setLoading(true);
    try {
      const [covRes, srvRes, resRes, winRes, catRes] = await Promise.all([
        api.get('/services/provider/coverage/').catch(() => ({ data: [] })),
        api.get('/services/provider/services/').catch(() => ({ data: [] })),
        api.get('/services/provider/resources/').catch(() => ({ data: [] })),
        api.get('/services/provider/availability/').catch(() => ({ data: [] })),
        api.get('/services/categories/').catch(() => ({ data: [] }))
      ]);
      setCoverageAreas(covRes.data || []);
      setOfferedServices(srvRes.data || []);
      setResources(resRes.data || []);
      setAvailabilityWindows(winRes.data || []);
      setCategories(catRes.data || []);
      if (catRes.data?.length > 0 && !newService.category_id) {
        setNewService(prev => ({ ...prev, category_id: catRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, []);

  // Handlers
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMsg({ error: '', success: '' });
    try {
      await api.put('/accounts/me/', profileData);
      await refreshProfile();
      setMsg({ error: '', success: lang === 'hi' ? 'प्रोफाइल सहेजी गई।' : 'Profile saved successfully.' });
    } catch (err) {
      setMsg({ error: 'Failed to update profile.', success: '' });
    }
  };

  const handleAddCoverage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        coverage_level: newCoverageLevel,
        state_id: newCoverageLoc.state_id,
        district_id: newCoverageLoc.district_id,
        subdistrict_id: newCoverageLoc.subdistrict_id,
        village_id: newCoverageLoc.village_id,
        includes_subordinates: includesSubordinates
      };
      await api.post('/services/provider/coverage/', payload);
      setShowAddCoverage(false);
      fetchProviderData();
      setMsg({ error: '', success: 'Coverage area registered.' });
    } catch (err) {
      setMsg({ error: 'Failed to add coverage area.', success: '' });
    }
  };

  const handleDeleteCoverage = async (id) => {
    try {
      await api.delete(`/services/provider/coverage/${id}/`);
      fetchProviderData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services/provider/services/', newService);
      setShowAddService(false);
      fetchProviderData();
      setMsg({ error: '', success: 'Service and pricing method saved.' });
    } catch (err) {
      setMsg({ error: 'Failed to save service.', success: '' });
    }
  };

  const handleAddResourceSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services/provider/resources/', {
        ...newResource,
        capacity: parseFloat(newResource.capacity) || 1.0,
        category: newResource.category ? parseInt(newResource.category) : null
      });
      setShowAddResource(false);
      fetchProviderData();
      setMsg({ error: '', success: 'Resource capacity registered.' });
    } catch (err) {
      setMsg({ error: 'Failed to add resource.', success: '' });
    }
  };

  const handleDeleteResource = async (id) => {
    try {
      await api.delete(`/services/provider/resources/${id}/`);
      fetchProviderData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWindowSubmit = async (e) => {
    e.preventDefault();
    if (!newWindow.start_date || !newWindow.end_date) return;
    try {
      await api.post('/services/provider/availability/', newWindow);
      setShowAddWindow(false);
      fetchProviderData();
      setMsg({ error: '', success: 'Availability window saved.' });
    } catch (err) {
      setMsg({ error: 'Failed to save availability window.', success: '' });
    }
  };

  const handleDeleteWindow = async (id) => {
    try {
      await api.delete(`/services/provider/availability/${id}/`);
      fetchProviderData();
    } catch (err) {
      console.error(err);
    }
  };

  const isVerified = user?.provider_profile?.verification_status === 'verified';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {lang === 'hi' ? 'प्रदाता सेवा प्रबंधन व प्रोफाइल' : 'Provider Service & Profile Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'hi'
              ? 'LGD सेवा क्षेत्र, मूल्य निर्धारण विधि, संसाधन क्षमता और उपलब्धता विंडो प्रबंधित करें।'
              : 'Configure official LGD coverage, pricing methods, machinery/crew capacity, and availability.'}
          </p>
        </div>

        {/* Verification Pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-bold ${
          isVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <ShieldCheck className={`w-4 h-4 ${isVerified ? 'text-[#84B547]' : 'text-amber-600'}`} />
          <span>{isVerified ? 'Platform Verified' : 'Verification Under Review'}</span>
        </div>
      </div>

      {/* Messages */}
      {msg.error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {msg.error}
        </div>
      )}
      {msg.success && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
          {msg.success}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'profile' ? 'bg-[#174D32] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {lang === 'hi' ? 'वर्कशॉप प्रोफाइल' : 'Workshop Profile'}
        </button>

        <button
          onClick={() => setActiveTab('coverage')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'coverage' ? 'bg-[#174D32] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'सेवा कवरेज क्षेत्र (LGD)' : 'Coverage Areas (LGD)'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800">
            {coverageAreas.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'services' ? 'bg-[#174D32] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'सेवाएं व मूल्य निर्धारण' : 'Services & Pricing'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800">
            {offeredServices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'resources' ? 'bg-[#174D32] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'संसाधन व क्षमता' : 'Resources & Capacity'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800">
            {resources.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'availability' ? 'bg-[#174D32] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'उपलब्धता कैलेंडर' : 'Availability Windows'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800">
            {availabilityWindows.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Profile & Workshop Details */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'व्यवसाय / वर्कशॉप नाम' : 'Business / Workshop Name'}
                </label>
                <input
                  type="text"
                  value={profileData.business_name}
                  onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'संपर्क मोबाइल' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'कार्यालय / आधार गाँव' : 'Base Office Village'}
                </label>
                <input
                  type="text"
                  value={profileData.village}
                  onChange={(e) => setProfileData({ ...profileData, village: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'जिला' : 'Base District'}
                </label>
                <input
                  type="text"
                  value={profileData.district}
                  onChange={(e) => setProfileData({ ...profileData, district: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {lang === 'hi' ? 'सेवा दायरा (किमी)' : 'Service Radius (km)'}
                </label>
                <input
                  type="number"
                  value={profileData.service_radius_km}
                  onChange={(e) => setProfileData({ ...profileData, service_radius_km: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {lang === 'hi' ? 'कार्य विवरण / बायो' : 'Workshop Bio'}
              </label>
              <textarea
                rows={3}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {lang === 'hi' ? 'प्रोफाइल सहेजें' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Multiple Service Coverage Areas using LGD Selectors */}
      {activeTab === 'coverage' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {lang === 'hi' ? 'पंजीकृत सेवा कवरेज क्षेत्र' : 'Registered Service Coverage Areas'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  STRICT RULE: Providers explicitly declare coverage at Village, Tehsil, or District level.
                  Subordinate villages are included only when explicitly enabled.
                </p>
              </div>
              <button
                onClick={() => setShowAddCoverage(!showAddCoverage)}
                className="px-3.5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddCoverage ? 'Cancel' : (lang === 'hi' ? 'नया क्षेत्र जोड़ें' : 'Add Coverage Area')}</span>
              </button>
            </div>

            {/* Add Coverage Form */}
            {showAddCoverage && (
              <form onSubmit={handleAddCoverage} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Coverage Hierarchy Level
                    </label>
                    <select
                      value={newCoverageLevel}
                      onChange={(e) => setNewCoverageLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                    >
                      <option value="village">Village Level (Specific Village)</option>
                      <option value="subdistrict">Sub-District / Tehsil Level</option>
                      <option value="district">District Level</option>
                      <option value="state">State Level</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="subordinatesToggle"
                      checked={includesSubordinates}
                      onChange={(e) => setIncludesSubordinates(e.target.checked)}
                      className="w-4 h-4 text-[#174D32] rounded border-slate-300"
                    />
                    <label htmlFor="subordinatesToggle" className="text-xs font-semibold text-slate-800 cursor-pointer">
                      Include all subordinate administrative locations (e.g. all villages in district)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Select Official LGD Administrative Location
                  </label>
                  <NationwideLocationSelector
                    value={newCoverageLoc}
                    onChange={(loc) => setNewCoverageLoc(loc)}
                    compact
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Confirm & Save Coverage
                  </button>
                </div>
              </form>
            )}

            {/* List Coverage Areas */}
            {coverageAreas.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No coverage areas registered yet. Click "Add Coverage Area" to declare your operational territory.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {coverageAreas.map((ca) => (
                  <div key={ca.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-50 text-[#174D32] border border-emerald-100">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {ca.village_name
                              ? `Village: ${ca.village_name} (LGD: ${ca.village_lgd || 'Official'})`
                              : ca.subdistrict_name
                                ? `Tehsil: ${ca.subdistrict_name} (LGD: ${ca.subdistrict_lgd || 'Official'})`
                                : ca.district_name
                                  ? `District: ${ca.district_name} (LGD: ${ca.district_lgd || 'Official'})`
                                  : `State: ${ca.state_name}`}
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {ca.coverage_level}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ca.includes_subordinates
                            ? '✓ Includes subordinate constituent administrative areas'
                            : 'Standalone jurisdiction boundary'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCoverage(ca.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Remove Coverage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Offered Services & Pricing Methods */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {lang === 'hi' ? 'प्रस्तावित सेवाएं व मूल्य निर्धारण' : 'Offered Services & Pricing Methods'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Support for: Fixed price, Per hour, Per day, Per acre, Per hectare, Per unit, Quotation required.
                </p>
              </div>
              <button
                onClick={() => setShowAddService(!showAddService)}
                className="px-3.5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddService ? 'Cancel' : (lang === 'hi' ? 'सेवा जोड़ें' : 'Add Service')}</span>
              </button>
            </div>

            {/* Add Service Form */}
            {showAddService && (
              <form onSubmit={handleAddServiceSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Service Category
                    </label>
                    <select
                      value={newService.category_id}
                      onChange={(e) => setNewService({ ...newService, category_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_en} ({c.name_hi})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Service Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. On-Farm Tractor Hydraulic Repair"
                      value={newService.title}
                      onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Pricing Method
                    </label>
                    <select
                      value={newService.pricing_method}
                      onChange={(e) => setNewService({ ...newService, pricing_method: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                    >
                      <option value="fixed">Fixed Price</option>
                      <option value="per_hour">Per Hour</option>
                      <option value="per_day">Per Day</option>
                      <option value="per_acre">Per Acre</option>
                      <option value="per_hectare">Per Hectare</option>
                      <option value="per_unit">Per Unit</option>
                      <option value="quotation_required">Quotation Required</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Price Amount (₹ Decimal)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 800.00"
                      value={newService.price_amount}
                      onChange={(e) => setNewService({ ...newService, price_amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Billing Unit Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. per visit, per acre, per day"
                      value={newService.rate_unit}
                      onChange={(e) => setNewService({ ...newService, rate_unit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Machinery / Equipment Models
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mahindra 575 DI, Preet Combine Harvester"
                    value={newService.equipment_models}
                    onChange={(e) => setNewService({ ...newService, equipment_models: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Save Service
                  </button>
                </div>
              </form>
            )}

            {/* List Services */}
            <div className="divide-y divide-slate-100">
              {offeredServices.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{s.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {s.category_name} • Method: <strong>{s.pricing_method}</strong> ({s.rate_unit})
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-xs text-emerald-900">
                      ₹{s.price_amount || s.base_rate}
                    </div>
                    <div className="text-[10px] text-slate-400">Indicative Price</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Resources & Capacity */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {lang === 'hi' ? 'संसाधन व कार्य क्षमता' : 'Resources & Operational Capacity'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exclusive resources reject overlapping reservations. Shared resources ensure overlapping demand does not exceed capacity.
                </p>
              </div>
              <button
                onClick={() => setShowAddResource(!showAddResource)}
                className="px-3.5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddResource ? 'Cancel' : (lang === 'hi' ? 'संसाधन जोड़ें' : 'Add Resource')}</span>
              </button>
            </div>

            {/* Add Resource Form */}
            {showAddResource && (
              <form onSubmit={handleAddResourceSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Resource Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Deere Combine Harvester #1"
                      value={newResource.name}
                      onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Resource Type
                    </label>
                    <select
                      value={newResource.resource_type}
                      onChange={(e) => setNewResource({ ...newResource, resource_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                    >
                      <option value="exclusive">Exclusive Machinery/Equipment (1 booking at a time)</option>
                      <option value="shared">Shared Capacity (e.g. Crew of 8 labourers, multiple plots)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Capacity Amount
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newResource.capacity}
                      onChange={(e) => setNewResource({ ...newResource, capacity: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Capacity Unit
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. machine, labourer, crew, acre/day"
                      value={newResource.capacity_unit}
                      onChange={(e) => setNewResource({ ...newResource, capacity_unit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Identifier / Asset Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. HARV-01, CREW-A"
                      value={newResource.identifier}
                      onChange={(e) => setNewResource({ ...newResource, identifier: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Save Resource
                  </button>
                </div>
              </form>
            )}

            {/* List Resources */}
            <div className="divide-y divide-slate-100">
              {resources.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>{r.name}</span>
                        {r.identifier && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {r.identifier}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Type: <strong className="capitalize">{r.resource_type}</strong> • Capacity: <strong>{r.capacity} {r.capacity_unit}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteResource(r.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Remove Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Availability Windows */}
      {activeTab === 'availability' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {lang === 'hi' ? 'उपलब्धता एवं ब्लैकआउट विंडो' : 'Scheduling & Availability Windows'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Half-open intervals [start, end) where reservations do not overlap adjacent days.
                </p>
              </div>
              <button
                onClick={() => setShowAddWindow(!showAddWindow)}
                className="px-3.5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddWindow ? 'Cancel' : (lang === 'hi' ? 'विंडो जोड़ें' : 'Add Window')}</span>
              </button>
            </div>

            {/* Add Window Form */}
            {showAddWindow && (
              <form onSubmit={handleAddWindowSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newWindow.start_date}
                      onChange={(e) => setNewWindow({ ...newWindow, start_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      End Date (Half-Open)
                    </label>
                    <input
                      type="date"
                      value={newWindow.end_date}
                      onChange={(e) => setNewWindow({ ...newWindow, end_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Window Type
                    </label>
                    <select
                      value={newWindow.is_available ? 'true' : 'false'}
                      onChange={(e) => setNewWindow({ ...newWindow, is_available: e.target.value === 'true' })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none"
                    >
                      <option value="true">Available Scheduling Window</option>
                      <option value="false">Blackout / Maintenance / Leave</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Notes / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rabi harvesting peak season, Machine servicing"
                    value={newWindow.notes}
                    onChange={(e) => setNewWindow({ ...newWindow, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#174D32] hover:bg-[#0e3321] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Save Window
                  </button>
                </div>
              </form>
            )}

            {/* List Windows */}
            <div className="divide-y divide-slate-100">
              {availabilityWindows.map((w) => (
                <div key={w.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      w.is_available
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {w.start_date} to {w.end_date}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-full ${
                          w.is_available ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                        }`}>
                          {w.is_available ? 'Available Window' : 'Blackout'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {w.notes || 'Operating hours'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteWindow(w.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Remove Window"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
