import React from 'react';
import { X, FileCheck, Zap, ArrowRight, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';

interface DocumentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPtw: () => void;
  onSelectEic: () => void;
}

export const DocumentSelectionModal: React.FC<DocumentSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectPtw,
  onSelectEic,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Initial Document Selection
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose the official PCL HSE document type to initiate
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Selection Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Permit to Work */}
          <div
            onClick={onSelectPtw}
            className="group relative bg-slate-950/60 hover:bg-slate-800/60 border-2 border-slate-800 hover:border-emerald-500/80 rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-lg hover:shadow-emerald-950/30"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <FileCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Option A
                </span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Permit to Work (PTW)
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Multi-discipline safe work authorization covering Cold Work, Hot Work, Confined Space Entry, Lifting Activity, and Work at Height.
              </p>
              <div className="mt-3 space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Strict 12-hour maximum validity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Dynamic discipline-specific checklists</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>CSE conditional gas testing</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Open PTW Form</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Option B: Electrical Isolation Certificate */}
          <div
            onClick={onSelectEic}
            className="group relative bg-slate-950/60 hover:bg-slate-800/60 border-2 border-slate-800 hover:border-amber-500/80 rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-lg hover:shadow-amber-950/30"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Option B
                </span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Electrical Isolation Certificate
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Official PCL Plant Electrical & Process Energy Isolation Certificate (Sections 1.0 through 6.1) for lock-out / tag-out of electrical & mechanical equipment.
              </p>
              <div className="mt-3 space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Breaker & mechanical point registers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Competent person & operator signs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Distinct work completion & de-isolation</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-400 group-hover:text-amber-300">
              <span>Open Isolation Certificate</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Documents operate independently and maintain separate audit trails.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
