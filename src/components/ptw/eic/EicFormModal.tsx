import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Send,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Zap,
  Shield,
  FileCheck,
  Calendar,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useToast } from '../../../context/ToastContext.tsx';
import { api } from '../../../services/api.ts';
import {
  ElectricalIsolationCertificate,
  ElectricalIsolationPoint,
  OtherIsolationPoint,
  PtwPermit,
} from '../../../types/index.ts';

interface EicFormModalProps {
  certificate?: ElectricalIsolationCertificate | null;
  onClose: () => void;
  onSuccess: (saved: ElectricalIsolationCertificate) => void;
}

const DEFAULT_ISOLATION_POINTS: ElectricalIsolationPoint[] = [
  { id: '1', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
  { id: '2', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
  { id: '3', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
  { id: '4', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
  { id: '5', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
];

const DEFAULT_OTHER_ISOLATIONS: OtherIsolationPoint[] = [
  { id: '1', controlMechanism: '', location: '', inletOutletDrain: '', linesBlanked: '', valvesStatus: '', padlockNo: '', taggedOut: '' },
  { id: '2', controlMechanism: '', location: '', inletOutletDrain: '', linesBlanked: '', valvesStatus: '', padlockNo: '', taggedOut: '' },
  { id: '3', controlMechanism: '', location: '', inletOutletDrain: '', linesBlanked: '', valvesStatus: '', padlockNo: '', taggedOut: '' },
];

export const EicFormModal: React.FC<EicFormModalProps> = ({
  certificate,
  onClose,
  onSuccess,
}) => {
  const { currentUser, locations } = useAuth();
  const toast = useToast();

  const isEditing = Boolean(certificate);
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

  const [ptwList, setPtwList] = useState<PtwPermit[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [workLocation, setWorkLocation] = useState(certificate?.workLocation || '');
  const [locationId, setLocationId] = useState<string>(certificate?.locationId ? String(certificate.locationId) : '');
  const [date, setDate] = useState(certificate?.date || today);
  const [time, setTime] = useState(certificate?.time || nowTime);
  const [equipmentToIsolate, setEquipmentToIsolate] = useState(certificate?.equipmentToIsolate || '');
  const [workDescription, setWorkDescription] = useState(certificate?.workDescription || '');
  const [linkedPtwId, setLinkedPtwId] = useState<string>(certificate?.linkedPtwId ? String(certificate.linkedPtwId) : '');
  const [linkedPtwNumber, setLinkedPtwNumber] = useState(certificate?.linkedPtwNumber || '');

  // Section 2.0 Requisition
  const [requestorName, setRequestorName] = useState(
    certificate?.requestorName || currentUser?.fullName || ''
  );
  const [requestorDesignation, setRequestorDesignation] = useState(
    certificate?.requestorDesignation || currentUser?.jobTitle || 'Electrical Engineer'
  );
  const [requestorSignature, setRequestorSignature] = useState(certificate?.requestorSignature || '');
  const [requestorDate, setRequestorDate] = useState(certificate?.requestorDate || `${today} ${nowTime}`);

  const [approverName, setApproverName] = useState(certificate?.approverName || '');
  const [approverDesignation, setApproverDesignation] = useState(certificate?.approverDesignation || '');
  const [approverSignature, setApproverSignature] = useState(certificate?.approverSignature || '');
  const [approvalRemarks, setApprovalRemarks] = useState(certificate?.approvalRemarks || '');

  // Section 3.1 Verification checkboxes (Initially unchecked)
  const [fusesRemoved, setFusesRemoved] = useState(certificate?.fusesRemoved || false);
  const [mainSwitchedOff, setMainSwitchedOff] = useState(certificate?.mainSwitchedOff || false);
  const [rackedOut, setRackedOut] = useState(certificate?.rackedOut || false);
  const [padlocksFitted, setPadlocksFitted] = useState(certificate?.padlocksFitted || false);
  const [tagsFitted, setTagsFitted] = useState(certificate?.tagsFitted || false);

  // Section 3.2 Electrical isolation points
  const [isolationPoints, setIsolationPoints] = useState<ElectricalIsolationPoint[]>(() => {
    if (certificate?.isolationPoints && certificate.isolationPoints.length > 0) {
      return certificate.isolationPoints;
    }
    return DEFAULT_ISOLATION_POINTS;
  });

  // Section 3.3 Competent Person declaration
  const [competentPersonName, setCompetentPersonName] = useState(certificate?.competentPersonName || '');
  const [competentPersonDesignation, setCompetentPersonDesignation] = useState(certificate?.competentPersonDesignation || '');
  const [operatorSignature, setOperatorSignature] = useState(certificate?.operatorSignature || '');
  const [competentPersonSignature, setCompetentPersonSignature] = useState(certificate?.competentPersonSignature || '');

  // Section 4.0 Other isolations
  const [otherIsolations, setOtherIsolations] = useState<OtherIsolationPoint[]>(() => {
    if (certificate?.otherIsolations && certificate.otherIsolations.length > 0) {
      return certificate.otherIsolations;
    }
    return DEFAULT_OTHER_ISOLATIONS;
  });
  const [otherCompetentPersonName, setOtherCompetentPersonName] = useState(certificate?.otherCompetentPersonName || '');
  const [otherCompetentPersonDesignation, setOtherCompetentPersonDesignation] = useState(certificate?.otherCompetentPersonDesignation || '');
  const [otherCompetentPersonSignature, setOtherCompetentPersonSignature] = useState(certificate?.otherCompetentPersonSignature || '');
  const [otherConfirmationDate, setOtherConfirmationDate] = useState(certificate?.otherConfirmationDate || '');
  const [otherConfirmationTime, setOtherConfirmationTime] = useState(certificate?.otherConfirmationTime || '');

  // Section 5.0 Work completion
  const [workPersonInChargeName, setWorkPersonInChargeName] = useState(certificate?.workPersonInChargeName || '');
  const [workPersonInChargeSignature, setWorkPersonInChargeSignature] = useState(certificate?.workPersonInChargeSignature || '');
  const [workCompletionDate, setWorkCompletionDate] = useState(certificate?.workCompletionDate || '');
  const [workCompletionTime, setWorkCompletionTime] = useState(certificate?.workCompletionTime || '');
  const [completionApproverName, setCompletionApproverName] = useState(certificate?.completionApproverName || '');
  const [completionApproverDesignation, setCompletionApproverDesignation] = useState(certificate?.completionApproverDesignation || '');
  const [completionApproverSignature, setCompletionApproverSignature] = useState(certificate?.completionApproverSignature || '');

  // Section 6.0 De-isolation
  const [deIsolationName, setDeIsolationName] = useState(certificate?.deIsolationName || '');
  const [deIsolationDesignation, setDeIsolationDesignation] = useState(certificate?.deIsolationDesignation || '');
  const [deIsolationSignature, setDeIsolationSignature] = useState(certificate?.deIsolationSignature || '');
  const [deIsolationDate, setDeIsolationDate] = useState(certificate?.deIsolationDate || '');
  const [deIsolationTime, setDeIsolationTime] = useState(certificate?.deIsolationTime || '');
  const [ccrOperatorSignatures, setCcrOperatorSignatures] = useState(certificate?.ccrOperatorSignatures || '');

  // Load active PTWs for optional linking
  useEffect(() => {
    api.getPtwPermits({ status: 'all' })
      .then((res) => setPtwList(res))
      .catch((err) => console.warn('Could not load PTW list for linking:', err));
  }, []);

  const handlePtwSelect = (ptwIdStr: string) => {
    setLinkedPtwId(ptwIdStr);
    if (!ptwIdStr) {
      setLinkedPtwNumber('');
      return;
    }
    const found = ptwList.find((p) => String(p.id) === ptwIdStr);
    if (found) {
      setLinkedPtwNumber(found.permitNumber);
      if (!workLocation && found.specificLocation) {
        setWorkLocation(found.specificLocation);
      }
      if (!locationId && found.locationId) {
        setLocationId(String(found.locationId));
      }
      if (!equipmentToIsolate && found.equipmentNumber) {
        setEquipmentToIsolate(found.equipmentNumber);
      }
    }
  };

  // Table row additions/removals
  const addIsolationPointRow = () => {
    const nextId = String(isolationPoints.length + 1);
    setIsolationPoints([
      ...isolationPoints,
      { id: nextId, location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
    ]);
  };

  const removeIsolationPointRow = (index: number) => {
    if (isolationPoints.length <= 1) return;
    const updated = isolationPoints.filter((_, i) => i !== index);
    setIsolationPoints(updated);
  };

  const updateIsolationPoint = (index: number, field: keyof ElectricalIsolationPoint, val: any) => {
    const updated = [...isolationPoints];
    updated[index] = { ...updated[index], [field]: val };
    setIsolationPoints(updated);
  };

  const addOtherIsolationRow = () => {
    const nextId = String(otherIsolations.length + 1);
    setOtherIsolations([
      ...otherIsolations,
      { id: nextId, controlMechanism: '', location: '', inletOutletDrain: '', linesBlanked: '', valvesStatus: '', padlockNo: '', taggedOut: '' },
    ]);
  };

  const removeOtherIsolationRow = (index: number) => {
    if (otherIsolations.length <= 1) return;
    const updated = otherIsolations.filter((_, i) => i !== index);
    setOtherIsolations(updated);
  };

  const updateOtherIsolation = (index: number, field: keyof OtherIsolationPoint, val: any) => {
    const updated = [...otherIsolations];
    updated[index] = { ...updated[index], [field]: val };
    setOtherIsolations(updated);
  };

  const handleSubmit = async (submitStatus: 'Draft' | 'Submitted for Approval') => {
    setErrorMsg(null);

    // Validation
    if (!workLocation.trim()) {
      setErrorMsg('Section 1.1: Work Location is required.');
      return;
    }
    if (!equipmentToIsolate.trim()) {
      setErrorMsg('Section 1.2: Equipment to be Isolated is required.');
      return;
    }
    if (!workDescription.trim()) {
      setErrorMsg('Section 1.3: Work Description is required.');
      return;
    }
    if (!requestorName.trim()) {
      setErrorMsg('Section 2.1: Requestor Name is required.');
      return;
    }

    if (submitStatus === 'Submitted for Approval' && !requestorSignature.trim()) {
      setErrorMsg('Section 2.1: Requestor signature / acknowledgment is required to submit for approval.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<ElectricalIsolationCertificate> = {
        workLocation,
        locationId: locationId ? Number(locationId) : null,
        equipmentToIsolate,
        date,
        time,
        workDescription,
        linkedPtwId: linkedPtwId ? Number(linkedPtwId) : null,
        linkedPtwNumber,
        status: isEditing && certificate?.status ? certificate.status : submitStatus,
        requestorName,
        requestorDesignation,
        requestorSignature: requestorSignature || (submitStatus === 'Submitted for Approval' ? requestorName : ''),
        requestorDate: requestorDate || `${today} ${nowTime}`,
        approverName,
        approverDesignation,
        approverSignature,
        approvalRemarks,
        fusesRemoved,
        mainSwitchedOff,
        rackedOut,
        padlocksFitted,
        tagsFitted,
        isolationPoints,
        competentPersonName,
        competentPersonDesignation,
        operatorSignature,
        competentPersonSignature,
        otherIsolations,
        otherCompetentPersonName,
        otherCompetentPersonDesignation,
        otherCompetentPersonSignature,
        otherConfirmationDate,
        otherConfirmationTime,
        workPersonInChargeName,
        workPersonInChargeSignature,
        workCompletionDate,
        workCompletionTime,
        completionApproverName,
        completionApproverDesignation,
        completionApproverSignature,
        deIsolationName,
        deIsolationDesignation,
        deIsolationSignature,
        deIsolationDate,
        deIsolationTime,
        ccrOperatorSignatures,
      };

      if (isEditing && certificate) {
        const updated = await api.updateElectricalCertificate(certificate.id, payload);
        toast.success(`Certificate ${updated.certificateNumber} saved successfully.`);
        onSuccess(updated);
      } else {
        payload.status = submitStatus;
        const created = await api.createElectricalCertificate(payload);
        toast.success(`Certificate ${created.certificateNumber} created successfully.`);
        onSuccess(created);
      }
    } catch (err: any) {
      console.error('Failed to save certificate:', err);
      setErrorMsg(err.message || 'Failed to save certificate to database');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isEditing ? `Edit Certificate: ${certificate?.certificateNumber}` : 'Prepare Electrical Isolation Certificate'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {isEditing ? certificate?.status : 'New Protocol'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Power Cement Limited — Standard 6-Section Zero-Energy Isolation Certification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Certificate Header Banner */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Organization</span>
              <span className="font-bold text-white text-sm">Power Cement Limited (PCL)</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Certificate Number</span>
              <span className="font-mono font-extrabold text-sky-400 text-sm">
                {certificate?.certificateNumber || 'EIC-2026-XXXXXX (Auto on Save)'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Current Status</span>
              <span className="font-bold text-emerald-400 uppercase">
                {certificate?.status || 'Draft'}
              </span>
            </div>

            {/* Optional PTW Link */}
            <div className="sm:max-w-xs w-full">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Linked PTW (Optional)
              </label>
              <select
                value={linkedPtwId}
                onChange={(e) => handlePtwSelect(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="">No PTW Linked (Standalone)</option>
                {ptwList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.permitNumber} — {p.specificLocation.substring(0, 30)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION 1.0 — WORK DETAILS */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-black">
                  1.0
                </span>
                <span>Work Details</span>
              </h4>
              <span className="text-[10px] text-slate-400">Mandatory Operational Information</span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              <div className="md:col-span-8">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  1.1 Work Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="e.g. Raw Material Grinding / Substation MCC Room 04"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Plant Area / Location
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
                >
                  <option value="">Select standard plant location...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-8">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  1.2 Equipment to be Isolated <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={equipmentToIsolate}
                  onChange={(e) => setEquipmentToIsolate(e.target.value)}
                  placeholder="e.g. Raw Mill Main Drive Motor 411-BM-01 (6.6 kV, 3200 kW)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-sky-500 text-xs font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Time <span className="text-rose-400">*</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-sky-500 text-xs font-mono"
                />
              </div>

              <div className="md:col-span-12">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  1.3 Work Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Describe scope of work requiring positive zero-energy isolation..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2.0 — ISOLATION REQUISITION */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-black">
                  2.0
                </span>
                <span>Isolation Requisition</span>
              </h4>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs divide-y md:divide-y-0 md:divide-x divide-slate-800">
              {/* 2.1 Requestor */}
              <div className="space-y-3 md:pr-4">
                <h5 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                  <span className="text-sky-400">2.1</span> Requestor
                </h5>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Requestor Name</label>
                  <input
                    type="text"
                    value={requestorName}
                    onChange={(e) => setRequestorName(e.target.value)}
                    placeholder="Full name of person requesting isolation"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    value={requestorDesignation}
                    onChange={(e) => setRequestorDesignation(e.target.value)}
                    placeholder="e.g. Mechanical Maintenance Section Head"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Signature / Acknowledgment</label>
                  <input
                    type="text"
                    value={requestorSignature}
                    onChange={(e) => setRequestorSignature(e.target.value)}
                    placeholder="Sign or type name to acknowledge"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* 2.2 Approved By */}
              <div className="space-y-3 pt-4 md:pt-0 md:pl-4">
                <h5 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                  <span className="text-sky-400">2.2</span> Approved By (Authorization Authority)
                </h5>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    placeholder="Name of approving authority (e.g. E&I Manager)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    value={approverDesignation}
                    onChange={(e) => setApproverDesignation(e.target.value)}
                    placeholder="e.g. Electrical & Instrumentation Manager"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Signature</label>
                  <input
                    type="text"
                    value={approverSignature}
                    onChange={(e) => setApproverSignature(e.target.value)}
                    placeholder="Approver signature (when authorizing)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3.0 — DETAILS OF ELECTRICAL ISOLATION */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-black">
                  3.0
                </span>
                <span>Details of Electrical Isolation</span>
              </h4>
            </div>

            <div className="p-4 space-y-4">
              {/* 3.1 Verification checkboxes */}
              <div>
                <span className="text-xs font-bold text-slate-200 block mb-2">
                  3.1 Electrical Isolation Verification (All checkboxes initially unchecked):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={fusesRemoved}
                      onChange={(e) => setFusesRemoved(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-950"
                    />
                    <span className={fusesRemoved ? 'text-white font-semibold' : 'text-slate-400'}>
                      Fuses removed
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={mainSwitchedOff}
                      onChange={(e) => setMainSwitchedOff(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-950"
                    />
                    <span className={mainSwitchedOff ? 'text-white font-semibold' : 'text-slate-400'}>
                      Main switched off
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={rackedOut}
                      onChange={(e) => setRackedOut(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-950"
                    />
                    <span className={rackedOut ? 'text-white font-semibold' : 'text-slate-400'}>
                      Racked out
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={padlocksFitted}
                      onChange={(e) => setPadlocksFitted(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-950"
                    />
                    <span className={padlocksFitted ? 'text-white font-semibold' : 'text-slate-400'}>
                      Padlocks fitted
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={tagsFitted}
                      onChange={(e) => setTagsFitted(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-950"
                    />
                    <span className={tagsFitted ? 'text-white font-semibold' : 'text-slate-400'}>
                      Tags fitted
                    </span>
                  </label>
                </div>
              </div>

              {/* 3.2 Electrical Isolation Point Register */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">
                    3.2 Electrical Isolation Point Register (Breaker & Lock Matrix):
                  </span>
                  <button
                    type="button"
                    onClick={addIsolationPointRow}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs divide-y divide-slate-800">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 text-[11px] font-bold">
                        <th className="p-2 w-10 text-center">#</th>
                        <th className="p-2">1. Location</th>
                        <th className="p-2">2. Breaker No.</th>
                        <th className="p-2 w-32 text-center">3. Action</th>
                        <th className="p-2 w-32">4. Padlock No.</th>
                        <th className="p-2 w-28 text-center">5. Tag Out</th>
                        <th className="p-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                      {isolationPoints.map((row, idx) => (
                        <tr key={row.id || idx}>
                          <td className="p-2 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.location}
                              onChange={(e) => updateIsolationPoint(idx, 'location', e.target.value)}
                              placeholder="Location / Substation"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.breakerNo}
                              onChange={(e) => updateIsolationPoint(idx, 'breakerNo', e.target.value)}
                              placeholder="Breaker tag / cubicle"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={row.action}
                              onChange={(e) => updateIsolationPoint(idx, 'action', e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                            >
                              <option value="">—</option>
                              <option value="Open">Open</option>
                              <option value="Lock">Lock</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.padlockNo}
                              onChange={(e) => updateIsolationPoint(idx, 'padlockNo', e.target.value)}
                              placeholder="e.g. LOTO-EL-104"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={row.tagOut}
                              onChange={(e) => updateIsolationPoint(idx, 'tagOut', e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                            >
                              <option value="">—</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            {isolationPoints.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeIsolationPointRow(idx)}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded cursor-pointer"
                                title="Remove row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3.3 Confirmation by Competent Person */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-200 block">
                  3.3 Confirmation by Competent Person:
                </span>
                <p className="italic text-xs text-sky-300 leading-relaxed bg-sky-950/20 border-l-2 border-sky-400 pl-3 py-1.5">
                  "I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed including CCR-Operator."
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Competent Person Name</label>
                    <input
                      type="text"
                      value={competentPersonName}
                      onChange={(e) => setCompetentPersonName(e.target.value)}
                      placeholder="Name of electrical engineer"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Designation</label>
                    <input
                      type="text"
                      value={competentPersonDesignation}
                      onChange={(e) => setCompetentPersonDesignation(e.target.value)}
                      placeholder="e.g. Senior Electrical Engineer"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Signature of Operator</label>
                    <input
                      type="text"
                      value={operatorSignature}
                      onChange={(e) => setOperatorSignature(e.target.value)}
                      placeholder="CCR Operator signature"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Sign-1 (Competent Person)</label>
                    <input
                      type="text"
                      value={competentPersonSignature}
                      onChange={(e) => setCompetentPersonSignature(e.target.value)}
                      placeholder="Competent Person signature"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4.0 — OTHER TYPES OF ISOLATION */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-black">
                  4.0
                </span>
                <span>Other Types of Isolation (Mechanical / Fluid / Process)</span>
              </h4>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">
                    4.1 Mechanical & Fluid Isolation Register:
                  </span>
                  <button
                    type="button"
                    onClick={addOtherIsolationRow}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs divide-y divide-slate-800">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 text-[11px] font-bold">
                        <th className="p-2 w-10 text-center">#</th>
                        <th className="p-2">1. Control Mechanism</th>
                        <th className="p-2">2. Location</th>
                        <th className="p-2 w-28 text-center">3. I / O / D</th>
                        <th className="p-2 w-28 text-center">4. Lines Blanked</th>
                        <th className="p-2 w-28 text-center">5. Valves</th>
                        <th className="p-2 w-32">6. Padlock No.</th>
                        <th className="p-2 w-24 text-center">7. Tagged</th>
                        <th className="p-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                      {otherIsolations.map((row, idx) => (
                        <tr key={row.id || idx}>
                          <td className="p-2 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.controlMechanism}
                              onChange={(e) => updateOtherIsolation(idx, 'controlMechanism', e.target.value)}
                              placeholder="Valve / Damper / Flange"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.location}
                              onChange={(e) => updateOtherIsolation(idx, 'location', e.target.value)}
                              placeholder="Physical location"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={row.inletOutletDrain}
                              onChange={(e) => updateOtherIsolation(idx, 'inletOutletDrain', e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                            >
                              <option value="">—</option>
                              <option value="Inlet">Inlet</option>
                              <option value="Outlet">Outlet</option>
                              <option value="Drain">Drain</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={row.linesBlanked}
                              onChange={(e) => updateOtherIsolation(idx, 'linesBlanked', e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                            >
                              <option value="">—</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={row.valvesStatus}
                              onChange={(e) => updateOtherIsolation(idx, 'valvesStatus', e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                            >
                              <option value="">—</option>
                              <option value="Open">Open</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.padlockNo}
                              onChange={(e) => updateOtherIsolation(idx, 'padlockNo', e.target.value)}
                              placeholder="LOTO-ME-xxx"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={row.taggedOut}
                              onChange={(e) => updateOtherIsolation(idx, 'taggedOut', e.target.value as any)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                            >
                              <option value="">—</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            {otherIsolations.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOtherIsolationRow(idx)}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded cursor-pointer"
                                title="Remove row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4.2 Isolation Confirmation */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-200 block">
                  4.2 Isolation Confirmation:
                </span>
                <p className="italic text-xs text-sky-300 leading-relaxed bg-sky-950/20 border-l-2 border-sky-400 pl-3 py-1.5">
                  "I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed."
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={otherCompetentPersonName}
                      onChange={(e) => setOtherCompetentPersonName(e.target.value)}
                      placeholder="Competent person name"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Designation</label>
                    <input
                      type="text"
                      value={otherCompetentPersonDesignation}
                      onChange={(e) => setOtherCompetentPersonDesignation(e.target.value)}
                      placeholder="Designation"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Signature</label>
                    <input
                      type="text"
                      value={otherCompetentPersonSignature}
                      onChange={(e) => setOtherCompetentPersonSignature(e.target.value)}
                      placeholder="Signature"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={otherConfirmationDate}
                      onChange={(e) => setOtherConfirmationDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Time</label>
                    <input
                      type="time"
                      value={otherConfirmationTime}
                      onChange={(e) => setOtherConfirmationTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5.0 — COMPLETION OF THE WORK */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-black">
                  5.0
                </span>
                <span>Completion of the Work</span>
              </h4>
            </div>

            <div className="p-4 space-y-4">
              {/* 5.1 Work Completion Declaration */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-200 block">
                  5.1 Work Completion Declaration:
                </span>
                <p className="italic text-xs text-sky-300 leading-relaxed bg-sky-950/20 border-l-2 border-sky-400 pl-3 py-1.5">
                  "I hereby confirm that the work detailed in section 1 above is completed, the personnel and equipment withdrawn and the Isolation may now be removed by a competent responsible person."
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Person in charge of work</label>
                    <input
                      type="text"
                      value={workPersonInChargeName}
                      onChange={(e) => setWorkPersonInChargeName(e.target.value)}
                      placeholder="Name of work lead"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Signature</label>
                    <input
                      type="text"
                      value={workPersonInChargeSignature}
                      onChange={(e) => setWorkPersonInChargeSignature(e.target.value)}
                      placeholder="Sign / acknowledge"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={workCompletionDate}
                      onChange={(e) => setWorkCompletionDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Time</label>
                    <input
                      type="time"
                      value={workCompletionTime}
                      onChange={(e) => setWorkCompletionTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* 5.2 Completion Approval */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-200 block">
                  5.2 Completion Approval:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Approved By — Name</label>
                    <input
                      type="text"
                      value={completionApproverName}
                      onChange={(e) => setCompletionApproverName(e.target.value)}
                      placeholder="Approver name"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Designation</label>
                    <input
                      type="text"
                      value={completionApproverDesignation}
                      onChange={(e) => setCompletionApproverDesignation(e.target.value)}
                      placeholder="Approver designation"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Signature</label>
                    <input
                      type="text"
                      value={completionApproverSignature}
                      onChange={(e) => setCompletionApproverSignature(e.target.value)}
                      placeholder="Approver signature"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6.0 — CONFIRMATION OF DE-ISOLATION */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-black">
                  6.0
                </span>
                <span>Confirmation of De-Isolation</span>
              </h4>
            </div>

            <div className="p-4 space-y-3">
              <span className="text-xs font-bold text-slate-200 block">
                6.1 De-Isolation Declaration:
              </span>
              <p className="italic text-xs text-sky-300 leading-relaxed bg-sky-950/20 border-l-2 border-sky-400 pl-3 py-1.5">
                "I hereby confirm that the Isolations detailed in section 3/4 have been removed and the system re-energized."
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={deIsolationName}
                    onChange={(e) => setDeIsolationName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    value={deIsolationDesignation}
                    onChange={(e) => setDeIsolationDesignation(e.target.value)}
                    placeholder="Designation"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Signature</label>
                  <input
                    type="text"
                    value={deIsolationSignature}
                    onChange={(e) => setDeIsolationSignature(e.target.value)}
                    placeholder="Signature"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={deIsolationDate}
                    onChange={(e) => setDeIsolationDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={deIsolationTime}
                    onChange={(e) => setDeIsolationTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-5 pt-1">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    CCR Operator Signatures (System Re-energization Confirmation)
                  </label>
                  <input
                    type="text"
                    value={ccrOperatorSignatures}
                    onChange={(e) => setCcrOperatorSignatures(e.target.value)}
                    placeholder="CCR Senior Panel Operator signature acknowledging normal power restore"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('Draft')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-400" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('Submitted for Approval')}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-950 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save Certificate' : 'Submit for Approval'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
