import { ShieldAlert, Compass, CheckCircle2, Lock } from 'lucide-react';

export default function UserRolesSection() {
  return (
    <section id="roles" className="py-24 bg-command-900/40 border-t border-command-700/60 relative">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-emergency-orange">
            <span className="w-1.5 h-1.5 rounded-full bg-emergency-orange" />
            <span>SECURITY & RESPONSIBILITY BOUNDARIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Specialized Interfaces for Dedicated Emergency Personnel
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Strict separation of duty ensures field units focus on ground needs while central operators orchestrate logistics and routes.
          </p>
        </div>

        {/* Roles 2-Column Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Role 1: NDRF / Relief Center */}
          <div className="glass-panel p-8 rounded-2xl border border-command-700 space-y-6 hover:border-emergency-orange/40 transition-all flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-command-700/60">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emergency-orange/10 border border-emergency-orange/30 rounded-xl text-emergency-orange">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-emergency-orange uppercase font-bold tracking-wider">
                      ROLE SPECIFICATION 01
                    </span>
                    <h3 className="text-xl font-bold text-white">NDRF / Relief Center</h3>
                  </div>
                </div>
                <span className="text-xs font-mono bg-command-800 text-slate-300 px-3 py-1 rounded-full border border-command-700">
                  Field Operations
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Deployed at forward operational bases, flood relief shelters, and evacuation staging areas. Focuses exclusively on capturing immediate ground needs and managing local casualty distribution.
              </p>

              <div className="space-y-3">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                  PRIMARY RESPONSIBILITIES
                </span>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Enter Disaster Assessments</strong>: Specify active calamity type, affected population headcount, and local infrastructure condition.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Submit Requisitions</strong>: Draft structured item demands across trauma medical kits, potable water, food cartons, and rescue rafts.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Live Status Tracking</strong>: View approved, partially approved, and remaining supply fulfillment status in real-time.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Convoy Ingress Telemetry</strong>: Monitor dispatched vehicles and estimated arrival times for safe reception.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-command-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Account Provisioning:</span>
              <span className="text-emerald-400 font-bold">Public Self-Registration</span>
            </div>
          </div>

          {/* Role 2: Command Center Operator */}
          <div className="glass-panel p-8 rounded-2xl border border-command-700 space-y-6 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-command-700/60">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                      ROLE SPECIFICATION 02
                    </span>
                    <h3 className="text-xl font-bold text-white">Command Center Operator</h3>
                  </div>
                </div>
                <span className="text-xs font-mono bg-command-800 text-slate-300 px-3 py-1 rounded-full border border-command-700">
                  Central Logistics HQ
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Stationed at central or state emergency coordination headquarters. Controls central warehouse stocks, evaluates multi-camp priorities, executes algorithms, and authorizes transport dispatches.
              </p>

              <div className="space-y-3">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                  PRIMARY RESPONSIBILITIES
                </span>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Triage Requisitions</strong>: Aggregate and evaluate resource requests received from multiple simultaneous disaster centers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Central Stock Allocation</strong>: Approve, partially approve, or queue allocations backed by transactional concurrency guards.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Vehicle Payload Optimization</strong>: Run 0/1 Knapsack DP to maximize life-saving utility strictly within truck payload limits.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Road Graph & Dijkstra Routing</strong>: Mark road segment conditions and calculate lowest-weight obstacle-free paths.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-command-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Lock className="w-3.5 h-3.5" />
                Account Security:
              </span>
              <span className="text-amber-400 font-bold">Admin-Only Provisioning (No Public Registration)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
