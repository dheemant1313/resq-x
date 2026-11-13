import { 
  Users, 
  MapPin, 
  Boxes, 
  SplitSquareVertical, 
  Scale, 
  Navigation, 
  Construction, 
  FileSearch 
} from 'lucide-react';

export default function CoreFeaturesSection() {
  const features = [
    {
      icon: Users,
      title: 'Population-Based Requests',
      description: 'Calculates dynamic intake demand proportional to affected human population, disaster classification, and vulnerable medical conditions.',
      badge: 'Demand Intake',
      color: 'text-emergency-orange',
    },
    {
      icon: MapPin,
      title: 'Relief Center Management',
      description: 'Coordinates multi-camp telemetry with verified GPS coordinates, active disaster status, camp commanders, and field casualty counts.',
      badge: 'Field Ops',
      color: 'text-cyan-400',
    },
    {
      icon: Boxes,
      title: 'Central Warehouse Inventory',
      description: 'Real-time multi-category tracking across medical trauma kits, potable water, rations, shelter tents, and search-and-rescue equipment.',
      badge: 'Stock Logistics',
      color: 'text-amber-400',
    },
    {
      icon: SplitSquareVertical,
      title: 'Full & Partial Allocation',
      description: 'Enables operators to approve, partially ration, or queue supplies with ACID database transaction locks preventing over-allocation.',
      badge: 'Triage Engine',
      color: 'text-emerald-400',
    },
    {
      icon: Scale,
      title: 'Vehicle Capacity Optimization',
      description: 'Executes 0/1 Knapsack Dynamic Programming with state backtracking to maximize life-saving utility strictly within vehicle weight limits.',
      badge: '0/1 Knapsack DP',
      color: 'text-purple-400',
    },
    {
      icon: Navigation,
      title: 'Dijkstra Route Planning',
      description: 'Calculates the optimal weighted road path between regional depots and disaster zones using a min-heap priority queue.',
      badge: 'Min-Heap Graph',
      color: 'text-sky-400',
    },
    {
      icon: Construction,
      title: 'Blocked-Road Handling',
      description: 'Dynamically adapts routing when flash floods or bridge damage occur, routing convoys around hazardous sectors.',
      badge: 'Hazard Resilience',
      color: 'text-rose-400',
    },
    {
      icon: FileSearch,
      title: 'End-to-End Request Tracking',
      description: 'Monitors the entire requisition lifecycle from pending submission to operator review, allocation, packaging, dispatch, and delivery.',
      badge: 'Audit Trail',
      color: 'text-teal-400',
    },
  ];

  return (
    <section id="features" className="py-24 bg-command-950 relative">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-emergency-orange">
              <span className="w-1.5 h-1.5 rounded-full bg-emergency-orange" />
              <span>CORE ARCHITECTURAL CAPABILITIES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Engineered for High-Pressure Emergency Coordination
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Eight integrated modules working in tandem to eliminate allocation delays and route convoys safely through disrupted terrain.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-command-900 px-4 py-2 rounded-lg border border-command-700 shrink-0">
            SPECIFICATION: <span className="text-emerald-400 font-bold">8 VERIFIED MODULES</span>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-6 rounded-2xl border border-command-700/80 hover:border-emergency-orange/50 transition-all hover:shadow-command-card flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-command-850 border border-command-700 group-hover:scale-105 transition-transform">
                      <Icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-command-800 text-slate-400 px-2 py-0.5 rounded border border-command-700">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-emergency-orange transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-command-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>MODULE {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
                  <span className="text-emerald-400 font-semibold">STANDBY</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
