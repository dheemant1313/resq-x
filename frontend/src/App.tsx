import { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProblemSolutionSection from './components/ProblemSolutionSection';
import CoreFeaturesSection from './components/CoreFeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import AlgorithmShowcaseSection from './components/AlgorithmShowcaseSection';
import UserRolesSection from './components/UserRolesSection';
import TechnologySection from './components/TechnologySection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import { CinematicRescueSequence } from './components/cinematic/CinematicRescueSequence';
import { LoginView } from './components/auth/LoginView';
import { useLenis } from './hooks/useLenis';

type AppViewMode = 'landing' | 'cinematic' | 'login';

export function App() {
  // Initialize Lenis smooth scroll engine for landing page
  useLenis();

  // Active view state
  const [viewMode, setViewMode] = useState<AppViewMode>('landing');

  // Triggered when user clicks "Launch RESQ-X" on landing page
  const handleLaunchCinematic = () => {
    setViewMode('cinematic');
  };

  // Triggered when 3D cinematic finishes or user clicks "Skip Intro"
  const handleCinematicComplete = () => {
    setViewMode('login');
  };

  // Triggered when user replays cinematic from login page
  const handleReplayCinematic = () => {
    setViewMode('cinematic');
  };

  // Triggered when user returns to landing page
  const handleReturnToLanding = () => {
    setViewMode('landing');
  };

  return (
    <>
      {/* ----------------- VIEW 1: 3D CINEMATIC RESCUE SEQUENCE ----------------- */}
      {viewMode === 'cinematic' && (
        <CinematicRescueSequence
          onComplete={handleCinematicComplete}
          onCancel={handleReturnToLanding}
        />
      )}

      {/* ----------------- VIEW 2: RESQ-X LOGIN & RBAC INTERFACE ----------------- */}
      {viewMode === 'login' && (
        <LoginView
          onReplayCinematic={handleReplayCinematic}
          onReturnToHome={handleReturnToLanding}
        />
      )}

      {/* ----------------- VIEW 3: FULL PUBLIC LANDING PAGE ----------------- */}
      {viewMode === 'landing' && (
        <div className="min-h-screen bg-command-950 text-slate-100 flex flex-col selection:bg-emergency-orange selection:text-white font-sans antialiased relative">
          {/* SECTION 1 — Tactical Navbar with Live Status */}
          <Navbar onLaunch={handleLaunchCinematic} />

          <main className="flex-1 w-full">
            {/* SECTION 2 — Hero with 3D Emergency Response Environment */}
            <HeroSection onLaunch={handleLaunchCinematic} />

            {/* SECTION 3 — Problem & Algorithmic Solution Breakdown */}
            <ProblemSolutionSection />

            {/* SECTION 4 — Core Platform Features */}
            <CoreFeaturesSection />

            {/* SECTION 5 — Animated 7-Stage Crisis Workflow */}
            <HowItWorksSection />

            {/* SECTION 6 — Algorithm Deep-Dive Showcase */}
            <AlgorithmShowcaseSection />

            {/* SECTION 7 — Dedicated User Roles & Responsibilities */}
            <UserRolesSection />

            {/* SECTION 8 — Fixed Technology Stack Presentation */}
            <TechnologySection />

            {/* SECTION 9 — Academic Scope, Viva Context & Limitations */}
            <AboutSection />
          </main>

          {/* SECTION 10 — Command Center Footer */}
          <Footer />
        </div>
      )}
    </>
  );
}

export default App;
