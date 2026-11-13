import { CheckCircle2, ShieldCheck, LogOut, ArrowRight, User, Key, Building2, LayoutDashboard } from 'lucide-react';
import type { AuthResponse } from './types';

interface AuthenticatedSessionCardProps {
  authData: AuthResponse;
  onLogout: () => void;
  onReturnToHome: () => void;
  onProceedToDashboard?: (authData: AuthResponse) => void;
}

export default function AuthenticatedSessionCard({
  authData,
  onLogout,
  onReturnToHome,
  onProceedToDashboard,
}: AuthenticatedSessionCardProps) {
  const isNDRF = authData.role === 'RELIEF_CENTER';

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Verified Status Banner */}
      <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 mx-auto flex items-center justify-center">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="text-base font-bold text-white font-mono tracking-wide">
          Authentication Verified by Backend
        </h3>
        <p className="text-xs text-emerald-300 font-mono">
          JWT Session Initialized &bull; Role Verified in Database
        </p>
      </div>

      {/* Verified User Details */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 font-mono text-xs text-slate-300">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1.5">
            <User size={13} className="text-cyan-400" />
            <span>Authenticated User:</span>
          </span>
          <strong className="text-white">{authData.username}</strong>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-amber-400" />
            <span>Assigned Role:</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
            {authData.role}
          </span>
        </div>

        {authData.center_id && (
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Building2 size={13} className="text-cyan-400" />
              <span>Relief Center ID:</span>
            </span>
            <span className="text-cyan-300 font-bold">
              Camp #{authData.center_id}
            </span>
          </div>
        )}

        <div className="pt-1">
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
            <Key size={11} className="text-slate-500" />
            <span>Bearer JWT Access Token:</span>
          </span>
          <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono break-all select-all">
            {authData.access_token.slice(0, 48)}...
          </div>
        </div>
      </div>

      {/* Primary Dashboard Launch Action */}
      {isNDRF && onProceedToDashboard ? (
        <button
          onClick={() => onProceedToDashboard(authData)}
          className="btn btn-amber w-full text-xs font-mono !py-3 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(249,115,22,0.4)]"
        >
          <LayoutDashboard size={15} />
          <span>PROCEED TO NDRF RELIEF CENTER DASHBOARD</span>
          <ArrowRight size={15} />
        </button>
      ) : (
        <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/50 text-[11px] text-cyan-200 font-sans leading-relaxed">
          Logged in as <strong>{authData.role}</strong>. Proceed to central operations.
        </div>
      )}

      {/* Auxiliary Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onLogout}
          className="btn flex-1 text-xs font-mono !py-2.5 flex items-center justify-center gap-1.5"
        >
          <LogOut size={14} />
          <span>LOGOUT</span>
        </button>
        <button
          onClick={onReturnToHome}
          className="btn flex-1 text-xs font-mono !py-2.5 flex items-center justify-center gap-1.5 border-slate-700"
        >
          <span>HOME OVERVIEW</span>
        </button>
      </div>
    </div>
  );
}
