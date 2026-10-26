import React, { useState } from 'react';
import {
  X,
  Printer,
  Zap,
  Lock,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { ElectricalIsolationCertificate, EicStatus } from '../../types/index.ts';
import { EicPrintView } from './EicPrintView.tsx';

interface EicDetailsModalProps {
  certificate: ElectricalIsolationCertificate;
  onClose: () => void;
  onUpdated: () => void;
}

export const EicDetailsModal: React.FC<EicDetailsModalProps> = ({ certificate, onClose, onUpdated }) => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [showPrintView, setShowPrintView] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'electrical' | 'other' | 'completion' | 'deisolation'>('details');
  const [loadingAction, setLoadingAction] = useState(false);

  // Sub-dialogs
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvedByName, setApprovedByName] = useState(currentUser?.fullName || '');
  const [approvedByDesignation, setApprovedByDesignation] = useState(currentUser?.jobTitle || 'Electrical Section Head');
  const [approvedBySignature, setApprovedBySignature] = useState(currentUser?.fullName || '');

  const [showConfirmIsoModal, setShowConfirmIsoModal] = useState(false);
  const [fusesRemoved, setFusesRemoved] = useState(certificate.fusesRemoved || false);
  const [mainSwitchedOff, setMainSwitchedOff] = useState(certificate.mainSwitchedOff || false);
  const [rackedOut, setRackedOut] = useState(certificate.rackedOut || false);
  const [padlocksFitted, setPadlocksFitted] = useState(certificate.padlocksFitted || false);
  const [tagsFitted, setTagsFitted] = useState(certificate.tagsFitted || false);
  const [isoCompetentName, setIsoCompetentName] = useState(certificate.electricalCompetentName || currentUser?.fullName || '');
  const [isoCompetentDesignation, setIsoCompetentDesignation] = useState(certificate.electricalCompetentDesignation || 'Competent Electrical Person');
  const [isoOperatorSig, setIsoOperatorSig] = useState(certificate.electricalOperatorSignature || 'CCR Shift Operator');

  const [showCompleteWorkModal, setShowCompleteWorkModal] = useState(false);
  const [workCompletionPerson, setWorkCompletionPerson] = useState(currentUser?.fullName || '');
  const [workCompletionSignature, setWorkCompletionSignature] = useState(currentUser?.fullName || '');
  const [workCompletionDate, setWorkCompletionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [workCompletionTime, setWorkCompletionTime] = useState(() => new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [completionApprovedByName, setCompletionApprovedByName] = useState('');
  const [completionApprovedByDesignation, setCompletionApprovedByDesignation] = useState('');

  const [showDeisoModal, setShowDeisoModal] = useState(false);
  const [deIsolationName, setDeIsolationName] = useState(currentUser?.fullName || '');
  const [deIsolationDesignation, setDeIsolationDesignation] = useState(currentUser?.jobTitle || 'Electrical Specialist');
  const [deIsolationSignature, setDeIsolationSignature] = useState(currentUser?.fullName || '');
  const [deIsolationDate, setDeIsolationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deIsolationTime, setDeIsolationTime] = useState(() => new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [ccrOperatorSignature, setCcrOperatorSignature] = useState('CCR Operator Re-energization Confirmed');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const statusBadge = (status: EicStatus) => {
    const map: Record<EicStatus, string> = {
      Draft: 'bg-slate-800 text-slate-300 border-slate-700',
      'Submitted for Approval': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      Approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      'Approved / Authorized': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      'Isolation Confirmed': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Work in Progress': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      'Work Completed': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'De-isolation Confirmed': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      Cancelled: 'bg-rose-900/30 text-rose-400 border-rose-800/50',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${map[status] || map.Draft}`}>
        {status}
      </span>
    );
  };

  // Workflow Handlers
  const handleSubmitForApproval = async () => {
    setLoadingAction(true);
    try {
      await api.submitIsolationCertificate(certificate.id);
      toast.success('Certificate submitted for authorization.');
      onUpdated();
    } catch (err: any) {
      toast.error('Submission failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApprove = async () => {
    if (!approvedByName.trim()) {
      toast.error('Approver Name is mandatory.');
      return;
    }
    setLoadingAction(true);
    try {
      await api.approveIsolationCertificate(certificate.id, {
        approvedByName: approvedByName.trim(),
        approvedByDesignation: approvedByDesignation.trim(),
        approvedBySignature: approvedBySignature.trim() || approvedByName.trim(),
      });
      toast.success('Isolation Requisition Approved (Section 2.0).');
      setShowApproveModal(false);
      onUpdated();
    } catch (err: any) {
      toast.error('Approval failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmIsolation = async () => {
    if (!isoCompetentName.trim()) {
      toast.error('Name of Competent Person performing isolation is mandatory.');
      return;
    }
    setLoadingAction(true);
    try {
      await api.confirmIsolation(certificate.id, {
        fusesRemoved,
        mainSwitchedOff,
        rackedOut,
        padlocksFitted,
        tagsFitted,
        electricalCompetentName: isoCompetentName.trim(),
        electricalCompetentDesignation: isoCompetentDesignation.trim(),
        electricalCompetentSignature: isoCompetentName.trim(),
        electricalOperatorSignature: isoOperatorSig.trim(),
        electricalPoints: certificate.electricalPoints,
        otherPoints: certificate.otherPoints,
      });
      toast.success('Physical Isolation Confirmed (Section 3.0 & 4.0).');
      setShowConfirmIsoModal(false);
      onUpdated();
    } catch (err: any) {
      toast.error('Isolation confirmation failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStartWork = async () => {
    setLoadingAction(true);
    try {
      await api.startIsolationWork(certificate.id);
      toast.success('Work commenced under isolated conditions.');
      onUpdated();
    } catch (err: any) {
      toast.error('Status update failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCompleteWork = async () => {
    if (!workCompletionPerson.trim()) {
      toast.error('Person in Charge of Work (Section 5.1) is mandatory.');
      return;
    }
    setLoadingAction(true);
    try {
      await api.completeIsolationWork(certificate.id, {
        workCompletionPerson: workCompletionPerson.trim(),
        workCompletionSignature: workCompletionSignature.trim() || workCompletionPerson.trim(),
        workCompletionDate,
        workCompletionTime,
        completionApprovedByName: completionApprovedByName.trim(),
        completionApprovedByDesignation: completionApprovedByDesignation.trim(),
      });
      toast.success('Work completion recorded. (Note: System remains isolated until Section 6 de-isolation).');
      setShowCompleteWorkModal(false);
      onUpdated();
    } catch (err: any) {
      toast.error('Work completion recording failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmDeisolation = async () => {
    if (!deIsolationName.trim()) {
      toast.error('Competent Person Name (Section 6.1) is mandatory for de-isolation.');
      return;
    }
    setLoadingAction(true);
    try {
      await api.confirmDeisolation(certificate.id, {
        deIsolationName: deIsolationName.trim(),
        deIsolationDesignation: deIsolationDesignation.trim(),
        deIsolationSignature: deIsolationSignature.trim() || deIsolationName.trim(),
        deIsolationDate,
        deIsolationTime,
        ccrOperatorSignature: ccrOperatorSignature.trim(),
      });
      toast.success('De-isolation confirmed. Equipment normalized & re-energized in CCR.');
      setShowDeisoModal(false);
      onUpdated();
    } catch (err: any) {
      toast.error('De-isolation confirmation failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Cancellation reason is required.');
      return;
    }
    setLoadingAction(true);
    try {
      await api.cancelIsolationCertificate(certificate.id, cancellationReason.trim());
      toast.warning('Certificate cancelled.');
      setShowCancelModal(false);
      onUpdated();
    } catch (err: any) {
      toast.error('Cancellation failed: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-extrabold text-amber-400">
                {certificate.certificateNumber}
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-semibold text-slate-200 text-xs">
                {certificate.equipmentToIsolate}
              </span>
              {certificate.ptwNumber && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  PTW: {certificate.ptwNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {statusBadge(certificate.status)}
              <button
                type="button"
                onClick={() => setShowPrintView(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Print Official PCL Isolation Certificate"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Form</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 py-2 gap-2 text-xs font-semibold overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              1.0 & 2.0 Work & Requisition
            </button>
            <button
              onClick={() => setActiveTab('electrical')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'electrical'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>3.0 Electrical Isolation</span>
              <span className="font-mono text-[10px] px-1.5 rounded-full bg-slate-800 text-slate-300">
                {certificate.electricalPoints?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('other')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'other'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>4.0 Other Isolations</span>
              <span className="font-mono text-[10px] px-1.5 rounded-full bg-slate-800 text-slate-300">
                {certificate.otherPoints?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completion')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'completion'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              5.0 Work Completion
            </button>
            <button
              onClick={() => setActiveTab('deisolation')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'deisolation'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              6.0 De-Isolation & CCR
            </button>
          </div>

          {/* Modal Tab Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
            {/* TAB: DETAILS & REQUISITION */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Section 1.0 Summary */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-amber-400 uppercase text-xs">Section 1.0 — Work Details</span>
                    <span className="font-mono text-slate-400 text-[11px]">{certificate.requestDate} {certificate.requestTime}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">1.1 Work Location</span>
                      <span className="font-semibold text-slate-200 mt-0.5 block">{certificate.workLocation}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Equipment Tag</span>
                      <span className="font-semibold text-slate-200 font-mono mt-0.5 block">{certificate.equipmentTag || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Associated PTW</span>
                      <span className="font-semibold text-slate-200 font-mono mt-0.5 block">{certificate.ptwNumber || 'None'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">1.2 Equipment to be Isolated</span>
                    <p className="font-medium text-slate-100 text-xs mt-1">{certificate.equipmentToIsolate}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">1.3 Work Description</span>
                    <p className="font-medium text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">{certificate.workDescription}</p>
                  </div>
                </div>

                {/* Section 2.0 Requisition */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
                  <span className="font-bold text-amber-400 uppercase text-xs block pb-2 border-b border-slate-800">
                    Section 2.0 — Isolation Requisition & Authorization
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                      <span className="font-bold text-slate-300 text-xs block">2.1 Requested By</span>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold">Name:</span>{' '}
                        <span className="font-semibold text-slate-200">{certificate.requestorName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold">Designation:</span>{' '}
                        <span className="text-slate-200">{certificate.requestorDesignation || 'Engineer'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold">Signature:</span>{' '}
                        <span className="font-mono text-emerald-400 font-bold">{certificate.requestorSignature || 'Signed'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                      <span className="font-bold text-slate-300 text-xs block">2.2 Approved By</span>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold">Approver:</span>{' '}
                        <span className="font-semibold text-slate-200">{certificate.approvedByName || 'Pending Authorization'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold">Designation:</span>{' '}
                        <span className="text-slate-200">{certificate.approvedByDesignation || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold">Signature:</span>{' '}
                        <span className="font-mono text-slate-200 font-semibold">{certificate.approvedBySignature || 'Pending'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ELECTRICAL ISOLATION */}
            {activeTab === 'electrical' && (
              <div className="space-y-4">
                {/* 3.1 Verification Checkboxes */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="font-bold text-amber-400 uppercase text-xs block pb-1 border-b border-slate-800">
                    3.1 Electrical Isolation Verification Controls Taken
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${certificate.fusesRemoved ? 'bg-emerald-400' : 'bg-slate-700'}`}></span>
                      <span className={certificate.fusesRemoved ? 'font-bold text-slate-100' : 'text-slate-500'}>Fuses removed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${certificate.mainSwitchedOff ? 'bg-emerald-400' : 'bg-slate-700'}`}></span>
                      <span className={certificate.mainSwitchedOff ? 'font-bold text-slate-100' : 'text-slate-500'}>Main switched off</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${certificate.rackedOut ? 'bg-emerald-400' : 'bg-slate-700'}`}></span>
                      <span className={certificate.rackedOut ? 'font-bold text-slate-100' : 'text-slate-500'}>Racked out</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${certificate.padlocksFitted ? 'bg-emerald-400' : 'bg-slate-700'}`}></span>
                      <span className={certificate.padlocksFitted ? 'font-bold text-slate-100' : 'text-slate-500'}>Padlocks fitted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${certificate.tagsFitted ? 'bg-emerald-400' : 'bg-slate-700'}`}></span>
                      <span className={certificate.tagsFitted ? 'font-bold text-slate-100' : 'text-slate-500'}>Tags fitted</span>
                    </div>
                  </div>
                </div>

                {/* 3.2 Electrical Isolation Point Register */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <span className="font-bold text-amber-400 uppercase text-xs block pb-1 border-b border-slate-800">
                    3.2 Electrical Isolation Point Register
                  </span>
                  <div className="border border-slate-800 rounded-lg overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                          <th className="py-2 px-3 w-12 text-center">#</th>
                          <th className="py-2 px-3">Location</th>
                          <th className="py-2 px-3">Breaker No.</th>
                          <th className="py-2 px-3 text-center">Action</th>
                          <th className="py-2 px-3">Padlock No.</th>
                          <th className="py-2 px-3 text-center">Tag Out</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {certificate.electricalPoints?.map((pt, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 text-slate-200">{pt.location || '—'}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-200">{pt.breakerNo || '—'}</td>
                            <td className="py-2 px-3 text-center">
                              {pt.action ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  pt.action === 'Lock' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {pt.action}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-300">{pt.padlockNo || '—'}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`font-semibold ${pt.tagOut === 'Yes' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {pt.tagOut || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3.3 Confirmation by Competent Person */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="font-bold text-amber-400 uppercase text-xs block pb-1 border-b border-slate-800">
                    3.3 Confirmation by Competent Person
                  </span>
                  <p className="text-[11px] text-slate-400 italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    “I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed including CCR-Operator.”
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Competent Person:</span>
                      <span className="font-semibold text-slate-200">{certificate.electricalCompetentName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Designation:</span>
                      <span className="text-slate-200">{certificate.electricalCompetentDesignation || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Operator Signature:</span>
                      <span className="font-mono text-slate-200">{certificate.electricalOperatorSignature || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Sign-1 (Competent Person):</span>
                      <span className="font-mono text-emerald-400 font-bold">{certificate.electricalCompetentSignature || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: OTHER ISOLATIONS */}
            {activeTab === 'other' && (
              <div className="space-y-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <span className="font-bold text-amber-400 uppercase text-xs block pb-1 border-b border-slate-800">
                    4.1 Other Types of Isolation Register (Mechanical / Process / Piping)
                  </span>
                  <div className="border border-slate-800 rounded-lg overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                          <th className="py-2 px-3 w-12 text-center">#</th>
                          <th className="py-2 px-3">Control Mechanism</th>
                          <th className="py-2 px-3">Location</th>
                          <th className="py-2 px-3 text-center">I / O / D</th>
                          <th className="py-2 px-3 text-center">Blanked</th>
                          <th className="py-2 px-3 text-center">Valves</th>
                          <th className="py-2 px-3">Padlock No.</th>
                          <th className="py-2 px-3 text-center">Tagged Out</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {certificate.otherPoints?.map((pt, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 text-slate-200">{pt.controlMechanism || '—'}</td>
                            <td className="py-2 px-3 text-slate-300">{pt.location || '—'}</td>
                            <td className="py-2 px-3 text-center font-bold text-slate-200">{pt.inletOutletDrain || '—'}</td>
                            <td className="py-2 px-3 text-center">{pt.blanked || '—'}</td>
                            <td className="py-2 px-3 text-center">{pt.valves || '—'}</td>
                            <td className="py-2 px-3 font-mono text-slate-300">{pt.padlockNo || '—'}</td>
                            <td className="py-2 px-3 text-center font-semibold text-emerald-400">{pt.taggedOut || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="font-bold text-amber-400 uppercase text-xs block pb-1 border-b border-slate-800">
                    4.2 Isolation Confirmation Declaration
                  </span>
                  <p className="text-[11px] text-slate-400 italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    “I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed.”
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Competent Person:</span>
                      <span className="font-semibold text-slate-200">{certificate.otherCompetentName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Designation:</span>
                      <span className="text-slate-200">{certificate.otherCompetentDesignation || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Signature:</span>
                      <span className="font-mono text-slate-200">{certificate.otherCompetentSignature || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Date & Time:</span>
                      <span className="text-slate-200">{certificate.otherIsolationDate} {certificate.otherIsolationTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: WORK COMPLETION */}
            {activeTab === 'completion' && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
                <span className="font-bold text-amber-400 uppercase text-xs block pb-2 border-b border-slate-800">
                  Section 5.0 — Completion of the Work
                </span>

                <div className="space-y-2">
                  <span className="font-bold text-slate-300 text-xs block">5.1 Work Completion Declaration:</span>
                  <p className="text-[11px] text-slate-400 italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    “I hereby confirm that the work detailed in section 1 above is completed, the personnel and equipment withdrawn and the Isolation may now be removed by a competent responsible person.”
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Person in Charge of Work:</span>
                      <span className="font-semibold text-slate-200 text-xs">{certificate.workCompletionPerson || 'Pending Work Completion'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Signature:</span>
                      <span className="font-mono text-emerald-400 font-bold">{certificate.workCompletionSignature || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Date:</span>
                      <span className="text-slate-200">{certificate.workCompletionDate || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Time:</span>
                      <span className="text-slate-200">{certificate.workCompletionTime || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300 text-xs block">5.2 Completion Approval:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Approved By:</span>
                      <span className="font-semibold text-slate-200">{certificate.completionApprovedByName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Designation:</span>
                      <span className="text-slate-200">{certificate.completionApprovedByDesignation || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Signature:</span>
                      <span className="font-mono text-slate-200">{certificate.completionApprovedBySignature || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DE-ISOLATION */}
            {activeTab === 'deisolation' && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
                <span className="font-bold text-amber-400 uppercase text-xs block pb-2 border-b border-slate-800">
                  Section 6.0 — Confirmation of De-Isolation & CCR Normalization
                </span>

                <div className="space-y-2">
                  <span className="font-bold text-slate-300 text-xs block">6.1 De-Isolation Declaration:</span>
                  <p className="text-[11px] text-slate-400 italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    “I hereby confirm that the Isolations detailed in section 3/4 have been removed and the system re-energized.”
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Competent Person:</span>
                      <span className="font-semibold text-slate-200">{certificate.deIsolationName || 'Pending De-isolation'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Designation:</span>
                      <span className="text-slate-200">{certificate.deIsolationDesignation || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Signature:</span>
                      <span className="font-mono text-emerald-400 font-bold">{certificate.deIsolationSignature || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Date:</span>
                      <span className="text-slate-200">{certificate.deIsolationDate || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Time:</span>
                      <span className="text-slate-200">{certificate.deIsolationTime || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">CCR Operator Signatures</span>
                  <span className="font-mono text-slate-200 font-semibold block">{certificate.ccrOperatorSignature || 'Pending'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div className="text-[11px] text-slate-400">
              Current Stage: <span className="font-bold text-amber-400 uppercase">{certificate.status}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Draft: Submit for Approval */}
              {certificate.status === 'Draft' && (
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={handleSubmitForApproval}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors shadow cursor-pointer"
                >
                  Submit for Approval
                </button>
              )}

              {/* Submitted for Approval: Approve Requisition */}
              {certificate.status === 'Submitted for Approval' && (
                <button
                  type="button"
                  onClick={() => setShowApproveModal(true)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Approve Requisition (Sec 2.0)</span>
                </button>
              )}

              {/* Approved: Confirm Physical Isolation */}
              {certificate.status === 'Approved' && (
                <button
                  type="button"
                  onClick={() => setShowConfirmIsoModal(true)}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirm Physical Isolation (Sec 3.0 & 4.0)</span>
                </button>
              )}

              {/* Isolation Confirmed: Start Work */}
              {certificate.status === 'Isolation Confirmed' && (
                <>
                  <button
                    type="button"
                    disabled={loadingAction}
                    onClick={handleStartWork}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Commence Work (Work in Progress)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCompleteWorkModal(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Direct Work Completion
                  </button>
                </>
              )}

              {/* Work in Progress: Complete Work */}
              {certificate.status === 'Work in Progress' && (
                <button
                  type="button"
                  onClick={() => setShowCompleteWorkModal(true)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Work (Sec 5.0)</span>
                </button>
              )}

              {/* Work Completed: Confirm De-isolation */}
              {certificate.status === 'Work Completed' && (
                <button
                  type="button"
                  onClick={() => setShowDeisoModal(true)}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-colors shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirm De-Isolation & Re-energize (Sec 6.0)</span>
                </button>
              )}

              {/* Cancellation Option for open statuses */}
              {certificate.status !== 'De-isolation Confirmed' && certificate.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel Certificate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* APPROVE REQUISITION MODAL */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Section 2.2 — Approve Isolation Requisition</span>
            </h3>
            <p className="text-xs text-slate-400">
              Authorize isolation of {certificate.equipmentToIsolate} ({certificate.certificateNumber}).
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Approver Name <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={approvedByName}
                  onChange={(e) => setApprovedByName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  value={approvedByDesignation}
                  onChange={(e) => setApprovedByDesignation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Electronic Signature</label>
                <input
                  type="text"
                  value={approvedBySignature}
                  onChange={(e) => setApprovedBySignature(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
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
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM PHYSICAL ISOLATION MODAL */}
      {showConfirmIsoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span>Section 3.3 — Confirm Physical Isolation</span>
            </h3>
            <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-800">
              “I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed including CCR-Operator.”
            </p>

            {/* Checkboxes */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={fusesRemoved}
                  onChange={(e) => setFusesRemoved(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                />
                <span>Fuses removed</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={mainSwitchedOff}
                  onChange={(e) => setMainSwitchedOff(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                />
                <span>Main switched off</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={rackedOut}
                  onChange={(e) => setRackedOut(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                />
                <span>Racked out</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={padlocksFitted}
                  onChange={(e) => setPadlocksFitted(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                />
                <span>Padlocks fitted</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={tagsFitted}
                  onChange={(e) => setTagsFitted(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                />
                <span>Tags fitted</span>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Competent Person Name <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={isoCompetentName}
                  onChange={(e) => setIsoCompetentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  value={isoCompetentDesignation}
                  onChange={(e) => setIsoCompetentDesignation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operator Signature / Acknowledged</label>
                <input
                  type="text"
                  value={isoOperatorSig}
                  onChange={(e) => setIsoOperatorSig(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmIsoModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleConfirmIsolation}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm Isolation (LOTO Locked)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE WORK MODAL */}
      {showCompleteWorkModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>Section 5.0 — Completion of the Work</span>
            </h3>
            <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-800">
              “I hereby confirm that the work detailed in section 1 above is completed, the personnel and equipment withdrawn and the Isolation may now be removed by a competent responsible person.”
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Person in Charge of Work <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={workCompletionPerson}
                  onChange={(e) => setWorkCompletionPerson(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Signature</label>
                <input
                  type="text"
                  value={workCompletionSignature}
                  onChange={(e) => setWorkCompletionSignature(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Completion Date</label>
                  <input
                    type="date"
                    value={workCompletionDate}
                    onChange={(e) => setWorkCompletionDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Completion Time</label>
                  <input
                    type="text"
                    value={workCompletionTime}
                    onChange={(e) => setWorkCompletionTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-slate-400 font-semibold mb-1">5.2 Completion Approval By (Optional)</label>
                <input
                  type="text"
                  value={completionApprovedByName}
                  onChange={(e) => setCompletionApprovedByName(e.target.value)}
                  placeholder="Approver Full Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCompleteWorkModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleCompleteWork}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Record Work Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DE-ISOLATION MODAL */}
      {showDeisoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-400" />
              <span>Section 6.0 — Confirmation of De-Isolation</span>
            </h3>
            <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2.5 rounded border border-slate-800">
              “I hereby confirm that the Isolations detailed in section 3/4 have been removed and the system re-energized.”
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Competent Person Name <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={deIsolationName}
                  onChange={(e) => setDeIsolationName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  value={deIsolationDesignation}
                  onChange={(e) => setDeIsolationDesignation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">De-isolation Date</label>
                  <input
                    type="date"
                    value={deIsolationDate}
                    onChange={(e) => setDeIsolationDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">De-isolation Time</label>
                  <input
                    type="text"
                    value={deIsolationTime}
                    onChange={(e) => setDeIsolationTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">CCR Operator Signature / Acceptance</label>
                <input
                  type="text"
                  value={ccrOperatorSignature}
                  onChange={(e) => setCcrOperatorSignature(e.target.value)}
                  placeholder="CCR Operator Name & Confirmation"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeisoModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleConfirmDeisolation}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm De-Isolation & Re-energize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Cancel Certificate {certificate.certificateNumber}</span>
            </h3>
            <p className="text-xs text-slate-400">
              State the reason for cancelling this isolation certificate.
            </p>
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Cancellation Reason <span className="text-rose-400">*</span></label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="State why this certificate is being cancelled..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Close
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={handleCancel}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT VIEW MODAL */}
      {showPrintView && (
        <EicPrintView certificate={certificate} onClose={() => setShowPrintView(false)} />
      )}
    </>
  );
};
