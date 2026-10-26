import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Shield,
  AlertTriangle,
  Flame,
  Wind,
  Layers,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Trash2,
  Lock,
  Gauge,
  UserCheck,
  Clock,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { PermitType, PtwChecklistItem, PtwIsolations, PtwGasTesting } from '../../types/index.ts';
import {
  PERMIT_TYPE_CONFIG,
  generateChecklistForPermitTypes,
  validatePtwValidity,
  getMaxValidTo,
  DEFAULT_ISOLATIONS,
  DEFAULT_GAS_TESTING,
} from '../../config/ptwChecklists.ts';

interface PtwCreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const PtwCreateModal: React.FC<PtwCreateModalProps> = ({ onClose, onCreated }) => {
  const { currentUser, departments, locations, subLocations } = useAuth();
  const toast = useToast();

  const today = new Date().toISOString().split('T')[0];

  // 1. Permit Types (Multi-select)
  const [selectedTypes, setSelectedTypes] = useState<PermitType[]>(['Cold Work']);

  // 2. Job Particulars
  const [locationId, setLocationId] = useState<string>(locations[0]?.id ? String(locations[0].id) : '');
  const [subLocationId, setSubLocationId] = useState<string>('');
  const [specificLocation, setSpecificLocation] = useState<string>('');
  const [equipmentNumber, setEquipmentNumber] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>(departments[0]?.id ? String(departments[0].id) : '');
  const [contractorName, setContractorName] = useState<string>('');
  const [leadManName, setLeadManName] = useState<string>(currentUser?.fullName || '');
  const [contactNumber, setContactNumber] = useState<string>('Ext 4321 / Channel 3');
  const [workersCount, setWorkersCount] = useState<number>(3);
  const [workDescription, setWorkDescription] = useState<string>('');

  // 3. Issue Date, Time and Validity (Max 12 Hours)
  const [issueDate, setIssueDate] = useState<string>(today);
  const [issueTime, setIssueTime] = useState<string>('08:00');
  const [validFromDate, setValidFromDate] = useState<string>(today);
  const [validFromTime, setValidFromTime] = useState<string>('08:00');
  const [validToDate, setValidToDate] = useState<string>(today);
  const [validToTime, setValidToTime] = useState<string>('18:00');

  const [jsaReference, setJsaReference] = useState<string>('JSA-PCL-2026-');
  const [tbtConducted, setTbtConducted] = useState<boolean>(true);
  const [tbtNotes, setTbtNotes] = useState<string>('Briefed crew on site hazards, emergency muster point, and mandatory PPE.');
  const [emergencyArrangements, setEmergencyArrangements] = useState<string>(
    'Emergency Muster Point #2, Eyewash & Safety Shower verified operable, Radio Channel 3.'
  );

  // 4. Dynamic Checklists
  const [checklists, setChecklists] = useState<PtwChecklistItem[]>(() =>
    generateChecklistForPermitTypes(['Cold Work'])
  );
  const [additionalHazards, setAdditionalHazards] = useState<string>('');
  const [additionalControls, setAdditionalControls] = useState<string>('');

  // 5. Isolations (LOTO)
  const [isolations, setIsolations] = useState<PtwIsolations>(DEFAULT_ISOLATIONS);

  // 6. Gas Testing
  const [gasTesting, setGasTesting] = useState<PtwGasTesting>(DEFAULT_GAS_TESTING);

  // Tabs for creating
  const [activeStep, setActiveStep] = useState<'types_details' | 'checklists' | 'isolations' | 'gas_test'>('types_details');
  const [submitting, setSubmitting] = useState(false);

  // Calculated validity strings and duration check
  const validFrom = `${validFromDate} ${validFromTime}`.trim();
  const validTo = `${validToDate} ${validToTime}`.trim();
  const validityResult = validatePtwValidity(validFrom, validTo);

  // Only Confined Space Entry permits show the Gas Testing Record page
  const requiresGasTest = selectedTypes.includes('Confined Space Entry');

  // Handle toggling of permit types
  const handleTogglePermitType = (type: PermitType) => {
    let next: PermitType[];
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) {
        toast.warning('At least one permit type must remain selected.');
        return;
      }
      next = selectedTypes.filter((t) => t !== type);
    } else {
      next = [...selectedTypes, type];
    }
    setSelectedTypes(next);

    // If CSE is deselected and user was on gas test step, move back to checklists
    if (!next.includes('Confined Space Entry') && activeStep === 'gas_test') {
      setActiveStep('checklists');
    }

    // Dynamically rebuild checklist, retaining existing user responses
    setChecklists((prev) => generateChecklistForPermitTypes(next, prev));
  };

  const handleSetMax12Hours = () => {
    const maxToStr = getMaxValidTo(validFrom);
    if (maxToStr) {
      const parts = maxToStr.split(' ');
      if (parts.length >= 2) {
        setValidToDate(parts[0]);
        setValidToTime(parts[1]);
        toast.info('Valid To set to maximum 12 hours from Valid From.');
      }
    }
  };

  const handleChecklistStatusChange = (id: string, status: 'Yes' | 'No' | 'N/A') => {
    setChecklists((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleChecklistNoteChange = (id: string, notes: string) => {
    setChecklists((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const handleIsolationChange = (
    category: keyof PtwIsolations,
    field: string,
    value: string
  ) => {
    setIsolations((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleGasTestChange = (field: keyof PtwGasTesting, value: string) => {
    setGasTesting((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSavePermit = async (submitForReview: boolean) => {
    if (!locationId) {
      toast.warning('Plant Area (Location) is required.');
      setActiveStep('types_details');
      return;
    }
    if (!departmentId) {
      toast.warning('Department / Section is required.');
      setActiveStep('types_details');
      return;
    }
    if (!specificLocation.trim()) {
      toast.warning('Specific Work Location is required.');
      setActiveStep('types_details');
      return;
    }
    if (!workDescription.trim()) {
      toast.warning('Detailed Scope of Work is required.');
      setActiveStep('types_details');
      return;
    }
    if (!leadManName.trim()) {
      toast.warning('Lead Man / Supervisor name is required.');
      setActiveStep('types_details');
      return;
    }
    if (!contactNumber.trim()) {
      toast.warning('Contact Number / Radio Channel is required.');
      setActiveStep('types_details');
      return;
    }

    // Enforce 12-hour validity maximum
    if (!validityResult.valid) {
      toast.error(validityResult.error || 'Validity duration cannot exceed 12 hours.');
      setActiveStep('types_details');
      return;
    }

    // Safety checks validation when submitting for review
    if (submitForReview) {
      const failedMandatory = checklists.filter((c) => c.isMandatory && c.status === 'No');
      if (failedMandatory.length > 0) {
        const topFailed = failedMandatory.slice(0, 3).map((f) => `[${f.id}] ${f.label}`).join(', ');
        toast.error(
          `Cannot submit for review: ${failedMandatory.length} mandatory safety check(s) are incomplete or marked 'No': ${topFailed}${
            failedMandatory.length > 3 ? '...' : ''
          }`
        );
        setActiveStep('checklists');
        return;
      }

      if (requiresGasTest) {
        if (!gasTesting.testedBy?.trim()) {
          toast.warning('Gas Tester Full Name is required for Confined Space Entry.');
          setActiveStep('gas_test');
          return;
        }
        if (!gasTesting.oxygen?.trim()) {
          toast.warning('Oxygen (O2) percentage reading is required for Confined Space Entry.');
          setActiveStep('gas_test');
          return;
        }
        if (gasTesting.result === 'Unsafe') {
          toast.error('Atmosphere verdict is marked "Unsafe". Confined Space Entry prohibited until atmosphere is safe.');
          setActiveStep('gas_test');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await api.createPtwPermit({
        permitTypes: selectedTypes,
        status: submitForReview ? 'Under Review' : 'Draft',
        locationId: Number(locationId),
        subLocationId: subLocationId ? Number(subLocationId) : null,
        specificLocation,
        equipmentNumber,
        departmentId: Number(departmentId),
        contractorName,
        leadManName,
        contactNumber,
        workersCount: Number(workersCount) || 1,
        workDescription,
        issueDate: `${issueDate} ${issueTime}`,
        validFrom,
        validTo,
        jsaReference,
        tbtConducted,
        tbtNotes,
        emergencyArrangements,
        checklists,
        additionalHazards,
        additionalControls,
        isolations,
        gasTesting: requiresGasTest ? gasTesting : DEFAULT_GAS_TESTING,
        receiverName: leadManName,
      });

      toast.success(
        submitForReview
          ? 'Permit submitted successfully for Area Authority review!'
          : 'Permit draft saved successfully with generated Reference Number!'
      );
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error('Failed to create permit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Organize active checklists into sections according to user specification
  const checklistSections = [
    {
      category: 'General Safety Checks',
      title: 'General Pre-Work Safety Verification (Applicable to All Permits)',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/30',
      borderColor: 'border-emerald-500/30',
      items: checklists.filter((c) => c.category === 'General Safety Checks'),
    },
    ...(selectedTypes.includes('Cold Work')
      ? [
          {
            category: 'Cold Work',
            title: 'CW — Cold Work Safety Verification Checklist',
            color: 'text-sky-400',
            bgColor: 'bg-sky-950/30',
            borderColor: 'border-sky-500/30',
            items: checklists.filter((c) => c.category === 'Cold Work'),
          },
        ]
      : []),
    ...(selectedTypes.includes('Hot Work')
      ? [
          {
            category: 'Hot Work',
            title: 'HW — Hot Work Safety Verification Checklist',
            color: 'text-amber-400',
            bgColor: 'bg-amber-950/30',
            borderColor: 'border-amber-500/30',
            items: checklists.filter((c) => c.category === 'Hot Work'),
          },
        ]
      : []),
    ...(selectedTypes.includes('Confined Space Entry')
      ? [
          {
            category: 'Confined Space Entry',
            title: 'CSE — Confined Space Entry Safety Verification Checklist',
            color: 'text-purple-400',
            bgColor: 'bg-purple-950/30',
            borderColor: 'border-purple-500/30',
            items: checklists.filter((c) => c.category === 'Confined Space Entry'),
          },
        ]
      : []),
    ...(selectedTypes.includes('Lifting Activity')
      ? [
          {
            category: 'Lifting Activity',
            title: 'LA — Lifting Activity Safety Verification Checklist',
            color: 'text-indigo-400',
            bgColor: 'bg-indigo-950/30',
            borderColor: 'border-indigo-500/30',
            items: checklists.filter((c) => c.category === 'Lifting Activity'),
          },
        ]
      : []),
    ...(selectedTypes.includes('Work at Height')
      ? [
          {
            category: 'Work at Height',
            title: 'WAH — Work at Height Safety Verification Checklist',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-950/30',
            borderColor: 'border-emerald-500/30',
            items: checklists.filter((c) => c.category === 'Work at Height'),
          },
        ]
      : []),
  ];

  const mandatoryRemaining = checklists.filter((c) => c.isMandatory && c.status === 'No').length;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                New Permit-to-Work (PTW) Application
              </h3>
              <p className="text-xs text-slate-400">
                Power Cement Limited (PCL) HSE Multi-Discipline PTW Digitization Form (Max 12-Hour Validity)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 py-2 gap-2 text-xs font-semibold overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveStep('types_details')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeStep === 'types_details'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>1. Types & Particulars</span>
          </button>
          <button
            onClick={() => {
              if (!validityResult.valid) {
                toast.error(validityResult.error || 'Permit validity exceeds 12-hour maximum limit.');
                return;
              }
              setActiveStep('checklists');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeStep === 'checklists'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>2. Dynamic Checklists ({checklists.length})</span>
            {mandatoryRemaining > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title={`${mandatoryRemaining} mandatory checks incomplete`} />
            )}
          </button>
          <button
            onClick={() => {
              if (!validityResult.valid) {
                toast.error(validityResult.error || 'Permit validity exceeds 12-hour maximum limit.');
                return;
              }
              setActiveStep('isolations');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeStep === 'isolations'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>3. Isolations / LOTO</span>
          </button>
          {requiresGasTest && (
            <button
              onClick={() => {
                if (!validityResult.valid) {
                  toast.error(validityResult.error || 'Permit validity exceeds 12-hour maximum limit.');
                  return;
                }
                setActiveStep('gas_test');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeStep === 'gas_test'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>4. Gas Testing Record (CSE)</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* STEP 1: PERMIT TYPES & JOB PARTICULARS */}
          {activeStep === 'types_details' && (
            <div className="space-y-6">
              {/* Multi-Select Permit Types Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  Select Applicable Permit Type(s) (Multi-Select Allowed):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {(['Cold Work', 'Hot Work', 'Confined Space Entry', 'Lifting Activity', 'Work at Height'] as const).map(
                    (type) => {
                      const cfg = PERMIT_TYPE_CONFIG[type];
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <div
                          key={type}
                          onClick={() => handleTogglePermitType(type)}
                          className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col justify-between ${
                            isSelected
                              ? `${cfg.bgColor} ${cfg.borderColor} ring-1 ring-emerald-500 shadow-md`
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                              {cfg.code}
                            </span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 cursor-pointer"
                            />
                          </div>
                          <div>
                            <div className={`font-bold text-xs ${isSelected ? cfg.color : 'text-slate-300'}`}>
                              {cfg.label}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {cfg.description}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  * Selected permit types dynamically control the checklist in Section 2 and activate Gas Testing for Confined Space Entry.
                </p>
              </div>

              {/* Job Particulars & Work Location */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                  Job Particulars & Work Location
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Plant Area (Location) *</label>
                    <select
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Department / Section *</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Equipment / Tag No</label>
                    <input
                      type="text"
                      value={equipmentNumber}
                      onChange={(e) => setEquipmentNumber(e.target.value)}
                      placeholder="e.g. 411-FN-01 / Raw Mill Cyclone"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-medium mb-1">Specific Work Location *</label>
                    <input
                      type="text"
                      value={specificLocation}
                      onChange={(e) => setSpecificLocation(e.target.value)}
                      placeholder="e.g. Preheater Tower 4th Floor Platform, East Side"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Contractor / Department Crew</label>
                    <input
                      type="text"
                      value={contractorName}
                      onChange={(e) => setContractorName(e.target.value)}
                      placeholder="e.g. Al-Farooq Mechanical / In-house Crew"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Lead Man / Supervisor *</label>
                    <input
                      type="text"
                      value={leadManName}
                      onChange={(e) => setLeadManName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Contact No / Radio Channel *</label>
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Total Workers in Crew</label>
                    <input
                      type="number"
                      min={1}
                      value={workersCount}
                      onChange={(e) => setWorkersCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Detailed Scope of Work *</label>
                  <textarea
                    rows={3}
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    placeholder="Provide a comprehensive description of the maintenance or operational activities to be carried out..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Validity & Safety Baseline — Maximum 12 Hours */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Issue Date, Time & Permit Validity (Strict Maximum 12 Hours)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleSetMax12Hours}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Set Max 12h Validity
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Issue Date & Time */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Issue Date & Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                      />
                      <input
                        type="time"
                        value={issueTime}
                        onChange={(e) => setIssueTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Valid From Date & Time */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Valid From (Date & Time) *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={validFromDate}
                        onChange={(e) => setValidFromDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                      />
                      <input
                        type="time"
                        value={validFromTime}
                        onChange={(e) => setValidFromTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Valid To Date & Time */}
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Valid To (Date & Time) *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={validToDate}
                        onChange={(e) => setValidToDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                      />
                      <input
                        type="time"
                        value={validToTime}
                        onChange={(e) => setValidToTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Duration Status Indicator */}
                <div className="pt-1">
                  {validityResult.valid ? (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>
                          Permit Duration: <strong>{validityResult.durationHours} hours</strong> (Permitted: Up to 12.0 hours)
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/40">
                        Validity Compliant
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span>{validityResult.error}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSetMax12Hours}
                        className="text-[10px] uppercase font-bold px-2.5 py-1 rounded bg-rose-900 text-white hover:bg-rose-800 transition-colors flex-shrink-0 ml-2"
                      >
                        Auto-Fix to 12h
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    * Validity is capped at 12 hours absolute maximum. Permits may cross midnight without shift-end restrictions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">JSA / Risk Assessment Ref</label>
                    <input
                      type="text"
                      value={jsaReference}
                      onChange={(e) => setJsaReference(e.target.value)}
                      placeholder="e.g. JSA-PCL-2026-MECH-04"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Toolbox Talk (TBT)</label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="tbtCheck"
                        checked={tbtConducted}
                        onChange={(e) => setTbtConducted(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                      />
                      <label htmlFor="tbtCheck" className="text-slate-200 cursor-pointer">
                        TBT Conducted with Crew
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Emergency Arrangements</label>
                    <input
                      type="text"
                      value={emergencyArrangements}
                      onChange={(e) => setEmergencyArrangements(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DYNAMIC SAFETY VERIFICATION CHECKLISTS */}
          {activeStep === 'checklists' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Dynamic Safety Verification Checklists
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Showing General Safety Checks + selected disciplines:{' '}
                    <span className="font-semibold text-emerald-400">{selectedTypes.join(', ')}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Verified: {checklists.filter((c) => c.status === 'Yes').length}
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Mandatory Unverified: {mandatoryRemaining}
                  </span>
                </div>
              </div>

              {/* Categorized Checklist Tables */}
              {checklistSections.map((sec) => (
                <div
                  key={sec.category}
                  className={`border ${sec.borderColor} rounded-xl overflow-hidden bg-slate-950/60 shadow-sm`}
                >
                  <div className={`px-4 py-2.5 ${sec.bgColor} border-b ${sec.borderColor} flex items-center justify-between`}>
                    <span className={`font-bold text-xs ${sec.color} uppercase tracking-wider`}>
                      {sec.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {sec.items.length} checks
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800/80 text-slate-400 font-semibold text-[11px]">
                        <th className="py-2 px-3 w-16 text-center">Ref</th>
                        <th className="py-2 px-3">Verification Check / Safety Requirement</th>
                        <th className="py-2 px-3 w-36 text-center">Status</th>
                        <th className="py-2 px-3 w-64">Verification Notes / Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {sec.items.map((chk) => (
                        <tr key={chk.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 text-[10px]">
                            {chk.id}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-slate-200">{chk.label}</span>
                            {chk.isMandatory && (
                              <span
                                className={`ml-2 font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                  chk.status === 'No'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {chk.status === 'No' ? '*Mandatory (Unverified)' : 'Mandatory (Verified)'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                              {(['Yes', 'No', 'N/A'] as const).map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleChecklistStatusChange(chk.id, opt)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                    chk.status === opt
                                      ? opt === 'Yes'
                                        ? 'bg-emerald-600 text-white'
                                        : opt === 'No'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-700 text-slate-200'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={chk.notes || ''}
                              onChange={(e) => handleChecklistNoteChange(chk.id, e.target.value)}
                              placeholder="e.g. Inspected by Lead / Tag verified"
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Additional Custom Hazards & Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Additional Site Hazards Identified
                  </label>
                  <textarea
                    rows={2}
                    value={additionalHazards}
                    onChange={(e) => setAdditionalHazards(e.target.value)}
                    placeholder="Specify any additional chemical, thermal, electrical, or structural hazards unique to this job..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Additional Required Control Measures
                  </label>
                  <textarea
                    rows={2}
                    value={additionalControls}
                    onChange={(e) => setAdditionalControls(e.target.value)}
                    placeholder="Specific engineering, administrative, or specialized PPE controls enforced..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ENERGY & PROCESS ISOLATION (LOTO) */}
          {activeStep === 'isolations' && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Lockout / Tagout (LOTO) & Energy Isolation Matrix</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Record isolation details for electrical, mechanical, utility, and production feeds.
                </p>
              </div>

              {(['electrical', 'mechanical', 'utilities', 'production'] as const).map((key) => {
                const labels = {
                  electrical: 'Electrical Isolation (Switchgear / Motor Breakers / Control Panels)',
                  mechanical: 'Mechanical Isolation (Blind Flanges / Block Valves / Drive Couplings)',
                  utilities: 'Utilities Isolation (Steam / Compressed Air / Process Water / Fuel Gas)',
                  production: 'Process / Production Isolation (Chutes / Diverter Gates / Feeders)',
                };
                const iso = isolations[key];
                return (
                  <div key={key} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{labels[key]}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">Isolation:</span>
                        <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                          {(['Yes', 'No', 'N/A'] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleIsolationChange(key, 'required', opt)}
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                iso.required === opt
                                  ? opt === 'Yes'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-700 text-slate-200'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {iso.required === 'Yes' && (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
                        <div>
                          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                            Equipment Tag / Location
                          </label>
                          <input
                            type="text"
                            value={iso.equipmentTag || ''}
                            onChange={(e) => handleIsolationChange(key, 'equipmentTag', e.target.value)}
                            placeholder="e.g. MCC-02 / Breaker 14"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                            Lock / Tag Number
                          </label>
                          <input
                            type="text"
                            value={iso.lockNumber || ''}
                            onChange={(e) => handleIsolationChange(key, 'lockNumber', e.target.value)}
                            placeholder="e.g. LOTO-EL-409"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                            Isolated By (Technician)
                          </label>
                          <input
                            type="text"
                            value={iso.isolatedBy || ''}
                            onChange={(e) => handleIsolationChange(key, 'isolatedBy', e.target.value)}
                            placeholder="e.g. M. Tariq (Electrician)"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                            Isolation Certificate Ref
                          </label>
                          <input
                            type="text"
                            value={iso.permitRef || ''}
                            onChange={(e) => handleIsolationChange(key, 'permitRef', e.target.value)}
                            placeholder="e.g. ISO-2026-081"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 4: GAS TESTING RECORD (ONLY FOR CONFINED SPACE ENTRY) */}
          {activeStep === 'gas_test' && requiresGasTest && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-purple-400" />
                  <span>Confined Space Entry — Atmospheric Gas Testing Record</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mandatory for CSE: Multi-gas atmospheric analysis must be verified and safe before any entry is permitted.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Oxygen (O2) % (Safe: 19.5 - 23.5%) *
                  </span>
                  <input
                    type="text"
                    value={gasTesting.oxygen || ''}
                    onChange={(e) => handleGasTestChange('oxygen', e.target.value)}
                    placeholder="20.9"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Combustible Gas (LEL) % (&lt;10%) *
                  </span>
                  <input
                    type="text"
                    value={gasTesting.lel || ''}
                    onChange={(e) => handleGasTestChange('lel', e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Carbon Monoxide (CO) ppm (&lt;25)
                  </span>
                  <input
                    type="text"
                    value={gasTesting.co || ''}
                    onChange={(e) => handleGasTestChange('co', e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Hydrogen Sulfide (H2S) ppm (&lt;10)
                  </span>
                  <input
                    type="text"
                    value={gasTesting.h2s || ''}
                    onChange={(e) => handleGasTestChange('h2s', e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Gas Tester Full Name *</label>
                  <input
                    type="text"
                    value={gasTesting.testedBy || ''}
                    onChange={(e) => handleGasTestChange('testedBy', e.target.value)}
                    placeholder="Certified Gas Tester Name"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Test Time & Instrument Serial</label>
                  <input
                    type="text"
                    value={gasTesting.testTime || ''}
                    onChange={(e) => handleGasTestChange('testTime', e.target.value)}
                    placeholder="08:15 AM / Ventis Pro5 #991"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Atmosphere Verdict *</label>
                  <select
                    value={gasTesting.result || 'Safe to Enter'}
                    onChange={(e) => handleGasTestChange('result', e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-bold"
                  >
                    <option value="Safe to Enter">Safe to Enter</option>
                    <option value="Unsafe">Unsafe (Ventilation Required)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            {activeStep !== 'types_details' && (
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 'gas_test') setActiveStep('isolations');
                  else if (activeStep === 'isolations') setActiveStep('checklists');
                  else if (activeStep === 'checklists') setActiveStep('types_details');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Back
              </button>
            )}

            {!(activeStep === 'gas_test' || (!requiresGasTest && activeStep === 'isolations')) && (
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 'types_details') {
                    if (!validityResult.valid) {
                      toast.error(validityResult.error || 'Permit validity duration exceeds 12 hours.');
                      return;
                    }
                    setActiveStep('checklists');
                  } else if (activeStep === 'checklists') {
                    setActiveStep('isolations');
                  } else if (activeStep === 'isolations' && requiresGasTest) {
                    setActiveStep('gas_test');
                  }
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Next Section
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSavePermit(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSavePermit(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-md flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit for Review'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
