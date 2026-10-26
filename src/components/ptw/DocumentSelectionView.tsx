import React from 'react';
import {
  FileCheck,
  Zap,
  ArrowRight,
  ShieldCheck,
  Layers,
  Lock,
  Flame,
  Gauge,
  Printer,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface DocumentSelectionViewProps {
  onSelectPtw: () => void;
  onSelectEic: () => void;
  ptwCount?: number;
  eicCount?: number;
}

export const DocumentSelectionView: React.FC<DocumentSelectionViewProps> = ({
  onSelectPtw,
  onSelectEic,
  ptwCount = 0,
  eicCount = 0,
}) => {
  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Power Cement Limited — Work Safety Authorization</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Select Safety Document to Open
        </h1>
        <p className="text-sm text-slate-400">
          Choose between standard multi-discipline <span className="text-emerald-400 font-medium">Permit-to-Work (PTW)</span> authorization or formal <span className="text-sky-400 font-medium">Electrical Isolation Certificate (EIC)</span> protocols. Both modules persist records in the database with strict workflow stages and printable audit copies.
        </p>
      </div>

      {/* Two Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Card A: Permit to Work */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500/50 transition-all duration-300 shadow-xl group">
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <FileCheck className="w-7 h-7" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold">
                {ptwCount} Active Records
              </span>
            </div>

            <div>
              <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Option A</div>
              <h2 className="text-xl font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">
                Permit to Work (PTW)
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Standard operational permit digitization for industrial plant activities across Cement Mill, Raw Mill, Kiln, Crusher, and Packing Plant sections.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>5 Disciplines:</strong> Cold Work, Hot Work, Confined Space, Lifting, Work at Height</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>12-Hour Validity:</strong> Strict time limits with Day 2 to Day 7 extension records</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>Dynamic Checklists:</strong> Tailored hazard controls and safety verifications</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><strong>Atmospheric Testing:</strong> Gas testing records (O₂, LEL, CO, H₂S) for Confined Spaces</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800">
            <button
              onClick={onSelectPtw}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50 group-hover:shadow-emerald-900/40 cursor-pointer"
            >
              <span>OPEN PERMIT TO WORK</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card B: Electrical Isolation Certificate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-sky-500/50 transition-all duration-300 shadow-xl group">
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-xl bg-sky-600/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Zap className="w-7 h-7" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold">
                {eicCount} Active Records
              </span>
            </div>

            <div>
              <div className="text-xs uppercase font-bold text-sky-400 tracking-wider">Option B</div>
              <h2 className="text-xl font-bold text-white mt-1 group-hover:text-sky-300 transition-colors">
                Electrical Isolation Certificate
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Formal multi-point zero-energy isolation certification covering high-voltage / low-voltage electrical switchgear, mechanical lines, and valves.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span><strong>6-Section Protocol:</strong> Section 1.0 Work Details through 6.1 De-Isolation confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span><strong>Isolation Point Register:</strong> Breaker numbers, Open/Lock action, padlocks & tags</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span><strong>Mechanical & Other Isolation:</strong> Lines blanked, valves status, and drain points</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span><strong>4-Copy Printout:</strong> Electrical Copy, Site Copy, CCR Copy, and HSE Copy</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800">
            <button
              onClick={onSelectEic}
              className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-950/50 group-hover:shadow-sky-900/40 cursor-pointer"
            >
              <span>OPEN ELECTRICAL ISOLATION CERTIFICATE</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Industrial Guidance Note */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center gap-3 text-xs text-slate-400">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div>
          <span className="font-semibold text-slate-200">Operational Guideline:</span> Permit to Work (PTW) and Electrical Isolation Certificate (EIC) maintain separate independent workflows and registers. Where electrical or mechanical equipment must be de-energized for PTW tasks, you can optionally link the Electrical Isolation Certificate number to the corresponding PTW.
        </div>
      </div>
    </div>
  );
};
