import { useState, useMemo } from 'react';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  Check, 
  X, 
  ArrowRight,
  RefreshCw,
  PackageCheck,
  FileText,
  SlidersHorizontal
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import type { 
  RequisitionRecord, 
  ResourceItem, 
  RequestStatus, 
  AllocationActionPayload 
} from './types';

interface OperatorRequestsViewProps {
  requisitions: RequisitionRecord[];
  inventory: ResourceItem[];
  selectedRequest: RequisitionRecord | null;
  onSelectRequest: (req: RequisitionRecord | null) => void;
  onRefresh: () => void;
}

export default function OperatorRequestsView({
  requisitions,
  inventory,
  selectedRequest,
  onSelectRequest,
  onRefresh,
}: OperatorRequestsViewProps) {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [disasterFilter, setDisasterFilter] = useState<string>('ALL');
  const [centerFilter, setCenterFilter] = useState<string>('ALL');

  // Allocation Modal State
  const [allocations, setAllocations] = useState<Record<number, number>>({});
  const [operatorNotes, setOperatorNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirmRejectModal, setConfirmRejectModal] = useState(false);

  // When a request is selected, initialize the allocation quantities
  const handleOpenTriage = (req: RequisitionRecord) => {
    onSelectRequest(req);
    setActionError(null);
    setActionSuccess(null);
    setOperatorNotes(req.operator_notes || '');

    // Map item_id to current approved_qty or default to requested_qty if available
    const initialMap: Record<number, number> = {};
    req.items.forEach(item => {
      // Find inventory stock to match available
      const stock = inventory.find(inv => inv.id === item.resource_id);
      const available = stock ? stock.available_stock : 0;
      if (item.approved_qty > 0) {
        initialMap[item.id] = item.approved_qty;
      } else {
        // Preset with max possible without exceeding requested or stock
        initialMap[item.id] = Math.min(item.requested_qty, available);
      }
    });
    setAllocations(initialMap);
  };

  // Close Triage Modal
  const handleCloseTriage = () => {
    onSelectRequest(null);
    setAllocations({});
    setOperatorNotes('');
    setActionError(null);
    setActionSuccess(null);
    setConfirmRejectModal(false);
  };

  // Extract unique centers and disaster types for dropdowns
  const uniqueCenters = useMemo(() => {
    const map = new Map<number, string>();
    requisitions.forEach(r => {
      if (r.center_id) {
        map.set(r.center_id, r.center_name || `Center #${r.center_id}`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [requisitions]);

  const uniqueDisasters = useMemo(() => {
    const set = new Set<string>();
    requisitions.forEach(r => {
      if (r.disaster_type) set.add(r.disaster_type);
    });
    return Array.from(set);
  }, [requisitions]);

  // Filtered requisitions
  const filteredRequests = useMemo(() => {
    return requisitions.filter(req => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchNumber = req.request_number.toLowerCase().includes(term);
        const matchCenter = (req.center_name || '').toLowerCase().includes(term);
        const matchLoc = (req.affected_location || '').toLowerCase().includes(term);
        if (!matchNumber && !matchCenter && !matchLoc) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;

      // Severity
      if (severityFilter !== 'ALL' && req.disaster_severity !== severityFilter) return false;

      // Disaster Type
      if (disasterFilter !== 'ALL' && req.disaster_type !== disasterFilter) return false;

      // Center
      if (centerFilter !== 'ALL' && req.center_id !== Number(centerFilter)) return false;

      return true;
    });
  }, [requisitions, searchTerm, statusFilter, severityFilter, disasterFilter, centerFilter]);

  // Allocation change handler
  const handleQtyChange = (itemId: number, maxAllowed: number, valueStr: string) => {
    const val = parseInt(valueStr) || 0;
    const clamped = Math.max(0, Math.min(val, maxAllowed));
    setAllocations(prev => ({
      ...prev,
      [itemId]: clamped
    }));
  };

  // Preset: 100% full allocation
  const handlePresetFull = () => {
    if (!selectedRequest) return;
    const map: Record<number, number> = {};
    selectedRequest.items.forEach(item => {
      const stock = inventory.find(inv => inv.id === item.resource_id);
      const available = stock ? stock.available_stock : 0;
      map[item.id] = Math.min(item.requested_qty, available);
    });
    setAllocations(map);
  };

  // Preset: Reset all to 0
  const handlePresetReset = () => {
    if (!selectedRequest) return;
    const map: Record<number, number> = {};
    selectedRequest.items.forEach(item => {
      map[item.id] = 0;
    });
    setAllocations(map);
  };

  // Execute Allocation / Status Transition Action
  const executeAllocationAction = async (targetStatus: RequestStatus, notesOverride?: string) => {
    if (!selectedRequest) return;
    setActionError(null);
    setActionSuccess(null);
    setSubmittingAction(true);

    try {
      const notes = notesOverride !== undefined ? notesOverride : operatorNotes;

      // Validation for rejection
      if (targetStatus === 'REJECTED' && (!notes || notes.trim() === '')) {
        setActionError('Operator justification reason is mandatory when rejecting a requisition.');
        setSubmittingAction(false);
        return;
      }

      const payload: AllocationActionPayload = {
        action: targetStatus,
        allocations: selectedRequest.items.map(item => ({
          request_item_id: item.id,
          approved_qty: allocations[item.id] ?? item.approved_qty ?? 0
        })),
        operator_notes: notes.trim() || undefined
      };

      const res = await ApiClient.post<RequisitionRecord>(
        `/requests/${selectedRequest.id}/allocate`,
        payload
      );

      setActionSuccess(`Requisition updated to status ${targetStatus}.`);
      onRefresh();
      // Keep modal open with updated record for verification
      onSelectRequest(res);
      setConfirmRejectModal(false);
    } catch (err: any) {
      console.error('Allocation error:', err);
      setActionError(err.message || 'Failed to process allocation transaction.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Status Badge Class
  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'UNDER_REVIEW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'PARTIALLY_APPROVED':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DISPATCHED':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'COMPLETED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* ----------------- SEARCH & MULTI-FILTER BAR ----------------- */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Request ID, Relief Center, or Affected Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emergency-orange/70 text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Refresh requisitions"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          {/* Status Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emergency-orange/60"
            >
              <option value="ALL">All Statuses ({requisitions.length})</option>
              <option value="PENDING">PENDING</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="PARTIALLY_APPROVED">PARTIALLY APPROVED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Relief Center Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
              Relief Center
            </label>
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emergency-orange/60 truncate"
            >
              <option value="ALL">All Centers ({uniqueCenters.length})</option>
              {uniqueCenters.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
              Disaster Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emergency-orange/60"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Disaster Type Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
              Disaster Type
            </label>
            <select
              value={disasterFilter}
              onChange={(e) => setDisasterFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emergency-orange/60"
            >
              <option value="ALL">All Disasters</option>
              {uniqueDisasters.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ----------------- REQUISITIONS TABLE ----------------- */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Requisitions Directory
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono border border-slate-700">
              Showing {filteredRequests.length} of {requisitions.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 uppercase font-mono text-[10px] text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">Request Number</th>
                <th className="px-4 py-3">Relief Center</th>
                <th className="px-4 py-3">Urgency & Severity</th>
                <th className="px-4 py-3">Affected Victims</th>
                <th className="px-4 py-3">Resource Lines</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Transmitted</th>
                <th className="px-4 py-3 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No Matching Requisitions Found</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Adjust your search query or clear the active filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => handleOpenTriage(req)}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-white group-hover:text-emergency-orange transition-colors">
                      {req.request_number}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">
                        {req.center_name || `Relief Center #${req.center_id}`}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {req.affected_location || 'Designated Relief Camp'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                          req.urgency_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40 font-bold' :
                          req.urgency_level === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {req.urgency_level}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {req.disaster_severity}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-cyan-300 font-bold">
                      {req.affected_count.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-300">
                      {req.items?.length || 0} line item{req.items?.length !== 1 ? 's' : ''}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase font-mono px-2.5 py-1 rounded border inline-block ${getStatusBadge(req.status)}`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <div className="text-[10px] text-slate-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTriage(req);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emergency-orange hover:bg-orange-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 transition-transform group-hover:scale-105 shadow"
                      >
                        <span>Triage & Allocate</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ----------------- TRIAGE & ALLOCATION MODAL ------------------ */}
      {/* ============================================================== */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div 
            className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emergency-orange/20 border border-emergency-orange/40 flex items-center justify-center text-emergency-orange">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-white">
                      {selectedRequest.request_number}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${getStatusBadge(selectedRequest.status)}`}>
                      {selectedRequest.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{selectedRequest.center_name || `Center #${selectedRequest.center_id}`}</span>
                    <span>•</span>
                    <span className="font-mono text-emergency-orange">{selectedRequest.urgency_level} Priority</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseTriage}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Feedback messages */}
              {actionError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-mono">{actionError}</div>
                </div>
              )}
              {actionSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-mono">{actionSuccess}</div>
                </div>
              )}

              {/* Demographics Overview Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Affected</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">
                    {selectedRequest.affected_count.toLocaleString()} victims
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Family Count</span>
                  <span className="font-mono text-slate-200 text-sm">
                    {(selectedRequest.num_families || 0).toLocaleString()} families
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Children & Elderly</span>
                  <span className="font-mono text-amber-300 text-sm">
                    {(selectedRequest.children_elderly_count || 0).toLocaleString()} persons
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Medical Attention</span>
                  <span className="font-mono text-red-400 text-sm">
                    {(selectedRequest.medical_assistance_count || 0).toLocaleString()} critical
                  </span>
                </div>

                {selectedRequest.special_instructions && (
                  <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">
                      Frontline Field Notes
                    </span>
                    <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      "{selectedRequest.special_instructions}"
                    </p>
                  </div>
                )}
              </div>

              {/* ----------------- SIDE-BY-SIDE RESOURCE ALLOCATION MATRIX ----------------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-white flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-emergency-orange" />
                    <span>Resource Allocation Matrix (Requested vs Available Depot Stock)</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePresetFull}
                      type="button"
                      className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono transition-colors"
                    >
                      Fill 100% Available
                    </button>
                    <button
                      onClick={handlePresetReset}
                      type="button"
                      className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 font-mono transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 uppercase font-mono text-[10px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-3.5 py-2.5">Resource Line & Depot Location</th>
                        <th className="px-3.5 py-2.5 text-center">Requested</th>
                        <th className="px-3.5 py-2.5 text-center">Depot Stock</th>
                        <th className="px-3.5 py-2.5 text-center">Allocated Qty</th>
                        <th className="px-3.5 py-2.5 text-center">Unmet Deficit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-sans">
                      {selectedRequest.items.map((item) => {
                        const stock = inventory.find(inv => inv.id === item.resource_id);
                        const available = stock ? stock.available_stock : 0;
                        const allocated = allocations[item.id] ?? 0;
                        const deficit = Math.max(0, item.requested_qty - allocated);
                        const hasInsufficientStock = item.requested_qty > available;

                        return (
                          <tr key={item.id} className="hover:bg-slate-900/40">
                            {/* Resource Details */}
                            <td className="px-3.5 py-3">
                              <div className="font-bold text-white">
                                {item.resource?.name || stock?.name || `Resource SKU #${item.resource_id}`}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                <span className="text-emergency-orange">{item.resource?.sku || stock?.sku}</span>
                                <span>•</span>
                                <span className="text-cyan-400">{stock?.storage_location || 'Central Warehouse'}</span>
                              </div>
                            </td>

                            {/* Requested Qty */}
                            <td className="px-3.5 py-3 text-center font-mono text-white font-bold">
                              {item.requested_qty.toLocaleString()} {item.resource?.unit || stock?.unit || 'units'}
                            </td>

                            {/* Depot Available Stock */}
                            <td className="px-3.5 py-3 text-center font-mono">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                hasInsufficientStock
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                  : 'text-emerald-400'
                              }`}>
                                {available.toLocaleString()} {stock?.unit || ''}
                              </span>
                              {hasInsufficientStock && (
                                <div className="text-[9px] text-red-400 font-mono mt-0.5">
                                  Deficit Risk
                                </div>
                              )}
                            </td>

                            {/* Stepper Allocation Input */}
                            <td className="px-3.5 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={available}
                                  value={allocated}
                                  onChange={(e) => handleQtyChange(item.id, available, e.target.value)}
                                  className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-center font-mono text-sm font-bold text-white focus:outline-none focus:border-emergency-orange"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(item.id, available, String(Math.min(item.requested_qty, available)))}
                                  className="text-[10px] px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                                  title="Match requested up to stock"
                                >
                                  Max
                                </button>
                              </div>
                            </td>

                            {/* Unmet Deficit */}
                            <td className="px-3.5 py-3 text-center font-mono">
                              <span className={`font-bold ${deficit > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                                {deficit > 0 ? `-${deficit.toLocaleString()}` : '0 (Fulfilled)'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Operator Notes Input */}
              <div>
                <label className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 block mb-1">
                  Operator Triage Notes & Review Justification
                </label>
                <textarea
                  rows={3}
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="Record mandatory operational justification for rejection, or logistical instructions for convoy dispatch..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-emergency-orange/70 font-mono"
                />
              </div>
            </div>

            {/* Modal Action Buttons Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseTriage}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors font-medium"
                >
                  Close Window
                </button>
              </div>

              {/* State Machine Permitted Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Mark Under Review */}
                {selectedRequest.status === 'PENDING' && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => executeAllocationAction('UNDER_REVIEW')}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Clock size={14} />
                    <span>Mark Under Review</span>
                  </button>
                )}

                {/* 2. Partial Allocation */}
                {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'UNDER_REVIEW' || selectedRequest.status === 'PARTIALLY_APPROVED') && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => executeAllocationAction('PARTIALLY_APPROVED')}
                    className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Layers size={14} />
                    <span>Commit Partial Allocation</span>
                  </button>
                )}

                {/* 3. Full 100% Approval */}
                {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'UNDER_REVIEW' || selectedRequest.status === 'PARTIALLY_APPROVED') && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => executeAllocationAction('APPROVED')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-950/40"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve Full Allocation</span>
                  </button>
                )}

                {/* 4. Dispatch Supplies */}
                {(selectedRequest.status === 'APPROVED' || selectedRequest.status === 'PARTIALLY_APPROVED') && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => executeAllocationAction('DISPATCHED')}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-lg shadow-cyan-950/40"
                  >
                    <Truck size={14} />
                    <span>Dispatch Logistics Convoy</span>
                  </button>
                )}

                {/* 5. Complete Delivery */}
                {selectedRequest.status === 'DISPATCHED' && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => executeAllocationAction('COMPLETED')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Check size={14} />
                    <span>Confirm Completed Delivery</span>
                  </button>
                )}

                {/* 6. Reject Requisition */}
                {selectedRequest.status !== 'COMPLETED' && selectedRequest.status !== 'REJECTED' && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => setConfirmRejectModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    <span>Reject Requisition</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- CONFIRM REJECTION MODAL ----------------- */}
      {confirmRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-600/50 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase font-mono text-white">
                  Confirm Requisition Rejection
                </h3>
                <p className="text-xs text-rose-400/90 font-mono">
                  Action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Disaster relief regulations strictly require an authorized Operator justification reason before rejecting frontline aid requests.
            </p>

            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-bold">
                Mandatory Rejection Justification
              </label>
              <textarea
                rows={3}
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="State precise reason (e.g. Duplicate request, sufficient municipal stock already delivered, inaccurate assessment)..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmRejectModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || !operatorNotes.trim()}
                onClick={() => executeAllocationAction('REJECTED', operatorNotes)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
