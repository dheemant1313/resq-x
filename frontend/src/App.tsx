import { useState, useEffect } from 'react';
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
import { LoginView } from './components/auth/LoginView';
import NDRFDashboardLayout from './components/dashboard/ndrf/NDRFDashboardLayout';
import { useLenis } from './hooks/useLenis';
import { ApiClient } from './services/api';
import type { AuthResponse } from './components/auth/types';

type AppViewMode = 'landing' | 'login' | 'ndrf_dashboard';

export function App() {
  // Initialize Lenis smooth scroll engine for landing page
  useLenis();

  // Active view state
  const [viewMode, setViewMode] = useState<AppViewMode>('landing');
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(null);

  // Restore authenticated session if valid token exists on mount
  useEffect(() => {
    async function restoreSession() {
      const token = ApiClient.getToken();
      if (!token) return;

      try {
        const user = await ApiClient.get<any>('/auth/me');
        const authData: AuthResponse = {
          access_token: token,
          token_type: 'bearer',
          role: user.role,
          username: user.username,
          center_id: user.center_id,
        };
        setCurrentUser(authData);
      } catch {
        ApiClient.clearSession();
        setCurrentUser(null);
      }
    }
    restoreSession();
  }, []);

  // Launch login experience
  const handleLaunchLogin = () => {
    if (currentUser?.role === 'RELIEF_CENTER') {
      setViewMode('ndrf_dashboard');
    } else {
      setViewMode('login');
    }
  };

  // Return to landing page
  const handleReturnToLanding = () => {
    setViewMode('landing');
  };

  // Transition from login to appropriate dashboard
  const handleProceedToDashboard = (authData: AuthResponse) => {
    setCurrentUser(authData);
    if (authData.role === 'RELIEF_CENTER') {
      setViewMode('ndrf_dashboard');
    }
  };

  // Logout from dashboard
  const handleDashboardLogout = async () => {
    await ApiClient.logout();
    setCurrentUser(null);
    setViewMode('landing');
  };

  return (
    <>
      {/* ----------------- VIEW 1: NDRF / RELIEF CENTER DASHBOARD ----------------- */}
      {viewMode === 'ndrf_dashboard' && currentUser && (
        <NDRFDashboardLayout
          currentUser={currentUser}
          onLogout={handleDashboardLogout}
          onReturnToHome={handleReturnToLanding}
        />
      )}

      {/* ----------------- VIEW 2: FULL REALISTIC RESCUE LOGIN EXPERIENCE ----------------- */}
      {viewMode === 'login' && (
        <LoginView
          onReturnToHome={handleReturnToLanding}
          onProceedToDashboard={handleProceedToDashboard}
        />
      )}

      {/* ----------------- VIEW 3: FULL PUBLIC LANDING PAGE ----------------- */}
      {viewMode === 'landing' && (
        <div className="min-h-screen bg-command-950 text-slate-100 flex flex-col selection:bg-emergency-orange selection:text-white font-sans antialiased relative">
          {/* SECTION 1 — Tactical Navbar with Live Status */}
          <Navbar onLaunch={handleLaunchLogin} />

          <main className="flex-1 w-full">
            {/* SECTION 2 — Hero with 3D Emergency Response Environment */}
            <HeroSection onLaunch={handleLaunchLogin} />

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
