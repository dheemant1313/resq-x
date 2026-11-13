import { useState, type FormEvent } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  LifeBuoy, 
  Radio, 
  ShieldCheck, 
  LogIn,
  KeyRound,
  HelpCircle
} from 'lucide-react';
import type { RoleType, AuthResponse } from './types';
import { ApiClient } from '../../services/api';
import { sfx } from '../../lib/sound';

interface LoginFormProps {
  role: RoleType;
  onBackToRoles: () => void;
  onSuccess: (data: AuthResponse) => void;
  onOpenForgot: () => void;
  onOpenNDRFRegister?: () => void;
}

export default function LoginForm({
  role,
  onBackToRoles,
  onSuccess,
  onOpenForgot,
  onOpenNDRFRegister,
}: LoginFormProps) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const val = emailOrUsername.trim();

    if (!val) {
      errors.emailOrUsername = 'Official Email or Username is required';
    } else if (val.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        errors.emailOrUsername = 'Please enter a valid official email format';
      }
    } else if (val.length < 3) {
      errors.emailOrUsername = 'Username must be at least 3 characters';
    }

    if (!password) {
      errors.password = 'Security password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!validate()) {
      sfx.error();
      return;
    }

    setBusy(true);

    try {
      // Connect to actual backend authentication API
      const data = await ApiClient.post<AuthResponse>('/auth/login', {
        username_or_email: emailOrUsername.trim(),
        password: password,
        role: role,
      });

      // Role Enforcement: Never trust frontend role alone, verify DB claim
      if (role !== 'ADMIN' && data.role !== role) {
        throw new Error(
          `Role Clearance Mismatch: Your account is registered as '${data.role}'. You cannot access the '${role}' portal with these credentials.`
        );
      }

      // Store JWT token only (passwords are NEVER stored in localStorage)
      ApiClient.setToken(data.access_token);
      if (data.refresh_token) {
        ApiClient.setRefreshToken(data.refresh_token);
      }
      sfx.done();
      onSuccess(data);
    } catch (err: unknown) {
      sfx.error();
      setError((err as Error).message || 'Authentication failed. Please verify credentials.');
    } finally {
      setBusy(false);
    }
  };

  const handleFillDemo = () => {
    setError(null);
    setValidationErrors({});
    if (role === 'RELIEF_CENTER') {
      setEmailOrUsername('dheemant');
      setPassword('dheemant123');
    } else if (role === 'OPERATOR') {
      setEmailOrUsername('dheemant');
      setPassword('dheemant8147');
    } else if (role === 'ADMIN') {
      setEmailOrUsername('admin');
      setPassword('Admin@12345');
    }
  };

  const roleMeta = {
    RELIEF_CENTER: {
      title: 'NDRF / Relief Center Portal',
      badge: 'FIELD REQUISITION NODE',
      description: 'Sign in to submit frontline casualty and resource requests.',
      icon: LifeBuoy,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      bgGlow: 'bg-cyan-500/10',
      placeholder: 'dheemant or coordinator@camp.gov.in',
    },
    OPERATOR: {
      title: 'Central Logistics Command',
      badge: 'CENTRAL OPERATOR NODE',
      description: 'Sign in to review requests, allocate inventory, and compute routes.',
      icon: Radio,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      bgGlow: 'bg-amber-500/10',
      placeholder: 'dheemant or operator1@resqx.gov.in',
    },
    ADMIN: {
      title: 'System Administrator Gateway',
      badge: 'SECOPS ROOT CLEARANCE',
      description: 'Sign in to provision operator accounts and review system audit logs.',
      icon: ShieldCheck,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      bgGlow: 'bg-purple-500/10',
      placeholder: 'admin or admin@resqx.gov.in',
    },
  }[role];

  const IconComponent = roleMeta.icon;

  return (
    <div className="space-y-4">
      {/* Top Navigation Bar: Back to Role Selection */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <button
          type="button"
          onClick={onBackToRoles}
          className="text-xs font-mono text-cyan-300 hover:text-white flex items-center gap-1.5 transition-colors group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
          <span>BACK TO ROLE SELECTION</span>
        </button>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
          {roleMeta.badge}
        </span>
      </div>

      {/* Role Header Banner */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${roleMeta.bgGlow} ${roleMeta.color} border ${roleMeta.borderColor} flex items-center justify-center shrink-0`}>
          <IconComponent size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white font-mono tracking-wide">
            {roleMeta.title}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
            {roleMeta.description}
          </p>
        </div>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2 shadow-lg animate-fadeIn">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLoginSubmit} className="space-y-3" noValidate>
        {/* Email or Username */}
        <div>
          <label className="label flex items-center gap-1.5" htmlFor="auth-email">
            <Mail size={12} className="text-cyan-400" />
            <span>Official Email or Username</span>
          </label>
          <input
            id="auth-email"
            type="text"
            className={`field text-xs font-mono ${validationErrors.emailOrUsername ? 'border-rose-500 focus:border-rose-500' : ''}`}
            placeholder={roleMeta.placeholder}
            value={emailOrUsername}
            onChange={(e) => {
              setEmailOrUsername(e.target.value);
              if (validationErrors.emailOrUsername) {
                setValidationErrors((prev) => ({ ...prev, emailOrUsername: '' }));
              }
            }}
            autoComplete="username"
            required
          />
          {validationErrors.emailOrUsername && (
            <p className="text-[10px] text-rose-400 mt-1 font-mono flex items-center gap-1">
              <AlertCircle size={10} />
              <span>{validationErrors.emailOrUsername}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center">
            <label className="label flex items-center gap-1.5" htmlFor="auth-password">
              <Lock size={12} className="text-cyan-400" />
              <span>Password</span>
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-white text-[10px] font-mono flex items-center gap-1 pb-1"
            >
              {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
              <span>{showPassword ? 'HIDE' : 'SHOW'}</span>
            </button>
          </div>
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            className={`field text-xs font-mono ${validationErrors.password ? 'border-rose-500 focus:border-rose-500' : ''}`}
            placeholder="Security password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: '' }));
              }
            }}
            autoComplete="current-password"
            required
          />
          {validationErrors.password && (
            <p className="text-[10px] text-rose-400 mt-1 font-mono flex items-center gap-1">
              <AlertCircle size={10} />
              <span>{validationErrors.password}</span>
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <button
            type="button"
            onClick={onOpenForgot}
            className="text-slate-400 hover:text-amber-300 font-mono transition-colors flex items-center gap-1"
          >
            <HelpCircle size={11} />
            <span>Forgot password?</span>
          </button>

          {role === 'RELIEF_CENTER' && onOpenNDRFRegister && (
            <button
              type="button"
              onClick={onOpenNDRFRegister}
              className="text-cyan-300 hover:text-white font-mono transition-colors"
            >
              Register New Camp
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={busy}
          className="btn btn-amber w-full !py-2.5 font-mono text-xs !tracking-[0.12em] flex items-center justify-center gap-2 mt-3 shadow-[0_0_25px_rgba(249,115,22,0.35)]"
        >
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin text-white" />
              <span>AUTHENTICATING CREDENTIALS...</span>
            </>
          ) : (
            <>
              <LogIn size={14} />
              <span>SIGN IN TO {role === 'RELIEF_CENTER' ? 'RELIEF PORTAL' : role === 'OPERATOR' ? 'CENTRAL COMMAND' : 'SECOPS'}</span>
            </>
          )}
        </button>
      </form>

      {/* Demo Quick-Fill Helper for Viva / Evaluation */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <button
          type="button"
          onClick={handleFillDemo}
          className="text-amber-300 hover:text-amber-200 underline decoration-amber-500/50 hover:decoration-amber-300 flex items-center gap-1 transition-colors"
        >
          <KeyRound size={11} />
          <span>
            {role === 'RELIEF_CENTER' 
              ? 'Load credentials (dheemant / dheemant123)' 
              : role === 'OPERATOR' 
              ? 'Load credentials (dheemant / dheemant8147)' 
              : 'Load demo: admin / Admin@12345'}
          </span>
        </button>

        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>API :8000</span>
        </span>
      </div>
    </div>
  );
}
