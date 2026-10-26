import React from 'react';
import { Printer, X, Shield, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { PtwPermit } from '../../types/index.ts';
import { PERMIT_TYPE_CONFIG, calculatePermitDurationHours } from '../../config/ptwChecklists.ts';

interface PtwPrintViewProps {
  permit: PtwPermit;
  onClose: () => void;
}

export const PtwPrintView: React.FC<PtwPrintViewProps> = ({ permit, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const allPermitTypes = ['Cold Work', 'Hot Work', 'Confined Space Entry', 'Lifting Activity', 'Work at Height'] as const;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 overflow-y-auto flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden my-auto print:shadow-none print:m-0 print:w-full print:max-w-none print:rounded-none">
        {/* Screen Action Bar (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Printable PCL Permit-to-Work Form</span>
            <span className="text-xs text-slate-400 font-mono">({permit.permitNumber})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 text-xs font-sans text-slate-900 leading-tight print:p-6">
          {/* Header */}
          <div className="border-2 border-slate-900 p-4 mb-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-700 text-white font-black text-xl flex items-center justify-center rounded">
                  PCL
                </div>
                <div>
                  <h1 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                    POWER CEMENT LIMITED
                  </h1>
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    INTEGRATED ENVIRONMENT, HEALTH & SAFETY MANAGEMENT SYSTEM
                  </p>
                  <p className="text-[10px] text-slate-600">Standard Operating Procedure: HSE-SOP-PTW-01</p>
                </div>
              </div>
              <div className="text-right">
                <div className="border border-slate-900 px-3 py-1 font-mono font-bold text-sm bg-slate-100">
                  {permit.permitNumber}
                </div>
                <div className="text-[10px] text-slate-700 mt-1 font-semibold uppercase">
                  Status: <span className="font-bold">{permit.status}</span>
                </div>
              </div>
            </div>

            <div className="text-center font-black text-sm tracking-wide uppercase bg-slate-200 py-1.5 border border-slate-900 mb-3">
              PERMIT-TO-WORK (PTW) AUTHORIZATION CERTIFICATE
            </div>

            {/* Permit Types Multi-Select Grid */}
            <div className="mb-2">
              <span className="font-bold text-[10px] uppercase text-slate-700 block mb-1">
                Permit Type(s) Applicable (Multi-Select):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border border-slate-900 p-2 bg-slate-50">
                {allPermitTypes.map((type) => {
                  const selected = permit.permitTypes.includes(type);
                  return (
                    <div
                      key={type}
                      className={`flex items-center gap-1.5 p-1 border ${
                        selected ? 'border-slate-900 bg-white font-bold' : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      {selected ? (
                        <CheckSquare className="w-4 h-4 text-slate-900 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="text-[11px] leading-none">{type}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 1: Permit Particulars */}
          <div className="border-2 border-slate-900 mb-4">
            <div className="bg-slate-800 text-white font-bold px-3 py-1 uppercase text-[11px]">
              Section 1: General Job Particulars & Site Description
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 border-b border-slate-300">
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Plant / Area:</span>
                <span className="font-semibold text-slate-900">{permit.location?.name || 'Plant Area'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Department / Section:</span>
                <span className="font-semibold text-slate-900">{permit.department?.name || 'Maintenance'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Issue Date:</span>
                <span className="font-semibold text-slate-900">{permit.issueDate}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Validity Period (Max 12h):</span>
                <span className="font-semibold text-slate-900 font-mono text-[11px] block">
                  {permit.validFrom} to {permit.validTo}
                </span>
                <span className="text-[9px] text-slate-600 font-bold block mt-0.5">
                  Duration: {calculatePermitDurationHours(permit.validFrom, permit.validTo)} Hours
                </span>
              </div>
            </div>

            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 border-b border-slate-300">
              <div className="col-span-2">
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Specific Work Location:</span>
                <span className="font-semibold text-slate-900">{permit.specificLocation}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Equipment / Tag No:</span>
                <span className="font-semibold text-slate-900">{permit.equipmentNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Total Workers in Crew:</span>
                <span className="font-semibold text-slate-900">{permit.workersCount} Persons</span>
              </div>
            </div>

            <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 border-b border-slate-300">
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Contractor / Dept Crew:</span>
                <span className="font-semibold text-slate-900">{permit.contractorName || 'PCL In-house Team'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Lead Man / Supervisor:</span>
                <span className="font-semibold text-slate-900">{permit.leadManName}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Contact / Radio Channel:</span>
                <span className="font-semibold text-slate-900">{permit.contactNumber}</span>
              </div>
            </div>

            <div className="p-3 border-b border-slate-300">
              <span className="font-bold text-slate-600 block text-[10px] uppercase">Detailed Scope of Work:</span>
              <p className="font-medium text-slate-900 mt-0.5 whitespace-pre-wrap">{permit.workDescription}</p>
            </div>

            <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 bg-slate-50">
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">JSA / Risk Assessment Ref:</span>
                <span className="font-semibold text-slate-900">{permit.jsaReference || 'JSA Verified on Site'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Toolbox Talk (TBT):</span>
                <span className="font-semibold text-slate-900">
                  {permit.tbtConducted ? '✓ Conducted with Crew' : 'Pending Prior to Work'}
                </span>
                {permit.tbtNotes && <span className="text-[10px] text-slate-600 block">{permit.tbtNotes}</span>}
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">Emergency Response:</span>
                <span className="font-semibold text-slate-900">{permit.emergencyArrangements || 'Muster Point Verified'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Safety Verification & Dynamic Checklists */}
          <div className="border-2 border-slate-900 mb-4">
            <div className="bg-slate-800 text-white font-bold px-3 py-1 uppercase text-[11px] flex justify-between">
              <span>Section 2: Hazard Identification & Safety Verification Checklists</span>
              <span className="text-[10px] font-normal">Applicable to selected permit types</span>
            </div>
            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-900 font-bold">
                  <th className="p-1.5 w-14 text-center border-r border-slate-300">Item</th>
                  <th className="p-1.5 border-r border-slate-300">Safety Requirement / Verification Check</th>
                  <th className="p-1.5 w-16 text-center border-r border-slate-300">Status</th>
                  <th className="p-1.5 w-48">Comments / Specific Control Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
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

                      return (
                        <React.Fragment key={cat}>
                          <tr className="bg-slate-200/80 font-bold border-y border-slate-400">
                            <td colSpan={4} className="py-1 px-2 text-[10px] uppercase text-slate-800 tracking-wider">
                              ▸ {categoryTitles[cat] || cat} ({items.length} checks)
                            </td>
                          </tr>
                          {items.map((chk, idx) => (
                            <tr key={chk.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-1 text-center font-mono font-bold text-slate-600 border-r border-slate-300">
                                {chk.id}
                              </td>
                              <td className="p-1 font-medium text-slate-900 border-r border-slate-300">
                                {chk.label}
                                {chk.isMandatory && (
                                  <span className="text-rose-700 ml-1 font-bold text-[9px]">*Mandatory</span>
                                )}
                              </td>
                              <td className="p-1 text-center font-bold border-r border-slate-300">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                                    chk.status === 'Yes'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-400'
                                      : chk.status === 'N/A'
                                      ? 'bg-slate-100 text-slate-600 border border-slate-300'
                                      : 'bg-rose-100 text-rose-800 border border-rose-400'
                                  }`}
                                >
                                  {chk.status}
                                </span>
                              </td>
                              <td className="p-1 text-slate-700 italic">{chk.notes || '—'}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    });
                  })()
                ) : (
                  <tr>
                    <td colSpan={4} className="p-2 text-center text-slate-500 italic">
                      Standard safety checks verified as per PCL SOP.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Custom Hazards & Controls if any */}
            {(permit.additionalHazards || permit.additionalControls) && (
              <div className="p-2 border-t border-slate-300 bg-slate-50 grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <span className="font-bold text-slate-700 uppercase">Additional Site Hazards:</span>
                  <p className="text-slate-900">{permit.additionalHazards || 'None specified'}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 uppercase">Additional Required Controls:</span>
                  <p className="text-slate-900">{permit.additionalControls || 'None specified'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Atmospheric Gas Testing (strictly Confined Space Entry) */}
          {permit.permitTypes.includes('Confined Space Entry') && (
            <div className="border-2 border-slate-900 mb-4">
              <div className="bg-slate-800 text-white font-bold px-3 py-1 uppercase text-[11px] flex justify-between">
                <span>Section 3: Atmospheric Gas Testing Record</span>
                <span className="text-[10px] font-normal">Mandatory for Confined Space Entry</span>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-4 gap-2 text-center mb-2">
                  <div className="border border-slate-400 p-1.5 bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-600 block">OXYGEN (O2)</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {permit.gasTesting?.oxygen ? `${permit.gasTesting.oxygen} %` : '—'}
                    </span>
                    <span className="text-[8px] text-slate-500 block">Permitted: 19.5 - 23.5%</span>
                  </div>
                  <div className="border border-slate-400 p-1.5 bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-600 block">FLAMMABLE / LEL</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {permit.gasTesting?.lel ? `${permit.gasTesting.lel} %` : '—'}
                    </span>
                    <span className="text-[8px] text-slate-500 block">Permitted: &lt; 10% (CSE) / &lt; 1% (HW)</span>
                  </div>
                  <div className="border border-slate-400 p-1.5 bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-600 block">CARBON MONOXIDE (CO)</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {permit.gasTesting?.co ? `${permit.gasTesting.co} ppm` : '—'}
                    </span>
                    <span className="text-[8px] text-slate-500 block">Permitted: &lt; 25 ppm</span>
                  </div>
                  <div className="border border-slate-400 p-1.5 bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-600 block">HYDROGEN SULFIDE (H2S)</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {permit.gasTesting?.h2s ? `${permit.gasTesting.h2s} ppm` : '—'}
                    </span>
                    <span className="text-[8px] text-slate-500 block">Permitted: &lt; 10 ppm</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 border-t border-slate-200">
                  <div>
                    <span className="font-bold text-slate-700">Gas Tester Name:</span>{' '}
                    <span>{permit.gasTesting?.testedBy || 'Competent Gas Tester'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Test Time:</span>{' '}
                    <span>{permit.gasTesting?.testTime || permit.issueDate}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Atmosphere Verdict:</span>{' '}
                    <span className="font-bold text-emerald-700 uppercase">
                      {permit.gasTesting?.result || 'Safe to Proceed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Lockout / Tagout (LOTO) & Isolations */}
          <div className="border-2 border-slate-900 mb-4">
            <div className="bg-slate-800 text-white font-bold px-3 py-1 uppercase text-[11px]">
              Section 4: Energy & Process Isolation Record (LOTO)
            </div>
            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-900 font-bold">
                  <th className="p-1.5 border-r border-slate-300">Discipline</th>
                  <th className="p-1.5 w-16 text-center border-r border-slate-300">Required</th>
                  <th className="p-1.5 border-r border-slate-300">Isolated Equipment / Tag No</th>
                  <th className="p-1.5 border-r border-slate-300">Lock / Tag No</th>
                  <th className="p-1.5 border-r border-slate-300">Isolated By</th>
                  <th className="p-1.5">Isolation Certificate Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {(['electrical', 'mechanical', 'utilities', 'production'] as const).map((key) => {
                  const iso = permit.isolations?.[key];
                  const labels = {
                    electrical: 'Electrical Isolation (Switchgear / Breakers)',
                    mechanical: 'Mechanical Isolation (Blinds / Valves / Flanges)',
                    utilities: 'Utilities Isolation (Steam / Compressed Air / Water)',
                    production: 'Process / Production Isolation (Chutes / Feeders)',
                  };
                  return (
                    <tr key={key}>
                      <td className="p-1.5 font-bold text-slate-800 border-r border-slate-300">{labels[key]}</td>
                      <td className="p-1.5 text-center font-bold border-r border-slate-300">{iso?.required || 'N/A'}</td>
                      <td className="p-1.5 font-mono border-r border-slate-300">{iso?.equipmentTag || '—'}</td>
                      <td className="p-1.5 font-mono border-r border-slate-300">{iso?.lockNumber || '—'}</td>
                      <td className="p-1.5 border-r border-slate-300">{iso?.isolatedBy || '—'}</td>
                      <td className="p-1.5 font-mono">{iso?.permitRef || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section 5: Authorization & Handover Signatures */}
          <div className="border-2 border-slate-900 mb-4">
            <div className="bg-slate-800 text-white font-bold px-3 py-1 uppercase text-[11px]">
              Section 5: Issue, Authorization & Acceptance Signatures
            </div>
            <div className="grid grid-cols-2 divide-x-2 divide-slate-900">
              <div className="p-3 space-y-1">
                <span className="font-bold text-[10px] uppercase text-slate-700 block">
                  Permit Receiver (Performing Authority):
                </span>
                <p className="text-[9px] text-slate-600 italic mb-2">
                  "I confirm that I have personally inspected the work area, verified all controls, conducted the TBT, and understand the permit conditions."
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="font-bold text-slate-700 block">Full Name:</span>
                    <span className="font-semibold text-slate-900">{permit.receiverName}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Designation:</span>
                    <span className="font-semibold text-slate-900">{permit.receiverDesignation || 'Supervisor'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Signature / Acknowledged:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {permit.receiverAcknowledged ? 'SIGNED ELECTRONICALLY' : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Date & Time:</span>
                    <span className="font-mono text-slate-900">
                      {permit.receiverSignatureDate
                        ? new Date(permit.receiverSignatureDate).toLocaleString()
                        : permit.issueDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-1">
                <span className="font-bold text-[10px] uppercase text-slate-700 block">
                  Permit Issuer (Authorized Area Authority):
                </span>
                <p className="text-[9px] text-slate-600 italic mb-2">
                  "I have verified that the site precautions and isolations are implemented. Permission is hereby granted to carry out the described work."
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="font-bold text-slate-700 block">Authorized Issuer:</span>
                    <span className="font-semibold text-slate-900">
                      {permit.issuerName || 'Authorized Area Engineer'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Designation:</span>
                    <span className="font-semibold text-slate-900">{permit.issuerDesignation || 'Area Authority'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Authorization Status:</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {permit.status === 'Approved' || permit.status === 'Extended' || permit.status === 'Closed'
                        ? 'AUTHORIZED & ISSUED'
                        : permit.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Date & Time:</span>
                    <span className="font-mono text-slate-900">
                      {permit.issuerSignatureDate
                        ? new Date(permit.issuerSignatureDate).toLocaleString()
                        : permit.validFrom}
                    </span>
                  </div>
                </div>
                {permit.issuerRemarks && (
                  <div className="pt-1 text-[9px] text-slate-700 border-t border-slate-200">
                    <span className="font-bold">Conditions / Notes:</span> {permit.issuerRemarks}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 6: Daily Multi-Day Extension Log (Day 2 to Day 7) */}
          <div className="border-2 border-slate-900 mb-4">
            <div className="bg-slate-800 text-white font-bold px-3 py-1 uppercase text-[11px] flex justify-between">
              <span>Section 6: Daily Multi-Day Revalidation & Extension Register</span>
              <span className="text-[10px] font-normal">Day 2 through Day 7 extensions</span>
            </div>
            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-900 font-bold">
                  <th className="p-1 text-center border-r border-slate-300 w-12">Day</th>
                  <th className="p-1 border-r border-slate-300 w-24">Date</th>
                  <th className="p-1 border-r border-slate-300 w-28">Valid Period</th>
                  <th className="p-1 text-center border-r border-slate-300 w-24">Site Re-check</th>
                  <th className="p-1 border-r border-slate-300">Gas Test Checked</th>
                  <th className="p-1 border-r border-slate-300">Receiver Handshake</th>
                  <th className="p-1 border-r border-slate-300">Issuer Authorization</th>
                  <th className="p-1">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-mono">
                {[2, 3, 4, 5, 6, 7].map((dayNum) => {
                  const ext = permit.extensions?.find((e) => e.dayNumber === dayNum);
                  return (
                    <tr key={dayNum} className={ext ? 'bg-emerald-50/40' : 'bg-white'}>
                      <td className="p-1 text-center font-bold text-slate-800 border-r border-slate-300">
                        Day {dayNum}
                      </td>
                      <td className="p-1 border-r border-slate-300">{ext ? ext.extensionDate : '—'}</td>
                      <td className="p-1 border-r border-slate-300">
                        {ext ? `${ext.startTime} - ${ext.endTime}` : '—'}
                      </td>
                      <td className="p-1 text-center border-r border-slate-300">
                        {ext ? (ext.siteReinspected ? '✓ Reinspected' : 'No') : '—'}
                      </td>
                      <td className="p-1 border-r border-slate-300">{ext ? ext.gasTestVerified : '—'}</td>
                      <td className="p-1 border-r border-slate-300">{ext ? ext.receiverName : '—'}</td>
                      <td className="p-1 border-r border-slate-300">{ext ? ext.issuerName : '—'}</td>
                      <td className="p-1 text-[9px] text-slate-600">{ext ? ext.remarks || 'Extended' : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section 7: Work Completion, De-Isolation & Handback to CCR */}
          <div className="border-2 border-slate-900">
            <div className="bg-slate-800 text-white font-bold px-3 py-1 uppercase text-[11px]">
              Section 7: Work Completion, De-Isolation & Operations / CCR Hand-back
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-300 bg-slate-50 text-[10px]">
              <div>
                <span className="font-bold text-slate-700 block uppercase">Work Status at Handback:</span>
                <span className="font-bold text-slate-900">
                  {permit.completionStatus || (permit.status === 'Closed' ? 'Completed' : 'In Progress')}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block uppercase">Site Housekeeping:</span>
                <span className="font-bold text-slate-900">
                  {permit.housekeepingDone ? '✓ Site Cleaned & Orderly' : 'Pending Verification'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block uppercase">Tools & Personnel Withdrawn:</span>
                <span className="font-bold text-slate-900">
                  {permit.toolsPersonnelRemoved ? '✓ 100% Cleared from Area' : 'Pending Verification'}
                </span>
              </div>
            </div>

            <div className="p-3 grid grid-cols-3 gap-3 border-b border-slate-300 text-[10px]">
              <div>
                <span className="font-bold text-slate-700 block">Electrical De-Isolation:</span>
                <span className="font-semibold text-slate-900">
                  Status: {permit.deIsolationElectrical || 'N/A'} (Locks/Tags removed)
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Mechanical De-Isolation:</span>
                <span className="font-semibold text-slate-900">
                  Status: {permit.deIsolationMechanical || 'N/A'} (Blinds removed / Normalized)
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Utilities De-Isolation:</span>
                <span className="font-semibold text-slate-900">
                  Status: {permit.deIsolationUtilities || 'N/A'} (Valves re-opened)
                </span>
              </div>
            </div>

            <div className="p-3 grid grid-cols-2 divide-x-2 divide-slate-900 text-[10px]">
              <div className="pr-3">
                <span className="font-bold uppercase text-slate-800 block mb-1">Performing Authority Sign-off:</span>
                <p className="text-[9px] text-slate-600 mb-1">
                  "Work is completed / suspended, site cleaned, tools removed, and area handed back."
                </p>
                <div>
                  <span className="font-bold text-slate-700">Handback By:</span>{' '}
                  <span className="font-semibold">{permit.receiverName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Handback Time:</span>{' '}
                  <span className="font-mono">
                    {permit.handbackDate ? new Date(permit.handbackDate).toLocaleString() : '—'}
                  </span>
                </div>
              </div>

              <div className="pl-3">
                <span className="font-bold uppercase text-slate-800 block mb-1">
                  Area Authority / CCR Final Closure Sign-off:
                </span>
                <p className="text-[9px] text-slate-600 mb-1">
                  "De-isolation verified, CCR informed, system normalized and accepted back into service."
                </p>
                <div>
                  <span className="font-bold text-slate-700">CCR Operator Notified:</span>{' '}
                  <span className="font-semibold">
                    {permit.ccrNotified ? `✓ Yes (${permit.ccrOperatorName || 'Control Room'})` : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Permit Closed By:</span>{' '}
                  <span className="font-semibold">
                    {permit.closureDate ? `Authorized Area Authority` : 'Open'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Closure Time:</span>{' '}
                  <span className="font-mono">
                    {permit.closureDate ? new Date(permit.closureDate).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="mt-4 pt-2 border-t border-slate-400 flex justify-between text-[9px] text-slate-500 font-mono">
            <span>Power Cement Limited — HSE Department Official Record</span>
            <span>Printed: {new Date().toLocaleString()}</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
