import React, { useState } from 'react';
import { Printer, ArrowLeft, CheckSquare, Square, Shield, Zap } from 'lucide-react';
import { ElectricalIsolationCertificate } from '../../../types/index.ts';

interface EicPrintViewProps {
  certificate: ElectricalIsolationCertificate;
  onClose: () => void;
}

export const EicPrintView: React.FC<EicPrintViewProps> = ({ certificate, onClose }) => {
  const [selectedCopy, setSelectedCopy] = useState<'ELECTRICAL' | 'SITE' | 'CCR' | 'HSE' | 'ALL'>('ELECTRICAL');

  const copies: Array<'ELECTRICAL' | 'SITE' | 'CCR' | 'HSE'> = ['ELECTRICAL', 'SITE', 'CCR', 'HSE'];

  const handlePrint = () => {
    window.print();
  };

  const renderSingleCopy = (copyType: 'ELECTRICAL' | 'SITE' | 'CCR' | 'HSE') => {
    return (
      <div
        key={copyType}
        className="bg-white text-black p-6 sm:p-8 font-sans max-w-4xl mx-auto shadow-2xl print:shadow-none print:p-0 print:max-w-none border border-slate-300 print:border-none mb-12 print:mb-0 print:break-after-page page-container"
      >
        {/* Certificate Header */}
        <div className="border-2 border-black pb-2 mb-3">
          <div className="flex items-center justify-between border-b-2 border-black px-4 py-2 bg-slate-100 print:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-black text-lg bg-black text-white">
                PCL
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-wide uppercase">Power Cement Limited</h1>
                <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest">
                  Health, Safety & Environment Management System
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-black border border-black px-2 py-0.5 bg-white">
                CERTIFICATE NO: <span className="text-sm underline">{certificate.certificateNumber}</span>
              </div>
              <div className="text-[10px] text-slate-600 mt-1 font-mono">
                STATUS: <span className="font-bold text-black uppercase">{certificate.status}</span>
                {certificate.linkedPtwNumber && (
                  <span className="ml-2 font-bold">| PTW: {certificate.linkedPtwNumber}</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-center py-1.5 bg-black text-white font-extrabold text-sm uppercase tracking-wider">
            ELECTRICAL ISOLATION CERTIFICATE
          </div>
        </div>

        {/* SECTION 1.0 — WORK DETAILS */}
        <div className="border-2 border-black mb-3">
          <div className="bg-slate-200 print:bg-slate-100 font-extrabold text-xs px-2 py-1 border-b border-black flex justify-between">
            <span>SECTION 1.0 — WORK DETAILS</span>
            <span className="font-mono text-[10px]">Ref: {certificate.certificateNumber}</span>
          </div>

          <div className="grid grid-cols-12 text-xs divide-x divide-y divide-black">
            <div className="col-span-8 p-2">
              <span className="font-bold block text-[10px] uppercase text-slate-700">1.1 Work Location:</span>
              <div className="font-semibold text-xs mt-0.5">{certificate.workLocation || '—'}</div>
            </div>
            <div className="col-span-4 p-2">
              <span className="font-bold block text-[10px] uppercase text-slate-700">Date & Time:</span>
              <div className="font-mono font-semibold text-xs mt-0.5">
                {certificate.date || '—'} at {certificate.time || '—'}
              </div>
            </div>

            <div className="col-span-12 p-2">
              <span className="font-bold block text-[10px] uppercase text-slate-700">1.2 Equipment to be Isolated:</span>
              <div className="font-semibold text-xs mt-0.5">{certificate.equipmentToIsolate || '—'}</div>
            </div>

            <div className="col-span-12 p-2">
              <span className="font-bold block text-[10px] uppercase text-slate-700">1.3 Work Description:</span>
              <div className="text-xs mt-0.5 whitespace-pre-wrap">{certificate.workDescription || '—'}</div>
            </div>
          </div>
        </div>

        {/* SECTION 2.0 — ISOLATION REQUISITION */}
        <div className="border-2 border-black mb-3">
          <div className="bg-slate-200 print:bg-slate-100 font-extrabold text-xs px-2 py-1 border-b border-black">
            SECTION 2.0 — ISOLATION REQUISITION
          </div>

          <div className="grid grid-cols-2 text-xs divide-x divide-black">
            {/* 2.1 Requestor */}
            <div className="p-2 space-y-1.5">
              <span className="font-bold text-[11px] block text-slate-800 underline">2.1 Requestor</span>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <span className="text-slate-600">Name:</span>
                <span className="col-span-2 font-semibold">{certificate.requestorName || '—'}</span>
                <span className="text-slate-600">Designation:</span>
                <span className="col-span-2 font-semibold">{certificate.requestorDesignation || '—'}</span>
                <span className="text-slate-600">Signature:</span>
                <span className="col-span-2 font-mono font-semibold">{certificate.requestorSignature || '(Pending Signature)'}</span>
                {certificate.requestorDate && (
                  <>
                    <span className="text-slate-600">Date/Time:</span>
                    <span className="col-span-2 font-mono text-[10px]">{certificate.requestorDate}</span>
                  </>
                )}
              </div>
            </div>

            {/* 2.2 Approved By */}
            <div className="p-2 space-y-1.5">
              <span className="font-bold text-[11px] block text-slate-800 underline">2.2 Approved By</span>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <span className="text-slate-600">Name:</span>
                <span className="col-span-2 font-semibold">{certificate.approverName || '—'}</span>
                <span className="text-slate-600">Designation:</span>
                <span className="col-span-2 font-semibold">{certificate.approverDesignation || '—'}</span>
                <span className="text-slate-600">Signature:</span>
                <span className="col-span-2 font-mono font-semibold">{certificate.approverSignature || '(Pending Approval)'}</span>
                {certificate.approvalRemarks && (
                  <>
                    <span className="text-slate-600">Remarks:</span>
                    <span className="col-span-2 italic text-[10px]">{certificate.approvalRemarks}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3.0 — DETAILS OF ELECTRICAL ISOLATION */}
        <div className="border-2 border-black mb-3">
          <div className="bg-slate-200 print:bg-slate-100 font-extrabold text-xs px-2 py-1 border-b border-black">
            SECTION 3.0 — DETAILS OF ELECTRICAL ISOLATION
          </div>

          {/* 3.1 Verification checkboxes */}
          <div className="p-2 border-b border-black bg-slate-50 print:bg-white">
            <span className="font-bold text-[11px] block mb-1 text-slate-800">
              3.1 Electrical Isolation Verification:
            </span>
            <div className="grid grid-cols-5 gap-2 text-[10px]">
              <div className="flex items-center gap-1.5">
                {certificate.fusesRemoved ? <CheckSquare className="w-3.5 h-3.5 text-black" /> : <Square className="w-3.5 h-3.5 text-slate-500" />}
                <span className={certificate.fusesRemoved ? 'font-bold' : ''}>Fuses removed</span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.mainSwitchedOff ? <CheckSquare className="w-3.5 h-3.5 text-black" /> : <Square className="w-3.5 h-3.5 text-slate-500" />}
                <span className={certificate.mainSwitchedOff ? 'font-bold' : ''}>Main switched off</span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.rackedOut ? <CheckSquare className="w-3.5 h-3.5 text-black" /> : <Square className="w-3.5 h-3.5 text-slate-500" />}
                <span className={certificate.rackedOut ? 'font-bold' : ''}>Racked out</span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.padlocksFitted ? <CheckSquare className="w-3.5 h-3.5 text-black" /> : <Square className="w-3.5 h-3.5 text-slate-500" />}
                <span className={certificate.padlocksFitted ? 'font-bold' : ''}>Padlocks fitted</span>
              </div>
              <div className="flex items-center gap-1.5">
                {certificate.tagsFitted ? <CheckSquare className="w-3.5 h-3.5 text-black" /> : <Square className="w-3.5 h-3.5 text-slate-500" />}
                <span className={certificate.tagsFitted ? 'font-bold' : ''}>Tags fitted</span>
              </div>
            </div>
          </div>

          {/* 3.2 Electrical Isolation Point Register */}
          <div className="p-2 border-b border-black">
            <span className="font-bold text-[11px] block mb-1.5 text-slate-800">
              3.2 Electrical Isolation Point Register:
            </span>
            <table className="w-full text-left border-collapse text-[10px] border border-black">
              <thead>
                <tr className="bg-slate-200 print:bg-slate-100 border-b border-black font-bold">
                  <th className="p-1 border-r border-black w-8 text-center">#</th>
                  <th className="p-1 border-r border-black">1. Location</th>
                  <th className="p-1 border-r border-black">2. Breaker No.</th>
                  <th className="p-1 border-r border-black w-24 text-center">3. Action (Open/Lock)</th>
                  <th className="p-1 border-r border-black w-28">4. Padlock No.</th>
                  <th className="p-1 w-24 text-center">5. Tag Out (Yes/No)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {certificate.isolationPoints.map((pt, idx) => (
                  <tr key={pt.id || idx} className="h-6">
                    <td className="p-1 border-r border-black text-center font-mono">{idx + 1}</td>
                    <td className="p-1 border-r border-black">{pt.location || '—'}</td>
                    <td className="p-1 border-r border-black font-mono font-semibold">{pt.breakerNo || '—'}</td>
                    <td className="p-1 border-r border-black text-center font-bold">{pt.action || '—'}</td>
                    <td className="p-1 border-r border-black font-mono">{pt.padlockNo || '—'}</td>
                    <td className="p-1 text-center font-bold">{pt.tagOut || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3.3 Confirmation by Competent Person */}
          <div className="p-2 text-xs space-y-2">
            <span className="font-bold text-[11px] block text-slate-800">
              3.3 Confirmation by Competent Person:
            </span>
            <p className="italic text-[10px] leading-relaxed text-slate-800 border-l-2 border-black pl-2 bg-slate-50 print:bg-white py-1">
              "I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed including CCR-Operator."
            </p>

            <div className="grid grid-cols-2 gap-4 pt-1 text-[11px]">
              <div className="space-y-1">
                <div><span className="font-bold">Name:</span> {certificate.competentPersonName || '—'}</div>
                <div><span className="font-bold">Designation:</span> {certificate.competentPersonDesignation || '—'}</div>
                <div><span className="font-bold">Sign-1 (Competent Person):</span> <span className="font-mono font-semibold">{certificate.competentPersonSignature || '—'}</span></div>
              </div>
              <div className="space-y-1">
                <div><span className="font-bold">Signature of Operator:</span> <span className="font-mono font-semibold">{certificate.operatorSignature || '—'}</span></div>
                {certificate.competentPersonConfirmedAt && (
                  <div className="text-[10px] text-slate-600 font-mono">
                    <span className="font-bold">Confirmed At:</span> {new Date(certificate.competentPersonConfirmedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4.0 — OTHER TYPES OF ISOLATION */}
        <div className="border-2 border-black mb-3">
          <div className="bg-slate-200 print:bg-slate-100 font-extrabold text-xs px-2 py-1 border-b border-black">
            SECTION 4.0 — OTHER TYPES OF ISOLATION (MECHANICAL / PROCESS)
          </div>

          <div className="p-2 border-b border-black">
            <table className="w-full text-left border-collapse text-[10px] border border-black">
              <thead>
                <tr className="bg-slate-200 print:bg-slate-100 border-b border-black font-bold">
                  <th className="p-1 border-r border-black w-8 text-center">#</th>
                  <th className="p-1 border-r border-black">1. Control Mechanism</th>
                  <th className="p-1 border-r border-black">2. Location</th>
                  <th className="p-1 border-r border-black w-24 text-center">3. I / O / D</th>
                  <th className="p-1 border-r border-black w-24 text-center">4. Lines Blanked</th>
                  <th className="p-1 border-r border-black w-24 text-center">5. Valves</th>
                  <th className="p-1 border-r border-black w-24">6. Padlock No.</th>
                  <th className="p-1 w-20 text-center">7. Tagged Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {certificate.otherIsolations.map((pt, idx) => (
                  <tr key={pt.id || idx} className="h-6">
                    <td className="p-1 border-r border-black text-center font-mono">{idx + 1}</td>
                    <td className="p-1 border-r border-black">{pt.controlMechanism || '—'}</td>
                    <td className="p-1 border-r border-black">{pt.location || '—'}</td>
                    <td className="p-1 border-r border-black text-center">{pt.inletOutletDrain || '—'}</td>
                    <td className="p-1 border-r border-black text-center font-bold">{pt.linesBlanked || '—'}</td>
                    <td className="p-1 border-r border-black text-center font-bold">{pt.valvesStatus || '—'}</td>
                    <td className="p-1 border-r border-black font-mono">{pt.padlockNo || '—'}</td>
                    <td className="p-1 text-center font-bold">{pt.taggedOut || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4.2 Isolation Confirmation */}
          <div className="p-2 text-xs space-y-2">
            <span className="font-bold text-[11px] block text-slate-800">
              4.2 Isolation Confirmation:
            </span>
            <p className="italic text-[10px] leading-relaxed text-slate-800 border-l-2 border-black pl-2 bg-slate-50 print:bg-white py-1">
              "I hereby confirm the above Isolations have been taken, the equipment has been proven de-energized by electrical test and all concerned/affected individuals have been adequately informed."
            </p>

            <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
              <div><span className="font-bold">Name:</span> {certificate.otherCompetentPersonName || '—'}</div>
              <div><span className="font-bold">Designation:</span> {certificate.otherCompetentPersonDesignation || '—'}</div>
              <div><span className="font-bold">Signature:</span> <span className="font-mono font-semibold">{certificate.otherCompetentPersonSignature || '—'}</span></div>
              <div className="font-mono text-[10px]">
                <span className="font-bold">Date/Time:</span> {certificate.otherConfirmationDate || '—'} {certificate.otherConfirmationTime}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5.0 — COMPLETION OF THE WORK */}
        <div className="border-2 border-black mb-3">
          <div className="bg-slate-200 print:bg-slate-100 font-extrabold text-xs px-2 py-1 border-b border-black">
            SECTION 5.0 — COMPLETION OF THE WORK
          </div>

          <div className="grid grid-cols-2 text-xs divide-x divide-black">
            {/* 5.1 Work Completion Declaration */}
            <div className="p-2 space-y-1.5">
              <span className="font-bold text-[11px] block text-slate-800 underline">
                5.1 Work Completion Declaration
              </span>
              <p className="italic text-[10px] leading-tight text-slate-800 border-l-2 border-black pl-2 py-0.5">
                "I hereby confirm that the work detailed in section 1 above is completed, the personnel and equipment withdrawn and the Isolation may now be removed by a competent responsible person."
              </p>
              <div className="grid grid-cols-3 gap-1 text-[11px] pt-1">
                <span className="text-slate-600">Person in charge:</span>
                <span className="col-span-2 font-semibold">{certificate.workPersonInChargeName || '—'}</span>
                <span className="text-slate-600">Signature:</span>
                <span className="col-span-2 font-mono font-semibold">{certificate.workPersonInChargeSignature || '—'}</span>
                <span className="text-slate-600">Date & Time:</span>
                <span className="col-span-2 font-mono text-[10px]">
                  {certificate.workCompletionDate || '—'} {certificate.workCompletionTime}
                </span>
              </div>
            </div>

            {/* 5.2 Completion Approval */}
            <div className="p-2 space-y-1.5">
              <span className="font-bold text-[11px] block text-slate-800 underline">
                5.2 Completion Approval
              </span>
              <div className="grid grid-cols-3 gap-1 text-[11px] pt-2">
                <span className="text-slate-600">Approved By:</span>
                <span className="col-span-2 font-semibold">{certificate.completionApproverName || '—'}</span>
                <span className="text-slate-600">Designation:</span>
                <span className="col-span-2 font-semibold">{certificate.completionApproverDesignation || '—'}</span>
                <span className="text-slate-600">Signature:</span>
                <span className="col-span-2 font-mono font-semibold">{certificate.completionApproverSignature || '—'}</span>
                {certificate.completionApprovedAt && (
                  <>
                    <span className="text-slate-600">Approved At:</span>
                    <span className="col-span-2 font-mono text-[10px]">{new Date(certificate.completionApprovedAt).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6.0 — CONFIRMATION OF DE-ISOLATION */}
        <div className="border-2 border-black mb-4">
          <div className="bg-slate-200 print:bg-slate-100 font-extrabold text-xs px-2 py-1 border-b border-black">
            SECTION 6.0 — CONFIRMATION OF DE-ISOLATION
          </div>

          <div className="p-2 text-xs space-y-2">
            <span className="font-bold text-[11px] block text-slate-800 underline">
              6.1 De-Isolation Declaration:
            </span>
            <p className="italic text-[10px] leading-relaxed text-slate-800 border-l-2 border-black pl-2 bg-slate-50 print:bg-white py-1">
              "I hereby confirm that the Isolations detailed in section 3/4 have been removed and the system re-energized."
            </p>

            <div className="grid grid-cols-12 gap-2 text-[11px] pt-1 border-t border-black/30">
              <div className="col-span-3">
                <span className="font-bold block text-[10px] text-slate-600">Name:</span>
                <span className="font-semibold">{certificate.deIsolationName || '—'}</span>
              </div>
              <div className="col-span-3">
                <span className="font-bold block text-[10px] text-slate-600">Designation:</span>
                <span className="font-semibold">{certificate.deIsolationDesignation || '—'}</span>
              </div>
              <div className="col-span-3">
                <span className="font-bold block text-[10px] text-slate-600">Signature:</span>
                <span className="font-mono font-semibold">{certificate.deIsolationSignature || '—'}</span>
              </div>
              <div className="col-span-3">
                <span className="font-bold block text-[10px] text-slate-600">Date & Time:</span>
                <span className="font-mono text-[10px]">{certificate.deIsolationDate || '—'} {certificate.deIsolationTime}</span>
              </div>

              <div className="col-span-12 pt-2 border-t border-black/20 mt-1">
                <span className="font-bold text-[11px] text-black mr-2">CCR Operator Signatures:</span>
                <span className="font-mono font-semibold text-xs border-b border-black pb-0.5 px-4 inline-block min-w-48">
                  {certificate.ccrOperatorSignatures || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DOCUMENT COPY DESIGNATIONS FOOTER */}
        <div className="border-t-2 border-black pt-3 mt-4 flex flex-col sm:flex-row items-center justify-between text-xs">
          <div className="font-mono text-[10px] text-slate-600">
            Document: PCL-HSE-EIC-V2 | Certificate No: {certificate.certificateNumber}
          </div>

          <div className="flex items-center gap-4 mt-2 sm:mt-0 font-bold text-[11px]">
            <span className={copyType === 'ELECTRICAL' ? 'bg-black text-white px-2 py-0.5 rounded' : 'text-slate-400'}>
              [ ELECTRICAL COPY ]
            </span>
            <span className={copyType === 'SITE' ? 'bg-black text-white px-2 py-0.5 rounded' : 'text-slate-400'}>
              [ SITE COPY ]
            </span>
            <span className={copyType === 'CCR' ? 'bg-black text-white px-2 py-0.5 rounded' : 'text-slate-400'}>
              [ CCR COPY ]
            </span>
            <span className={copyType === 'HSE' ? 'bg-black text-white px-2 py-0.5 rounded' : 'text-slate-400'}>
              [ HSE COPY ]
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 overflow-y-auto">
      {/* Top Floating Control Bar (Hidden during print) */}
      <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 p-4 shadow-xl print:hidden">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Register</span>
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Electrical Isolation Certificate Print View
              </h2>
              <span className="text-[11px] font-mono text-emerald-400">{certificate.certificateNumber}</span>
            </div>
          </div>

          {/* Copy Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedCopy('ELECTRICAL')}
              className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                selectedCopy === 'ELECTRICAL' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Electrical Copy
            </button>
            <button
              onClick={() => setSelectedCopy('SITE')}
              className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                selectedCopy === 'SITE' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Site Copy
            </button>
            <button
              onClick={() => setSelectedCopy('CCR')}
              className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                selectedCopy === 'CCR' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CCR Copy
            </button>
            <button
              onClick={() => setSelectedCopy('HSE')}
              className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                selectedCopy === 'HSE' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              HSE Copy
            </button>
            <button
              onClick={() => setSelectedCopy('ALL')}
              className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                selectedCopy === 'ALL' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All 4 Copies
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-emerald-950 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="p-4 sm:p-8">
        {selectedCopy === 'ALL' ? (
          copies.map((c) => renderSingleCopy(c))
        ) : (
          renderSingleCopy(selectedCopy)
        )}
      </div>
    </div>
  );
};
