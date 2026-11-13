import { GraduationCap, Award, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-command-900/40 border-t border-command-700/60 relative">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-emergency-orange">
            <span className="w-1.5 h-1.5 rounded-full bg-emergency-orange" />
            <span>ACADEMIC CONTEXT & DISASTER ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            About the RESQ-X Engineering Project
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            A comprehensive computer science capstone integrating distributed backend systems, combinatorial optimization, and real-time 3D simulation.
          </p>
        </div>

        {/* 3 Pillars of Scope */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Project Objective */}
          <div className="glass-panel p-6 rounded-2xl border border-command-700 space-y-4">
            <div className="flex items-center space-x-3 text-emergency-orange">
              <Award className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Project Objective</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Design and evaluate a centralized disaster-relief coordination platform where NDRF/Relief Centers submit structured resource requisitions based on affected human population, while Central Operators manage inventory, solve vehicle capacity constraints, and calculate obstacle-free road paths.
            </p>
            <div className="pt-3 border-t border-command-800 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero inventory over-allocation guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Payload utility optimization via 0/1 Knapsack DP</span>
              </div>
            </div>
          </div>

          {/* Card 2: Academic & Viva Evaluation */}
          <div className="glass-panel p-6 rounded-2xl border border-command-700 space-y-4">
            <div className="flex items-center space-x-3 text-cyan-400">
              <GraduationCap className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Academic Context</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Developed as an advanced academic research and demonstration project showcasing the intersection of operations research (Dynamic Programming), graph theory (Dijkstra Min-Heap), and modern full-stack web engineering (React 18, Three.js, and Python FastAPI).
            </p>
            <div className="pt-3 border-t border-command-800 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Full step-by-step algorithm audit trails for viva</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>ACID database integrity & unit test coverage</span>
              </div>
            </div>
          </div>

          {/* Card 3: Scope & Limitations */}
          <div className="glass-panel p-6 rounded-2xl border border-command-700 space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Scope & Limitations</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              RESQ-X is an academic software simulation and demonstration prototype. It operates on simulated disaster road network graphs and inventory models. It is not certified for live life-critical military or governmental emergency response operations.
            </p>
            <div className="pt-3 border-t border-command-800 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulated telemetric inputs and disaster zones</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Designed for technical evaluation and thesis defense</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
