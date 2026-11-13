import { Lock, ShieldAlert, UserCheck, X } from 'lucide-react';

interface OperatorRestrictedModalProps {
  onClose: () => void;
  onProceedToLogin: () => void;
}

export default function OperatorRestrictedModal({
  onClose,
  onProceedToLogin,
}: OperatorRestrictedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-6 rounded-2xl border border-amber-500/50 bg-slate-900/95 shadow-[0_0_60px_rgba(245,158,11,0.25)] text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Lock size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono tracking-wide">
              Operator Registration Restricted
            </h3>
            <span className="text-[11px] text-amber-300 font-mono tracking-wider">
              POLICY REGULATION: SEC-OPS-04
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-200 flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Public Operator self-registration is strictly prohibited.</strong> Under the RESQ-X operational architecture, Operator accounts control central warehouse allocation, 0/1 Knapsack payload planning, and critical transport routes.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="font-mono text-white text-xs font-bold flex items-center gap-1.5">
              <UserCheck size={14} className="text-cyan-400" />
              <span>How are Operator Accounts Created?</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              New Operator clearance can only be provisioned by an authenticated <strong>System Administrator</strong> via the restricted endpoint <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">/api/v1/auth/create-operator</code> using cryptographic token delegation.
            </p>
          </div>

          <p className="text-[11px] text-slate-400">
            If you are an authorized central dispatcher or logistics officer and already have credentials assigned by the disaster management directorate, please log in directly.
          </p>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn text-xs font-mono !py-2 px-4"
          >
            CANCEL
          </button>
          <button
            onClick={onProceedToLogin}
            className="btn btn-amber text-xs font-mono !py-2 px-5"
          >
            PROCEED TO OPERATOR LOGIN
          </button>
        </div>
      </div>
    </div>
  );
}
