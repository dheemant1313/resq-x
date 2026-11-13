import { useState } from 'react';
import { Box, Navigation, Layers, CheckCircle2, AlertCircle, Code, Cpu } from 'lucide-react';

export default function AlgorithmShowcaseSection() {
  const [activeTab, setActiveTab] = useState<'knapsack' | 'dijkstra' | 'allocation'>('knapsack');

  return (
    <section id="algorithms" className="py-24 bg-command-950 relative">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-emergency-orange">
            <span className="w-1.5 h-1.5 rounded-full bg-emergency-orange" />
            <span>RIGOROUS MATHEMATICAL FOUNDATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Algorithmic Precision in Crisis Conditions
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            RESQ-X separates three computationally distinct challenges: single-vehicle payload packing, multi-camp inventory rationing, and disaster-resilient network routing.
          </p>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 border-b border-command-700/60 pb-4">
          <button
            onClick={() => setActiveTab('knapsack')}
            className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl font-mono text-xs font-bold transition-all ${
              activeTab === 'knapsack'
                ? 'bg-emergency-orange text-white shadow-glow-orange'
                : 'bg-command-900 text-slate-400 hover:text-white border border-command-700'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>0/1 KNAPSACK DYNAMIC PROGRAMMING</span>
          </button>

          <button
            onClick={() => setActiveTab('dijkstra')}
            className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl font-mono text-xs font-bold transition-all ${
              activeTab === 'dijkstra'
                ? 'bg-cyan-500 text-command-950 font-extrabold shadow-glow-cyan'
                : 'bg-command-900 text-slate-400 hover:text-white border border-command-700'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>DIJKSTRA MIN-HEAP ROUTING</span>
          </button>

          <button
            onClick={() => setActiveTab('allocation')}
            className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl font-mono text-xs font-bold transition-all ${
              activeTab === 'allocation'
                ? 'bg-amber-400 text-command-950 font-extrabold'
                : 'bg-command-900 text-slate-400 hover:text-white border border-command-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>SEPARATE INVENTORY ALLOCATION</span>
          </button>
        </div>

        {/* Tab 1: 0/1 Knapsack DP Content */}
        {activeTab === 'knapsack' && (
          <div className="glass-panel p-8 rounded-2xl border border-command-700 space-y-6 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-command-700/60">
              <div className="space-y-1">
                <span className="text-xs font-mono text-emergency-orange font-bold uppercase tracking-wider">
                  VEHICLE CAPACITY PACKAGING ENGINE
                </span>
                <h3 className="text-2xl font-bold text-white">0/1 Knapsack with State Backtracking</h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="bg-command-850 px-3 py-1.5 rounded border border-command-700 text-slate-300">
                  Time: <strong className="text-emergency-orange">O(N × W)</strong>
                </span>
                <span className="bg-command-850 px-3 py-1.5 rounded border border-command-700 text-slate-300">
                  Space: <strong className="text-slate-200">O(N × W)</strong>
                </span>
              </div>
            </div>

            {/* Warning Distinction Alert */}
            <div className="bg-emergency-orange/10 border border-emergency-orange/30 p-4 rounded-xl flex items-start space-x-3 text-xs">
              <AlertCircle className="w-5 h-5 text-emergency-orange shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-emergency-orange font-mono uppercase tracking-wider">
                  Important Architectural Distinction
                </strong>
                <p className="text-slate-300">
                  0/1 Knapsack solves <em>which relief items fit inside a single rescue vehicle's gross payload rating</em>. It does <strong>not</strong> divide inventory across multiple camps. That is managed exclusively by the Inventory Allocation engine.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Theory & Recurrence */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Code className="w-4 h-4 text-emergency-orange" />
                  Dynamic Programming Formulation
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Given vehicle carrying capacity $W$ and $N$ items where each item $i$ has weight $w_i$ and life-saving priority score $v_i$, the table $DP[i][w]$ represents the maximum survival utility attainable:
                </p>

                <div className="bg-command-900 p-4 rounded-xl border border-command-700 font-mono text-xs text-slate-200 space-y-2">
                  <div className="text-slate-400">// Base Case</div>
                  <div>DP[0][w] = 0 for all w &isin; [0, W]</div>
                  <div className="text-slate-400 pt-2">// Recurrence Relation</div>
                  <div className="text-emerald-400">if w_i &gt; w: DP[i][w] = DP[i-1][w]</div>
                  <div className="text-emergency-orange font-bold">
                    else: DP[i][w] = max(DP[i-1][w], DP[i-1][w - w_i] + v_i)
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>State Backtracking identifies the exact items included in the optimal manifest.</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sub-kilogram precision achieved through discrete 0.1 kg scaling factor.</span>
                  </div>
                </div>
              </div>

              {/* Verified Viva Demo Sample */}
              <div className="bg-command-900/90 p-5 rounded-xl border border-command-700 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-command-700">
                  <span>SAMPLE EXECUTION AUDIT</span>
                  <span className="text-emergency-orange">CAPACITY: 50.0 kg</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-300 p-2 bg-command-850 rounded border border-command-700/60">
                    <div>
                      <span className="text-white font-bold block">1. Trauma Kit</span>
                      <span className="text-[10px] text-slate-400">Weight: 10 kg | Priority: 50</span>
                    </div>
                    <span className="text-rose-400 text-[10px] bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800">
                      Excluded (Suboptimal)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300 p-2 bg-command-850 rounded border border-emerald-800/40">
                    <div>
                      <span className="text-emerald-400 font-bold block">2. High-Calorie Rations</span>
                      <span className="text-[10px] text-slate-400">Weight: 20 kg | Priority: 80</span>
                    </div>
                    <span className="text-emerald-400 text-[10px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800">
                      SELECTED (Packed)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300 p-2 bg-command-850 rounded border border-emerald-800/40">
                    <div>
                      <span className="text-emerald-400 font-bold block">3. Potable Water Jerrycans</span>
                      <span className="text-[10px] text-slate-400">Weight: 30 kg | Priority: 95</span>
                    </div>
                    <span className="text-emerald-400 text-[10px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800">
                      SELECTED (Packed)
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-command-700 flex items-center justify-between">
                  <span className="text-slate-400">Optimal Solution Priority:</span>
                  <span className="text-emerald-400 font-bold text-sm">175 pts (50.0 kg / 100% Full)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Dijkstra Min-Heap Content */}
        {activeTab === 'dijkstra' && (
          <div className="glass-panel p-8 rounded-2xl border border-command-700 space-y-6 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-command-700/60">
              <div className="space-y-1">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  DISASTER TRANSPORTATION ROUTING
                </span>
                <h3 className="text-2xl font-bold text-white">Dijkstra with Priority Queue Min-Heap</h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="bg-command-850 px-3 py-1.5 rounded border border-command-700 text-slate-300">
                  Time: <strong className="text-cyan-400">O((V + E) log V)</strong>
                </span>
                <span className="bg-command-850 px-3 py-1.5 rounded border border-command-700 text-slate-300">
                  Space: <strong className="text-slate-200">O(V)</strong>
                </span>
              </div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-xl flex items-start space-x-3 text-xs">
              <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-cyan-400 font-mono uppercase tracking-wider">
                  Important Architectural Distinction
                </strong>
                <p className="text-slate-300">
                  Dijkstra calculates the <em>minimum-cost physical path over an impacted road graph</em>. It handles road debris, mudslides, and severed links, completely independent of what is packed inside the vehicle.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Dynamic Disaster Weighting Formula
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Standard shortest path uses unweighted distance. In catastrophe zones, a shorter road submerged in 1.5m floodwater is unusable. RESQ-X applies a continuous penalty multiplier:
                </p>

                <div className="bg-command-900 p-4 rounded-xl border border-command-700 font-mono text-xs text-slate-200 space-y-2">
                  <div className="text-cyan-400 font-bold">
                    Effective Edge Weight = d_km &times; M_cond &times; (R_risk if avoid_risk else 1.0)
                  </div>
                  <div className="text-slate-400 pt-1">
                    where:
                    <br />• d_km = Physical segment length in kilometers
                    <br />• M_cond = Degradation multiplier (1.0 = clean, 2.5 = heavy debris)
                    <br />• is_blocked = True &rarr; Edge dropped entirely from graph
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Calculates transit speed degradation: v_est = v_base / M_cond.</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Emits actionable hazard warnings for each damaged corridor traversed.</span>
                  </div>
                </div>
              </div>

              <div className="bg-command-900/90 p-5 rounded-xl border border-command-700 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-command-700">
                  <span>DISASTER REROUTE DEMONSTRATION</span>
                  <span className="text-cyan-400">DEPOT &rarr; RC-ALPHA</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-command-850 rounded border border-rose-900/50 space-y-1">
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      Route 1: NH-48 Direct Pass (14.6 km)
                    </span>
                    <span className="text-[11px] text-slate-400 block">Condition: Inundation multiplier x2.5 &rarr; Weighted: 36.5</span>
                    <span className="text-[10px] text-rose-300 uppercase">REJECTED BY DIJKSTRA (EXCESSIVE DELAY)</span>
                  </div>

                  <div className="p-3 bg-command-850 rounded border border-cyan-800/60 space-y-1">
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      Route 2: Cross Ridge High-Ground Bypass (15.3 km)
                    </span>
                    <span className="text-[11px] text-slate-400 block">Condition: Multiplier x1.02 &rarr; Weighted: 15.6</span>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold">OPTIMAL PATH SELECTED</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-command-700 flex items-center justify-between">
                  <span className="text-slate-400">Convoy Transit Estimate:</span>
                  <span className="text-cyan-400 font-bold text-sm">21.4 mins (Saved 18 mins)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Inventory Allocation Engine Content */}
        {activeTab === 'allocation' && (
          <div className="glass-panel p-8 rounded-2xl border border-command-700 space-y-6 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-command-700/60">
              <div className="space-y-1">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                  MULTI-CAMP SCARCITY RATIONING
                </span>
                <h3 className="text-2xl font-bold text-white">Priority-Weighted Triage Apportionment</h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="bg-command-850 px-3 py-1.5 rounded border border-command-700 text-slate-300">
                  Complexity: <strong className="text-amber-400">O(M log M)</strong>
                </span>
                <span className="bg-command-850 px-3 py-1.5 rounded border border-command-700 text-slate-300">
                  Policy: <strong className="text-slate-200">Anti-Starvation</strong>
                </span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start space-x-3 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-amber-400 font-mono uppercase tracking-wider">
                  Important Architectural Distinction
                </strong>
                <p className="text-slate-300">
                  Inventory allocation distributes limited warehouse stock across <em>competing relief center requests</em>. It ensures that critical high-casualty camps receive their proportional share without depleting warehouse inventory before other camps are reviewed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Triage Priority Formulation
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  When aggregate requests exceed central warehouse availability, allocations are scored using the non-linear triage formula:
                </p>

                <div className="bg-command-900 p-4 rounded-xl border border-command-700 font-mono text-xs text-slate-200 space-y-2">
                  <div className="text-amber-400 font-bold">
                    Score_i = W_sev(Severity) &times; W_urg(Urgency) &times; (1.0 + min(Pop, 100k) / 10k)
                  </div>
                  <div className="text-slate-400 pt-1">
                    where:
                    <br />• Critical Severity Weight = 4.0 | High = 3.0 | Medium = 2.0
                    <br />• Critical Urgency Weight = 3.0 | High = 2.2 | Medium = 1.5
                    <br />• Share_i = (Score_i / &Sigma; Score) &times; Total_Available_Stock
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Guarantees zero warehouse stock overdraft via database row-level locking.</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Supports both proportional fair share and strict priority triage modes.</span>
                  </div>
                </div>
              </div>

              <div className="bg-command-900/90 p-5 rounded-xl border border-command-700 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-command-700">
                  <span>SCARCITY ALLOCATION BENCHMARK</span>
                  <span className="text-amber-400">STOCK: 100 UNITS AVAILABLE</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-command-850 rounded border border-command-700 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">Camp Alpha (Severe Flood, 10k pop)</span>
                      <span className="text-emerald-400 font-bold">84 Units</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Requested: 200 units | Severity: CRITICAL</span>
                  </div>

                  <div className="p-3 bg-command-850 rounded border border-command-700 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">Camp Bravo (Minor Landslide, 500 pop)</span>
                      <span className="text-amber-400 font-bold">16 Units</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Requested: 100 units | Severity: LOW</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-command-700 flex items-center justify-between">
                  <span className="text-slate-400">Fair Distribution Audit:</span>
                  <span className="text-emerald-400 font-bold text-sm">100% Disbursed (Zero Deficit)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
