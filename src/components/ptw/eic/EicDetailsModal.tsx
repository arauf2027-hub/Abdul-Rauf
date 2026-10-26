import React, { useState } from 'react';
import {
  X,
  Printer,
  Edit,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Lock,
  Shield,
  FileCheck,
  CheckSquare,
  Square,
  ArrowRight,
  UserCheck,
  Ban,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useToast } from '../../../context/ToastContext.tsx';
import { api } from '../../../services/api.ts';
import { ElectricalIsolationCertificate, EicStatus } from '../../../types/index.ts';

interface EicDetailsModalProps {
  certificate: ElectricalIsolationCertificate;
  onClose: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onStatusChange: (updated: ElectricalIsolationCertificate) => void;
}

export const EicDetailsModal: React.FC<EicDetailsModalProps> = ({
  certificate,
  onClose,
  onEdit,
  onPrint,
  onStatusChange,
}) => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [activeActionModal, setActiveActionModal] = useState<
    'approve' | 'confirm_isolation' | 'start_work' | 'complete_work' | 'close_deisolate' | 'cancel' | null
  >(null);

  interface ActionInputState {
    approverName: string;
    approverDesignation: string;
    approverSignature: string;
    approvalRemarks: string;
    competentPersonName: string;
    competentPersonDesignation: string;
    operatorSignature: string;
    competentPersonSignature: string;
    fusesRemoved: boolean;
    mainSwitchedOff: boolean;
    rackedOut: boolean;
    padlocksFitted: boolean;
    tagsFitted: boolean;
    workPersonInChargeName: string;
    workPersonInChargeSignature: string;
    deIsolationName: string;
    deIsolationDesignation: string;
    deIsolationSignature: string;
    ccrOperatorSignatures: string;
    cancellationReason: string;
  }

  // Workflow prompt input state
  const [actionInput, setActionInput] = useState<ActionInputState>({
    approverName: currentUser?.fullName || '',
    approverDesignation: currentUser?.jobTitle || 'Electrical & Instrumentation Manager',
    approverSignature: currentUser?.fullName || '',
    approvalRemarks: 'Authorized for shutdown isolation.',

    competentPersonName: currentUser?.fullName || '',
    competentPersonDesignation: currentUser?.jobTitle || 'Senior Electrical Engineer',
    operatorSignature: 'CCR Senior Panel Operator',
    competentPersonSignature: currentUser?.fullName || '',
    fusesRemoved: Boolean(certificate.fusesRemoved ?? true),
    mainSwitchedOff: Boolean(certificate.mainSwitchedOff ?? true),
    rackedOut: Boolean(certificate.rackedOut ?? true),
    padlocksFitted: Boolean(certificate.padlocksFitted ?? true),
    tagsFitted: Boolean(certificate.tagsFitted ?? true),

    workPersonInChargeName: currentUser?.fullName || '',
    workPersonInChargeSignature: currentUser?.fullName || '',

    deIsolationName: currentUser?.fullName || '',
    deIsolationDesignation: currentUser?.jobTitle || 'Senior Electrical Engineer',
    deIsolationSignature: currentUser?.fullName || '',
    ccrOperatorSignatures: 'CCR Operator (System Re-energized)',

    cancellationReason: '',
  });

  const stages: { label: string; status: EicStatus; desc: string }[] = [
    { label: 'Requisition', status: 'Submitted for Approval', desc: '1.0 & 2.1 Prepared' },
    { label: 'Authorization', status: 'Approved', desc: '2.2 E&I Approval' },
    { label: 'Isolation', status: 'Isolation Confirmed', desc: '3.0 LOTO Confirmed' },
    { label: 'Execution', status: 'Work in Progress', desc: 'Active on Site' },
    { label: 'Work Complete', status: 'Work Completed', desc: '5.0 Tools Withdrawn' },
    { label: 'De-Isolated & Closed', status: 'Closed', desc: '6.0 Re-energized' },
  ];

  const getStageIndex = (status: EicStatus) => {
    switch (status) {
      case 'Draft':
        return 0;
      case 'Submitted for Approval':
        return 1;
      case 'Approved':
        return 2;
      case 'Isolation Confirmed':
        return 3;
      case 'Work in Progress':
        return 4;
      case 'Work Completed':
        return 5;
      case 'De-isolation Confirmed':
      case 'Closed':
        return 6;
      case 'Cancelled':
      case 'Rejected':
        return -1;
      default:
        return 0;
    }
  };

  const currentStageIdx = getStageIndex(certificate.status);

  const handlePerformAction = async () => {
    setLoading(true);
    try {
      let payload: Partial<ElectricalIsolationCertificate> = {};

      if (activeActionModal === 'approve') {
        payload = {
          status: 'Approved',
          approverName: actionInput.approverName,
          approverDesignation: actionInput.approverDesignation,
          approverSignature: actionInput.approverSignature,
          approvalRemarks: actionInput.approvalRemarks,
        };
      } else if (activeActionModal === 'confirm_isolation') {
        payload = {
          status: 'Isolation Confirmed',
          fusesRemoved: actionInput.fusesRemoved,
          mainSwitchedOff: actionInput.mainSwitchedOff,
          rackedOut: actionInput.rackedOut,
          padlocksFitted: actionInput.padlocksFitted,
          tagsFitted: actionInput.tagsFitted,
          competentPersonName: actionInput.competentPersonName,
          competentPersonDesignation: actionInput.competentPersonDesignation,
          competentPersonSignature: actionInput.competentPersonSignature,
          operatorSignature: actionInput.operatorSignature,
        };
      } else if (activeActionModal === 'start_work') {
        payload = {
          status: 'Work in Progress',
        };
      } else if (activeActionModal === 'complete_work') {
        const today = new Date().toISOString().split('T')[0];
        const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
        payload = {
          status: 'Work Completed',
          workPersonInChargeName: actionInput.workPersonInChargeName,
          workPersonInChargeSignature: actionInput.workPersonInChargeSignature,
          workCompletionDate: today,
          workCompletionTime: nowTime,
        };
      } else if (activeActionModal === 'close_deisolate') {
        const today = new Date().toISOString().split('T')[0];
        const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
        payload = {
          status: 'Closed',
          deIsolationName: actionInput.deIsolationName,
          deIsolationDesignation: actionInput.deIsolationDesignation,
          deIsolationSignature: actionInput.deIsolationSignature,
          deIsolationDate: today,
          deIsolationTime: nowTime,
          ccrOperatorSignatures: actionInput.ccrOperatorSignatures,
        };
      } else if (activeActionModal === 'cancel') {
        if (!actionInput.cancellationReason.trim()) {
          toast.error('Please specify the cancellation reason.');
          setLoading(false);
          return;
        }
        payload = {
          status: 'Cancelled',
          cancellationReason: actionInput.cancellationReason,
        };
      }

      const updated = await api.updateElectricalCertificate(certificate.id, payload);
      toast.success(`Certificate ${updated.certificateNumber} transitioned to ${updated.status}.`);
      setActiveActionModal(null);
      onStatusChange(updated);
    } catch (err: any) {
      console.error('Workflow error:', err);
      toast.error(err.message || 'Failed to update certificate stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">{certificate.certificateNumber}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-sky-500/10 text-sky-400 border-sky-500/20">
                  {certificate.status}
                </span>
                {certificate.linkedPtwNumber && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    PTW: {certificate.linkedPtwNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {certificate.equipmentToIsolate} • {certificate.workLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onEdit}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Form</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-xs">
          {/* Workflow Stepper */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">
              Sequential Isolation Protocol Workflow
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {stages.map((st, idx) => {
                const isPassed = currentStageIdx > idx;
                const isCurrent = currentStageIdx === idx + 1;
                return (
                  <div
                    key={st.label}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 font-bold'
                        : isPassed
                        ? 'bg-slate-900 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : isCurrent ? (
                        <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-700 text-[9px] flex items-center justify-center text-slate-500">
                          {idx + 1}
                        </span>
                      )}
                      <span className="text-[11px] truncate">{st.label}</span>
                    </div>
                    <span className="text-[9px] block text-slate-400">{st.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Action Bar */}
          <div className="p-4 bg-sky-950/20 border border-sky-800/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white block">Next Authorized Action</span>
              <span className="text-[11px] text-slate-400">
                {certificate.status === 'Draft' && 'Submit certificate for formal authorization.'}
                {certificate.status === 'Submitted for Approval' && 'Authorized E&I Authority review and signature required.'}
                {certificate.status === 'Approved' && 'Competent Person must physically isolate, rack out breakers, lock, and verify with CCR.'}
                {certificate.status === 'Isolation Confirmed' && 'Zero energy proven safe. Ready to start on-site work.'}
                {certificate.status === 'Work in Progress' && 'Record maintenance scope completion and personnel withdrawal.'}
                {certificate.status === 'Work Completed' && 'Confirm system de-isolation, removal of locks, and CCR re-energization.'}
                {certificate.status === 'Closed' && 'Certificate closed. All systems de-isolated and re-energized.'}
                {certificate.status === 'Cancelled' && 'This certificate was formally cancelled.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {certificate.status === 'Draft' && (
                <button
                  onClick={() => {
                    api.updateElectricalCertificate(certificate.id, { status: 'Submitted for Approval' })
                      .then((up) => {
                        toast.success('Certificate submitted for approval.');
                        onStatusChange(up);
                      });
                  }}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Submit for Approval</span>
                </button>
              )}

              {certificate.status === 'Submitted for Approval' && (
                <button
                  onClick={() => setActiveActionModal('approve')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Record Approval</span>
                </button>
              )}

              {certificate.status === 'Approved' && (
                <button
                  onClick={() => setActiveActionModal('confirm_isolation')}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-950 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirm Electrical Isolation</span>
                </button>
              )}

              {certificate.status === 'Isolation Confirmed' && (
                <button
                  onClick={() => setActiveActionModal('start_work')}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-950 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Start Work (In Progress)</span>
                </button>
              )}

              {certificate.status === 'Work in Progress' && (
                <button
                  onClick={() => setActiveActionModal('complete_work')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Record Work Completion</span>
                </button>
              )}

              {certificate.status === 'Work Completed' && (
                <button
                  onClick={() => setActiveActionModal('close_deisolate')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm De-Isolation & Close</span>
                </button>
              )}

              {certificate.status !== 'Closed' && certificate.status !== 'Cancelled' && (
                <button
                  onClick={() => setActiveActionModal('cancel')}
                  className="px-3 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 font-semibold rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 1.0 & 2.0 Display Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
                SECTION 1.0 — WORK DETAILS
              </span>
              <div className="space-y-1.5">
                <div><span className="text-slate-400">1.1 Location:</span> <span className="font-semibold text-white">{certificate.workLocation}</span></div>
                <div><span className="text-slate-400">1.2 Equipment:</span> <span className="font-semibold text-white">{certificate.equipmentToIsolate}</span></div>
                <div><span className="text-slate-400">Date & Time:</span> <span className="font-mono text-slate-300">{certificate.date} at {certificate.time}</span></div>
                <div><span className="text-slate-400">1.3 Work Description:</span> <p className="text-slate-300 mt-0.5">{certificate.workDescription}</p></div>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
                SECTION 2.0 — ISOLATION REQUISITION
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 border-r border-slate-800 pr-2">
                  <span className="font-bold text-slate-300 block">2.1 Requestor</span>
                  <div className="text-[11px] text-slate-400">Name: <span className="text-slate-200 font-semibold">{certificate.requestorName}</span></div>
                  <div className="text-[11px] text-slate-400">Designation: <span className="text-slate-200">{certificate.requestorDesignation || '—'}</span></div>
                  <div className="text-[11px] text-slate-400">Signature: <span className="font-mono text-emerald-400">{certificate.requestorSignature || '—'}</span></div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-300 block">2.2 Approved By</span>
                  <div className="text-[11px] text-slate-400">Name: <span className="text-slate-200 font-semibold">{certificate.approverName || '—'}</span></div>
                  <div className="text-[11px] text-slate-400">Designation: <span className="text-slate-200">{certificate.approverDesignation || '—'}</span></div>
                  <div className="text-[11px] text-slate-400">Signature: <span className="font-mono text-emerald-400">{certificate.approverSignature || '—'}</span></div>
                  {certificate.approvalRemarks && (
                    <div className="text-[10px] text-slate-400 italic">"{certificate.approvalRemarks}"</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3.0 Details of Electrical Isolation */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
              SECTION 3.0 — DETAILS OF ELECTRICAL ISOLATION
            </span>

            {/* 3.1 Verification checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
              <div className="flex items-center gap-1.5">
                {certificate.fusesRemoved ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                <span className={certificate.fusesRemoved ? 'text-white font-semibold' : 'text-slate-400'}>Fuses removed</span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.mainSwitchedOff ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                <span className={certificate.mainSwitchedOff ? 'text-white font-semibold' : 'text-slate-400'}>Main switched off</span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.rackedOut ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                <span className={certificate.rackedOut ? 'text-white font-semibold' : 'text-slate-400'}>Racked out</span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.padlocksFitted ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                <span className={certificate.padlocksFitted ? 'text-white font-semibold' : 'text-slate-400'}>Padlocks fitted</span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.tagsFitted ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                <span className={certificate.tagsFitted ? 'text-white font-semibold' : 'text-slate-400'}>Tags fitted</span>
              </div>
            </div>

            {/* 3.2 Electrical isolation point table */}
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs divide-y divide-slate-800">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2">Location</th>
                    <th className="p-2">Breaker No.</th>
                    <th className="p-2 text-center">Action</th>
                    <th className="p-2">Padlock No.</th>
                    <th className="p-2 text-center">Tag Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/60 font-mono text-xs">
                  {certificate.isolationPoints.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-sans">{p.location || '—'}</td>
                      <td className="p-2 text-sky-400 font-bold">{p.breakerNo || '—'}</td>
                      <td className="p-2 text-center font-bold">{p.action || '—'}</td>
                      <td className="p-2">{p.padlockNo || '—'}</td>
                      <td className="p-2 text-center">{p.tagOut || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3.3 Confirmation by Competent Person */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300 block">3.3 Confirmation by Competent Person</span>
              <p className="italic text-[11px] text-sky-300">
                "I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed including CCR-Operator."
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400">
                <div>Name: <span className="text-white font-semibold">{certificate.competentPersonName || '—'}</span></div>
                <div>Designation: <span className="text-white">{certificate.competentPersonDesignation || '—'}</span></div>
                <div>Operator Signature: <span className="font-mono text-emerald-400">{certificate.operatorSignature || '—'}</span></div>
                <div>Sign-1: <span className="font-mono text-emerald-400">{certificate.competentPersonSignature || '—'}</span></div>
              </div>
            </div>
          </div>

          {/* Section 4.0 Other Types of Isolation */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
              SECTION 4.0 — OTHER TYPES OF ISOLATION (MECHANICAL / PROCESS)
            </span>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs divide-y divide-slate-800">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2">Control Mechanism</th>
                    <th className="p-2">Location</th>
                    <th className="p-2 text-center">I / O / D</th>
                    <th className="p-2 text-center">Blanked</th>
                    <th className="p-2 text-center">Valves</th>
                    <th className="p-2">Padlock No.</th>
                    <th className="p-2 text-center">Tagged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/60 font-mono text-xs">
                  {certificate.otherIsolations.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-sans">{p.controlMechanism || '—'}</td>
                      <td className="p-2 font-sans">{p.location || '—'}</td>
                      <td className="p-2 text-center">{p.inletOutletDrain || '—'}</td>
                      <td className="p-2 text-center font-bold">{p.linesBlanked || '—'}</td>
                      <td className="p-2 text-center font-bold">{p.valvesStatus || '—'}</td>
                      <td className="p-2">{p.padlockNo || '—'}</td>
                      <td className="p-2 text-center">{p.taggedOut || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300 block">4.2 Isolation Confirmation</span>
              <p className="italic text-[11px] text-sky-300">
                "I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed."
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400">
                <div>Name: <span className="text-white font-semibold">{certificate.otherCompetentPersonName || '—'}</span></div>
                <div>Designation: <span className="text-white">{certificate.otherCompetentPersonDesignation || '—'}</span></div>
                <div>Signature: <span className="font-mono text-emerald-400">{certificate.otherCompetentPersonSignature || '—'}</span></div>
                <div>Date/Time: <span className="font-mono">{certificate.otherConfirmationDate} {certificate.otherConfirmationTime}</span></div>
              </div>
            </div>
          </div>

          {/* Section 5.0 & 6.0 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
                SECTION 5.0 — WORK COMPLETION
              </span>
              <p className="italic text-[11px] text-slate-300">
                "I hereby confirm that the work detailed in section 1 above is completed, the personnel and equipment withdrawn and the Isolation may now be removed by a competent responsible person."
              </p>
              <div className="space-y-1 pt-1 text-[11px] text-slate-400">
                <div>Person in charge: <span className="text-white font-semibold">{certificate.workPersonInChargeName || '—'}</span></div>
                <div>Signature: <span className="font-mono text-emerald-400">{certificate.workPersonInChargeSignature || '—'}</span></div>
                <div>Date/Time: <span className="font-mono">{certificate.workCompletionDate} {certificate.workCompletionTime}</span></div>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
                SECTION 6.0 — DE-ISOLATION & RE-ENERGIZATION
              </span>
              <p className="italic text-[11px] text-slate-300">
                "I hereby confirm that the Isolations detailed in section 3/4 have been removed and the system re-energized."
              </p>
              <div className="space-y-1 pt-1 text-[11px] text-slate-400">
                <div>De-isolated By: <span className="text-white font-semibold">{certificate.deIsolationName || '—'}</span></div>
                <div>Signature: <span className="font-mono text-emerald-400">{certificate.deIsolationSignature || '—'}</span></div>
                <div>CCR Operator Sign: <span className="font-mono text-emerald-400">{certificate.ccrOperatorSignatures || '—'}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Sub-Dialog */}
        {activeActionModal && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {activeActionModal === 'approve' && 'Authorize Certificate (Section 2.2)'}
                  {activeActionModal === 'confirm_isolation' && 'Confirm Electrical Isolation (Section 3.0)'}
                  {activeActionModal === 'start_work' && 'Start Work in Progress'}
                  {activeActionModal === 'complete_work' && 'Record Work Completion (Section 5.1)'}
                  {activeActionModal === 'close_deisolate' && 'Confirm De-Isolation & Re-Energization (Section 6.1)'}
                  {activeActionModal === 'cancel' && 'Cancel Certificate'}
                </span>
              </h4>
              <button
                onClick={() => setActiveActionModal(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {activeActionModal === 'approve' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Approver Name</label>
                  <input
                    type="text"
                    value={actionInput.approverName}
                    onChange={(e) => setActionInput({ ...actionInput, approverName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    value={actionInput.approverDesignation}
                    onChange={(e) => setActionInput({ ...actionInput, approverDesignation: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Signature</label>
                  <input
                    type="text"
                    value={actionInput.approverSignature}
                    onChange={(e) => setActionInput({ ...actionInput, approverSignature: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            {activeActionModal === 'confirm_isolation' && (
              <div className="space-y-3 text-xs">
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionInput.fusesRemoved}
                      onChange={(e) => setActionInput({ ...actionInput, fusesRemoved: e.target.checked })}
                      className="rounded text-sky-600 bg-slate-950"
                    />
                    <span>Fuses removed</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionInput.mainSwitchedOff}
                      onChange={(e) => setActionInput({ ...actionInput, mainSwitchedOff: e.target.checked })}
                      className="rounded text-sky-600 bg-slate-950"
                    />
                    <span>Main switched off</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionInput.rackedOut}
                      onChange={(e) => setActionInput({ ...actionInput, rackedOut: e.target.checked })}
                      className="rounded text-sky-600 bg-slate-950"
                    />
                    <span>Racked out</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionInput.padlocksFitted}
                      onChange={(e) => setActionInput({ ...actionInput, padlocksFitted: e.target.checked })}
                      className="rounded text-sky-600 bg-slate-950"
                    />
                    <span>Padlocks fitted</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionInput.tagsFitted}
                      onChange={(e) => setActionInput({ ...actionInput, tagsFitted: e.target.checked })}
                      className="rounded text-sky-600 bg-slate-950"
                    />
                    <span>Tags fitted</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Competent Person Name</label>
                    <input
                      type="text"
                      value={actionInput.competentPersonName}
                      onChange={(e) => setActionInput({ ...actionInput, competentPersonName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Designation</label>
                    <input
                      type="text"
                      value={actionInput.competentPersonDesignation}
                      onChange={(e) => setActionInput({ ...actionInput, competentPersonDesignation: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Operator Signature</label>
                    <input
                      type="text"
                      value={actionInput.operatorSignature}
                      onChange={(e) => setActionInput({ ...actionInput, operatorSignature: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Sign-1 (Competent Person)</label>
                    <input
                      type="text"
                      value={actionInput.competentPersonSignature}
                      onChange={(e) => setActionInput({ ...actionInput, competentPersonSignature: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeActionModal === 'complete_work' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Person in charge of work</label>
                  <input
                    type="text"
                    value={actionInput.workPersonInChargeName}
                    onChange={(e) => setActionInput({ ...actionInput, workPersonInChargeName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Signature (Work Completion)</label>
                  <input
                    type="text"
                    value={actionInput.workPersonInChargeSignature}
                    onChange={(e) => setActionInput({ ...actionInput, workPersonInChargeSignature: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            {activeActionModal === 'close_deisolate' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">De-isolated By (Competent Person)</label>
                  <input
                    type="text"
                    value={actionInput.deIsolationName}
                    onChange={(e) => setActionInput({ ...actionInput, deIsolationName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Signature</label>
                  <input
                    type="text"
                    value={actionInput.deIsolationSignature}
                    onChange={(e) => setActionInput({ ...actionInput, deIsolationSignature: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">CCR Operator Signature (Re-energized)</label>
                  <input
                    type="text"
                    value={actionInput.ccrOperatorSignatures}
                    onChange={(e) => setActionInput({ ...actionInput, ccrOperatorSignatures: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            {activeActionModal === 'cancel' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Reason for Cancellation</label>
                <input
                  type="text"
                  value={actionInput.cancellationReason}
                  onChange={(e) => setActionInput({ ...actionInput, cancellationReason: e.target.value })}
                  placeholder="Specify operational reason for cancelling this isolation certificate"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handlePerformAction}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span>Confirm & Save Stage</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
