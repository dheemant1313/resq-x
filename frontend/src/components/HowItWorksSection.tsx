import { useState } from 'react';
import { 
  Building2, 
  FileText, 
  UserCheck, 
  Boxes, 
  Scale, 
  Navigation, 
  Truck, 
  ArrowRight,
  Shield
} from 'lucide-react';

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: '01',
      title: 'Relief Center',
      role: 'NDRF Field Camp',
      icon: Building2,
      summary: 'Assesses local calamity magnitude and affected headcount.',
      detail: 'Field coordinators register active disaster type (flooding, cyclone, landslide) along with GPS coordinates and immediate survival priorities.',
      metric: 'Intake Assessment',
    },
    {
      step: '02',
      title: 'Resource Request',
      role: 'Demand Generation',
      icon: FileText,
      summary: 'Generates structured requisitions with quantities & urgency levels.',
      detail: 'Requisitions specify required units across trauma kits, potable water, food cartons, and rescue boats, assigned an urgency rating from Medium to Critical.',
      metric: 'Structured Demand',
    },
    {
      step: '03',
      title: 'Operator Review',
      role: 'Central HQ Officer',
      icon: UserCheck,
      summary: 'Central operators review incoming requisitions across all camps.',
      detail: 'Operators view an aggregated live queue sorted by urgency score, evaluating regional supply trends and triage priority.',
      metric: 'Triage Queue',
    },
    {
      step: '04',
      title: 'Inventory Allocation',
      role: 'Rationing Engine',
      icon: Boxes,
      summary: 'Distributes limited central stock across competing camps.',
      detail: 'Executes fair-share or priority-proportional allocation. Concurrency controls and database transactions guarantee zero over-allocation.',
      metric: 'Stock Apportionment',
    },
    {
      step: '05',
      title: 'Vehicle Optimization',
      role: '0/1 Knapsack DP',
      icon: Scale,
      summary: 'Calculates the optimal payload packaging for the transport vehicle.',
      detail: 'Uses 0/1 Knapsack Dynamic Programming with state backtracking to select the highest-priority relief items fitting within the truck gross weight rating.',
      metric: 'Capacity Fit',
    },
    {
      step: '06',
      title: 'Route Planning',
      role: 'Dijkstra Min-Heap',
      icon: Navigation,
      summary: 'Computes disaster-resilient shortest path to destination camp.',
      detail: 'Dijkstra algorithm evaluates road segment conditions, hazard multipliers, and completely impassable sections to compute the fastest safe route.',
      metric: 'Hazard Navigation',
    },
    {
      step: '07',
      title: 'Dispatch',
      role: 'Convoy Departure',
      icon: Truck,
      summary: 'Generates route manifest and initiates real-time transit tracking.',
      detail: 'A dispatch manifest is generated and sent to the convoy crew, while the Relief Center receives arrival estimates and route telemetry.',
      metric: 'Convoy En Route',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-command-900/50 border-t border-b border-command-700/60 relative">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-emergency-orange">
            <span className="w-1.5 h-1.5 rounded-full bg-emergency-orange" />
            <span>END-TO-END OPERATIONAL LIFECYCLE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            From Crisis Assessment to Coordinated Convoy Dispatch
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            A synchronized 7-stage workflow connecting on-the-ground human needs with centralized algorithmic execution.
          </p>
        </div>

        {/* Step Buttons Chain */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                  isActive
                    ? 'bg-command-800 border-emergency-orange shadow-glow-orange'
                    : 'bg-command-850/60 border-command-700/70 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-emergency-orange' : 'text-slate-400'}`}>
                    PHASE {st.step}
                  </span>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emergency-orange' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white truncate">{st.title}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{st.role}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Detailed Breakdown Panel */}
        <div className="glass-panel p-8 rounded-2xl border border-command-700 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Detail */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-3xl font-extrabold text-emergency-orange">
                  {steps[activeStep].step}
                </span>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {steps[activeStep].title}
                  </h3>
                  <div className="text-xs font-mono text-slate-400">
                    ACTOR: <span className="text-cyan-400 font-semibold">{steps[activeStep].role}</span>
                  </div>
                </div>
              </div>

              <p className="text-base text-slate-200 font-medium leading-relaxed">
                {steps[activeStep].summary}
              </p>

              <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                {steps[activeStep].detail}
              </p>

              <div className="pt-4 flex flex-wrap gap-4 text-xs font-mono">
                <div className="bg-command-850 px-3 py-1.5 rounded-lg border border-command-700 text-slate-300">
                  Target Outcome: <span className="text-emerald-400 font-bold">{steps[activeStep].metric}</span>
                </div>
                <div className="bg-command-850 px-3 py-1.5 rounded-lg border border-command-700 text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emergency-orange" />
                  Transaction Integrity: <span className="text-white font-bold">Guaranteed</span>
                </div>
              </div>
            </div>

            {/* Right Workflow Controls */}
            <div className="lg:col-span-4 bg-command-900/80 p-6 rounded-xl border border-command-700 space-y-4">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                WORKFLOW NAVIGATION
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>Current Step</span>
                  <span className="text-emergency-orange font-bold">{activeStep + 1} of 7</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-command-800 rounded-full h-1.5">
                  <div
                    className="bg-emergency-orange h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((activeStep + 1) / 7) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                  className="flex-1 py-2 rounded-lg bg-command-800 hover:bg-command-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono text-slate-200 transition-colors"
                >
                  PREVIOUS
                </button>
                <button
                  disabled={activeStep === 6}
                  onClick={() => setActiveStep((prev) => Math.min(6, prev + 1))}
                  className="flex-1 py-2 rounded-lg bg-emergency-orange hover:bg-emergency-glow disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-bold text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>NEXT</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
