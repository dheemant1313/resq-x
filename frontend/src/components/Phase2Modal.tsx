import React, { useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  ShieldAlert, 
  Truck, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  ArrowRight,
  Database
} from 'lucide-react';

interface Phase2ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase2Modal: React.FC<Phase2ModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-command-900 border border-command-700 rounded-2xl shadow-2xl overflow-hidden z-10 hud-border flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-command-700 bg-command-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emergency-orange/10 border border-emergency-orange/30 flex items-center justify-center text-emergency-orange">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono tracking-widest text-emergency-orange font-bold uppercase">
                  PLATFORM ACCESS GATEWAY
                </span>
                <span className="text-[10px] bg-command-800 text-slate-400 px-2 py-0.5 rounded font-mono border border-command-700">
                  PHASE 2 TRANSITION
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Launch RESQ-X Command System
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-command-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emergency-orange"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Status Alert */}
          <div className="p-4 rounded-xl bg-command-800/80 border border-command-700 flex items-start space-x-3.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-white text-sm">
                Phase 1 Complete — Core Algorithms & REST API Operational
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The full Python FastAPI backend, PostgreSQL schema, 0/1 Knapsack payload packer, and Dijkstra routing algorithms are live. In accordance with development rules, authentication and dedicated role dashboards are launched in <strong className="text-emergency-orange">Phase 2</strong>.
              </p>
            </div>
          </div>

          {/* Role Portals Preview */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Select Destination Portal Architecture
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: Relief Center */}
              <div className="p-4 rounded-xl bg-command-850 border border-command-700/80 hover:border-emergency-orange/50 transition-all flex flex-col justify-between group">
                <div className="space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emergency-orange/10 border border-emergency-orange/30 flex items-center justify-center text-emergency-orange group-hover:scale-105 transition-transform">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">NDRF / Relief Camp</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      Submit population requirements, track approval states, and view incoming vehicle convoys.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-command-700/60 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                  <span>Self-Registration</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Operator */}
              <div className="p-4 rounded-xl bg-command-850 border border-command-700/80 hover:border-cyan-400/50 transition-all flex flex-col justify-between group">
                <div className="space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Logistics Operator</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      Manage central inventory, triage requests, pack vehicles with 0/1 Knapsack, and route via Dijkstra.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-command-700/60 flex items-center justify-between text-[11px] font-mono text-cyan-400">
                  <span>Admin-Provisioned</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Admin */}
              <div className="p-4 rounded-xl bg-command-850 border border-command-700/80 hover:border-purple-400/50 transition-all flex flex-col justify-between group">
                <div className="space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">System Admin</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      Operator lifecycle management, disaster zone road network node/edge editor, and audit logs.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-command-700/60 flex items-center justify-between text-[11px] font-mono text-purple-400">
                  <span>Superuser</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Active Backend Swagger UI & Direct Testing */}
          <div className="p-4 rounded-xl bg-command-950/70 border border-command-700 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                ACTIVE REST API ENDPOINTS & SWAGGER SPEC
              </span>
              <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                ONLINE :8000
              </span>
            </div>
            <p className="text-slate-400 font-sans text-xs">
              Explore and test live algorithm endpoints (<code className="text-emergency-orange">/api/v1/algorithms/knapsack</code>, <code className="text-cyan-400">/api/v1/algorithms/dijkstra</code>, <code className="text-amber-400">/api/v1/algorithms/allocate</code>) and JWT authentication contracts directly in FastAPI interactive docs.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-command-800 hover:bg-command-700 border border-command-600 text-white transition-colors"
              >
                <span>Interactive Swagger UI</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <a
                href="http://localhost:8000/redoc"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-command-800 hover:bg-command-700 border border-command-600 text-white transition-colors"
              >
                <span>ReDoc Documentation</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-command-700 bg-command-950/60 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500">
            RESQ-X Project Foundation & Academic Evaluation Prototype
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emergency-orange hover:bg-emergency-orange-hover text-white text-xs font-semibold tracking-wide transition-colors shadow-lg shadow-emergency-orange/20"
          >
            Acknowledge & Return to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};
