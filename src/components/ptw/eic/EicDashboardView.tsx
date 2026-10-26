import React, { useEffect, useState } from 'react';
import {
  Zap,
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
  CheckCircle2,
  AlertOctagon,
  X,
  Layers,
  ArrowLeft,
  FileCheck,
  Edit,
  Trash2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useToast } from '../../../context/ToastContext.tsx';
import { api } from '../../../services/api.ts';
import { ElectricalIsolationCertificate, EicStatus, EicSummary } from '../../../types/index.ts';
import { EicFormModal } from './EicFormModal.tsx';
import { EicDetailsModal } from './EicDetailsModal.tsx';
import { EicPrintView } from './EicPrintView.tsx';

interface EicDashboardViewProps {
  onBackToSelection: () => void;
  onSwitchToPtw: () => void;
}

export const EicDashboardView: React.FC<EicDashboardViewProps> = ({
  onBackToSelection,
  onSwitchToPtw,
}) => {
  const { currentUser, locations, globalSearch } = useAuth();
  const toast = useToast();

  const [certificates, setCertificates] = useState<ElectricalIsolationCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EicSummary>({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    isolationConfirmed: 0,
    workInProgress: 0,
    workCompleted: 0,
    closed: 0,
    cancelled: 0,
  });

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCert, setEditingCert] = useState<ElectricalIsolationCertificate | null>(null);
  const [selectedCert, setSelectedCert] = useState<ElectricalIsolationCertificate | null>(null);
  const [printCert, setPrintCert] = useState<ElectricalIsolationCertificate | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedLocation !== 'all') params.locationId = selectedLocation;
      if (searchTerm.trim() || globalSearch) {
        params.search = searchTerm.trim() || globalSearch || '';
      }

      const [list, stats] = await Promise.all([
        api.getElectricalCertificates(params),
        api.getElectricalCertificateSummary(),
      ]);

      setCertificates(list);
      setSummary(stats);
    } catch (err: any) {
      console.error('Failed to load EIC records:', err);
      toast.error('Failed to load certificates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedLocation, searchTerm, globalSearch]);

  const handleDelete = async (cert: ElectricalIsolationCertificate) => {
    if (!window.confirm(`Are you sure you want to delete certificate ${cert.certificateNumber}?`)) {
      return;
    }
    try {
      await api.deleteElectricalCertificate(cert.id);
      toast.success(`Certificate ${cert.certificateNumber} deleted.`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to delete certificate: ' + err.message);
    }
  };

  const statusBadge = (status: EicStatus) => {
    const map: Record<EicStatus, string> = {
      Draft: 'bg-slate-800 text-slate-300 border-slate-700',
      'Submitted for Approval': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'Isolation Confirmed': 'bg-sky-500/10 text-sky-400 border-sky-500/20 font-bold',
      'Work in Progress': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      'Work Completed': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'De-isolation Confirmed': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      Closed: 'bg-slate-800/80 text-slate-400 border-slate-700',
      Cancelled: 'bg-rose-900/20 text-rose-400 border-rose-800/30',
      Rejected: 'bg-rose-900/20 text-rose-400 border-rose-800/30',
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
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header with Navigation Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400">
            <button
              onClick={onBackToSelection}
              className="hover:text-sky-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Document Selector</span>
            </button>
            <span>/</span>
            <span className="text-sky-400 font-semibold">Electrical Isolation Certificate</span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-sky-400" />
            <span>Electrical Isolation Certificate (EIC) Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Formal Power Cement Limited zero-energy isolation protocols: Electrical switchgear breaker lock-outs, physical padlocks, and mechanical isolation verifications.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onSwitchToPtw}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Switch to Permit-to-Work module"
          >
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Open PTW Module</span>
          </button>

          <button
            onClick={() => loadData()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            title="Refresh Register"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setEditingCert(null);
              setShowFormModal(true);
            }}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-sky-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Prepare New Certificate</span>
          </button>
        </div>
      </div>

      {/* KPI Dashboard Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total</span>
          <div className="text-xl font-mono font-extrabold text-white mt-1">{summary.total}</div>
          <span className="text-[10px] text-slate-500">All registered EICs</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Submitted</span>
          <div className="text-xl font-mono font-extrabold text-amber-400 mt-1">{summary.submitted}</div>
          <span className="text-[10px] text-slate-500">Awaiting E&I approval</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Authorized</span>
          <div className="text-xl font-mono font-extrabold text-emerald-400 mt-1">{summary.approved}</div>
          <span className="text-[10px] text-slate-500">Approved for isolation</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-sky-400 block tracking-wider">Isolated</span>
          <div className="text-xl font-mono font-extrabold text-sky-400 mt-1">{summary.isolationConfirmed}</div>
          <span className="text-[10px] text-slate-500">Zero energy verified</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">In Progress</span>
          <div className="text-xl font-mono font-extrabold text-indigo-400 mt-1">{summary.workInProgress}</div>
          <span className="text-[10px] text-slate-500">Work active on site</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">Completed</span>
          <div className="text-xl font-mono font-extrabold text-purple-400 mt-1">{summary.workCompleted}</div>
          <span className="text-[10px] text-slate-500">Ready for de-isolation</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Closed</span>
          <div className="text-xl font-mono font-extrabold text-slate-300 mt-1">{summary.closed}</div>
          <span className="text-[10px] text-slate-500">Re-energized & closed</span>
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
              placeholder="Search by Certificate No, equipment tag, location, requestor, or linked PTW..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Certificate Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted for Approval">Submitted for Approval</option>
              <option value="Approved">Approved</option>
              <option value="Isolation Confirmed">Isolation Confirmed</option>
              <option value="Work in Progress">Work in Progress</option>
              <option value="Work Completed">Work Completed</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Plant Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Register Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-800">
            <thead>
              <tr className="bg-slate-950/70 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                <th className="p-3.5">Certificate Ref</th>
                <th className="p-3.5">Equipment to be Isolated</th>
                <th className="p-3.5">Work Location</th>
                <th className="p-3.5">Linked PTW</th>
                <th className="p-3.5">Requestor</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date / Time</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading electrical isolation certificates...</span>
                    </div>
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                        <Zap className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-300">No isolation certificates found</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Create an electrical isolation certificate to record switchgear breaker lockouts and zero-energy verifications.
                      </p>
                      <button
                        onClick={() => {
                          setEditingCert(null);
                          setShowFormModal(true);
                        }}
                        className="mt-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Prepare New Certificate</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-sky-400">{cert.certificateNumber}</span>
                    </td>
                    <td className="p-3.5 font-medium text-white max-w-xs truncate" title={cert.equipmentToIsolate}>
                      {cert.equipmentToIsolate}
                    </td>
                    <td className="p-3.5 text-slate-300 max-w-xs truncate" title={cert.workLocation}>
                      {cert.workLocation}
                    </td>
                    <td className="p-3.5">
                      {cert.linkedPtwNumber ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {cert.linkedPtwNumber}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-300">{cert.requestorName}</td>
                    <td className="p-3.5">{statusBadge(cert.status)}</td>
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                      {cert.date} {cert.time}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="View Details & Workflow"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCert(cert);
                            setShowFormModal(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit Certificate"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          onClick={() => setPrintCert(cert)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Print / Save PDF (4 Copies)"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        {(cert.status === 'Draft' || cert.status === 'Cancelled') && (
                          <button
                            onClick={() => handleDelete(cert)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showFormModal && (
        <EicFormModal
          certificate={editingCert}
          onClose={() => {
            setShowFormModal(false);
            setEditingCert(null);
          }}
          onSuccess={(saved) => {
            setShowFormModal(false);
            setEditingCert(null);
            loadData();
          }}
        />
      )}

      {selectedCert && (
        <EicDetailsModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          onEdit={() => {
            setEditingCert(selectedCert);
            setSelectedCert(null);
            setShowFormModal(true);
          }}
          onPrint={() => {
            setPrintCert(selectedCert);
          }}
          onStatusChange={(updated) => {
            setSelectedCert(updated);
            loadData();
          }}
        />
      )}

      {printCert && (
        <EicPrintView
          certificate={printCert}
          onClose={() => setPrintCert(null)}
        />
      )}
    </div>
  );
};
