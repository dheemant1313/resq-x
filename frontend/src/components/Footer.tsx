import { ShieldAlert, ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-command-950 border-t border-command-700/80 text-slate-400 py-16 text-xs font-mono">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emergency-orange/10 border border-emergency-orange/30">
                <ShieldAlert className="w-5 h-5 text-emergency-orange" />
              </div>
              <span className="font-bold tracking-tight text-white text-base">RESQ-X PLATFORM</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Disaster Relief Resource Allocation and Intelligent Route Optimization System. Connecting frontline requisitions, central warehouse inventory, and disaster road navigation.
            </p>
            <div className="text-[11px] text-slate-400">
              ARCHITECTURE VERSION: <span className="text-emerald-400 font-bold">1.0.0-PROTOTYPE</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block">NAVIGATION</span>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#home" className="hover:text-emergency-orange transition-colors">Command Home</a></li>
              <li><a href="#features" className="hover:text-emergency-orange transition-colors">Core Features</a></li>
              <li><a href="#how-it-works" className="hover:text-emergency-orange transition-colors">7-Stage Workflow</a></li>
              <li><a href="#algorithms" className="hover:text-emergency-orange transition-colors">Algorithm Engine</a></li>
              <li><a href="#roles" className="hover:text-emergency-orange transition-colors">User Roles & RBAC</a></li>
              <li><a href="#about" className="hover:text-emergency-orange transition-colors">Academic Context</a></li>
            </ul>
          </div>

          {/* Technology Credits */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block">TECH STACK</span>
            <ul className="space-y-2 text-slate-400">
              <li>React 18 &bull; Vite &bull; TypeScript</li>
              <li>Tailwind CSS &bull; Lucide React</li>
              <li>Three.js &bull; R3F &bull; Drei</li>
              <li>GSAP &bull; Motion &bull; Lenis</li>
              <li>FastAPI &bull; PostgreSQL &bull; SQLAlchemy</li>
              <li>0/1 Knapsack DP &bull; Dijkstra Heap</li>
            </ul>
          </div>
        </div>

        {/* Academic Evaluation Disclaimer & Copyright */}
        <div className="pt-8 border-t border-command-800 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-slate-400">
              <strong>Academic Project Evaluation Notice:</strong> This software is an engineering capstone and viva demonstration prototype. All disaster scenarios and road networks represent illustrative simulation data. Not certified for live operational emergency management.
            </p>
            <p>&copy; {new Date().getFullYear()} RESQ-X Disaster Relief Engineering Group. Academic Evaluation Build.</p>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center space-x-1.5 p-2 rounded-lg bg-command-850 hover:bg-command-800 text-slate-300 hover:text-white border border-command-700 transition-colors shrink-0"
            aria-label="Back to Top"
          >
            <span>TOP</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
