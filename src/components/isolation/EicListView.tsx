import React, { useEffect, useState } from 'react';
import {
  Zap,
  Plus,
  Search,
  RefreshCw,
  Printer,
  Eye,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { ElectricalIsolationCertificate, EicStatus } from '../../types/index.ts';
import { EicDetailsModal } from './EicDetailsModal.tsx';
import { EicPrintView } from './EicPrintView.tsx';

interface EicListViewProps {
  onOpenCreate: () => void;
}

export const EicListView: React.FC<EicListViewProps> = ({ onOpenCreate }) => {
  const { currentUser, departments, locations, globalSearch } = useAuth();
  const toast = useToast();

  const [certificates, setCertificates] = useState<ElectricalIsolationCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    isolationConfirmed: number;
    workInProgress: number;
    workCompleted: number;
    deIsolated: number;
    cancelled: number;
    active: number;
  }>({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    isolationConfirmed: 0,
    workInProgress: 0,
    workCompleted: 0,
    deIsolated: 0,
    cancelled: 0,
    active: 0,
  });

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [selectedCertificate, setSelectedCertificate] = useState<ElectricalIsolationCertificate | null>(null);
  const [printCertificate, setPrintCertificate] = useState<ElectricalIsolationCertificate | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedLocation !== 'all') params.locationId = selectedLocation;
      if (selectedDept !== 'all') params.departmentId = selectedDept;
      if (searchTerm.trim() || globalSearch) {
        params.search = searchTerm.trim() || globalSearch || '';
      }

      const [list, stats] = await Promise.all([
        api.getIsolationCertificates(params),
        api.getIsolationCertificateSummary(),
      ]);

      setCertificates(list);
      setSummary(stats);
    } catch (err: any) {
      console.error('Failed to load isolation certificates:', err);
      toast.error('Failed to load certificates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedLocation, selectedDept, searchTerm, globalSearch]);

  const handleOpenDetails = async (c: ElectricalIsolationCertificate) => {
    try {
      const full = await api.getIsolationCertificate(c.id);
      setSelectedCertificate(full);
    } catch (err: any) {
      toast.error('Failed to load certificate details: ' + err.message);
    }
  };

  const statusBadge = (status: EicStatus) => {
    const map: Record<EicStatus, string> = {
      Draft: 'bg-slate-800 text-slate-300 border-slate-700',
      'Submitted for Approval': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      Approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Approved / Authorized': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Isolation Confirmed': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Work in Progress': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'Work Completed': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'De-isolation Confirmed': 'bg-slate-800/80 text-slate-400 border-slate-700',
      Cancelled: 'bg-rose-900/20 text-rose-400 border-rose-800/30',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
          map[status] || map.Draft
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub Header for EIC */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Electrical & Process Isolation Certificate Register</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Plant-wide energy isolation and Lockout/Tagout (LOTO) governance covering Section 1.0 to 6.1 de-energization and restoration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
            title="Refresh Register"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenCreate}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-amber-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>New Isolation Certificate</span>
          </button>
        </div>
      </div>

      {/* KPI Dashboard Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Certificates
          </span>
          <div className="text-xl font-mono font-extrabold text-white mt-1">{summary.total}</div>
          <span className="text-[10px] text-slate-500">All registered EICs</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
            Awaiting Approval
          </span>
          <div className="text-xl font-mono font-extrabold text-amber-400 mt-1">{summary.submitted}</div>
          <span className="text-[10px] text-slate-500">Sec 2.0 Requisition</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">
            Isolated & Locked
          </span>
          <div className="text-xl font-mono font-extrabold text-purple-400 mt-1">{summary.isolationConfirmed}</div>
          <span className="text-[10px] text-slate-500">Padlocked & tagged</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
            Work in Progress
          </span>
          <div className="text-xl font-mono font-extrabold text-emerald-400 mt-1">
            {summary.workInProgress}
          </div>
          <span className="text-[10px] text-slate-500">Active maintenance</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-orange-400 block tracking-wider">
            Work Completed
          </span>
          <div className="text-xl font-mono font-extrabold text-orange-400 mt-1">
            {summary.workCompleted}
          </div>
          <span className="text-[10px] text-slate-500">Awaiting De-Isolation</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-sky-400 block tracking-wider">
            De-Isolated & Closed
          </span>
          <div className="text-xl font-mono font-extrabold text-sky-400 mt-1">{summary.deIsolated}</div>
          <span className="text-[10px] text-slate-500">CCR re-energized</span>
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
              placeholder="Search by Certificate No (e.g. EIC-2026-000001), equipment, location, PTW ref, or requestor..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
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
            { id: 'all', label: 'All Certificates' },
            { id: 'Draft', label: 'Draft' },
            { id: 'Submitted for Approval', label: 'Submitted' },
            { id: 'Approved / Authorized', label: 'Approved' },
            { id: 'Isolation Confirmed', label: 'Isolated' },
            { id: 'Work in Progress', label: 'In Progress' },
            { id: 'Work Completed', label: 'Work Completed' },
            { id: 'De-isolation Confirmed', label: 'De-Isolated (Closed)' },
            { id: 'Cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedStatus === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Certificate Register Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                <th className="py-3 px-4">Certificate No</th>
                <th className="py-3 px-4">Work Location & Equipment</th>
                <th className="py-3 px-4">Associated PTW</th>
                <th className="py-3 px-4">Requisition (Sec 2.0)</th>
                <th className="py-3 px-4">Isolation Points</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading Isolation Certificates...</span>
                    </div>
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-medium text-slate-400">No isolation certificates found matching current criteria.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click "New Isolation Certificate" to create an Electrical & Mechanical isolation record.
                    </p>
                  </td>
                </tr>
              ) : (
                certificates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{c.certificateNumber}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {c.requestDate} {c.requestTime ? `• ${c.requestTime}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200 truncate max-w-xs" title={c.equipmentToIsolate}>
                        {c.equipmentToIsolate}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {c.workLocation} {c.location?.name ? `(${c.location.name})` : ''}
                        {c.equipmentTag ? ` • Tag: ${c.equipmentTag}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {c.ptwNumber ? (
                        <div className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                          <FileText className="w-3 h-3" />
                          <span>{c.ptwNumber}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Standalone</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{c.requestorName}</div>
                      <div className="text-[10px] text-slate-400">
                        {c.requestorDesignation || 'Requestor'}
                      </div>
                      {c.approvedByName && (
                        <div className="text-[9px] text-blue-400 mt-0.5">
                          Appr: {c.approvedByName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <span className="text-slate-300">
                          ⚡ <span className="font-semibold text-amber-400">{c.electricalPoints?.length || 0}</span> Breakers
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          ⚙️ <span className="font-semibold text-sky-400">{c.otherPoints?.length || 0}</span> Mech / Valves
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      <div>{c.requestDate}</div>
                      <div className="text-[10px] text-slate-500">{c.requestTime || '--:--'}</div>
                    </td>
                    <td className="py-3 px-4">{statusBadge(c.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPrintCertificate(c)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                          title="Print Electrical Isolation Certificate"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDetails(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
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

      {/* DETAILS / WORKFLOW MODAL */}
      {selectedCertificate && (
        <EicDetailsModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
          onUpdated={async () => {
            const updated = await api.getIsolationCertificate(selectedCertificate.id);
            setSelectedCertificate(updated);
            loadData();
          }}
        />
      )}

      {/* PRINT MODAL */}
      {printCertificate && (
        <EicPrintView
          certificate={printCertificate}
          onClose={() => setPrintCertificate(null)}
        />
      )}
    </div>
  );
};
