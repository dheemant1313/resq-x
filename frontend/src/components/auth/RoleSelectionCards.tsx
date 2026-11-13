import { 
  LifeBuoy, 
  Radio, 
  ArrowRight, 
  UserPlus, 
  Lock, 
  Shield, 
  Layers, 
  Navigation, 
  Boxes, 
  CheckCircle2,
  SlidersHorizontal,
  KeyRound
} from 'lucide-react';
import type { RoleType } from './types';

interface RoleSelectionCardsProps {
  onSelectRole: (role: RoleType) => void;
  onOpenNDRFRegister: () => void;
  onOpenOperatorLocked: () => void;
}

export default function RoleSelectionCards({
  onSelectRole,
  onOpenNDRFRegister,
  onOpenOperatorLocked,
}: RoleSelectionCardsProps) {
  return (
    <div className="space-y-6">
      {/* Tactical Center Banner */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emergency-orange/15 border border-emergency-orange/40 text-emergency-orange text-[11px] font-mono tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emergency-orange animate-ping" />
          <span>Operational Node Clearance</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-wide">
          Select Command Portal
        </h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Choose your operational role to access assigned resource coordination protocols.
        </p>
      </div>

      {/* Two Separate Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1 — NDRF / RELIEF CENTER */}
        <div 
          className="group relative flex flex-col justify-between p-5 rounded-2xl border border-cyan-400/30 bg-slate-950/70 hover:bg-slate-900/80 hover:border-emergency-orange/70 transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.1)] hover:shadow-[0_0_40px_rgba(249,115,22,0.25)]"
        >
          {/* Top Tag */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>FIELD LEVEL REQUISITION</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">NODE 01</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 flex items-center justify-center group-hover:scale-105 group-hover:text-emergency-orange group-hover:border-emergency-orange/50 transition-all">
                <LifeBuoy size={26} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono tracking-wide">
                  NDRF / RELIEF CENTER
                </h3>
                <p className="text-xs text-emergency-orange font-mono">
                  Ground Zero Emergency Node
                </p>
              </div>
            </div>

            {/* Prompt description */}
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Submit relief requests and track allocations.
            </p>

            {/* Tactical Capabilities */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                <span>Frontline population triage & requisitions</span>
              </div>
              <div className="flex items-center gap-2">
                <Boxes size={13} className="text-cyan-400 shrink-0" />
                <span>Track approved, partial & remaining supplies</span>
              </div>
              <div className="flex items-center gap-2">
                <Navigation size={13} className="text-cyan-400 shrink-0" />
                <span>Permitted dispatch corridor verification</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800/80 space-y-2.5">
            <button
              onClick={() => onSelectRole('RELIEF_CENTER')}
              className="btn btn-amber w-full !py-2.5 font-mono text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.25)]"
            >
              <span>ACCESS RELIEF PORTAL</span>
              <ArrowRight size={14} />
            </button>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={onOpenNDRFRegister}
                className="text-[11px] font-mono text-cyan-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <UserPlus size={12} />
                <span>Register New Relief Camp</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2 — OPERATOR */}
        <div 
          className="group relative flex flex-col justify-between p-5 rounded-2xl border border-amber-500/30 bg-slate-950/70 hover:bg-slate-900/80 hover:border-amber-400/80 transition-all duration-300 shadow-[0_0_30px_rgba(245,158,11,0.1)] hover:shadow-[0_0_40px_rgba(245,158,11,0.25)]"
        >
          {/* Top Tag */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>CENTRAL COMMAND NODE</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">NODE 02</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 flex items-center justify-center group-hover:scale-105 group-hover:text-amber-200 group-hover:border-amber-400/60 transition-all">
                <Radio size={26} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono tracking-wide">
                  OPERATOR
                </h3>
                <p className="text-xs text-amber-400/90 font-mono">
                  State Logistics Headquarters
                </p>
              </div>
            </div>

            {/* Prompt description */}
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Manage inventory, review requests and allocate resources.
            </p>

            {/* Tactical Capabilities */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300 font-mono">
              <div className="flex items-center gap-2">
                <Layers size={13} className="text-amber-400 shrink-0" />
                <span>Multi-center central inventory triage</span>
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-amber-400 shrink-0" />
                <span>0/1 Knapsack payload vehicle optimization</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={13} className="text-amber-400 shrink-0" />
                <span>Dijkstra shortest-path & hazard bypass</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800/80 space-y-2.5">
            <button
              onClick={() => onSelectRole('OPERATOR')}
              className="btn w-full !py-2.5 font-mono text-xs flex items-center justify-center gap-2 border-amber-400/60 text-amber-100 hover:border-amber-300 hover:bg-amber-400/15 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              <span>ACCESS CENTRAL COMMAND</span>
              <ArrowRight size={14} />
            </button>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={onOpenOperatorLocked}
                className="text-[11px] font-mono text-slate-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
              >
                <Lock size={12} className="text-amber-400/80" />
                <span>Operator accounts require Admin provisioning</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Discreet System Administrator Option */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => onSelectRole('ADMIN')}
          className="text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
        >
          <KeyRound size={13} />
          <span>System Administrator Sign In (SecOps Override)</span>
        </button>
      </div>
    </div>
  );
}
