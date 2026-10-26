import React, { useState } from 'react';
import {
  X,
  Zap,
  Plus,
  Trash2,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { ElectricalIsolationPoint, OtherIsolationPoint } from '../../types/index.ts';

interface EicCreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const EicCreateModal: React.FC<EicCreateModalProps> = ({ onClose, onCreated }) => {
  const { currentUser, locations, departments } = useAuth();
  const toast = useToast();

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

  // Section 1.0: Work Details
  const [workLocation, setWorkLocation] = useState('');
  const [locationId, setLocationId] = useState<number | ''>(locations[0]?.id || '');
  const [departmentId, setDepartmentId] = useState<number | ''>(departments[0]?.id || '');
  const [requestDate, setRequestDate] = useState(today);
  const [requestTime, setRequestTime] = useState(nowTime);
  const [equipmentToIsolate, setEquipmentToIsolate] = useState('');
  const [equipmentTag, setEquipmentTag] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [ptwNumber, setPtwNumber] = useState('');

  // Section 2.0: Isolation Requisition
  const [requestorName, setRequestorName] = useState(currentUser?.fullName || '');
  const [requestorDesignation, setRequestorDesignation] = useState(currentUser?.jobTitle || 'Lead Engineer');
  const [requestorSignature, setRequestorSignature] = useState(currentUser?.fullName || '');
  const [approvedByName, setApprovedByName] = useState('');
  const [approvedByDesignation, setApprovedByDesignation] = useState('');

  // Section 3.0: Details of Electrical Isolation
  // 3.1 Verification checkboxes - NOT preselected
  const [fusesRemoved, setFusesRemoved] = useState(false);
  const [mainSwitchedOff, setMainSwitchedOff] = useState(false);
  const [rackedOut, setRackedOut] = useState(false);
  const [padlocksFitted, setPadlocksFitted] = useState(false);
  const [tagsFitted, setTagsFitted] = useState(false);

  // 3.2 Electrical Points Register (at least 5 rows)
  const [electricalPoints, setElectricalPoints] = useState<ElectricalIsolationPoint[]>([
    { id: '1', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
    { id: '2', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
    { id: '3', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
    { id: '4', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
    { id: '5', location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
  ]);

  // 3.3 Confirmation by Competent Person
  const [electricalCompetentName, setElectricalCompetentName] = useState('');
  const [electricalCompetentDesignation, setElectricalCompetentDesignation] = useState('Competent Electrical Person');
  const [electricalOperatorSignature, setElectricalOperatorSignature] = useState('');

  // Section 4.0: Other Types of Isolation (at least 3 rows)
  const [otherPoints, setOtherPoints] = useState<OtherIsolationPoint[]>([
    { id: '1', controlMechanism: '', location: '', inletOutletDrain: '', blanked: '', valves: '', padlockNo: '', taggedOut: '' },
    { id: '2', controlMechanism: '', location: '', inletOutletDrain: '', blanked: '', valves: '', padlockNo: '', taggedOut: '' },
    { id: '3', controlMechanism: '', location: '', inletOutletDrain: '', blanked: '', valves: '', padlockNo: '', taggedOut: '' },
  ]);

  // 4.2 Other Isolation Confirmation
  const [otherCompetentName, setOtherCompetentName] = useState('');
  const [otherCompetentDesignation, setOtherCompetentDesignation] = useState('Mechanical / Process Specialist');
  const [otherIsolationDate, setOtherIsolationDate] = useState(today);
  const [otherIsolationTime, setOtherIsolationTime] = useState(nowTime);

  const [loading, setLoading] = useState(false);

  // Row Manipulation
  const handleAddElectricalRow = () => {
    setElectricalPoints((prev) => [
      ...prev,
      { id: String(prev.length + 1), location: '', breakerNo: '', action: '', padlockNo: '', tagOut: '' },
    ]);
  };

  const handleRemoveElectricalRow = (index: number) => {
    if (electricalPoints.length <= 1) return;
    setElectricalPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateElectricalPoint = (index: number, field: keyof ElectricalIsolationPoint, value: any) => {
    setElectricalPoints((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddOtherRow = () => {
    setOtherPoints((prev) => [
      ...prev,
      { id: String(prev.length + 1), controlMechanism: '', location: '', inletOutletDrain: '', blanked: '', valves: '', padlockNo: '', taggedOut: '' },
    ]);
  };

  const handleRemoveOtherRow = (index: number) => {
    if (otherPoints.length <= 1) return;
    setOtherPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateOtherPoint = (index: number, field: keyof OtherIsolationPoint, value: any) => {
    setOtherPoints((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (submitStatus: 'Draft' | 'Submitted for Approval') => {
    // Validation for essential work details
    if (!workLocation.trim()) {
      toast.error('Section 1.1 Work Location is required.');
      return;
    }
    if (!equipmentToIsolate.trim()) {
      toast.error('Section 1.2 Equipment to be Isolated is required.');
      return;
    }
    if (!workDescription.trim()) {
      toast.error('Section 1.3 Work Description is required.');
      return;
    }
    if (!requestorName.trim()) {
      toast.error('Section 2.1 Requestor Name is required.');
      return;
    }

    setLoading(true);
    try {
      await api.createIsolationCertificate({
        workLocation: workLocation.trim(),
        locationId: locationId || null,
        departmentId: departmentId || null,
        requestDate,
        requestTime,
        equipmentToIsolate: equipmentToIsolate.trim(),
        equipmentTag: equipmentTag.trim(),
        workDescription: workDescription.trim(),
        ptwNumber: ptwNumber.trim(),
        requestorName: requestorName.trim(),
        requestorDesignation: requestorDesignation.trim(),
        requestorSignature: requestorSignature.trim() || requestorName.trim(),
        approvedByName: approvedByName.trim(),
        approvedByDesignation: approvedByDesignation.trim(),
        fusesRemoved,
        mainSwitchedOff,
        rackedOut,
        padlocksFitted,
        tagsFitted,
        electricalPoints,
        electricalCompetentName: electricalCompetentName.trim(),
        electricalCompetentDesignation: electricalCompetentDesignation.trim(),
        electricalOperatorSignature: electricalOperatorSignature.trim(),
        otherPoints,
        otherCompetentName: otherCompetentName.trim(),
        otherCompetentDesignation: otherCompetentDesignation.trim(),
        otherIsolationDate,
        otherIsolationTime,
        status: submitStatus,
      });

      toast.success(
        submitStatus === 'Submitted for Approval'
          ? 'Electrical Isolation Certificate created and submitted for approval!'
          : 'Electrical Isolation Certificate saved as Draft.'
      );
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error('Failed to create certificate: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Electrical Isolation Certificate
              </h2>
              <p className="text-xs text-slate-400">
                PCL Plant Safety Form — Sections 1.0 to 6.1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* SECTION 1.0 — WORK DETAILS */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold uppercase tracking-wider text-amber-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                Section 1.0 — Work Details
              </span>
              <span className="text-[11px] text-slate-500">Certificate No. generated automatically</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">
                  1.1 Work Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="e.g. Substation 2 / Raw Mill 1 Drive Area"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Date</label>
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Time</label>
                <input
                  type="text"
                  value={requestTime}
                  onChange={(e) => setRequestTime(e.target.value)}
                  placeholder="08:00"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 text-xs mb-1 font-semibold">
                  1.2 Equipment to be Isolated <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={equipmentToIsolate}
                  onChange={(e) => setEquipmentToIsolate(e.target.value)}
                  placeholder="e.g. Raw Mill Main Drive Motor 412-M-01"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Equipment / Tag No.</label>
                <input
                  type="text"
                  value={equipmentTag}
                  onChange={(e) => setEquipmentTag(e.target.value)}
                  placeholder="e.g. 412-M-01"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Plant Area (Location)</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(Number(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Department / Section</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(Number(e.target.value) || '')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Associated PTW Ref (Optional)</label>
                <input
                  type="text"
                  value={ptwNumber}
                  onChange={(e) => setPtwNumber(e.target.value)}
                  placeholder="e.g. PTW-2026-000001"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1 font-semibold">
                1.3 Detailed Work Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="Describe scope of maintenance, overhaul, or repair necessitating energy isolation..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* SECTION 2.0 — ISOLATION REQUISITION */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold uppercase tracking-wider text-amber-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                Section 2.0 — Isolation Requisition
              </span>
              <span className="text-[11px] text-slate-500">Signatures & Authorities</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 2.1 Requestor */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-3">
                <span className="font-bold text-slate-300 text-xs block">2.1 Requested By</span>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Requestor Name <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    value={requestorName}
                    onChange={(e) => setRequestorName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Designation</label>
                  <input
                    type="text"
                    value={requestorDesignation}
                    onChange={(e) => setRequestorDesignation(e.target.value)}
                    placeholder="e.g. Lead Mechanical Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Electronic Signature / Acknowledgement</label>
                  <input
                    type="text"
                    value={requestorSignature}
                    onChange={(e) => setRequestorSignature(e.target.value)}
                    placeholder="Signee Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* 2.2 Approved By (Configurable, non-hardcoded) */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-3">
                <span className="font-bold text-slate-300 text-xs block">2.2 Approved By</span>
                <p className="text-[11px] text-slate-500">
                  Approval authority may be entered now or authorized by the area manager later in the workflow.
                </p>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Approver Name</label>
                  <input
                    type="text"
                    value={approvedByName}
                    onChange={(e) => setApprovedByName(e.target.value)}
                    placeholder="Approver Full Name (Optional during draft)"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Designation</label>
                  <input
                    type="text"
                    value={approvedByDesignation}
                    onChange={(e) => setApprovedByDesignation(e.target.value)}
                    placeholder="e.g. Electrical Section Head / Plant Area Manager"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3.0 — DETAILS OF ELECTRICAL ISOLATION */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold uppercase tracking-wider text-amber-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                Section 3.0 — Details of Electrical Isolation
              </span>
              <span className="text-[11px] text-slate-500">3.1 Verification & 3.2 Point Register</span>
            </div>

            {/* 3.1 Verification Checkboxes */}
            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
              <span className="font-bold text-slate-300 text-xs block">
                3.1 Electrical Isolation Verification (Check applicable controls taken):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={fusesRemoved}
                    onChange={(e) => setFusesRemoved(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700"
                  />
                  <span>Fuses removed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={mainSwitchedOff}
                    onChange={(e) => setMainSwitchedOff(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700"
                  />
                  <span>Main switched off</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={rackedOut}
                    onChange={(e) => setRackedOut(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700"
                  />
                  <span>Racked out</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={padlocksFitted}
                    onChange={(e) => setPadlocksFitted(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700"
                  />
                  <span>Padlocks fitted</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={tagsFitted}
                    onChange={(e) => setTagsFitted(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700"
                  />
                  <span>Tags fitted</span>
                </label>
              </div>
            </div>

            {/* 3.2 Electrical Isolation Point Register */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 text-xs">
                  3.2 Electrical Isolation Point Register (Minimum 5 rows):
                </span>
                <button
                  type="button"
                  onClick={handleAddElectricalRow}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Isolation Point</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-2 px-2.5 w-10 text-center">#</th>
                      <th className="py-2 px-2.5 min-w-[140px]">Location</th>
                      <th className="py-2 px-2.5 min-w-[120px]">Breaker No.</th>
                      <th className="py-2 px-2.5 w-28 text-center">Action</th>
                      <th className="py-2 px-2.5 min-w-[110px]">Padlock No.</th>
                      <th className="py-2 px-2.5 w-24 text-center">Tag Out</th>
                      <th className="py-2 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {electricalPoints.map((pt, index) => (
                      <tr key={index} className="hover:bg-slate-900/40">
                        <td className="py-2 px-2.5 text-center font-mono text-slate-500">
                          {index + 1}
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={pt.location}
                            onChange={(e) => handleUpdateElectricalPoint(index, 'location', e.target.value)}
                            placeholder="e.g. Substation 2 / MCC"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={pt.breakerNo}
                            onChange={(e) => handleUpdateElectricalPoint(index, 'breakerNo', e.target.value)}
                            placeholder="e.g. VCB-412"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <select
                            value={pt.action}
                            onChange={(e) => handleUpdateElectricalPoint(index, 'action', e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                          >
                            <option value="">— Select —</option>
                            <option value="Lock">Lock</option>
                            <option value="Open">Open</option>
                          </select>
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={pt.padlockNo}
                            onChange={(e) => handleUpdateElectricalPoint(index, 'padlockNo', e.target.value)}
                            placeholder="e.g. PCL-EL-091"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <select
                            value={pt.tagOut}
                            onChange={(e) => handleUpdateElectricalPoint(index, 'tagOut', e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                          >
                            <option value="">—</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {electricalPoints.length > 5 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveElectricalRow(index)}
                              className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                              title="Delete row"
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
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
              <span className="font-bold text-slate-300 text-xs block">
                3.3 Confirmation by Competent Person:
              </span>
              <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-800">
                “I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed including CCR-Operator.”
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Competent Person Name</label>
                  <input
                    type="text"
                    value={electricalCompetentName}
                    onChange={(e) => setElectricalCompetentName(e.target.value)}
                    placeholder="Electrical Specialist Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Designation</label>
                  <input
                    type="text"
                    value={electricalCompetentDesignation}
                    onChange={(e) => setElectricalCompetentDesignation(e.target.value)}
                    placeholder="e.g. Electrical Technician"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Operator Signature / Acknowledged</label>
                  <input
                    type="text"
                    value={electricalOperatorSignature}
                    onChange={(e) => setElectricalOperatorSignature(e.target.value)}
                    placeholder="CCR / Shift Operator Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4.0 — OTHER TYPES OF ISOLATION */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold uppercase tracking-wider text-amber-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                Section 4.0 — Other Types of Isolation (Mechanical / Piping / Process)
              </span>
              <button
                type="button"
                onClick={handleAddOtherRow}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-2.5 w-10 text-center">#</th>
                    <th className="py-2 px-2.5 min-w-[130px]">Control Mechanism</th>
                    <th className="py-2 px-2.5 min-w-[120px]">Location</th>
                    <th className="py-2 px-2.5 w-24 text-center">I / O / D</th>
                    <th className="py-2 px-2.5 w-24 text-center">Blanked</th>
                    <th className="py-2 px-2.5 w-24 text-center">Valves</th>
                    <th className="py-2 px-2.5 min-w-[100px]">Padlock No.</th>
                    <th className="py-2 px-2.5 w-24 text-center">Tagged Out</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {otherPoints.map((pt, index) => (
                    <tr key={index} className="hover:bg-slate-900/40">
                      <td className="py-2 px-2.5 text-center font-mono text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={pt.controlMechanism}
                          onChange={(e) => handleUpdateOtherPoint(index, 'controlMechanism', e.target.value)}
                          placeholder="e.g. Lube oil supply valve"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={pt.location}
                          onChange={(e) => handleUpdateOtherPoint(index, 'location', e.target.value)}
                          placeholder="e.g. Hydraulic pack"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <select
                          value={pt.inletOutletDrain}
                          onChange={(e) => handleUpdateOtherPoint(index, 'inletOutletDrain', e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="">—</option>
                          <option value="I">I (Inlet)</option>
                          <option value="O">O (Outlet)</option>
                          <option value="D">D (Drain)</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <select
                          value={pt.blanked}
                          onChange={(e) => handleUpdateOtherPoint(index, 'blanked', e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="">—</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <select
                          value={pt.valves}
                          onChange={(e) => handleUpdateOtherPoint(index, 'valves', e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="">—</option>
                          <option value="Closed">Closed</option>
                          <option value="Open">Open</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={pt.padlockNo}
                          onChange={(e) => handleUpdateOtherPoint(index, 'padlockNo', e.target.value)}
                          placeholder="e.g. PCL-ME-011"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <select
                          value={pt.taggedOut}
                          onChange={(e) => handleUpdateOtherPoint(index, 'taggedOut', e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="">—</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        {otherPoints.length > 3 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOtherRow(index)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                            title="Delete row"
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

            {/* 4.2 Isolation Confirmation */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
              <span className="font-bold text-slate-300 text-xs block">
                4.2 Isolation Confirmation:
              </span>
              <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded border border-slate-800">
                “I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed.”
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Competent Person Name</label>
                  <input
                    type="text"
                    value={otherCompetentName}
                    onChange={(e) => setOtherCompetentName(e.target.value)}
                    placeholder="Mechanical Specialist Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Designation</label>
                  <input
                    type="text"
                    value={otherCompetentDesignation}
                    onChange={(e) => setOtherCompetentDesignation(e.target.value)}
                    placeholder="e.g. Mechanical In-charge"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Date</label>
                  <input
                    type="date"
                    value={otherIsolationDate}
                    onChange={(e) => setOtherIsolationDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Time</label>
                  <input
                    type="text"
                    value={otherIsolationTime}
                    onChange={(e) => setOtherIsolationTime(e.target.value)}
                    placeholder="08:30"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[11px] text-slate-500">
            Work Completion (Sec 5) & De-Isolation (Sec 6) will become available after isolation authorization.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('Draft')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('Submitted for Approval')}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>Submit for Approval</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
