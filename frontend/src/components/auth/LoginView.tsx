import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Building2, 
  Truck, 
  UserCheck, 
  KeyRound, 
  User, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Terminal,
  LogOut,
  Volume2,
  VolumeX,
  Compass
} from 'lucide-react';
import { ApiClient } from '../../services/api';
import { RealisticRescueLoginCanvas } from './RealisticRescueLoginCanvas';
import { rescueAudio } from '../../audio/rescueAudio';

interface LoginViewProps {
  onReplayCinematic: () => void;
  onReturnToHome: () => void;
}

type RoleType = 'RELIEF_CENTER' | 'OPERATOR' | 'ADMIN';

interface AuthResponse {
  access_token: string;
  token_type: string;
  role: RoleType;
  username: string;
  center_id: number | null;
}

export function LoginView({ onReturnToHome }: LoginViewProps) {
  // Choreography State for 3D Background
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchIntensity, setTorchIntensity] = useState<number>(0);
  const [heloPhase, setHeloPhase] = useState<'approaching' | 'hovering' | 'leaving'>('approaching');
  const [heloProgress, setHeloProgress] = useState<number>(0);
  const [loginCardVisible, setLoginCardVisible] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [choreographyStep, setChoreographyStep] = useState<string>('HELICOPTER INBOUND OVER WATER');

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Role & Form State
  const [selectedRole, setSelectedRole] = useState<RoleType>('RELIEF_CENTER');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('coord_alpha');
  const [password, setPassword] = useState<string>('Relief@12345');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regCenterId, setRegCenterId] = useState<number>(1);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Status & Error handling
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [authData, setAuthData] = useState<AuthResponse | null>(null);

  // ----------------- CHOREOGRAPHED RESCUE SEQUENCE -----------------
  // 1. Helicopter approaches over flooded water (0s to 3s)
  // 2. Survivor in water raises torch and turns it ON with click (3s)
  // 3. Torch beam sweeps from left to right end, revealing login page (3.5s - 4.5s)
  // 4. Helicopter hovers, then banks and leaves into deep background (5.5s onwards)
  const startChoreography = () => {
    startTimeRef.current = Date.now();
    setTorchOn(false);
    setTorchIntensity(0);
    setHeloPhase('approaching');
    setHeloProgress(0);
    setLoginCardVisible(false);
    setChoreographyStep('AIR-RESCUE HELO ON VECTOR');

    rescueAudio.startAmbient();
    rescueAudio.setHeloHover(0.85);

    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      if (elapsed < 3.2) {
        // Approaching phase
        setHeloPhase('approaching');
        setHeloProgress(elapsed / 3.2);
        setChoreographyStep('HELO SEARCHLIGHT SCANNING WATER');
      } else if (elapsed >= 3.2 && elapsed < 5.0) {
        // Person switches on torch!
        setHeloPhase('hovering');
        setTorchOn(true);
        const beamProgress = Math.min(1.0, (elapsed - 3.2) / 1.2);
        setTorchIntensity(beamProgress);
        setChoreographyStep('HANDHELD BEACON SWEEPING TO RIGHT END');

        // Reveal login card as beam reaches the right end
        if (elapsed > 4.0 && !loginCardVisible) {
          setLoginCardVisible(true);
          setChoreographyStep('COMMAND LOGIN ILLUMINATED BY BEACON');
        }
      } else if (elapsed >= 5.0) {
        // Helicopter departs into background behind the login panel!
        setHeloPhase('leaving');
        const leaveProgress = Math.min(1.0, (elapsed - 5.0) / 4.5);
        setHeloProgress(leaveProgress);
        setTorchOn(true);
        setTorchIntensity(1.0);
        setLoginCardVisible(true);
        setChoreographyStep('HELO DEPARTING TO EXPEDITION BASE');
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    startChoreography();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      rescueAudio.stopAndCleanup();
    };
  }, []);

  const handleToggleMute = () => {
    const muted = rescueAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleReplayFlyby = () => {
    startChoreography();
  };

  // Switch role and update demo credentials
  const handleSelectRole = (role: RoleType) => {
    setSelectedRole(role);
    setIsRegisterMode(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (role === 'RELIEF_CENTER') {
      setUsernameOrEmail('coord_alpha');
      setPassword('Relief@12345');
    } else if (role === 'OPERATOR') {
      setUsernameOrEmail('operator1');
      setPassword('Operator@12345');
    } else if (role === 'ADMIN') {
      setUsernameOrEmail('admin');
      setPassword('Admin@12345');
    }
  };

  // Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const data = await ApiClient.post<AuthResponse>('/auth/login', {
        username_or_email: usernameOrEmail,
        password: password,
      });

      ApiClient.setToken(data.access_token);
      setAuthData(data);
      setSuccessMsg(`Authenticated successfully as ${data.username} (${data.role}). Session active!`);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Self-Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await ApiClient.post('/auth/register-relief-center', {
        email: regEmail,
        username: regUsername,
        password: regPassword,
        role: 'RELIEF_CENTER',
        center_id: regCenterId || 1,
      });

      setSuccessMsg('NDRF Relief Center account created successfully! You can now log in.');
      setIsRegisterMode(false);
      setUsernameOrEmail(regUsername);
      setPassword(regPassword);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Registration failed. Check if username or email is already taken.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    ApiClient.setToken(null);
    setAuthData(null);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-emergency-orange selection:text-white overflow-hidden">
      {/* ----------------- 3D FULL REALISTIC BACKGROUND SCENE ----------------- */}
      {/* 
        - Left: Drenched person waist-deep in water holding handheld torch
        - Top/Sky: Rescue helicopter flying in, hovering, and leaving into background
        - Torch light: Beams from Left across to the Right end
      */}
      <RealisticRescueLoginCanvas
        torchOn={torchOn}
        torchIntensity={torchIntensity}
        heloPhase={heloPhase}
        heloProgress={heloProgress}
      />

      {/* ----------------- TOP TACTICAL NAVIGATION BAR ----------------- */}
      <header className="border-b border-command-700/80 bg-command-950/70 backdrop-blur-md px-6 py-3 flex items-center justify-between relative z-30">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReturnToHome}>
          <div className="p-2 bg-emergency-orange/10 border border-emergency-orange/30 rounded-xl text-emergency-orange">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] tracking-widest text-emergency-orange font-bold uppercase">
                RESCUE COMMAND PORTAL
              </span>
              <span className="text-[10px] bg-command-800 text-slate-400 px-2 py-0.5 rounded font-mono border border-command-700">
                ACTIVE
              </span>
            </div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              RESQ-X PLATFORM ACCESS
            </h1>
          </div>
        </div>

        {/* Tactical Controls: Replay, Audio, Landing */}
        <div className="flex items-center space-x-2.5">
          {/* Mute/Unmute */}
          <button
            onClick={handleToggleMute}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-command-900/80 hover:bg-command-800 text-slate-300 border border-command-700 text-xs font-mono transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline">{isMuted ? 'MUTED' : 'AUDIO'}</span>
          </button>

          {/* Replay Helicopter & Torch Sequence */}
          <button
            onClick={handleReplayFlyby}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-command-900/80 hover:bg-command-800 text-slate-300 hover:text-white border border-command-700 text-xs font-mono transition-colors"
            title="Replay Helicopter & Handheld Torch Sequence"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emergency-orange" />
            <span className="hidden sm:inline">REPLAY RESCUE FLYBY</span>
          </button>

          {/* Home Landing */}
          <button
            onClick={onReturnToHome}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emergency-orange hover:bg-emergency-orange-hover text-white text-xs font-mono transition-colors shadow-glow-orange font-semibold"
          >
            <span>HOME LANDING</span>
          </button>
        </div>
      </header>

      {/* ----------------- MAIN LAYOUT: PERSON ON LEFT, LOGIN ON RIGHT END ----------------- */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-between p-4 sm:p-6 lg:p-10 relative z-20 pointer-events-none">
        {/* Left Side: Water & Telemetry Indicator */}
        <div className="w-full md:w-5/12 flex flex-col justify-end p-4 pointer-events-auto space-y-2 mt-auto md:mt-0">
          <div className="bg-command-950/80 backdrop-blur-md p-3.5 rounded-xl border border-command-700/80 max-w-sm space-y-1.5 shadow-2xl">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emergency-orange" />
                SURVIVOR BEACON TELEMETRY
              </span>
              <span className="text-emerald-400 font-bold">SIGNAL LOCKED</span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              {choreographyStep}
            </p>
            <div className="text-[10px] font-mono text-emergency-orange pt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emergency-orange animate-ping" />
              <span>HANDHELD TORCH TARGETING LOGIN TERMINAL</span>
            </div>
          </div>
        </div>

        {/* Right Side: The Illuminated Login Panel (Right End) */}
        <div 
          className={`w-full md:w-7/12 lg:w-5/12 pointer-events-auto transition-all duration-700 ${
            loginCardVisible 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-12'
          }`}
        >
          <div className="bg-command-900/90 border border-command-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden hud-border shadow-emergency-orange/10">
            {/* Top Header of Card */}
            <div className="px-6 py-3.5 bg-command-950/80 border-b border-command-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emergency-orange" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                  AUTHENTICATION GATEWAY
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded">
                JWT SHA-256 RBAC
              </span>
            </div>

            <div className="p-6 space-y-5">
              {/* If Logged In: Active Session */}
              {authData ? (
                <div className="space-y-5 animate-fadeIn">
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/80 text-center space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">Active Session Initialized</h3>
                    <div className="text-xs font-mono text-slate-300 space-y-1">
                      <p>User: <strong className="text-white">{authData.username}</strong></p>
                      <p>Role: <strong className="text-emerald-400">{authData.role}</strong></p>
                      {authData.center_id && <p>Assigned Center: <strong className="text-cyan-400">Camp #{authData.center_id}</strong></p>}
                      <p className="text-[10px] text-slate-500 truncate pt-1">Token: {authData.access_token.slice(0, 32)}...</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={handleLogout}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-command-800 hover:bg-command-700 text-white font-mono text-xs font-semibold transition-colors border border-command-600"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>LOGOUT</span>
                    </button>

                    <button
                      onClick={onReturnToHome}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-emergency-orange hover:bg-emergency-orange-hover text-white font-mono text-xs font-semibold transition-colors shadow-glow-orange"
                    >
                      <span>RETURN HOME</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* 3 Role Selection Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-command-950 rounded-xl border border-command-700">
                    <button
                      onClick={() => handleSelectRole('RELIEF_CENTER')}
                      className={`flex flex-col items-center py-2 px-1.5 rounded-lg font-mono text-xs transition-all ${
                        selectedRole === 'RELIEF_CENTER'
                          ? 'bg-emergency-orange text-white font-bold shadow-glow-orange'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px] leading-tight">RELIEF CAMP</span>
                    </button>

                    <button
                      onClick={() => handleSelectRole('OPERATOR')}
                      className={`flex flex-col items-center py-2 px-1.5 rounded-lg font-mono text-xs transition-all ${
                        selectedRole === 'OPERATOR'
                          ? 'bg-cyan-500 text-command-950 font-bold shadow-glow-cyan'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px] leading-tight">OPERATOR</span>
                    </button>

                    <button
                      onClick={() => handleSelectRole('ADMIN')}
                      className={`flex flex-col items-center py-2 px-1.5 rounded-lg font-mono text-xs transition-all ${
                        selectedRole === 'ADMIN'
                          ? 'bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[10px] leading-tight">SYS ADMIN</span>
                    </button>
                  </div>

                  {/* Role Brief & Security Notice */}
                  <div className="p-3 rounded-xl bg-command-850/80 border border-command-700/80 text-[11px] text-slate-300">
                    {selectedRole === 'RELIEF_CENTER' && (
                      <span><strong>NDRF / Relief Camp Personnel:</strong> Submit population needs & track dispatches.</span>
                    )}
                    {selectedRole === 'OPERATOR' && (
                      <span><strong>Central Logistics Officer:</strong> Inventory allocation, 0/1 Knapsack & Dijkstra routing.</span>
                    )}
                    {selectedRole === 'ADMIN' && (
                      <span><strong>System Administrator:</strong> Operator account creation & network topology audit.</span>
                    )}
                  </div>

                  {/* Alerts */}
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                  {successMsg && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* Form */}
                  {isRegisterMode ? (
                    <form onSubmit={handleRegister} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-slate-400">Email Address</label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="coordinator@ndrf.gov.in"
                          className="w-full px-3 py-2 rounded-lg bg-command-950 border border-command-700 text-white text-xs font-mono focus:border-emergency-orange"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-mono text-slate-400">Username</label>
                          <input
                            type="text"
                            required
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value)}
                            placeholder="coord_beta"
                            className="w-full px-3 py-2 rounded-lg bg-command-950 border border-command-700 text-white text-xs font-mono focus:border-emergency-orange"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-mono text-slate-400">Center ID</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={regCenterId}
                            onChange={(e) => setRegCenterId(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 rounded-lg bg-command-950 border border-command-700 text-white text-xs font-mono focus:border-emergency-orange"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-slate-400">Password</label>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 rounded-lg bg-command-950 border border-command-700 text-white text-xs font-mono focus:border-emergency-orange"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-emergency-orange hover:bg-emergency-orange-hover text-white font-mono text-xs font-bold transition-all shadow-glow-orange"
                      >
                        {loading ? 'REGISTERING...' : 'CREATE RELIEF ACCOUNT'}
                      </button>
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => setIsRegisterMode(false)}
                          className="text-xs font-mono text-slate-400 hover:text-white"
                        >
                          Already have an account? Sign in
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleLogin} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-slate-400 flex justify-between">
                          <span>USERNAME / EMAIL</span>
                          <span className="text-[10px] text-slate-400">Pre-filled Demo</span>
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={usernameOrEmail}
                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-command-950 border border-command-700 text-white text-xs font-mono focus:border-emergency-orange"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-slate-400 flex justify-between">
                          <span>PASSWORD</span>
                          <span className="text-[10px] text-slate-400">Bcrypt Salted</span>
                        </label>
                        <div className="relative">
                          <KeyRound className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-9 py-2 rounded-lg bg-command-950 border border-command-700 text-white text-xs font-mono focus:border-emergency-orange"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-emergency-orange hover:bg-emergency-orange-hover text-white font-mono text-xs font-bold tracking-wider transition-all shadow-glow-orange flex items-center justify-center space-x-2"
                      >
                        {loading ? (
                          <span>AUTHENTICATING...</span>
                        ) : (
                          <>
                            <span>ACCESS {selectedRole.replace('_', ' ')} PORTAL</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      {selectedRole === 'RELIEF_CENTER' && (
                        <div className="text-center pt-1">
                          <button
                            type="button"
                            onClick={() => setIsRegisterMode(true)}
                            className="text-[11px] font-mono text-emergency-orange hover:underline"
                          >
                            Register New Relief Center Camp
                          </button>
                        </div>
                      )}
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ----------------- BOTTOM TACTICAL FOOTER ----------------- */}
      <footer className="border-t border-command-700/80 bg-command-950/70 text-slate-400 text-xs px-6 py-2.5 flex items-center justify-between font-mono relative z-30">
        <div>RESQ-X Crisis Portal &bull; Live Telemetry Operational</div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            BACKEND REST API (:8000)
          </span>
        </div>
      </footer>
    </div>
  );
}
