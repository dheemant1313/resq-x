import { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  ShieldCheck
} from 'lucide-react';
import type { AllocationLogRecord } from './types';

interface OperatorAuditLogViewProps {
  auditLogs: AllocationLogRecord[];
  onRefresh: () => void;
  onRequestSelect?: (requestId: number) => void;
}

export default function OperatorAuditLogView({
  auditLogs,
  onRefresh,
  onRequestSelect,
}: OperatorAuditLogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchReq = (log.request_number || `REQ-${log.request_id}`).toLowerCase().includes(term);
        const matchCenter = (log.center_name || '').toLowerCase().includes(term);
        const matchResource = (log.resource_name || '').toLowerCase().includes(term) || (log.resource_sku || '').toLowerCase().includes(term);
        const matchNotes = (log.notes || '').toLowerCase().includes(term);
        const matchOp = (log.operator_username || '').toLowerCase().includes(term);
        if (!matchReq && !matchCenter && !matchResource && !matchNotes && !matchOp) return false;
      }

      if (actionFilter !== 'ALL' && log.action_type !== actionFilter) {
        return false;
      }

      return true;
    });
  }, [auditLogs, searchTerm, actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ALLOCATION':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'DISPATCH':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'REJECT_RELEASE':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'DEALLOCATION':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* ----------------- SEARCH & ACTION FILTER BAR ----------------- */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search audit trail by Request #, Relief Center, Resource SKU, or Operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emergency-orange/70 text-slate-100 placeholder-slate-500 text-xs focus:outline-none transition-colors font-mono"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emergency-orange/60 font-mono"
          >
            <option value="ALL">All Actions ({auditLogs.length})</option>
            <option value="ALLOCATION">ALLOCATION</option>
            <option value="DISPATCH">DISPATCH</option>
            <option value="REJECT_RELEASE">REJECT RELEASE</option>
            <option value="DEALLOCATION">DEALLOCATION</option>
          </select>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RefreshCw size={14} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* ----------------- AUDIT LOGS LEDGER TABLE ----------------- */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Immutable Allocation Audit Trail
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-slate-700">
              {filteredLogs.length} Records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 uppercase font-mono text-[10px] text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Requisition #</th>
                <th className="px-4 py-3">Relief Center</th>
                <th className="px-4 py-3">Allocated Resource</th>
                <th className="px-4 py-3 text-center">Allocated Qty</th>
                <th className="px-4 py-3 text-center">Stock Transition</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Remarks / Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <FileText size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No Audit Trail Records</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Resource allocations, status changes, and stock releases are logged here permanently.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getActionBadge(log.action_type)}`}>
                        {log.action_type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                      {log.request_number ? (
                        <button
                          onClick={() => onRequestSelect && onRequestSelect(log.request_id)}
                          className="text-emergency-orange hover:underline flex items-center gap-1"
                        >
                          <span>{log.request_number}</span>
                        </button>
                      ) : (
                        `REQ #${log.request_id}`
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-200">
                        {log.center_name || `Center #${log.center_id}`}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-100">
                        {log.resource_name || `Item #${log.resource_id}`}
                      </div>
                      {log.resource_sku && (
                        <div className="text-[10px] font-mono text-emergency-orange">
                          {log.resource_sku}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono font-bold text-cyan-300">
                      {log.allocated_qty.toLocaleString()}
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      <span>{log.previous_stock.toLocaleString()}</span>
                      <span className="text-slate-500 mx-1.5">→</span>
                      <span className="text-emerald-400 font-bold">{log.remaining_stock.toLocaleString()}</span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                      {log.operator_username || `Operator #${log.operator_id}`}
                    </td>

                    <td className="px-4 py-3.5 text-slate-400 italic text-[11px] max-w-xs truncate">
                      {log.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
