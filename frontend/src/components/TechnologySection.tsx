import { 
  Code2, 
  Database, 
  ShieldCheck, 
  Sparkles, 
  Server 
} from 'lucide-react';

export default function TechnologySection() {
  const techCategories = [
    {
      category: 'Frontend & Architecture',
      icon: Code2,
      accent: 'border-blue-500/30 text-blue-400',
      technologies: [
        { name: 'React 18', role: 'Component UI Framework', version: 'v18.3' },
        { name: 'Vite', role: 'Next-Gen Build Engine', version: 'v6.2' },
        { name: 'TypeScript', role: 'End-to-End Type Safety', version: 'v5.8' },
        { name: 'Tailwind CSS', role: 'Command Center Styling', version: 'v4.0' },
        { name: 'Lucide React', role: 'Tactical Iconography', version: 'v1.16' },
      ],
    },
    {
      category: '3D Graphics & Motion Suite',
      icon: Sparkles,
      accent: 'border-emergency-orange/30 text-emergency-orange',
      technologies: [
        { name: 'Three.js', role: 'Core WebGL 3D Rendering', version: 'v0.174' },
        { name: 'React Three Fiber', role: 'Declarative 3D Canvas', version: 'v8.18' },
        { name: 'Drei', role: 'R3F Shader & Control Primitives', version: 'v9.122' },
        { name: 'GSAP', role: 'Cinematic Sequencing & Timelines', version: 'v3.12' },
        { name: 'Motion', role: 'Micro-Interactions & UI Physics', version: 'v12.4' },
        { name: 'Lenis', role: 'Smooth Inertia Scroll Engine', version: 'v1.1' },
      ],
    },
    {
      category: 'Backend & High-Performance API',
      icon: Server,
      accent: 'border-emerald-500/30 text-emerald-400',
      technologies: [
        { name: 'Python FastAPI', role: 'Async ASGI REST Framework', version: 'v0.111' },
        { name: 'Pydantic v2', role: 'Type & Contract Validation', version: 'v2.14' },
        { name: 'Python-Jose', role: 'Cryptographic JWT Tokens', version: 'v3.5' },
        { name: 'Passlib (bcrypt)', role: 'Work-Factor Salted Hashing', version: 'v1.7' },
        { name: 'Pytest', role: 'Algorithmic Test Verification', version: 'v9.2' },
      ],
    },
    {
      category: 'Database & Geospatial Engine',
      icon: Database,
      accent: 'border-cyan-500/30 text-cyan-400',
      technologies: [
        { name: 'PostgreSQL', role: 'ACID Relational Storage', version: 'v16+' },
        { name: 'SQLAlchemy 2.0', role: 'High-Concurrency ORM', version: 'v2.0' },
        { name: 'Alembic', role: 'Schema Versioning Migrations', version: 'v1.20' },
        { name: 'React Leaflet', role: 'Geospatial Map Canvas', version: 'Leaflet' },
        { name: 'OpenStreetMap', role: 'Disaster Road Network Tiles', version: 'Carto' },
      ],
    },
  ];

  return (
    <section id="technology" className="py-24 bg-command-950 relative">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-emergency-orange">
            <span className="w-1.5 h-1.5 rounded-full bg-emergency-orange" />
            <span>APPROVED ENGINEERING ECOSYSTEM</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Fixed Production-Grade Technology Stack
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Engineered strictly with the prescribed full-stack technologies to deliver speed, visual fidelity, and computational guarantees.
          </p>
        </div>

        {/* 4 Category Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {techCategories.map((cat, idx) => {
            const CatIcon = cat.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-6 rounded-2xl border border-command-700/80 space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Category Title */}
                  <div className="flex items-center space-x-3 pb-3 border-b border-command-800">
                    <div className={`p-2 rounded-lg bg-command-850 border ${cat.accent}`}>
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{cat.category}</h3>
                      <span className="text-[10px] font-mono text-slate-400">Verified System Layer</span>
                    </div>
                  </div>

                  {/* Technology Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cat.technologies.map((tech, tIdx) => (
                      <div
                        key={tIdx}
                        className="bg-command-900/90 p-3 rounded-xl border border-command-800/80 space-y-1 hover:border-command-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{tech.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-command-800 px-1.5 py-0.5 rounded">
                            {tech.version}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          {tech.role}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-command-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>LAYER INTEGRITY</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% CONFIGURED
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
