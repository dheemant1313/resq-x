import { AlertOctagon, CheckCircle2, TrendingUp, Truck, ShieldAlert, GitFork } from 'lucide-react';

export default function ProblemSolutionSection() {
  const problemSolutions = [
    {
      id: '01',
      problem: 'Disconnected Relief Requests',
      problemDesc: 'Field camps lack unified digital requisition tools, leading to fragmented phone calls, delayed triage, and redundant duplicate orders.',
      solution: 'Centralized Digital Telemetry',
      solutionDesc: 'Standardized digital intake captures affected population, priority category, and precise GPS coordinates in real-time.',
      icon: AlertOctagon,
      accent: 'border-rose-500/30 text-rose-400',
    },
    {
      id: '02',
      problem: 'Limited Warehouse Inventory',
      problemDesc: 'Critical medical and survival stocks are finite. Uncoordinated dispatches starve heavily devastated camps while oversupplying others.',
      solution: 'Multi-Center Stock Triage Engine',
      solutionDesc: 'Algorithmically rations inventory proportional to disaster severity level, population density, and medical urgency.',
      icon: TrendingUp,
      accent: 'border-amber-500/30 text-amber-400',
    },
    {
      id: '03',
      problem: 'Vehicle Capacity Constraints',
      problemDesc: 'Emergency trucks have strict gross vehicle weight ratings. Inefficient packing risks structural breakdown or under-utilized payload capacity.',
      solution: '0/1 Knapsack Dynamic Programming',
      solutionDesc: 'Mathematically calculates the exact subset of medical and food supplies that maximizes life-saving priority without exceeding vehicle tonnage.',
      icon: Truck,
      accent: 'border-emergency-orange/30 text-emergency-orange',
    },
    {
      id: '04',
      problem: 'Blocked Roads & Collapsed Bridges',
      problemDesc: 'Landslides, flash floods, and bridge collapses render standard highway navigation obsolete and strand relief convoys.',
      solution: 'Dijkstra Min-Heap Routing',
      solutionDesc: 'Calculates the lowest-cost path over damaged road graphs, discarding impassable segments and accounting for debris speed penalties.',
      icon: GitFork,
      accent: 'border-cyan-500/30 text-cyan-400',
    },
    {
      id: '05',
      problem: 'Coordination Breakdown',
      problemDesc: 'Lack of verified roles leads to conflicting instructions, delayed approvals, and zero audit accountability across agencies.',
      solution: 'Role-Based Access Control (RBAC)',
      solutionDesc: 'Enforces strict authority separation between NDRF Relief Center personnel, Command Operators, and System Administrators with immutable audit logs.',
      icon: ShieldAlert,
      accent: 'border-emerald-500/30 text-emerald-400',
    },
  ];

  return (
    <section className="py-20 bg-command-900/40 border-t border-command-700/60 relative">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-emergency-orange">
            <span className="w-1.5 h-1.5 rounded-full bg-emergency-orange" />
            <span>OPERATIONAL BOTTLENECK ANALYSIS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Transforming Crisis Chaos into Coordinated Precision
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            In natural catastrophes, coordination failure costs lives. RESQ-X replaces manual guesswork with mathematically proven algorithms and centralized inventory intelligence.
          </p>
        </div>

        {/* Problem vs Solution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problemSolutions.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="glass-panel-elevated p-6 rounded-2xl border border-command-700 space-y-4 hover:border-command-600 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header & Badge */}
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl bg-command-800 border ${item.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs text-slate-400 font-bold">CASE #{item.id}</span>
                  </div>

                  {/* Problem Statement */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block font-semibold">
                      THE DISASTER CRISIS
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-emergency-orange transition-colors">
                      {item.problem}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.problemDesc}
                    </p>
                  </div>
                </div>

                {/* Solution Statement */}
                <div className="pt-4 border-t border-command-700/60 space-y-1.5 bg-command-900/50 p-3 rounded-xl">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    RESQ-X ARCHITECTURE
                  </span>
                  <div className="text-xs font-bold text-slate-200">{item.solution}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {item.solutionDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
