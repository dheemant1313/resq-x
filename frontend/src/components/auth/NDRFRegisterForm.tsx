import { useState, type FormEvent } from 'react';
import { 
  Building2, 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  LifeBuoy 
} from 'lucide-react';
import { ApiClient } from '../../services/api';
import { sfx } from '../../lib/sound';

interface NDRFRegisterFormProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

export default function NDRFRegisterForm({ onBackToLogin, onSuccess }: NDRFRegisterFormProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [centerId, setCenterId] = useState<number>(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Official coordinator email is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid official email address';
    }

    if (!username.trim()) {
      errors.username = 'Coordinator username is required';
    } else if (username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!centerId || centerId < 1) {
      errors.centerId = 'Valid Relief Center ID is required';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!validate()) {
      sfx.error();
      return;
    }

    setBusy(true);
    try {
      await ApiClient.post('/auth/register-relief-center', {
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password: password,
        role: 'RELIEF_CENTER',
        center_id: Number(centerId),
      });

      sfx.done();
      onSuccess();
    } catch (err: unknown) {
      sfx.error();
      setError((err as Error).message || 'Relief Center registration failed. Check inputs.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Back Navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-xs font-mono text-cyan-300 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>BACK TO SIGN IN</span>
        </button>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
          FIELD REGISTRATION
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
          <LifeBuoy size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white font-mono tracking-wide">
            NDRF Relief Camp Registration
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Register an authorized frontline camp to submit resource requisitions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Email */}
        <div>
          <label className="label flex items-center gap-1.5" htmlFor="reg-email">
            <Mail size={12} className="text-cyan-400" />
            <span>Official Email</span>
          </label>
          <input
            id="reg-email"
            type="email"
            className={`field text-xs font-mono ${validationErrors.email ? 'border-rose-500 focus:border-rose-500' : ''}`}
            placeholder="coordinator@ndrf-camp.gov.in"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: '' }));
            }}
            required
          />
          {validationErrors.email && (
            <p className="text-[10px] text-rose-400 mt-1 font-mono">{validationErrors.email}</p>
          )}
        </div>

        {/* Username & Center ID in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label flex items-center gap-1.5" htmlFor="reg-user">
              <User size={12} className="text-cyan-400" />
              <span>Username</span>
            </label>
            <input
              id="reg-user"
              type="text"
              className={`field text-xs font-mono ${validationErrors.username ? 'border-rose-500' : ''}`}
              placeholder="coord_bravo"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (validationErrors.username) setValidationErrors((prev) => ({ ...prev, username: '' }));
              }}
              required
            />
            {validationErrors.username && (
              <p className="text-[10px] text-rose-400 mt-1 font-mono">{validationErrors.username}</p>
            )}
          </div>

          <div>
            <label className="label flex items-center gap-1.5" htmlFor="reg-cid">
              <Building2 size={12} className="text-cyan-400" />
              <span>Center ID</span>
            </label>
            <input
              id="reg-cid"
              type="number"
              min="1"
              max="999"
              className={`field text-xs font-mono ${validationErrors.centerId ? 'border-rose-500' : ''}`}
              value={centerId}
              onChange={(e) => {
                setCenterId(parseInt(e.target.value, 10) || 1);
                if (validationErrors.centerId) setValidationErrors((prev) => ({ ...prev, centerId: '' }));
              }}
              required
            />
            {validationErrors.centerId && (
              <p className="text-[10px] text-rose-400 mt-1 font-mono">{validationErrors.centerId}</p>
            )}
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center">
            <label className="label flex items-center gap-1.5" htmlFor="reg-pw">
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
            id="reg-pw"
            type={showPassword ? 'text' : 'password'}
            className={`field text-xs font-mono ${validationErrors.password ? 'border-rose-500' : ''}`}
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: '' }));
            }}
            required
          />
          {validationErrors.password && (
            <p className="text-[10px] text-rose-400 mt-1 font-mono">{validationErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label flex items-center gap-1.5" htmlFor="reg-pw2">
            <Lock size={12} className="text-cyan-400" />
            <span>Confirm Password</span>
          </label>
          <input
            id="reg-pw2"
            type={showPassword ? 'text' : 'password'}
            className={`field text-xs font-mono ${validationErrors.confirmPassword ? 'border-rose-500' : ''}`}
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (validationErrors.confirmPassword) setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }}
            required
          />
          {validationErrors.confirmPassword && (
            <p className="text-[10px] text-rose-400 mt-1 font-mono">{validationErrors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn btn-amber w-full !py-2.5 font-mono text-xs !tracking-[0.12em] flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
        >
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>PROVISIONING CAMP...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              <span>CREATE RELIEF CAMP ACCOUNT</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
