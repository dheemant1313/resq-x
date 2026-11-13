import { useState } from 'react';
import { 
  Building2, 
  User, 
  Save, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import type { ReliefCenterProfile } from './types';

interface NDRFProfileViewProps {
  profile: ReliefCenterProfile | null;
  onProfileUpdated: (updated: ReliefCenterProfile) => void;
}

export default function NDRFProfileView({ profile, onProfileUpdated }: NDRFProfileViewProps) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    contact_person: profile?.contact_person || '',
    contact_phone: profile?.contact_phone || '',
    location_name: profile?.location_name || '',
    affected_population: profile?.affected_population || 0,
    severity_level: profile?.severity_level || 'HIGH',
    status: profile?.status || 'ACTIVE'
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await ApiClient.request<ReliefCenterProfile>('/relief-centers/me', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setSuccess('Relief Center profile and operational parameters saved successfully.');
      onProfileUpdated(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile updates';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emergency-orange" />
            <h1 className="text-xl font-black font-mono text-white tracking-wide">
              RELIEF CENTER REGISTRATION & PROFILE
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Government credentials, geographic station, and command authority contact registry
          </p>
        </div>

        <span className="px-3 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
          {profile?.status || 'ACTIVE'}
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 size={15} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity & Registry */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4">
            <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Building2 size={15} className="text-emergency-orange" />
              <span>Center Identity</span>
            </h2>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Center Station Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Unique Center Identifier Code</label>
                <input
                  type="text"
                  disabled
                  value={profile?.code || 'RC-ALPHA'}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-cyan-300 font-bold cursor-not-allowed opacity-80"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Permanent identifier assigned by Disaster Management Authority</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned Geographic Sector / Location</label>
                <input
                  type="text"
                  value={formData.location_name}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 block">Latitude:</span>
                  <span className="text-white font-bold">{profile?.latitude.toFixed(4) || '19.1663'}° N</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Longitude:</span>
                  <span className="text-white font-bold">{profile?.longitude.toFixed(4) || '72.8526'}° E</span>
                </div>
              </div>
            </div>
          </div>

          {/* Field Command Contact */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4">
            <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <User size={15} className="text-cyan-400" />
              <span>Authorized Field Personnel</span>
            </h2>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Lead Field Coordinator</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g. Commander Rajesh Varma"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Direct Operational Hotline Phone</label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+91-9876543210"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Current Sector Affected Population</label>
                <input
                  type="number"
                  min="0"
                  value={formData.affected_population}
                  onChange={(e) => setFormData({ ...formData, affected_population: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white font-bold text-amber-300"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Active Crisis Severity Assessment</label>
                <select
                  value={formData.severity_level}
                  onChange={(e) => setFormData({ ...formData, severity_level: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL (Direct Threat to Life)</option>
                  <option value="HIGH">HIGH (Severe Flood/Structural Damage)</option>
                  <option value="MEDIUM">MEDIUM (Moderate Scarcity)</option>
                  <option value="LOW">LOW (Monitoring & Standby)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-amber text-xs font-mono !py-2.5 !px-6 flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          >
            <Save size={14} />
            <span>{saving ? 'SAVING PROFILE...' : 'SAVE REGISTRATION PARAMETERS'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
