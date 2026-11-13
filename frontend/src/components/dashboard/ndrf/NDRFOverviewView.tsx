import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  GitFork, 
  Truck, 
  CheckCheck, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  Building2, 
  MapPin, 
  Radio
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import type { DashboardKPIs, RequisitionRecord, ReliefCenterProfile } from './types';

interface NDRFOverviewViewProps {
  onNavigateTab: (tab: 'new_request' | 'tracking' | 'profile') => void;
  centerProfile: ReliefCenterProfile | null;
}

export default function NDRFOverviewView({ onNavigateTab, centerProfile }: NDRFOverviewViewProps) {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentRequests, setRecentRequests] = useState<RequisitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [statsData, reqsData] = await Promise.all([
        ApiClient.get<DashboardKPIs>('/requests/stats'),
        ApiClient.get<RequisitionRecord[]>('/requests/?limit=5')
      ]);
      setKpis(statsData);
      setRecentRequests(reqsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load live dashboard metrics';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            PENDING
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            UNDER REVIEW
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 size={11} className="text-emerald-400" />
            APPROVED
          </span>
        );
      case 'PARTIALLY_APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <GitFork size={11} className="text-cyan-400" />
            PARTIAL
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Truck size={11} className="text-indigo-400" />
            DISPATCHED
          </span>
        );
      case 'COMPLETED':
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <CheckCheck size={11} className="text-teal-400" />
            COMPLETED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            REJECTED
          </span>
        );
      default:
        return <span className="font-mono text-[10px] text-slate-400">{status}</span>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-700/40 text-slate-300 border border-slate-600 text-[10px] font-mono">LOW</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw size={28} className="animate-spin text-emergency-orange" />
        <p className="text-xs font-mono text-cyan-300 tracking-wider">
          SYNCHRONIZING RELIEF REQUISITIONS WITH COMMAND DATABASE...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ----------------- RELIEF CENTER PROFILE HEADER BANNER ----------------- */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-6 shadow-[0_0_40px_rgba(6,182,212,0.12)]">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-96 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.12),transparent_70%)]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emergency-orange opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emergency-orange" />
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-emergency-orange uppercase">
                Frontline Relief Command
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                OPERATIONAL // LIVE
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide font-mono flex items-center gap-2">
              <span>{centerProfile?.name || kpis?.center_name || 'NDRF Base Camp Alpha'}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {centerProfile?.code || kpis?.center_code || 'RC-ALPHA'}
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <MapPin size={13} className="text-cyan-400" />
                <span>{centerProfile?.location_name || 'Godavari Basin Lowlands'}</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Building2 size={13} className="text-amber-400" />
                <span>Population: {centerProfile?.affected_population.toLocaleString() || '12,500'}</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Radio size={13} className="text-emerald-400" />
                <span>Sector Severity: <strong>{centerProfile?.severity_level || 'CRITICAL'}</strong></span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn text-xs font-mono !py-2 !px-3 flex items-center gap-1.5 border-slate-700 hover:border-cyan-400 text-slate-300"
              title="Refresh live metrics"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
              <span>SYNC</span>
            </button>
            <button
              onClick={() => onNavigateTab('new_request')}
              className="btn btn-amber text-xs font-mono !py-2 !px-4 flex items-center gap-1.5 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            >
              <span>SUBMIT REQUISITION</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2.5">
          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ----------------- 6 LIVE DATABASE-BACKED KPI CARDS ----------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Requests */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono tracking-wider">TOTAL REQS</span>
            <ClipboardList size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {kpis?.total_requests || 0}
          </div>
          <span className="text-[10px] font-mono text-slate-500">Cumulative Filed</span>
        </div>

        {/* Pending Requests */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 hover:border-amber-400 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-mono tracking-wider">PENDING</span>
            <Clock size={16} className="text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
            {kpis?.pending_requests || 0}
          </div>
          <span className="text-[10px] font-mono text-amber-500/80">Awaiting Triage</span>
        </div>

        {/* Approved Requests */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/40 hover:border-emerald-400 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-mono tracking-wider">APPROVED</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
            {kpis?.approved_requests || 0}
          </div>
          <span className="text-[10px] font-mono text-emerald-500/80">100% Allocated</span>
        </div>

        {/* Partially Approved Requests */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/40 hover:border-cyan-400 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-[11px] font-mono tracking-wider">PARTIAL</span>
            <GitFork size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
            {kpis?.partially_approved_requests || 0}
          </div>
          <span className="text-[10px] font-mono text-cyan-500/80">Stock Rationed</span>
        </div>

        {/* Dispatched Resources */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/40 hover:border-indigo-400 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-[11px] font-mono tracking-wider">DISPATCHED</span>
            <Truck size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-300">
            {kpis?.dispatched_resources ? kpis.dispatched_resources.toLocaleString() : (kpis?.dispatched_requests || 0)}
          </div>
          <span className="text-[10px] font-mono text-indigo-400/80">Units in Transit</span>
        </div>

        {/* Completed Requests */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-teal-500/40 hover:border-teal-400 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <span className="text-[11px] font-mono tracking-wider">COMPLETED</span>
            <CheckCheck size={16} className="text-teal-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-teal-300">
            {kpis?.completed_requests || 0}
          </div>
          <span className="text-[10px] font-mono text-teal-400/80">Delivered & Closed</span>
        </div>
      </div>

      {/* ----------------- RECENT REQUISITIONS ACTIVITY TABLE ----------------- */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <ClipboardList size={16} className="text-emergency-orange" />
              <span>Active Requisition Stream</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Live updates directly synchronized with Operator Command queue
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('tracking')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>VIEW ALL</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {recentRequests.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-3">
            <ClipboardList size={32} className="text-slate-600 mx-auto" />
            <p className="text-xs font-mono text-slate-400">
              No relief requisitions filed yet for this center.
            </p>
            <button
              onClick={() => onNavigateTab('new_request')}
              className="btn btn-amber text-xs font-mono !py-1.5"
            >
              CREATE FIRST REQUISITION
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">REQUEST ID</th>
                  <th className="pb-3 font-semibold">TIMESTAMP</th>
                  <th className="pb-3 font-semibold">URGENCY</th>
                  <th className="pb-3 font-semibold">POPULATION</th>
                  <th className="pb-3 font-semibold">RESOURCES</th>
                  <th className="pb-3 font-semibold">STATUS</th>
                  <th className="pb-3 font-semibold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 font-bold text-white tracking-wider">
                      {req.request_number}
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3">
                      {getUrgencyBadge(req.urgency_level)}
                    </td>
                    <td className="py-3 text-slate-300">
                      {req.affected_count.toLocaleString()}
                    </td>
                    <td className="py-3 text-slate-300">
                      {req.items?.length || 0} items
                    </td>
                    <td className="py-3">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onNavigateTab('tracking')}
                        className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
                      >
                        Track &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ----------------- QUICK PROCEDURAL TILES ----------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-emergency-orange/15 text-emergency-orange border border-emergency-orange/30 flex items-center justify-center shrink-0">
            <Radio size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold font-mono text-white">Sphere Humanitarian Baseline</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Our automated estimation engine applies Sphere 2018 humanitarian baselines (15L/day water, 2,100 kcal rations, medical triage kits). Field coordinators retain full authority to override all recommendations.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Truck size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold font-mono text-white">Algorithmic Fleet Dispatch</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Approved relief quotas are routed through 0/1 Knapsack payload optimization and Dijkstra shortest-path algorithms in Central Command to evade floodwaters and road collapses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
