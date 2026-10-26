import React, { useState } from 'react';
import { X, Printer, Shield, CheckSquare, Square, Zap, Lock } from 'lucide-react';
import { ElectricalIsolationCertificate } from '../../types/index.ts';

interface EicPrintViewProps {
  certificate: ElectricalIsolationCertificate;
  onClose: () => void;
}

type CopyDesignation = 'ELECTRICAL COPY' | 'SITE COPY' | 'CCR COPY' | 'HSE COPY';

export const EicPrintView: React.FC<EicPrintViewProps> = ({ certificate, onClose }) => {
  const [activeCopy, setActiveCopy] = useState<CopyDesignation>('ELECTRICAL COPY');

  const handlePrint = () => {
    window.print();
  };

  const copyOptions: CopyDesignation[] = [
    'ELECTRICAL COPY',
    'SITE COPY',
    'CCR COPY',
    'HSE COPY',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static">
      {/* Top Floating Control Bar - Hidden in Print */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl">
        <div className="flex items-center gap-1 mr-2 border-r border-slate-700 pr-2">
          {copyOptions.map((copy) => (
            <button
              key={copy}
              type="button"
              onClick={() => setActiveCopy(copy)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                activeCopy === copy
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {copy.replace(' COPY', '')}
            </button>
          ))}
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Print Preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Printable Document Canvas */}
      <div className="bg-white text-slate-900 w-full max-w-4xl p-6 sm:p-8 my-auto shadow-2xl rounded-sm print:shadow-none print:m-0 print:p-6 font-sans border border-slate-300 print:border-none text-xs leading-normal">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center font-black text-xl rounded">
                PCL
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-wider text-slate-950">
                  Power Cement Limited
                </h1>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700">
                  Integrated HSE & Plant Safety Management System
                </p>
                <h2 className="text-sm font-black uppercase text-amber-700 mt-0.5 tracking-wider">
                  Electrical Isolation Certificate
                </h2>
              </div>
            </div>

            <div className="text-right">
              <div className="border-2 border-slate-900 px-3 py-1.5 bg-slate-50 inline-block text-left">
                <span className="text-[9px] font-bold uppercase text-slate-600 block">Certificate No:</span>
                <span className="font-mono text-base font-extrabold text-slate-950 tracking-wider">
                  {certificate.certificateNumber}
                </span>
              </div>
              {certificate.ptwNumber && (
                <div className="text-[10px] text-slate-600 font-semibold mt-1">
                  Associated PTW: <span className="font-mono text-slate-900 font-bold">{certificate.ptwNumber}</span>
                </div>
              )}
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5 uppercase">
                Status: <span className="text-slate-900 font-bold">{certificate.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1.0: Work Details */}
        <div className="border-2 border-slate-900 mb-3">
          <div className="bg-slate-900 text-white font-bold px-3 py-1 uppercase text-[11px] flex justify-between items-center">
            <span>Section 1.0 — Work Details</span>
            <span className="text-[10px] font-normal text-slate-300">Plant Isolation Request</span>
          </div>
          <div className="p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-300">
            <div className="col-span-2">
              <span className="font-bold text-slate-600 block text-[10px] uppercase">1.1 Work Location:</span>
              <span className="font-semibold text-slate-950 text-xs">{certificate.workLocation}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">Date:</span>
              <span className="font-semibold text-slate-950 text-xs">{certificate.requestDate}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">Time:</span>
              <span className="font-semibold text-slate-950 text-xs">{certificate.requestTime}</span>
            </div>
          </div>

          <div className="p-2.5 grid grid-cols-1 sm:grid-cols-4 gap-2 border-b border-slate-300 bg-slate-50">
            <div className="sm:col-span-3">
              <span className="font-bold text-slate-600 block text-[10px] uppercase">1.2 Equipment to be Isolated:</span>
              <span className="font-semibold text-slate-950 text-xs">{certificate.equipmentToIsolate}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">Equipment / Tag No:</span>
              <span className="font-semibold text-slate-950 text-xs font-mono">{certificate.equipmentTag || 'N/A'}</span>
            </div>
          </div>

          <div className="p-2.5">
            <span className="font-bold text-slate-600 block text-[10px] uppercase">1.3 Work Description:</span>
            <p className="font-medium text-slate-900 whitespace-pre-wrap text-xs mt-0.5">
              {certificate.workDescription}
            </p>
          </div>
        </div>

        {/* Section 2.0: Isolation Requisition */}
        <div className="border-2 border-slate-900 mb-3">
          <div className="bg-slate-900 text-white font-bold px-3 py-1 uppercase text-[11px]">
            Section 2.0 — Isolation Requisition
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-slate-900">
            {/* 2.1 Requestor */}
            <div className="p-2.5 space-y-1.5">
              <span className="font-bold text-[10px] uppercase text-slate-700 block">
                2.1 Requested By (Performing Authority / Lead Engineer):
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="font-bold text-slate-600 block">Name:</span>
                  <span className="font-semibold text-slate-900 text-xs">{certificate.requestorName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 block">Designation:</span>
                  <span className="font-semibold text-slate-900 text-xs">{certificate.requestorDesignation || 'Engineer'}</span>
                </div>
              </div>
              <div className="pt-1 text-[10px] flex items-center justify-between border-t border-slate-200">
                <span className="font-bold text-slate-600">Signature:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {certificate.requestorSignature || certificate.requestorName} (Signed)
                </span>
              </div>
            </div>

            {/* 2.2 Approved By */}
            <div className="p-2.5 space-y-1.5">
              <span className="font-bold text-[10px] uppercase text-slate-700 block">
                2.2 Approved By (Area / Electrical Authority):
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="font-bold text-slate-600 block">Name:</span>
                  <span className="font-semibold text-slate-900 text-xs">
                    {certificate.approvedByName || 'Pending Authorization'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 block">Designation:</span>
                  <span className="font-semibold text-slate-900 text-xs">
                    {certificate.approvedByDesignation || 'Authorized Approver'}
                  </span>
                </div>
              </div>
              <div className="pt-1 text-[10px] flex items-center justify-between border-t border-slate-200">
                <span className="font-bold text-slate-600">Signature:</span>
                <span className="font-mono font-bold text-slate-800">
                  {certificate.approvedBySignature || (certificate.approvedByName ? `${certificate.approvedByName} (Approved)` : 'Pending')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3.0: Details of Electrical Isolation */}
        <div className="border-2 border-slate-900 mb-3">
          <div className="bg-slate-900 text-white font-bold px-3 py-1 uppercase text-[11px] flex justify-between items-center">
            <span>Section 3.0 — Details of Electrical Isolation</span>
            <span className="text-[10px] font-normal text-slate-300">Lockout / Tagout (LOTO)</span>
          </div>

          {/* 3.1 Verification Checkboxes */}
          <div className="p-2.5 border-b border-slate-300 bg-slate-50">
            <span className="font-bold text-slate-700 text-[10px] uppercase block mb-1.5">
              3.1 Electrical Isolation Verification Controls:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                {certificate.fusesRemoved ? (
                  <CheckSquare className="w-4 h-4 text-slate-900 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className={certificate.fusesRemoved ? 'font-bold text-slate-950' : 'text-slate-600'}>
                  Fuses removed
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.mainSwitchedOff ? (
                  <CheckSquare className="w-4 h-4 text-slate-900 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className={certificate.mainSwitchedOff ? 'font-bold text-slate-950' : 'text-slate-600'}>
                  Main switched off
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.rackedOut ? (
                  <CheckSquare className="w-4 h-4 text-slate-900 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className={certificate.rackedOut ? 'font-bold text-slate-950' : 'text-slate-600'}>
                  Racked out
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.padlocksFitted ? (
                  <CheckSquare className="w-4 h-4 text-slate-900 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className={certificate.padlocksFitted ? 'font-bold text-slate-950' : 'text-slate-600'}>
                  Padlocks fitted
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.tagsFitted ? (
                  <CheckSquare className="w-4 h-4 text-slate-900 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className={certificate.tagsFitted ? 'font-bold text-slate-950' : 'text-slate-600'}>
                  Tags fitted
                </span>
              </div>
            </div>
          </div>

          {/* 3.2 Electrical Isolation Point Register */}
          <div className="p-2 border-b border-slate-300">
            <span className="font-bold text-slate-700 text-[10px] uppercase block mb-1">
              3.2 Electrical Isolation Point Register:
            </span>
            <table className="w-full text-[10px] text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-400 font-bold">
                  <th className="p-1 border-r border-slate-300 w-10 text-center">Sr #</th>
                  <th className="p-1 border-r border-slate-300">Location</th>
                  <th className="p-1 border-r border-slate-300">Breaker No.</th>
                  <th className="p-1 border-r border-slate-300 w-24 text-center">Action</th>
                  <th className="p-1 border-r border-slate-300 w-28">Padlock No.</th>
                  <th className="p-1 w-20 text-center">Tag Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {certificate.electricalPoints && certificate.electricalPoints.length > 0 ? (
                  certificate.electricalPoints.map((pt, idx) => (
                    <tr key={pt.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1 text-center font-mono font-bold text-slate-600 border-r border-slate-300">
                        {idx + 1}
                      </td>
                      <td className="p-1 font-medium border-r border-slate-300">{pt.location || '—'}</td>
                      <td className="p-1 font-mono font-bold border-r border-slate-300">{pt.breakerNo || '—'}</td>
                      <td className="p-1 text-center font-bold border-r border-slate-300">
                        {pt.action ? (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] uppercase ${
                              pt.action === 'Lock'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                                : 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
                            }`}
                          >
                            {pt.action}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-1 font-mono border-r border-slate-300">{pt.padlockNo || '—'}</td>
                      <td className="p-1 text-center font-bold">
                        {pt.tagOut ? (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] ${
                              pt.tagOut === 'Yes' ? 'text-emerald-800 font-bold' : 'text-slate-600'
                            }`}
                          >
                            {pt.tagOut}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-2 text-center text-slate-500 italic">
                      No electrical isolation points registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 3.3 Confirmation by Competent Person */}
          <div className="p-2.5 bg-slate-50/70">
            <span className="font-bold text-slate-700 text-[10px] uppercase block mb-1">
              3.3 Confirmation by Competent Person:
            </span>
            <p className="text-[10px] text-slate-700 italic border-l-2 border-slate-800 pl-2 mb-2 bg-white p-1 rounded-sm">
              “I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed including CCR-Operator.”
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div>
                <span className="font-bold text-slate-600 block">Name of Competent Person:</span>
                <span className="font-semibold text-slate-900">{certificate.electricalCompetentName || '—'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Designation:</span>
                <span className="font-semibold text-slate-900">
                  {certificate.electricalCompetentDesignation || 'Competent Electrical Person'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Signature of Operator:</span>
                <span className="font-mono font-bold text-slate-800">
                  {certificate.electricalOperatorSignature || '—'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Sign-1 (Competent Person):</span>
                <span className="font-mono font-bold text-emerald-800">
                  {certificate.electricalCompetentSignature || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4.0: Other Types of Isolation */}
        <div className="border-2 border-slate-900 mb-3">
          <div className="bg-slate-900 text-white font-bold px-3 py-1 uppercase text-[11px] flex justify-between items-center">
            <span>Section 4.0 — Other Types of Isolation</span>
            <span className="text-[10px] font-normal text-slate-300">Mechanical, Process, Piping & Utilities</span>
          </div>

          {/* 4.1 Other Isolation Register */}
          <div className="p-2 border-b border-slate-300">
            <table className="w-full text-[10px] text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-400 font-bold">
                  <th className="p-1 border-r border-slate-300 w-10 text-center">Sr #</th>
                  <th className="p-1 border-r border-slate-300">Control Mechanism</th>
                  <th className="p-1 border-r border-slate-300">Location</th>
                  <th className="p-1 border-r border-slate-300 w-16 text-center">I / O / D</th>
                  <th className="p-1 border-r border-slate-300 w-24 text-center">Lines: Blanked</th>
                  <th className="p-1 border-r border-slate-300 w-24 text-center">Valves</th>
                  <th className="p-1 border-r border-slate-300 w-24">Padlock No.</th>
                  <th className="p-1 w-20 text-center">Tagged Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {certificate.otherPoints && certificate.otherPoints.length > 0 ? (
                  certificate.otherPoints.map((pt, idx) => (
                    <tr key={pt.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1 text-center font-mono font-bold text-slate-600 border-r border-slate-300">
                        {idx + 1}
                      </td>
                      <td className="p-1 font-medium border-r border-slate-300">{pt.controlMechanism || '—'}</td>
                      <td className="p-1 border-r border-slate-300">{pt.location || '—'}</td>
                      <td className="p-1 text-center font-bold border-r border-slate-300">{pt.inletOutletDrain || '—'}</td>
                      <td className="p-1 text-center border-r border-slate-300 font-semibold">{pt.blanked || '—'}</td>
                      <td className="p-1 text-center border-r border-slate-300 font-semibold">{pt.valves || '—'}</td>
                      <td className="p-1 font-mono border-r border-slate-300">{pt.padlockNo || '—'}</td>
                      <td className="p-1 text-center font-bold">{pt.taggedOut || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-2 text-center text-slate-500 italic">
                      No other isolation points registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 4.2 Isolation Confirmation */}
          <div className="p-2.5 bg-slate-50/70">
            <span className="font-bold text-slate-700 text-[10px] uppercase block mb-1">
              4.2 Isolation Confirmation:
            </span>
            <p className="text-[10px] text-slate-700 italic border-l-2 border-slate-800 pl-2 mb-2 bg-white p-1 rounded-sm">
              “I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed.”
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
              <div>
                <span className="font-bold text-slate-600 block">Name of Competent Person:</span>
                <span className="font-semibold text-slate-900">{certificate.otherCompetentName || '—'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Designation:</span>
                <span className="font-semibold text-slate-900">{certificate.otherCompetentDesignation || 'Mechanical Person'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Signature:</span>
                <span className="font-mono font-bold text-slate-800">{certificate.otherCompetentSignature || '—'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Date:</span>
                <span className="font-semibold text-slate-900">{certificate.otherIsolationDate || '—'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Time:</span>
                <span className="font-semibold text-slate-900">{certificate.otherIsolationTime || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5.0: Completion of the Work */}
        <div className="border-2 border-slate-900 mb-3">
          <div className="bg-slate-900 text-white font-bold px-3 py-1 uppercase text-[11px] flex justify-between items-center">
            <span>Section 5.0 — Completion of the Work</span>
            <span className="text-[10px] font-normal text-slate-300">Work Area Clearance & Handover</span>
          </div>

          {/* 5.1 Work Completion Declaration */}
          <div className="p-2.5 border-b border-slate-300">
            <span className="font-bold text-slate-700 text-[10px] uppercase block mb-1">
              5.1 Work Completion Declaration:
            </span>
            <p className="text-[10px] text-slate-700 italic border-l-2 border-slate-800 pl-2 mb-2 bg-slate-50 p-1 rounded-sm">
              “I hereby confirm that the work detailed in section 1 above is completed, the personnel and equipment withdrawn and the Isolation may now be removed by a competent responsible person.”
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div>
                <span className="font-bold text-slate-600 block">Person in Charge of Work:</span>
                <span className="font-semibold text-slate-900 text-xs">
                  {certificate.workCompletionPerson || 'Pending Work Completion'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Signature:</span>
                <span className="font-mono font-bold text-slate-800">
                  {certificate.workCompletionSignature || '—'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Date:</span>
                <span className="font-semibold text-slate-900">{certificate.workCompletionDate || '—'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Time:</span>
                <span className="font-semibold text-slate-900">{certificate.workCompletionTime || '—'}</span>
              </div>
            </div>
          </div>

          {/* 5.2 Completion Approval */}
          <div className="p-2.5 bg-slate-50/70">
            <span className="font-bold text-slate-700 text-[10px] uppercase block mb-1">
              5.2 Completion Approval:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
              <div>
                <span className="font-bold text-slate-600 block">Approved By (Name):</span>
                <span className="font-semibold text-slate-900 text-xs">
                  {certificate.completionApprovedByName || '—'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Designation:</span>
                <span className="font-semibold text-slate-900 text-xs">
                  {certificate.completionApprovedByDesignation || '—'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Signature:</span>
                <span className="font-mono font-bold text-slate-800">
                  {certificate.completionApprovedBySignature || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6.0: Confirmation of De-Isolation */}
        <div className="border-2 border-slate-900 mb-4">
          <div className="bg-slate-900 text-white font-bold px-3 py-1 uppercase text-[11px] flex justify-between items-center">
            <span>Section 6.0 — Confirmation of De-Isolation</span>
            <span className="text-[10px] font-normal text-slate-300">CCR & System Re-energization</span>
          </div>

          {/* 6.1 De-Isolation Declaration */}
          <div className="p-2.5">
            <span className="font-bold text-slate-700 text-[10px] uppercase block mb-1">
              6.1 De-Isolation Declaration:
            </span>
            <p className="text-[10px] text-slate-700 italic border-l-2 border-slate-800 pl-2 mb-2 bg-slate-50 p-1 rounded-sm">
              “I hereby confirm that the Isolations detailed in section 3/4 have been removed and the system re-energized.”
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] border-b border-slate-200 pb-2 mb-2">
              <div>
                <span className="font-bold text-slate-600 block">Name of Competent Person:</span>
                <span className="font-semibold text-slate-900 text-xs">{certificate.deIsolationName || 'Pending De-isolation'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Designation:</span>
                <span className="font-semibold text-slate-900 text-xs">{certificate.deIsolationDesignation || '—'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Signature:</span>
                <span className="font-mono font-bold text-emerald-800">{certificate.deIsolationSignature || '—'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Date:</span>
                <span className="font-semibold text-slate-900">{certificate.deIsolationDate || '—'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block">Time:</span>
                <span className="font-semibold text-slate-900">{certificate.deIsolationTime || '—'}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 text-[10px] uppercase block">
                CCR Operator Signatures & Central Control Room Normalization:
              </span>
              <div className="flex items-center justify-between text-[10px] pt-1">
                <span className="text-slate-600">Central Control Room (CCR) Informed & Accepted:</span>
                <span className="font-mono font-bold text-slate-900">
                  {certificate.ccrOperatorSignature || 'Pending Final Normalization'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Copy Designation Footer */}
        <div className="border-t-2 border-slate-900 pt-3">
          <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2">
            <span>Power Cement Limited (PCL) — Official Safety & Environmental Management Document</span>
            <span className="font-mono">Page 1 of 1</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black tracking-wider uppercase">
            <div
              className={`p-1.5 border-2 ${
                activeCopy === 'ELECTRICAL COPY'
                  ? 'border-slate-950 bg-slate-900 text-white shadow'
                  : 'border-slate-400 text-slate-600 bg-slate-50'
              }`}
            >
              ELECTRICAL COPY
            </div>
            <div
              className={`p-1.5 border-2 ${
                activeCopy === 'SITE COPY'
                  ? 'border-slate-950 bg-slate-900 text-white shadow'
                  : 'border-slate-400 text-slate-600 bg-slate-50'
              }`}
            >
              SITE COPY
            </div>
            <div
              className={`p-1.5 border-2 ${
                activeCopy === 'CCR COPY'
                  ? 'border-slate-950 bg-slate-900 text-white shadow'
                  : 'border-slate-400 text-slate-600 bg-slate-50'
              }`}
            >
              CCR COPY
            </div>
            <div
              className={`p-1.5 border-2 ${
                activeCopy === 'HSE COPY'
                  ? 'border-slate-950 bg-slate-900 text-white shadow'
                  : 'border-slate-400 text-slate-600 bg-slate-50'
              }`}
            >
              HSE COPY
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
