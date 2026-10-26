import React, { useEffect, useState } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  Clock,
  Eye,
  AlertTriangle,
  Lock,
  Gauge,
  Flame,
  CheckCircle2,
  AlertOctagon,
  X,
  Layers,
  ArrowUpRight,
  Shield,
  Activity,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { PtwPermit, PermitType, PermitStatus } from '../../types/index.ts';
import { PERMIT_TYPE_CONFIG } from '../../config/ptwChecklists.ts';
import { PtwCreateModal } from './PtwCreateModal.tsx';
import { PtwDetailsModal } from './PtwDetailsModal.tsx';
import { PtwPrintView } from './PtwPrintView.tsx';
import { DocumentSelectionModal } from '../isolation/DocumentSelectionModal.tsx';
import { EicCreateModal } from '../isolation/EicCreateModal.tsx';
import { EicListView } from '../isolation/EicListView.tsx';

export const PtwView: React.FC = () => {
  const { currentUser, departments, locations, globalSearch } = useAuth();
  const toast = useToast();

  // Document Type Switcher: Option A (PTW) or Option B (EIC)
  const [activeDocType, setActiveDocType] = useState<'ptw' | 'eic'>('ptw');

  const [permits, setPermits] = useState<PtwPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    total: number;
    draft: number;
    underReview: number;
    approved: number;
    suspended: number;
    extended: number;
    workCompleted: number;
    closed: number;
    active: number;
    expiringToday: number;
    highRiskCount: number;
  }>({
    total: 0,
    draft: 0,
    underReview: 0,
    approved: 0,
    suspended: 0,
    extended: 0,
    workCompleted: 0,
    closed: 0,
    active: 0,
    expiringToday: 0,
    highRiskCount: 0,
  });

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [showDocSelectModal, setShowDocSelectModal] = useState(false);
  const [showPtwCreateModal, setShowPtwCreateModal] = useState(false);
  const [showEicCreateModal, setShowEicCreateModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<PtwPermit | null>(null);
  const [printPermit, setPrintPermit] = useState<PtwPermit | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedType !== 'all') params.permitType = selectedType;
      if (selectedDept !== 'all') params.departmentId = selectedDept;
      if (selectedLocation !== 'all') params.locationId = selectedLocation;
      if (searchTerm.trim() || globalSearch) {
        params.search = searchTerm.trim() || globalSearch || '';
      }

      const [list, stats] = await Promise.all([
        api.getPtwPermits(params),
        api.getPtwAnalyticsSummary(),
      ]);

      setPermits(list);
      setSummary(stats);
    } catch (err: any) {
      console.error('Failed to load PTW data:', err);
      toast.error('Failed to load permits: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeDocType === 'ptw') {
      loadData();
    }
  }, [selectedStatus, selectedType, selectedDept, selectedLocation, searchTerm, globalSearch, activeDocType]);

  const handleOpenDetails = async (p: PtwPermit) => {
    try {
      const full = await api.getPtwPermit(p.id);
      setSelectedPermit(full);
    } catch (err: any) {
      toast.error('Failed to load permit details: ' + err.message);
    }
  };

  const statusBadge = (status: PermitStatus) => {
    const map: Record<PermitStatus, string> = {
      Draft: 'bg-slate-800 text-slate-300 border-slate-700',
      'Under Review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      Suspended: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      Extended: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      'Work Completed': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      Closed: 'bg-slate-800/80 text-slate-400 border-slate-700',
      Cancelled: 'bg-rose-900/20 text-rose-400 border-rose-800/30',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${map[status] || map.Draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Document Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>PCL Permit to Work & Isolation System</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Plant-wide governance for hazardous work permits and electrical / mechanical lockout-tagout certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeDocType === 'ptw' && (
            <button
              onClick={() => loadData()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
              title="Refresh Register"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Primary Action Button: Opens Initial Document Selection Screen */}
          <button
            onClick={() => setShowDocSelectModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Document Selection Tabs (Option A: PTW vs Option B: Electrical Isolation Certificate) */}
      <div className="bg-slate-900/80 border border-slate-800 p-1.5 rounded-xl flex items-center gap-2 max-w-2xl">
        <button
          onClick={() => setActiveDocType('ptw')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
            activeDocType === 'ptw'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Option A: Permit to Work (PTW)</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-950/40 text-emerald-300 border border-emerald-500/20">
            {summary.total}
          </span>
        </button>

        <button
          onClick={() => setActiveDocType('eic')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${
            activeDocType === 'eic'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Option B: Electrical Isolation Certificate</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-950/40 text-amber-300 border border-amber-500/20">
            LOTO
          </span>
        </button>
      </div>

      {/* OPTION B: ELECTRICAL ISOLATION CERTIFICATE VIEW */}
      {activeDocType === 'eic' ? (
        <EicListView onOpenCreate={() => setShowEicCreateModal(true)} />
      ) : (
        /* OPTION A: PERMIT TO WORK VIEW */
        <div className="space-y-6">
          {/* Subheader */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Permit-to-Work Register & Safety Metrics</span>
            </h3>
            <button
              onClick={() => setShowPtwCreateModal(true)}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply for New PTW</span>
            </button>
          </div>

          {/* KPI Dashboard Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Permits</span>
              <div className="text-xl font-mono font-extrabold text-white mt-1">{summary.total}</div>
              <span className="text-[10px] text-slate-500">All registered jobs</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Active / Approved</span>
              <div className="text-xl font-mono font-extrabold text-emerald-400 mt-1">{summary.active}</div>
              <span className="text-[10px] text-slate-500">{summary.extended} extended multi-day</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Under Review</span>
              <div className="text-xl font-mono font-extrabold text-amber-400 mt-1">{summary.underReview}</div>
              <span className="text-[10px] text-slate-500">Awaiting Area sign-off</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">High-Risk Activities</span>
              <div className="text-xl font-mono font-extrabold text-purple-400 mt-1">{summary.highRiskCount}</div>
              <span className="text-[10px] text-slate-500">HW, CSE, WAH</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">Suspended</span>
              <div className="text-xl font-mono font-extrabold text-rose-400 mt-1">{summary.suspended}</div>
              <span className="text-[10px] text-slate-500">Work halted</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-sky-400 block tracking-wider">Closed / Returned</span>
              <div className="text-xl font-mono font-extrabold text-sky-400 mt-1">{summary.closed}</div>
              <span className="text-[10px] text-slate-500">De-isolated & CCR normal</span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by PTW Ref No, equipment tag, location, contractor, or lead man..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Permit Types</option>
                  <option value="Cold Work">Cold Work</option>
                  <option value="Hot Work">Hot Work</option>
                  <option value="Confined Space Entry">Confined Space Entry</option>
                  <option value="Lifting Activity">Lifting Activity</option>
                  <option value="Work at Height">Work at Height</option>
                </select>

                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Plant Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-500 uppercase font-bold text-[10px] mr-1">Status:</span>
              {[
                { id: 'all', label: 'All Permits' },
                { id: 'Draft', label: 'Draft' },
                { id: 'Under Review', label: 'Under Review' },
                { id: 'Approved', label: 'Approved (Active)' },
                { id: 'Extended', label: 'Extended' },
                { id: 'Work Completed', label: 'Work Completed' },
                { id: 'Suspended', label: 'Suspended' },
                { id: 'Closed', label: 'Closed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    selectedStatus === tab.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* PTW Register Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                    <th className="py-3 px-4">Permit Ref No</th>
                    <th className="py-3 px-4">Type(s)</th>
                    <th className="py-3 px-4">Specific Location & Equipment</th>
                    <th className="py-3 px-4">Department / Contractor</th>
                    <th className="py-3 px-4">Lead Man</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading Permit-to-Work Register...</span>
                        </div>
                      </td>
                    </tr>
                  ) : permits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="font-medium text-slate-400">No permits found matching the current criteria.</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Click "Apply for New PTW" to create a new digitised permit.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    permits.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-emerald-400">{p.permitNumber}</div>
                          <span className="text-[10px] text-slate-500">{p.issueDate}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {p.permitTypes.map((t) => {
                              const cfg = PERMIT_TYPE_CONFIG[t];
                              return (
                                <span
                                  key={t}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cfg?.bgColor || 'bg-slate-800'} ${cfg?.borderColor || 'border-slate-700'} ${cfg?.color || 'text-slate-300'}`}
                                >
                                  {cfg?.code || t}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200 truncate max-w-xs" title={p.specificLocation}>
                            {p.specificLocation}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {p.location?.name} {p.equipmentNumber ? `• Tag: ${p.equipmentNumber}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200">{p.department?.name}</div>
                          <div className="text-[10px] text-slate-400">{p.contractorName || 'In-House'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200 font-medium">{p.leadManName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.contactNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-300 font-mono text-[11px]">{p.validTo}</div>
                          {p.extensions && p.extensions.length > 0 && (
                            <span className="text-[9px] text-indigo-400 font-semibold">
                              Extended Day {Math.max(...p.extensions.map((e) => e.dayNumber))}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">{statusBadge(p.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPrintPermit(p)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                              title="Print Permit Form"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDetails(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Manage</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INITIAL DOCUMENT SELECTION SCREEN MODAL */}
      <DocumentSelectionModal
        isOpen={showDocSelectModal}
        onClose={() => setShowDocSelectModal(false)}
        onSelectPtw={() => {
          setShowDocSelectModal(false);
          setActiveDocType('ptw');
          setShowPtwCreateModal(true);
        }}
        onSelectEic={() => {
          setShowDocSelectModal(false);
          setActiveDocType('eic');
          setShowEicCreateModal(true);
        }}
      />

      {/* OPTION A: PTW CREATE MODAL */}
      {showPtwCreateModal && (
        <PtwCreateModal
          onClose={() => setShowPtwCreateModal(false)}
          onCreated={() => {
            setShowPtwCreateModal(false);
            loadData();
          }}
        />
      )}

      {/* OPTION B: ELECTRICAL ISOLATION CERTIFICATE CREATE MODAL */}
      {showEicCreateModal && (
        <EicCreateModal
          onClose={() => setShowEicCreateModal(false)}
          onCreated={() => {
            setShowEicCreateModal(false);
            setActiveDocType('eic');
          }}
        />
      )}

      {/* PTW DETAILS / WORKFLOW MODAL */}
      {selectedPermit && (
        <PtwDetailsModal
          permit={selectedPermit}
          onClose={() => setSelectedPermit(null)}
          onUpdated={async () => {
            const updated = await api.getPtwPermit(selectedPermit.id);
            setSelectedPermit(updated);
            loadData();
          }}
        />
      )}

      {/* PTW DIRECT PRINT MODAL */}
      {printPermit && (
        <PtwPrintView
          permit={printPermit}
          onClose={() => setPrintPermit(null)}
        />
      )}
    </div>
  );
};

