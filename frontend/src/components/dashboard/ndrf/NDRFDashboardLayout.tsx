import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Clock, 
  Building2, 
  BookOpen, 
  LogOut, 
  Home, 
  Radio, 
  Volume2, 
  VolumeX, 
  Menu, 
  X,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import NDRFOverviewView from './NDRFOverviewView';
import NDRFNewRequestView from './NDRFNewRequestView';
import NDRFRequestTrackingView from './NDRFRequestTrackingView';
import NDRFProfileView from './NDRFProfileView';
import NDRFGuidelinesView from './NDRFGuidelinesView';
import type { NDRFNavTab, ReliefCenterProfile, RequisitionRecord } from './types';
import type { AuthResponse } from '../../auth/types';

interface NDRFDashboardLayoutProps {
  currentUser: AuthResponse;
  onLogout: () => void;
  onReturnToHome: () => void;
}

export default function NDRFDashboardLayout({
  currentUser,
  onLogout,
  onReturnToHome,
}: NDRFDashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<NDRFNavTab>('overview');
  const [centerProfile, setCenterProfile] = useState<ReliefCenterProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fetch relief center profile
  useEffect(() => {
    async function loadCenter() {
      try {
        const data = await ApiClient.get<ReliefCenterProfile>('/relief-centers/me');
        setCenterProfile(data);
      } catch (err: unknown) {
        console.warn('Failed to load relief center profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadCenter();
  }, []);

  const handleRequisitionCreated = (_newReq: RequisitionRecord) => {
    setActiveTab('tracking');
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'new_request', label: 'New Requisition', icon: PlusCircle },
    { id: 'tracking', label: 'Request Tracking', icon: Clock },
    { id: 'profile', label: 'Relief Center Profile', icon: Building2 },
    { id: 'guidelines', label: 'Sphere Guidelines', icon: BookOpen },
  ] as const;

  return (
    <div className="min-h-screen bg-[#02050c] text-slate-100 flex flex-col font-sans select-none">
      {/* ----------------- TOP TACTICAL COMMAND BAR ----------------- */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div
            onClick={onReturnToHome}
            className="cursor-pointer flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emergency-orange/20 border border-emergency-orange/50 flex items-center justify-center text-emergency-orange group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <Radio size={16} className="animate-pulse" />
            </div>
            <div>
              <div className="text-base font-black tracking-widest text-white font-mono flex items-center gap-1">
                <span>RESQ</span>
                <span className="text-emergency-orange">-X</span>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-cyan-300 font-mono hidden sm:block">
                NDRF Frontline Command
              </p>
            </div>
          </div>
        </div>

        {/* Center Station Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-slate-400">Station:</span>
          <strong className="text-white">{centerProfile?.name || 'NDRF Base Camp Alpha'}</strong>
          <span className="text-cyan-300 font-bold">[{centerProfile?.code || 'RC-ALPHA'}]</span>
        </div>

        {/* Action Controls & User Identity */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn text-xs !py-1 !px-2.5 border-slate-800 text-slate-400 hover:text-white hidden sm:flex items-center gap-1"
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 size={13} className="text-cyan-400" /> : <VolumeX size={13} className="text-rose-400" />}
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
            <ShieldCheck size={14} className="text-amber-400" />
            <div className="text-left">
              <span className="text-white font-bold block leading-none">{currentUser.username}</span>
              <span className="text-[9px] text-amber-300/80 uppercase font-mono">Relief Center Lead</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="btn text-xs !py-1.5 !px-3 border-rose-900/60 hover:border-rose-500 text-rose-400 flex items-center gap-1.5"
            title="Log out and invalidate session"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">LOGOUT</span>
          </button>
        </div>
      </header>

      {/* ----------------- DASHBOARD BODY WITH SIDEBAR ----------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`fixed md:static inset-y-16 left-0 z-30 w-64 bg-slate-950 border-r border-slate-800/80 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="space-y-6">
            <div className="px-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                TACTICAL PORTAL
              </span>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emergency-orange text-white shadow-[0_0_20px_rgba(249,115,22,0.35)]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Details */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Relief Center ID:</span>
                <strong className="text-cyan-300">#{currentUser.center_id || 1}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Active Link:</span>
                <strong className="text-emerald-400">ONLINE</strong>
              </div>
            </div>

            <button
              onClick={onReturnToHome}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors border border-slate-800"
            >
              <Home size={13} />
              <span>RETURN TO PUBLIC PORTAL</span>
            </button>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#02050c]">
          {loadingProfile ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
              <RefreshCw size={24} className="animate-spin text-emergency-orange" />
              <p className="text-xs font-mono text-cyan-300">Initializing Frontline Console...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <NDRFOverviewView
                  onNavigateTab={(t) => setActiveTab(t)}
                  centerProfile={centerProfile}
                />
              )}

              {activeTab === 'new_request' && (
                <NDRFNewRequestView
                  centerProfile={centerProfile}
                  onSuccess={handleRequisitionCreated}
                />
              )}

              {activeTab === 'tracking' && (
                <NDRFRequestTrackingView />
              )}

              {activeTab === 'profile' && (
                <NDRFProfileView
                  profile={centerProfile}
                  onProfileUpdated={(updated) => setCenterProfile(updated)}
                />
              )}

              {activeTab === 'guidelines' && (
                <NDRFGuidelinesView />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
