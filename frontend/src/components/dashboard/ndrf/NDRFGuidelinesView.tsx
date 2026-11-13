import { BookOpen, Droplets, Package, HeartPulse, Compass } from 'lucide-react';

export default function NDRFGuidelinesView() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80 shadow-xl space-y-1">
        <h1 className="text-xl font-black font-mono text-white tracking-wide flex items-center gap-2">
          <BookOpen size={20} className="text-emergency-orange" />
          <span>HUMANITARIAN STANDARDS & TACTICAL LOGISTICS GUIDELINES</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Sphere Project charter baselines & algorithmic crisis optimization protocols
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sphere Water Standards */}
        <div className="p-5 rounded-2xl border border-cyan-500/30 bg-slate-950/70 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
            <Droplets size={16} />
            <span>Water Supply & Hygiene Baseline</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Under international Sphere guidelines, every individual requires a minimum of <strong>15 liters of potable water per day</strong> for drinking, food preparation, and basic hygiene. In initial 72-hour flood isolation, priority is given to portable 20L Jerrycans and high-potency water purification tablets.
          </p>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300">
            Formula: Target = (Affected Population &times; 15L &times; 3 Days) &divide; 20L Jerrycan
          </div>
        </div>

        {/* Sphere Food Rations */}
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-slate-950/70 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
            <Package size={16} />
            <span>Nutrition & High-Calorie Food Basket</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            The minimum nutritional baseline is <strong>2,100 kcal per person per day</strong>. Ready-to-Eat (RTE) vacuum-sealed rations requiring no clean water or cooking are prioritized in active floodwaters. Fortified grains are reserved for established relief camps with cooking infrastructure.
          </p>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300">
            Formula: Target = ~3 RTE meal cartons per family for 72-hour survival
          </div>
        </div>

        {/* Emergency Medical Triage */}
        <div className="p-5 rounded-2xl border border-rose-500/30 bg-slate-950/70 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-sm">
            <HeartPulse size={16} />
            <span>Trauma & Epidemic Containment</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            1 Comprehensive Trauma First Aid Kit is rationed per 25-30 registered casualties with minor to moderate trauma injuries. Antibiotics cartons and water-borne anti-diarrheal packs are scaled according to flood depth and stagnant water duration.
          </p>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-rose-300">
            Formula: Trauma Kits = ceil(Medical Casualties &divide; 25) (Min: 2 Kits)
          </div>
        </div>

        {/* 0/1 Knapsack & Dijkstra Algorithmic Protocols */}
        <div className="p-5 rounded-2xl border border-indigo-500/30 bg-slate-950/70 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-mono font-bold text-sm">
            <Compass size={16} />
            <span>Dual Algorithmic Dispatch System</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Requisitions are triaged at Central Command using <strong>0/1 Knapsack DP</strong> to maximize life-saving utility under vehicle payload limits (e.g. 5,000 kg 4x4 trucks or 2,500 kg helicopters), followed by <strong>Dijkstra algorithm</strong> rerouting around submerged roadways.
          </p>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300">
            Pipeline: Requisition &rarr; Knapsack Triage &rarr; Dijkstra Path &rarr; Dispatch
          </div>
        </div>
      </div>
    </div>
  );
}
