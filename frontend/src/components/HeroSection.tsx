import { useEffect, useRef } from 'react';
import { ArrowRight, Compass, Shield, Activity, Radio, AlertTriangle } from 'lucide-react';
import gsap from 'gsap';
import Hero3D from './Hero3D';

interface HeroSectionProps {
  onLaunch: () => void;
}

export default function HeroSection({ onLaunch }: HeroSectionProps) {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP Entrance Timeline
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(badgeRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.6,
      })
        .from(
          headlineRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
          },
          '-=0.3'
        )
        .from(
          descRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.7,
          },
          '-=0.4'
        )
        .from(
          ctaRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
          },
          '-=0.4'
        );
    });

    return () => ctx.revert();
  }, []);

  const handleExplore = () => {
    const el = document.querySelector('#features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Ambience Gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emergency-orange/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headlines & CTAs */}
        <div className="lg:col-span-6 space-y-6">
          {/* Tactical Status Pill */}
          <div ref={badgeRef} className="inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-full text-xs font-mono bg-emergency-orange/10 text-emergency-orange border border-emergency-orange/30">
            <span className="w-2 h-2 rounded-full bg-emergency-orange animate-ping" />
            <span>CENTRAL EMERGENCY COMMAND PLATFORM</span>
          </div>

          {/* Master Headline */}
          <h1
            ref={headlineRef}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            When Every Second Matters,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emergency-orange via-amber-400 to-emergency-glow">
              Every Route Counts.
            </span>
          </h1>

          {/* Exact Master Description */}
          <p ref={descRef} className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
            An intelligent disaster relief coordination platform designed to connect resource requests, inventory allocation and route optimization.
          </p>

          {/* Action Buttons */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <button
              onClick={onLaunch}
              className="flex items-center justify-center space-x-3 bg-emergency-orange hover:bg-emergency-glow text-white text-sm font-bold font-mono px-7 py-3.5 rounded-xl shadow-glow-orange transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Launch RESQ-X</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleExplore}
              className="flex items-center justify-center space-x-2 bg-command-850 hover:bg-command-800 text-slate-200 hover:text-white text-sm font-mono px-6 py-3.5 rounded-xl border border-command-700 transition-colors"
            >
              <Compass className="w-4 h-4 text-slate-400" />
              <span>Explore Platform</span>
            </button>
          </div>

          {/* Live System Telemetry Strip (Illustrative Demo Statistics) */}
          <div className="pt-6 border-t border-command-700/60 grid grid-cols-3 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emergency-orange" />
                Response Time
              </span>
              <div className="text-white font-bold text-sm">&lt; 15 ms</div>
              <span className="text-[10px] text-slate-400 block">*Simulated Demo Metric</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Dijkstra Rerouting
              </span>
              <div className="text-cyan-400 font-bold text-sm">Dynamic Min-Heap</div>
              <span className="text-[10px] text-slate-400 block">Blocked Road Avoidance</span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Payload Efficacy
              </span>
              <div className="text-emerald-400 font-bold text-sm">0/1 Knapsack DP</div>
              <span className="text-[10px] text-slate-400 block">Priority Maximization</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Emergency Environment */}
        <div className="lg:col-span-6 relative">
          <Hero3D />

          {/* Decorative Tactical Callout */}
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-command-900/60 p-2.5 rounded-lg border border-command-700">
            <span className="flex items-center gap-1.5 text-slate-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Live Simulation Feed: Godavari Flood Sector Alpha
            </span>
            <span className="text-emergency-orange font-bold">DEFCON-READY</span>
          </div>
        </div>
      </div>
    </section>
  );
}
