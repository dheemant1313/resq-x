import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';
import { ApiClient } from '../../services/api';

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

export function LoginView({ onReplayCinematic, onReturnToHome }: LoginViewProps) {
  const [selectedRole, setSelectedRole] = useState<RoleType>('RELIEF_CENTER');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  // Form State
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

  // Handle switching role tab and auto-filling demo credentials for viva demonstration
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

  // Submit Self-Registration (Relief Center only)
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

  // Logout
  const handleLogout = () => {
    ApiClient.setToken(null);
    setAuthData(null);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-emergency-orange selection:text-white relative overflow-hidden">
      {/* Background Command Center Atmosphere Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emergency-orange/5 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-cyan-500/5 blur-[140px] pointer-events-none rounded-full" />

      {/* ----------------- TOP TACTICAL NAVIGATION BAR ----------------- */}
      <header className="border-b border-command-700 bg-command-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onReturnToHome}>
          <div className="p-2 bg-emergency-orange/10 border border-emergency-orange/30 rounded-xl text-emergency-orange">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] tracking-widest text-emergency-orange font-bold uppercase">
                COMMAND AUTH GATEWAY
              </span>
              <span className="text-[10px] bg-command-800 text-slate-400 px-2 py-0.5 rounded font-mono border border-command-700">
                PHASE 2 OPERATIONAL
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              RESQ-X CENTRAL PLATFORM
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Replay Cinematic Intro */}
          <button
            onClick={onReplayCinematic}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-command-850 hover:bg-command-800 text-slate-300 hover:text-white border border-command-700 text-xs font-mono transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emergency-orange" />
            <span className="hidden sm:inline">REPLAY RESCUE SCENE</span>
          </button>

          {/* Return to Home Landing */}
          <button
            onClick={onReturnToHome}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-command-800 hover:bg-command-700 text-white text-xs font-mono border border-command-600 transition-colors"
          >
            <span>HOME LANDING</span>
          </button>
        </div>
      </header>

      {/* ----------------- MAIN AUTHENTICATION CONTAINER ----------------- */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-xl bg-command-900/90 border border-command-700 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden hud-border">
          {/* Top Banner Notice */}
          <div className="px-6 py-4 bg-command-950/80 border-b border-command-700/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emergency-orange" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                ROLE-BASED ACCESS CONTROL (RBAC)
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded">
              JWT SECURE SHA-256
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* If Logged In: Active Session View */}
            {authData ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-800/80 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Active Session Initialized</h3>
                  <div className="text-xs font-mono text-slate-300 space-y-1">
                    <p>User: <strong className="text-white">{authData.username}</strong></p>
                    <p>Role: <strong className="text-emerald-400">{authData.role}</strong></p>
                    {authData.center_id && <p>Assigned Center: <strong className="text-cyan-400">Camp #{authData.center_id}</strong></p>}
                    <p className="text-[10px] text-slate-500 truncate pt-2">JWT: {authData.access_token.slice(0, 32)}...</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleLogout}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-command-800 hover:bg-command-700 text-white font-mono text-xs font-semibold transition-colors border border-command-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>LOGOUT & CHANGE USER</span>
                  </button>

                  <button
                    onClick={onReturnToHome}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emergency-orange hover:bg-emergency-orange-hover text-white font-mono text-xs font-semibold transition-colors shadow-glow-orange"
                  >
                    <span>RETURN TO OVERVIEW</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 3 Role Selection Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-command-950 rounded-xl border border-command-700">
                  <button
                    onClick={() => handleSelectRole('RELIEF_CENTER')}
                    className={`flex flex-col items-center py-2.5 px-2 rounded-lg font-mono text-xs transition-all ${
                      selectedRole === 'RELIEF_CENTER'
                        ? 'bg-emergency-orange text-white font-bold shadow-glow-orange'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mb-1" />
                    <span className="text-[11px] leading-tight">RELIEF CENTER</span>
                  </button>

                  <button
                    onClick={() => handleSelectRole('OPERATOR')}
                    className={`flex flex-col items-center py-2.5 px-2 rounded-lg font-mono text-xs transition-all ${
                      selectedRole === 'OPERATOR'
                        ? 'bg-cyan-500 text-command-950 font-bold shadow-glow-cyan'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Truck className="w-4 h-4 mb-1" />
                    <span className="text-[11px] leading-tight">OPERATOR</span>
                  </button>

                  <button
                    onClick={() => handleSelectRole('ADMIN')}
                    className={`flex flex-col items-center py-2.5 px-2 rounded-lg font-mono text-xs transition-all ${
                      selectedRole === 'ADMIN'
                        ? 'bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mb-1" />
                    <span className="text-[11px] leading-tight">SYSTEM ADMIN</span>
                  </button>
                </div>

                {/* Role Description & Security Enforcement Badge */}
                <div className="p-3.5 rounded-xl bg-command-850/80 border border-command-700/80 text-xs">
                  {selectedRole === 'RELIEF_CENTER' && (
                    <div className="flex items-start space-x-2.5 text-slate-300">
                      <Building2 className="w-4 h-4 text-emergency-orange shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">NDRF / Relief Camp Personnel:</strong> Submit frontline population needs, generate resource requisitions, and track arriving convoys.
                      </div>
                    </div>
                  )}
                  {selectedRole === 'OPERATOR' && (
                    <div className="flex items-start space-x-2.5 text-slate-300">
                      <Truck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Logistics Command Operator:</strong> Central inventory control, 0/1 Knapsack payload vehicle packing, and Dijkstra route dispatch.
                        <span className="block text-[11px] text-amber-400 mt-1">
                          *Strict RBAC: Public registration disabled. Operator accounts must be provisioned by an Administrator.
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedRole === 'ADMIN' && (
                    <div className="flex items-start space-x-2.5 text-slate-300">
                      <UserCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">System Administrator:</strong> Provision Operator accounts, audit disaster response logs, and manage road network topology.
                      </div>
                    </div>
                  )}
                </div>

                {/* Alert Messages */}
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Form: Login or Register */}
                {isRegisterMode ? (
                  /* ----------------- RELIEF CENTER REGISTRATION ----------------- */
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-slate-400">Center Official Email</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="coordinator@ndrf-camp-alpha.gov.in"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-command-950 border border-command-700 text-white text-xs font-mono focus:outline-none focus:border-emergency-orange"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-slate-400">Username</label>
                        <input
                          type="text"
                          required
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="coord_delta"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-command-950 border border-command-700 text-white text-xs font-mono focus:outline-none focus:border-emergency-orange"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-slate-400">Center ID</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={regCenterId}
                          onChange={(e) => setRegCenterId(parseInt(e.target.value) || 1)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-command-950 border border-command-700 text-white text-xs font-mono focus:outline-none focus:border-emergency-orange"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono text-slate-400">Secure Password</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-command-950 border border-command-700 text-white text-xs font-mono focus:outline-none focus:border-emergency-orange"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-emergency-orange hover:bg-emergency-orange-hover text-white font-mono text-xs font-bold tracking-wider transition-colors shadow-glow-orange flex items-center justify-center space-x-2"
                    >
                      {loading ? <span>REGISTERING...</span> : <span>CREATE RELIEF CENTER ACCOUNT</span>}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setIsRegisterMode(false)}
                        className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
                      >
                        Already have an account? Sign in
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ----------------- STANDARD LOGIN FORM ----------------- */
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
                        <span>USERNAME OR EMAIL</span>
                        <span className="text-[10px] text-slate-400">Auto-filled for Viva Demo</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={usernameOrEmail}
                          onChange={(e) => setUsernameOrEmail(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-command-950 border border-command-700 text-white text-xs font-mono focus:outline-none focus:border-emergency-orange transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
                        <span>ACCOUNT PASSWORD</span>
                        <span className="text-[10px] text-slate-400">Bcrypt Salted Hash</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-command-950 border border-command-700 text-white text-xs font-mono focus:outline-none focus:border-emergency-orange transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-emergency-orange hover:bg-emergency-orange-hover text-white font-mono text-xs font-bold tracking-wider transition-all shadow-glow-orange flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <span>AUTHENTICATING WITH SHA-256 JWT...</span>
                      ) : (
                        <>
                          <span>ACCESS {selectedRole.replace('_', ' ')} PORTAL</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Self-registration option for Relief Center only */}
                    {selectedRole === 'RELIEF_CENTER' && (
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setIsRegisterMode(true)}
                          className="text-xs font-mono text-emergency-orange hover:underline"
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
      </main>

      {/* Footer */}
      <footer className="border-t border-command-700 bg-command-900/60 text-slate-400 text-xs px-6 py-3 flex items-center justify-between font-mono">
        <div>RESQ-X Security Gateway &bull; Role Verification Active</div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            BACKEND REST API ONLINE (:8000)
          </span>
        </div>
      </footer>
    </div>
  );
}
