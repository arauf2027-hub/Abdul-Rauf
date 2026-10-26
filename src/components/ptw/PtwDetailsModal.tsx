import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Printer,
  Shield,
  AlertTriangle,
  Flame,
  Wind,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Lock,
  Gauge,
  UserCheck,
  Calendar,
  AlertOctagon,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { PtwPermit } from '../../types/index.ts';
import {
  PERMIT_TYPE_CONFIG,
  calculatePermitDurationHours,
  validatePtwValidity,
  validateExtensionValidity,
} from '../../config/ptwChecklists.ts';
import { PtwPrintView } from './PtwPrintView.tsx';

interface PtwDetailsModalProps {
  permit: PtwPermit;
  onClose: () => void;
  onUpdated: () => void;
}

export const PtwDetailsModal: React.FC<PtwDetailsModalProps> = ({ permit, onClose, onUpdated }) => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'details' | 'checklists' | 'isolations' | 'gas_testing' | 'extensions' | 'closure'>('details');
  const [showPrintView, setShowPrintView] = useState(false);

  // Sub-dialogs
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [issuerRemarks, setIssuerRemarks] = useState('');
  const [ehsVerified, setEhsVerified] = useState(true);
  const [ehsRemarks, setEhsRemarks] = useState('');

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extDayNumber, setExtDayNumber] = useState<number>(() => {
    const existingDays = (permit.extensions || []).map((e) => e.dayNumber);
    const maxDay = existingDays.length > 0 ? Math.max(...existingDays) : 1;
    return Math.min(7, maxDay + 1);
  });
  const [extDate, setExtDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [extStartTime, setExtStartTime] = useState('08:00');
  const [extEndTime, setExtEndTime] = useState('18:00');
  const [extSiteReinspected, setExtSiteReinspected] = useState(true);
  const [extGasTest, setExtGasTest] = useState('O2 20.9%, LEL 0%');
  const [extRemarks, setExtRemarks] = useState('');

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionHousekeeping, setCompletionHousekeeping] = useState(true);
  const [completionToolsRemoved, setCompletionToolsRemoved] = useState(true);
  const [completionNotes, setCompletionNotes] = useState('All mechanical works completed, site thoroughly cleaned.');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [deIsoElectrical, setDeIsoElectrical] = useState<'Yes' | 'No' | 'N/A'>('Yes');
  const [deIsoMechanical, setDeIsoMechanical] = useState<'Yes' | 'No' | 'N/A'>('Yes');
  const [deIsoUtilities, setDeIsoUtilities] = useState<'Yes' | 'No' | 'N/A'>('N/A');
  const [ccrNotified, setCcrNotified] = useState(true);
  const [ccrOperatorName, setCcrOperatorName] = useState('CCR Shift Supervisor (A. Khan)');
  const [closureRemarks, setClosureRemarks] = useState('De-isolation verified. Handed back to Operations/CCR.');

  const [loadingAction, setLoadingAction] = useState(false);

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      Draft: 'bg-slate-700/60 text-slate-300 border-slate-600',
      'Under Review': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      Approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      Suspended: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      Extended: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      'Work Completed': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      Closed: 'bg-slate-800 text-slate-400 border-slate-700',
      Cancelled: 'bg-rose-900/30 text-rose-400 border-rose-800/50',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${map[status] || map.Draft}`}>
        {status}
      </span>
    );
  };

  // Actions
  const handleSubmitForReview = async () => {
    const val = validatePtwValidity(permit.validFrom, permit.validTo);
    if (!val.valid) {
      toast.error(`Validity Error: ${val.error}`);
      return;
    }

    const unverifiedMandatory = permit.checklists?.filter((c) => c.isMandatory && c.status === 'No') || [];
    if (unverifiedMandatory.length > 0) {
      toast.error(`Cannot submit permit: ${unverifiedMandatory.length} mandatory safety check(s) are unchecked ("No"). All mandatory checks must be verified ("Yes") or marked ("N/A").`);
      return;
    }

    setLoadingAction(true);
    try {
      await api.submitPtwForReview(permit.id);
      toast.success('Permit submitted for Area Authority review.');
      onUpdated();
    } catch (err: any) {
      toast.error('Submission failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApprove = async () => {
    const val = validatePtwValidity(permit.validFrom, permit.validTo);
    if (!val.valid) {
      toast.error(`Validity Error: ${val.error}`);
      return;
    }

    const unverifiedMandatory = permit.checklists?.filter((c) => c.isMandatory && c.status === 'No') || [];
    if (unverifiedMandatory.length > 0) {
      toast.error(`Cannot authorize permit: ${unverifiedMandatory.length} mandatory safety check(s) are unchecked ("No"). All mandatory checks must be verified ("Yes") or justified ("N/A").`);
      return;
    }

    setLoadingAction(true);
    try {
      await api.approvePtwPermit(permit.id, {
        issuerRemarks,
        ehsVerified,
        ehsRemarks,
      });
      toast.success('Permit authorized and approved! Status is now Active.');
      setShowApproveModal(false);
      onUpdated();
    } catch (err: any) {
      toast.error('Approval failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.warning('Mandatory suspension reason is required.');
      return;
    }
    setLoadingAction(true);
    try {
      await api.suspendPtwPermit(permit.id, suspendReason);
      toast.warning('Permit suspended.');
      setShowSuspendModal(false);
      onUpdated();
    } catch (err: any) {
      toast.error('Suspension failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReactivate = async () => {
    setLoadingAction(true);
    try {
      await api.reactivatePtwPermit(permit.id);
      toast.success('Permit re-activated and restored to Approved.');
      onUpdated();
    } catch (err: any) {
      toast.error('Re-activation failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExtend = async () => {
    const extVal = validateExtensionValidity(extDate, extStartTime, extEndTime);
    if (!extVal.valid) {
      toast.error(extVal.error || 'Extension validity duration cannot exceed 12 hours.');
      return;
    }

    setLoadingAction(true);
    try {
      await api.extendPtwPermit(permit.id, {
        dayNumber: Number(extDayNumber),
        extensionDate: extDate,
        startTime: extStartTime,
        endTime: extEndTime,
        siteReinspected: extSiteReinspected,
        gasTestVerified: extGasTest,
        receiverName: permit.leadManName,
        issuerName: currentUser?.fullName || 'Authorized Issuer',
        remarks: extRemarks,
      });
      toast.success(`Day ${extDayNumber} extension recorded successfully!`);
      setShowExtendModal(false);
      onUpdated();
    } catch (err: any) {
      toast.error('Extension failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCompleteWork = async () => {
    setLoadingAction(true);
    try {
      await api.completePtwPermit(permit.id, {
        completionStatus: 'Work Completed',
        housekeepingDone: completionHousekeeping,
        toolsPersonnelRemoved: completionToolsRemoved,
        comments: completionNotes,
      });
      toast.success('Work completion recorded. Awaiting final de-isolation & CCR closure.');
      setShowCompleteModal(false);
      onUpdated();
    } catch (err: any) {
      toast.error('Completion failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleClose = async () => {
    setLoadingAction(true);
    try {
      await api.closePtwPermit(permit.id, {
        deIsolationElectrical: deIsoElectrical,
        deIsolationMechanical: deIsoMechanical,
        deIsolationUtilities: deIsoUtilities,
        ccrNotified,
        ccrOperatorName,
        closureRemarks,
      });
      toast.success('Permit de-isolated and closed. Plant area normalized and returned to CCR.');
      setShowCloseModal(false);
      onUpdated();
    } catch (err: any) {
      toast.error('Closure failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const requiresGasTest = permit.permitTypes.includes('Confined Space Entry');

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-extrabold text-emerald-400">
                {permit.permitNumber}
              </span>
              <span className="text-slate-600">|</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {permit.permitTypes.map((t) => {
                  const cfg = PERMIT_TYPE_CONFIG[t];
                  return (
                    <span
                      key={t}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${cfg?.bgColor || 'bg-slate-800'} ${cfg?.borderColor || 'border-slate-700'} ${cfg?.color || 'text-slate-200'}`}
                    >
                      {t}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {renderStatusBadge(permit.status)}
              <button
                onClick={() => setShowPrintView(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Print Official PCL Permit Form"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Form</span>
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 py-2 gap-2 text-xs font-semibold overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'details'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Job Particulars
            </button>
            <button
              onClick={() => setActiveTab('checklists')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'checklists'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>Dynamic Checklists</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {permit.checklists?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('isolations')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'isolations'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              LOTO Isolations
            </button>
            {requiresGasTest && (
              <button
                onClick={() => setActiveTab('gas_testing')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'gas_testing'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Gas Testing
              </button>
            )}
            <button
              onClick={() => setActiveTab('extensions')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'extensions'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>Extensions (Day 2-7)</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {permit.extensions?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('closure')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'closure'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Completion & Hand-back
            </button>
          </div>

          {/* Modal Tab Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
            {/* TAB: DETAILS */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Particulars Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Plant Area</span>
                    <div className="font-semibold text-slate-200 mt-0.5">{permit.location?.name || 'Plant'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Department</span>
                    <div className="font-semibold text-slate-200 mt-0.5">{permit.department?.name || 'Operations'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Equipment / Tag</span>
                    <div className="font-semibold text-slate-200 mt-0.5 font-mono">{permit.equipmentNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Crew Size</span>
                    <div className="font-semibold text-slate-200 mt-0.5">{permit.workersCount} Workers</div>
                  </div>
                </div>

                {/* Specific Location & Work Description */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Specific Work Location</span>
                    <p className="font-medium text-slate-200 mt-1">{permit.specificLocation}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Detailed Scope of Work</span>
                    <p className="font-medium text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">
                      {permit.workDescription}
                    </p>
                  </div>
                </div>

                {/* Supervisor & Crew Particulars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Contractor / In-House</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{permit.contractorName || 'PCL In-house'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Lead Man / Supervisor</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{permit.leadManName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Contact Number / Radio</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{permit.contactNumber}</span>
                  </div>
                </div>

                {/* Issue Date, Time & Permit Validity (Strict Max 12h) */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Issue Date, Time & Permit Validity (Max 12 Hours)</span>
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Duration: {calculatePermitDurationHours(permit.validFrom, permit.validTo)} Hours (≤ 12h Max Limit)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Issue Date</span>
                      <span className="font-semibold text-slate-200 mt-0.5 block font-mono">{permit.issueDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Valid From (Date & Time)</span>
                      <span className="font-semibold text-slate-200 mt-0.5 block font-mono">{permit.validFrom}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Valid To (Date & Time)</span>
                      <span className="font-semibold text-slate-200 mt-0.5 block font-mono">{permit.validTo}</span>
                    </div>
                  </div>
                </div>

                {/* Pre-Requisites Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">JSA Reference</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block font-mono">{permit.jsaReference || 'Verified on site'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Toolbox Talk (TBT)</span>
                    <span className="font-semibold text-emerald-400 mt-0.5 block">
                      {permit.tbtConducted ? '✓ Conducted with Crew' : 'Pending'}
                    </span>
                    {permit.tbtNotes && <span className="text-[10px] text-slate-400 block mt-0.5">{permit.tbtNotes}</span>}
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Emergency Arrangements</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{permit.emergencyArrangements || 'Muster Point Verified'}</span>
                  </div>
                </div>

                {/* Authorization Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Performing Authority (Receiver)</span>
                    <div className="text-xs">
                      <span className="text-slate-400">Name:</span> <span className="font-semibold text-white">{permit.receiverName}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400">Status:</span>{' '}
                      <span className="font-semibold text-emerald-400">
                        {permit.receiverAcknowledged ? '✓ Acknowledged & Signed' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Area Authority (Issuer)</span>
                    <div className="text-xs">
                      <span className="text-slate-400">Name:</span>{' '}
                      <span className="font-semibold text-white">{permit.issuerName || 'Pending Authorization'}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400">Authorization:</span>{' '}
                      <span className="font-semibold text-slate-200 uppercase">{permit.status}</span>
                    </div>
                    {permit.issuerRemarks && (
                      <div className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800">
                        "{permit.issuerRemarks}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CHECKLISTS */}
            {activeTab === 'checklists' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Dynamic Safety Verification Checklists
                  </h4>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-400 font-semibold">
                      Verified: {permit.checklists?.filter((c) => c.status === 'Yes').length || 0}
                    </span>
                    <span className="text-rose-400 font-semibold">
                      Unchecked: {permit.checklists?.filter((c) => c.status === 'No').length || 0}
                    </span>
                    <span className="text-slate-400 font-semibold">
                      N/A: {permit.checklists?.filter((c) => c.status === 'N/A').length || 0}
                    </span>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="py-2.5 px-3 w-16 text-center">Ref</th>
                        <th className="py-2.5 px-3">Safety Verification Requirement</th>
                        <th className="py-2.5 px-3 w-28 text-center">Status</th>
                        <th className="py-2.5 px-3 w-64">Verification Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {permit.checklists && permit.checklists.length > 0 ? (
                        (() => {
                          const categoryTitles: Record<string, string> = {
                            General: 'General Pre-Work Safety Precautions (Applicable to All Permits)',
                            CW: 'Cold Work Precautions (CW)',
                            'Cold Work': 'Cold Work Precautions (CW)',
                            HW: 'Hot Work Precautions & Spark Containment (HW)',
                            'Hot Work': 'Hot Work Precautions & Spark Containment (HW)',
                            CSE: 'Confined Space Entry Precautions (CSE)',
                            'Confined Space Entry': 'Confined Space Entry Precautions (CSE)',
                            LA: 'Lifting Activity & Rigging Precautions (LA)',
                            'Lifting Activity': 'Lifting Activity & Rigging Precautions (LA)',
                            WAH: 'Work at Height & Fall Prevention Precautions (WAH)',
                            'Work at Height': 'Work at Height & Fall Prevention Precautions (WAH)',
                          };

                          const cats = Array.from(new Set(permit.checklists.map((c) => c.category))) as string[];
                          const orderedCats = ['General', ...cats.filter((c) => c !== 'General')];

                          return orderedCats.map((cat) => {
                            const items = permit.checklists.filter((c) => c.category === cat);
                            if (items.length === 0) return null;
                            const catYes = items.filter((c) => c.status === 'Yes').length;

                            return (
                              <React.Fragment key={cat}>
                                <tr className="bg-slate-900 border-y border-slate-800">
                                  <td colSpan={4} className="py-2 px-3 text-[11px] font-bold text-slate-200">
                                    <div className="flex items-center justify-between">
                                      <span className="uppercase tracking-wider text-emerald-400 font-bold">
                                        ▸ {categoryTitles[cat] || cat}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        {catYes} of {items.length} verified
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                                {items.map((chk) => (
                                  <tr key={chk.id} className="hover:bg-slate-900/40">
                                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 text-[10px]">
                                      {chk.id}
                                    </td>
                                    <td className="py-2 px-3">
                                      <span className="text-slate-200">{chk.label}</span>
                                      {chk.isMandatory && (
                                        <span className="text-rose-400 ml-1.5 font-bold text-[10px]">*Mandatory</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span
                                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                          chk.status === 'Yes'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : chk.status === 'N/A'
                                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        }`}
                                      >
                                        {chk.status}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-slate-400 italic">{chk.notes || '—'}</td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          });
                        })()
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-500 italic">
                            No checklist items found for this permit.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {(permit.additionalHazards || permit.additionalControls) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">
                        Additional Site Hazards Identified
                      </span>
                      <p className="text-slate-200">{permit.additionalHazards || 'None specified'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">
                        Additional Required Controls
                      </span>
                      <p className="text-slate-200">{permit.additionalControls || 'None specified'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ISOLATIONS */}
            {activeTab === 'isolations' && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Lockout / Tagout (LOTO) & Energy Isolation Matrix</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['electrical', 'mechanical', 'utilities', 'production'] as const).map((key) => {
                    const labels = {
                      electrical: 'Electrical Isolation (Switchgear / Breakers)',
                      mechanical: 'Mechanical Isolation (Blinds / Valves)',
                      utilities: 'Utilities Isolation (Steam / Air / Water)',
                      production: 'Process / Production Isolation (Chutes / Gates)',
                    };
                    const iso = permit.isolations?.[key];
                    return (
                      <div key={key} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                          <span className="font-bold text-slate-200 text-xs">{labels[key]}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              iso?.required === 'Yes'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            Required: {iso?.required || 'N/A'}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs pt-1">
                          <div>
                            <span className="text-slate-400">Equipment Tag:</span>{' '}
                            <span className="font-mono text-slate-200">{iso?.equipmentTag || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Lock / Tag No:</span>{' '}
                            <span className="font-mono text-slate-200">{iso?.lockNumber || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Isolated By:</span>{' '}
                            <span className="text-slate-200">{iso?.isolatedBy || '—'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Certificate Ref:</span>{' '}
                            <span className="font-mono text-slate-200">{iso?.permitRef || '—'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: GAS TESTING */}
            {activeTab === 'gas_testing' && requiresGasTest && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-purple-400" />
                    <span>Atmospheric Gas Testing Records</span>
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Oxygen (O2)</span>
                    <span className="text-lg font-mono font-bold text-slate-100">
                      {permit.gasTesting?.oxygen ? `${permit.gasTesting.oxygen} %` : '—'}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-1">Normal: 19.5 - 23.5%</span>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Flammable (LEL)</span>
                    <span className="text-lg font-mono font-bold text-slate-100">
                      {permit.gasTesting?.lel ? `${permit.gasTesting.lel} %` : '—'}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-1">Target: &lt;10% CSE / &lt;1% HW</span>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Carbon Monoxide (CO)</span>
                    <span className="text-lg font-mono font-bold text-slate-100">
                      {permit.gasTesting?.co ? `${permit.gasTesting.co} ppm` : '—'}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-1">Limit: &lt;25 ppm</span>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hydrogen Sulfide (H2S)</span>
                    <span className="text-lg font-mono font-bold text-slate-100">
                      {permit.gasTesting?.h2s ? `${permit.gasTesting.h2s} ppm` : '—'}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-1">Limit: &lt;10 ppm</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Gas Tester</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{permit.gasTesting?.testedBy || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Test Time</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block font-mono">{permit.gasTesting?.testTime || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Atmosphere Verdict</span>
                    <span className="font-bold text-emerald-400 mt-0.5 block uppercase">
                      {permit.gasTesting?.result || 'Safe to Enter'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: EXTENSIONS */}
            {activeTab === 'extensions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Daily Multi-Day Extensions (Day 2 to Day 7)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Standard multi-day PCL permit revalidation register.
                    </p>
                  </div>
                  {(permit.status === 'Approved' || permit.status === 'Extended') && (
                    <button
                      onClick={() => setShowExtendModal(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Record Extension</span>
                    </button>
                  )}
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="py-2.5 px-3 w-16 text-center">Day</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Shift Hours</th>
                        <th className="py-2.5 px-3 text-center">Site Re-check</th>
                        <th className="py-2.5 px-3">Gas Test</th>
                        <th className="py-2.5 px-3">Receiver</th>
                        <th className="py-2.5 px-3">Issuer Sign</th>
                        <th className="py-2.5 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {[2, 3, 4, 5, 6, 7].map((d) => {
                        const ext = permit.extensions?.find((e) => e.dayNumber === d);
                        return (
                          <tr key={d} className={ext ? 'bg-emerald-500/5' : 'hover:bg-slate-900/40'}>
                            <td className="py-2 px-3 text-center font-bold text-slate-300">Day {d}</td>
                            <td className="py-2 px-3 text-slate-200">{ext ? ext.extensionDate : '—'}</td>
                            <td className="py-2 px-3 text-slate-200">
                              {ext ? `${ext.startTime} - ${ext.endTime}` : '—'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {ext ? (
                                <span className="text-emerald-400 font-bold">✓ Yes</span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-300">{ext ? ext.gasTestVerified : '—'}</td>
                            <td className="py-2 px-3 text-slate-200">{ext ? ext.receiverName : '—'}</td>
                            <td className="py-2 px-3 text-slate-200">{ext ? ext.issuerName : '—'}</td>
                            <td className="py-2 px-3 text-[11px] text-slate-400">{ext ? ext.remarks || 'Authorized' : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: COMPLETION & CLOSURE */}
            {activeTab === 'closure' && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Work Completion, De-Isolation & Central Control Room (CCR) Hand-back
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Work Completion Status</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {permit.completionStatus || (permit.status === 'Closed' ? 'Completed' : 'In Progress')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Housekeeping Verified</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {permit.housekeepingDone ? '✓ Site Cleaned & Orderly' : 'Pending Verification'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Personnel & Tools Withdrawn</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {permit.toolsPersonnelRemoved ? '✓ All Cleared' : 'Pending Verification'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Electrical De-Isolation</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      Status: {permit.deIsolationElectrical || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Mechanical De-Isolation</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      Status: {permit.deIsolationMechanical || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Utilities De-Isolation</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      Status: {permit.deIsolationUtilities || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">CCR & Operations Hand-back</span>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">CCR Notified:</span>{' '}
                      <span className="font-semibold text-slate-200">
                        {permit.ccrNotified ? `✓ Yes (${permit.ccrOperatorName})` : 'Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Final Closure Date:</span>{' '}
                      <span className="font-mono text-slate-200">
                        {permit.closureDate ? new Date(permit.closureDate).toLocaleString() : 'Open'}
                      </span>
                    </div>
                  </div>
                  {permit.closureRemarks && (
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 italic">
                      "{permit.closureRemarks}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Workflow Actions */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div className="text-[11px] text-slate-400">
              Role: <span className="font-bold text-white uppercase">{currentUser?.role || 'rp'}</span>
              <span className="mx-2">•</span>
              Status: <span className="font-bold text-emerald-400">{permit.status}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Draft: Submit for Review */}
              {permit.status === 'Draft' && (
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={handleSubmitForReview}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow"
                >
                  Submit for Area Review
                </button>
              )}

              {/* Under Review: Approve or Reject */}
              {permit.status === 'Under Review' && (
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => setShowApproveModal(true)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Authorize & Issue PTW</span>
                </button>
              )}

              {/* Active / Extended: Suspend, Complete, Extend */}
              {(permit.status === 'Approved' || permit.status === 'Extended') && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowExtendModal(true)}
                    className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Extend Day 2-7
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSuspendModal(true)}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Suspend Work
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(true)}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors shadow flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Work</span>
                  </button>
                </>
              )}

              {/* Suspended: Reactivate */}
              {permit.status === 'Suspended' && (
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={handleReactivate}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Re-activate Permit</span>
                </button>
              )}

              {/* Work Completed: Final De-Isolation & Closure */}
              {permit.status === 'Work Completed' && (
                <button
                  type="button"
                  onClick={() => setShowCloseModal(true)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>De-Isolate & Close Permit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* APPROVE DIALOG */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Authorize & Issue Permit {permit.permitNumber}</span>
            </h3>
            <p className="text-xs text-slate-400">
              As the Authorized Area Authority, confirm that site precautions, isolation records, and gas test requirements are satisfied.
            </p>
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Issuer Conditions & Remarks</label>
              <textarea
                rows={3}
                value={issuerRemarks}
                onChange={(e) => setIssuerRemarks(e.target.value)}
                placeholder="Specific precautions, PPE, or coordination instructions..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="ehsVer"
                checked={ehsVerified}
                onChange={(e) => setEhsVerified(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-800"
              />
              <label htmlFor="ehsVer" className="text-xs text-slate-300 cursor-pointer">
                EHS Department verified & endorsed
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleApprove}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm Authorization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND DIALOG */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Suspend Work on Permit {permit.permitNumber}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Specify the reason for halting work (e.g. hazardous atmosphere, weather change, safety violation).
            </p>
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Mandatory Suspension Reason</label>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="State the unsafe condition or operational reason for suspending this permit..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleSuspend}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTEND DIALOG (DAY 2 TO DAY 7) */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Permit Daily Extension (Day 2 to Day 7)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Multi-day revalidation for {permit.permitNumber} on subsequent shifts.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Extension Day</label>
                <select
                  value={extDayNumber}
                  onChange={(e) => setExtDayNumber(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  {[2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d}>
                      Day {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Extension Date</label>
                <input
                  type="date"
                  value={extDate}
                  onChange={(e) => setExtDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                </input>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Shift Start</label>
                <input
                  type="text"
                  value={extStartTime}
                  onChange={(e) => setExtStartTime(e.target.value)}
                  placeholder="08:00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Shift End</label>
                <input
                  type="text"
                  value={extEndTime}
                  onChange={(e) => setExtEndTime(e.target.value)}
                  placeholder="18:00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>

            {/* Live Extension Shift Duration & 12h Limit Indicator */}
            {(() => {
              const extVal = validateExtensionValidity(extDate, extStartTime, extEndTime);
              return (
                <div
                  className={`p-2 rounded-lg border text-xs flex flex-col gap-1 ${
                    extVal.valid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Shift Duration: {extVal.durationHours} hrs</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700">
                      {extVal.valid ? 'Valid (≤ 12h)' : 'Exceeds 12h Limit'}
                    </span>
                  </div>
                  {!extVal.valid && (
                    <span className="text-[11px] text-rose-300 font-medium">{extVal.error}</span>
                  )}
                </div>
              );
            })()}

            <div>
              <label className="block text-slate-400 text-xs mb-1">Atmospheric Gas Test Re-check</label>
              <input
                type="text"
                value={extGasTest}
                onChange={(e) => setExtGasTest(e.target.value)}
                placeholder="e.g. O2: 20.9%, LEL: 0%, CO: 0ppm (Verified)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reInsp"
                checked={extSiteReinspected}
                onChange={(e) => setExtSiteReinspected(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-800"
              />
              <label htmlFor="reInsp" className="text-xs text-slate-300 cursor-pointer">
                Site re-inspected and controls confirmed in place
              </label>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Extension Remarks</label>
              <input
                type="text"
                value={extRemarks}
                onChange={(e) => setExtRemarks(e.target.value)}
                placeholder="Work continuing as per original scope..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction || !validateExtensionValidity(extDate, extStartTime, extEndTime).valid}
                onClick={handleExtend}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold shadow"
              >
                Authorize Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE WORK DIALOG */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>Performing Authority Work Completion</span>
            </h3>
            <p className="text-xs text-slate-400">
              Verify that task activities are finished and work site is handed back to PCL operations.
            </p>
            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hk"
                  checked={completionHousekeeping}
                  onChange={(e) => setCompletionHousekeeping(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                />
                <label htmlFor="hk" className="text-slate-200 cursor-pointer">
                  Housekeeping done, waste/scrap removed from work area
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tp"
                  checked={completionToolsRemoved}
                  onChange={(e) => setCompletionToolsRemoved(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                />
                <label htmlFor="tp" className="text-slate-200 cursor-pointer">
                  All tools, gear, and crew personnel withdrawn
                </label>
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Hand-back Comments</label>
              <textarea
                rows={2}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleCompleteWork}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL DE-ISOLATION & CLOSURE DIALOG */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>De-Isolation & CCR Hand-back Final Closure</span>
            </h3>
            <p className="text-xs text-slate-400">
              Verify that energy isolations are removed, systems normalized, and Central Control Room (CCR) informed.
            </p>
            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Electrical De-iso</label>
                <select
                  value={deIsoElectrical}
                  onChange={(e) => setDeIsoElectrical(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="Yes">Yes (Removed)</option>
                  <option value="No">No (Active)</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Mechanical De-iso</label>
                <select
                  value={deIsoMechanical}
                  onChange={(e) => setDeIsoMechanical(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="Yes">Yes (Normalized)</option>
                  <option value="No">No (Blinded)</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">Utilities De-iso</label>
                <select
                  value={deIsoUtilities}
                  onChange={(e) => setDeIsoUtilities(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="Yes">Yes (Opened)</option>
                  <option value="No">No</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ccrCheck"
                  checked={ccrNotified}
                  onChange={(e) => setCcrNotified(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-800"
                />
                <label htmlFor="ccrCheck" className="text-xs text-slate-300 cursor-pointer font-semibold">
                  CCR Notified & Accepted
                </label>
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">CCR Operator</label>
                <input
                  type="text"
                  value={ccrOperatorName}
                  onChange={(e) => setCcrOperatorName(e.target.value)}
                  placeholder="CCR Operator Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Final Closure Remarks</label>
              <textarea
                rows={2}
                value={closureRemarks}
                onChange={(e) => setClosureRemarks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleClose}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Close Permit & Normalize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT VIEW MODAL */}
      {showPrintView && (
        <PtwPrintView permit={permit} onClose={() => setShowPrintView(false)} />
      )}
    </>
  );
};
