import { useState, useEffect } from 'react';
import { ShieldAlert, Menu, X, ArrowRight, Activity } from 'lucide-react';

interface NavbarProps {
  onLaunch: () => void;
}

export default function Navbar({ onLaunch }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Algorithms', href: '#algorithms' },
    { label: 'Roles', href: '#roles' },
    { label: 'About', href: '#about' },
  ];

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-command-950/90 backdrop-blur-md border-b border-command-700 shadow-command-card py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* RESQ-X Logo */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('#home');
          }}
          className="flex items-center space-x-3 group"
        >
          <div className="p-2 rounded-lg bg-emergency-orange/10 border border-emergency-orange/30 group-hover:border-emergency-orange transition-colors">
            <ShieldAlert className="w-6 h-6 text-emergency-orange animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-white text-lg">RESQ-X</span>
              <span className="text-[10px] font-mono uppercase bg-emergency-orange/10 text-emergency-orange px-1.5 py-0.5 rounded border border-emergency-orange/30">
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 tracking-wider hidden sm:block">
              COMMAND & ALLOCATION PLATFORM
            </p>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleLinkClick(link.href)}
              className="px-3.5 py-2 text-xs font-mono text-slate-300 hover:text-white hover:bg-command-800/60 rounded-md transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Action Button & Telemetry Indicator */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/60">
            <Activity className="w-3.5 h-3.5" />
            <span>DISPATCH READY</span>
          </div>

          <button
            onClick={onLaunch}
            className="flex items-center space-x-2 bg-emergency-orange hover:bg-emergency-glow text-white text-xs font-bold font-mono px-4 py-2 rounded-lg shadow-glow-orange transition-all transform hover:-translate-y-0.5"
          >
            <span>LAUNCH RESQ-X</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white hover:bg-command-800 rounded-lg border border-command-700"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-emergency-orange" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-command-950/95 border-b border-command-700 backdrop-blur-xl px-6 py-5 space-y-4">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link.href)}
                className="text-left py-2.5 text-sm font-mono text-slate-300 hover:text-emergency-orange border-b border-command-800/40"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunch();
              }}
              className="w-full flex items-center justify-center space-x-2 bg-emergency-orange text-white py-3 rounded-lg font-mono text-xs font-bold shadow-glow-orange"
            >
              <span>LAUNCH RESQ-X</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
