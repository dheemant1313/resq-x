import { 
  Building2, 
  Inbox, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Boxes, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import type { OperatorKPIs, RequisitionRecord, LowStockAlert } from './types';

interface OperatorOverviewViewProps {
  kpis: OperatorKPIs;
  requisitions: RequisitionRecord[];
  lowStockAlerts: LowStockAlert[];
  onNavigateTab: (tab: 'requests' | 'inventory' | 'audit_log') => void;
  onSelectRequisition: (req: RequisitionRecord) => void;
  onRefresh: () => void;
}

export default function OperatorOverviewView({
  kpis,
  requisitions,
  lowStockAlerts,
  onNavigateTab,
  onSelectRequisition,
}: OperatorOverviewViewProps) {
  // Urgent triage queue: requests that are PENDING or UNDER_REVIEW, sorted by CRITICAL severity / urgency first
  const triageQueue = requisitions
    .filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW')
    .sort((a, b) => {
      const urgencyRank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (urgencyRank[b.urgency_level] || 0) - (urgencyRank[a.urgency_level] || 0);
    })
    .slice(0, 5);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* ----------------- LOW STOCK BANNER ALERT (IF APPLICABLE) ----------------- */}
      {lowStockAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-slate-900 border border-red-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle size={20} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-red-400 font-bold">
                  Critical Inventory Notice
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  {lowStockAlerts.length} SKU{lowStockAlerts.length !== 1 ? 's' : ''} at/below buffer
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Central Warehouse buffer threshold breached. Restock shipments required immediately.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shrink-0"
          >
            <span>Review Warehouse Stock</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ----------------- 7 COMMAND STAT METRIC CARDS ----------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Total Relief Centers */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Relief Centers
            </span>
            <Building2 size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {kpis.total_centers ?? 0}
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Authorized Zones</p>
        </div>

        {/* Incoming Requests */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Incoming Reqs
            </span>
            <Inbox size={16} className="text-emergency-orange group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black font-mono text-emergency-orange">
            {kpis.incoming_requests ?? kpis.total_requests}
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Total Transmitted</p>
        </div>

        {/* Pending Requests */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400">
              Pending Triage
            </span>
            <Clock size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {kpis.pending_requests}
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Needs Allocation</p>
        </div>

        {/* Approved Requests */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">
              Approved
            </span>
            <CheckCircle2 size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {kpis.approved_requests}
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">100% Reserved</p>
        </div>

        {/* Partially Approved */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-orange-500/20 hover:border-orange-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-orange-400">
              Partial Reqs
            </span>
            <Layers size={16} className="text-orange-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black font-mono text-orange-400">
            {kpis.partially_approved_requests}
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Split Allocation</p>
        </div>

        {/* Available Inventory */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-md group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400">
              Available Stock
            </span>
            <Boxes size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-300">
            {(kpis.available_inventory ?? 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Central Warehouse</p>
        </div>

        {/* Dispatched Resources */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-teal-500/20 hover:border-teal-500/40 transition-all shadow-md group col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-teal-400">
              Dispatched
            </span>
            <Truck size={16} className="text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black font-mono text-teal-300">
            {kpis.dispatched_resources.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Units En Route</p>
        </div>
      </div>

      {/* ----------------- TWO COLUMN MAIN DECK ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Urgent Requisitions Triage Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                    Urgent Requisitions Triage Queue
                  </h3>
                  <p className="text-xs text-slate-400">
                    Highest priority incoming requests awaiting Operator review & resource allocation
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('requests')}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
              >
                <span>View All ({requisitions.length})</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            {triageQueue.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                <p className="text-sm font-medium text-slate-300">Triage Queue Cleared</p>
                <p className="text-xs text-slate-500 mt-1">
                  No requisitions currently pending allocation. All incoming needs have been triaged.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {triageQueue.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequisition(req)}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emergency-orange/50 transition-all cursor-pointer group hover:shadow-[0_0_15px_rgba(249,115,22,0.12)]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white group-hover:text-emergency-orange transition-colors">
                          {req.request_number}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${getUrgencyBadge(req.urgency_level)}`}>
                          {req.urgency_level}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {req.disaster_type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 border-y border-slate-800/60 my-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-500 block">Relief Center</span>
                        <span className="font-medium text-slate-200 truncate block">
                          {req.center_name || `Center #${req.center_id}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-500 block">Affected Population</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {req.affected_count.toLocaleString()} victims
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-500 block">Resource Lines</span>
                        <span className="font-mono text-slate-200">
                          {req.items?.length || 0} categories requested
                        </span>
                      </div>
                      <div className="flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRequisition(req);
                          }}
                          className="px-3 py-1 rounded bg-emergency-orange hover:bg-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition-transform group-hover:scale-105"
                        >
                          <span>Review & Allocate</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>

                    {req.special_instructions && (
                      <p className="text-xs text-slate-400 italic truncate">
                        "{req.special_instructions}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Warehouse Stock & Operational Status (1 col) */}
        <div className="space-y-4">
          {/* Warehouse Capacity Overview */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Boxes size={18} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                  Depot Inventory Status
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('inventory')}
                className="text-xs text-emergency-orange hover:underline font-mono"
              >
                Manage Stock
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-mono">Stock Utilization</span>
                  <span className="text-white font-mono font-bold">
                    {kpis.total_inventory && kpis.total_inventory > 0
                      ? `${Math.round(((kpis.total_inventory - (kpis.available_inventory || 0)) / kpis.total_inventory) * 100)}% Reserved / Deployed`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emergency-orange rounded-full transition-all duration-500"
                    style={{ 
                      width: kpis.total_inventory && kpis.total_inventory > 0
                        ? `${Math.min(100, Math.round(((kpis.total_inventory - (kpis.available_inventory || 0)) / kpis.total_inventory) * 100))}%`
                        : '0%' 
                    }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Total Warehouse Stock:</span>
                  <span className="font-mono text-white font-bold">
                    {(kpis.total_inventory ?? 0).toLocaleString()} units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Immediately Available:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {(kpis.available_inventory ?? 0).toLocaleString()} units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Low-Stock SKUs:</span>
                  <span className={`font-mono font-bold ${lowStockAlerts.length > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                    {lowStockAlerts.length} item{lowStockAlerts.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigateTab('inventory')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <TrendingUp size={14} className="text-emergency-orange" />
                  <span>Open Warehouse Logistics Panel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Command Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
            <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 mb-3">
              Standard Operating Protocols
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Full Allocation:</strong> Deducts stock and sets request status to <span className="font-mono text-emerald-400">APPROVED</span>.
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-start gap-2">
                <Clock size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Partial Allocation:</strong> Reserves approved units and preserves deficit as <span className="font-mono text-amber-400">PARTIALLY_APPROVED</span>.
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 flex items-start gap-2">
                <ShieldAlert size={14} className="text-rose-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Rejection:</strong> Strictly requires operator justification remarks before setting status to <span className="font-mono text-rose-400">REJECTED</span>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
