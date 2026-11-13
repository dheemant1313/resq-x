import { ShieldAlert, Phone, KeyRound, X, Check } from 'lucide-react';
import type { RoleType } from './types';

interface ForgotPasswordModalProps {
  role: RoleType;
  onClose: () => void;
}

export default function ForgotPasswordModal({ role, onClose }: ForgotPasswordModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-6 rounded-2xl border border-cyan-500/40 bg-slate-900/90 shadow-[0_0_50px_rgba(249,115,22,0.2)] text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-emergency-orange border border-amber-500/40 flex items-center justify-center shrink-0">
            <KeyRound size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono tracking-wide">
              Credential Recovery Protocol
            </h3>
            <span className="text-xs text-amber-400/90 font-mono">
              ROLE CLEARANCE: {role}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
          <p>
            To prevent hostile interception and preserve disaster coordination integrity, automated password resets via public email links are disabled under RESQ-X operational protocols.
          </p>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert size={15} className="text-emergency-orange shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-mono block">
                  {role === 'RELIEF_CENTER' 
                    ? 'NDRF Field Coordinator Recovery' 
                    : role === 'OPERATOR' 
                    ? 'Central Operator Security Protocol' 
                    : 'System Administrator Override'}
                </strong>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {role === 'RELIEF_CENTER'
                    ? 'Contact your State Disaster Management Authority (SDMA) or the Central Operations Room to request a signed one-time credential reset packet.'
                    : role === 'OPERATOR'
                    ? 'Operator accounts possess regional inventory allocation and fleet routing authority. You must contact the SecOps Administrator with your hardware token.'
                    : 'Use the master root secret key provisioned during initial air-gapped system initialization.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/60 text-cyan-200 space-y-1">
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-cyan-300">
              <Phone size={13} />
              <span>EMERGENCY DISPATCH HOTLINE</span>
            </div>
            <p className="font-mono text-xs text-white">
              +91 (11) 2436-3260 &bull; Extension #9 (Relief Desk)
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-amber text-xs font-mono !py-2 px-5 flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>ACKNOWLEDGE & RETURN</span>
          </button>
        </div>
      </div>
    </div>
  );
}
