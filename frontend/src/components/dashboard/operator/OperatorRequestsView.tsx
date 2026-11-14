import { useState, useMemo } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  X, 
  ArrowRight,
  RefreshCw,
  PackageCheck,
  FileText,
  SlidersHorizontal,
  Droplets,
  Wind,
  Activity,
  Mountain,
  Waves,
  Flame,
  Boxes
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import type { 
  RequisitionRecord, 
  ResourceItem, 
  RequestStatus, 
  AllocationActionPayload,
  ReliefCenterRecord
} from './types';

interface OperatorRequestsViewProps {
  requisitions: RequisitionRecord[];
  inventory: ResourceItem[];
  reliefCenters?: ReliefCenterRecord[];
  selectedRequest: RequisitionRecord | null;
  onSelectRequest: (req: RequisitionRecord | null) => void;
  onRefresh: () => void;
}

const ALL_DISASTER_TYPES = [
  'FLOOD',
  'CYCLONE',
  'EARTHQUAKE',
  'LANDSLIDE',
  'TSUNAMI',
  'FIRE',
  'OTHER'
];

export default function OperatorRequestsView({
  requisitions,
  inventory,
  reliefCenters = [],
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
      const stock = inventory.find(inv => inv.id === item.resource_id);
      const available = stock ? stock.available_stock : 0;
      if (item.approved_qty > 0) {
        initialMap[item.id] = item.approved_qty;
      } else {
        // Preset with max possible without exceeding requested or available stock
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

  // Extract all relief centers for dropdown
  const uniqueCenters = useMemo(() => {
    const map = new Map<number, string>();
    if (reliefCenters && reliefCenters.length > 0) {
      reliefCenters.forEach(rc => map.set(rc.id, rc.name));
    }
    requisitions.forEach(r => {
      if (r.center_id && !map.has(r.center_id)) {
        map.set(r.center_id, r.center_name || `Center #${r.center_id}`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [requisitions, reliefCenters]);

  // Extract all disaster types with live requisition counts
  const disasterTypeOptions = useMemo(() => {
    return ALL_DISASTER_TYPES.map(type => {
      const count = requisitions.filter(r => (r.disaster_type || 'FLOOD').toUpperCase() === type).length;
      return { type, count };
    });
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
        const matchDisaster = (req.disaster_type || '').toLowerCase().includes(term);
        if (!matchNumber && !matchCenter && !matchLoc && !matchDisaster) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;

      // Severity
      if (severityFilter !== 'ALL' && req.disaster_severity !== severityFilter) return false;

      // Disaster Type
      if (disasterFilter !== 'ALL' && (req.disaster_type || 'FLOOD').toUpperCase() !== disasterFilter) return false;

      // Center
      if (centerFilter !== 'ALL' && req.center_id !== Number(centerFilter)) return false;

      return true;
    });
  }, [requisitions, searchTerm, statusFilter, severityFilter, disasterFilter, centerFilter]);

  // Helper for quantity changes in triage modal
  const handleQtyChange = (itemId: number, maxAvailable: number, val: string) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 0) {
      setAllocations(prev => ({ ...prev, [itemId]: 0 }));
      return;
    }
    // Cap allocation at available stock
    const capped = Math.min(parsed, maxAvailable);
    setAllocations(prev => ({ ...prev, [itemId]: capped }));
  };

  // Presets for allocation modal
  const handlePresetFullStock = () => {
    if (!selectedRequest) return;
    const map: Record<number, number> = {};
    selectedRequest.items.forEach(item => {
      const stock = inventory.find(inv => inv.id === item.resource_id);
      const available = stock ? stock.available_stock : 0;
      map[item.id] = Math.min(item.requested_qty, available);
    });
    setAllocations(map);
  };

  const handlePresetPercentDemand = (pct: number) => {
    if (!selectedRequest) return;
    const map: Record<number, number> = {};
    selectedRequest.items.forEach(item => {
      const stock = inventory.find(inv => inv.id === item.resource_id);
      const available = stock ? stock.available_stock : 0;
      const targetQty = Math.round(item.requested_qty * (pct / 100));
      map[item.id] = Math.min(targetQty, available);
    });
    setAllocations(map);
  };

  const handlePresetReset = () => {
    if (!selectedRequest) return;
    const map: Record<number, number> = {};
    selectedRequest.items.forEach(item => {
      map[item.id] = 0;
    });
    setAllocations(map);
  };

  // Overall Consignment Inventory & Feasibility Calculations
  const consignmentAnalytics = useMemo(() => {
    if (!selectedRequest) {
      return {
        totalRequested: 0,
        totalAvailable: 0,
        maxFulfillable: 0,
        totalAllocated: 0,
        overallCoveragePct: 0,
        overallAllocatedPct: 0,
        overallStockImpactPct: 0,
      };
    }

    let reqSum = 0;
    let availSum = 0;
    let fulfillableSum = 0;
    let allocSum = 0;

    selectedRequest.items.forEach(item => {
      const stock = inventory.find(inv => inv.id === item.resource_id);
      const available = stock ? stock.available_stock : 0;
      const allocated = allocations[item.id] ?? 0;

      reqSum += item.requested_qty;
      availSum += available;
      fulfillableSum += Math.min(item.requested_qty, available);
      allocSum += allocated;
    });

    const covPct = reqSum > 0 ? Math.min(100, Math.round((fulfillableSum / reqSum) * 100)) : 100;
    const allocPct = reqSum > 0 ? Math.min(100, Math.round((allocSum / reqSum) * 100)) : 0;
    const stockImpact = availSum > 0 ? Math.min(100, Math.round((allocSum / availSum) * 100)) : 0;

    return {
      totalRequested: reqSum,
      totalAvailable: availSum,
      maxFulfillable: fulfillableSum,
      totalAllocated: allocSum,
      overallCoveragePct: covPct,
      overallAllocatedPct: allocPct,
      overallStockImpactPct: stockImpact,
    };
  }, [selectedRequest, inventory, allocations]);

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

      await ApiClient.post<RequisitionRecord>(
        `/requests/${selectedRequest.id}/allocate`,
        payload
      );

      setActionSuccess(`Requisition updated to status ${targetStatus}.`);
      onRefresh();
      
      // Auto-close modal after brief delay on terminal states
      if (['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'DISPATCHED'].includes(targetStatus)) {
        setTimeout(() => {
          handleCloseTriage();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Allocation error:', err);
      setActionError(err.message || 'Failed to update requisition allocation.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Disaster Icon and Badge Styling Helper
  const getDisasterDetails = (type?: string) => {
    const norm = (type || 'FLOOD').toUpperCase();
    switch (norm) {
      case 'FLOOD':
        return {
          label: 'Flood',
          icon: Droplets,
          badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
        };
      case 'CYCLONE':
        return {
          label: 'Cyclone',
          icon: Wind,
          badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
        };
      case 'EARTHQUAKE':
        return {
          label: 'Earthquake',
          icon: Activity,
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        };
      case 'LANDSLIDE':
        return {
          label: 'Landslide',
          icon: Mountain,
          badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
        };
      case 'TSUNAMI':
        return {
          label: 'Tsunami',
          icon: Waves,
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
        };
      case 'FIRE':
        return {
          label: 'Wildfire',
          icon: Flame,
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        };
      default:
        return {
          label: norm,
          icon: AlertTriangle,
          badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* ------------------- HEADER & SEARCH TOOLBAR ------------------- */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wider flex items-center gap-3">
            <Layers className="text-emergency-orange" size={24} />
            <span>GLOBAL REQUISITION TRIAGE</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Centrally review, approve, partially fulfill, or reject logistics consignments across all registered relief centers.
          </p>
        </div>

        {/* Quick status counter pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emergency-orange animate-pulse" />
            <span>{requisitions.filter(r => r.status === 'PENDING').length} PENDING TRIAGE</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Request ID, Relief Center, Disaster Type, or Sector..."
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
              Relief Center ({uniqueCenters.length})
            </label>
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emergency-orange/60 truncate"
            >
              <option value="ALL">All Relief Centers ({uniqueCenters.length})</option>
              {uniqueCenters.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Disaster Type Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
              Disaster Type ({disasterTypeOptions.length})
            </label>
            <select
              value={disasterFilter}
              onChange={(e) => setDisasterFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emergency-orange/60"
            >
              <option value="ALL">All Disaster Types</option>
              {disasterTypeOptions.map(d => (
                <option key={d.type} value={d.type}>
                  {d.type} {d.count > 0 ? `(${d.count})` : ''}
                </option>
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
        </div>
      </div>

      {/* ============================================================== */}
      {/* ------------------ REQUISITIONS MASTER TABLE ----------------- */}
      {/* ============================================================== */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
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
                <th className="px-4 py-3">Disaster Type</th>
                <th className="px-4 py-3">Severity & Urgency</th>
                <th className="px-4 py-3">Affected Population</th>
                <th className="px-4 py-3">Resource Lines</th>
                <th className="px-4 py-3">Status</th>
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
                filteredRequests.map((req) => {
                  const disaster = getDisasterDetails(req.disaster_type);
                  const DisasterIcon = disaster.icon;

                  return (
                    <tr 
                      key={req.id} 
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => handleOpenTriage(req)}
                    >
                      {/* Request Number */}
                      <td className="px-4 py-3 font-mono font-bold text-white group-hover:text-emergency-orange transition-colors">
                        {req.request_number}
                      </td>

                      {/* Relief Center */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">
                          {req.center_name || `Relief Center #${req.center_id}`}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {req.affected_location || 'Designated Relief Camp'}
                        </div>
                      </td>

                      {/* Disaster Type Badge */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg border font-bold uppercase ${disaster.badgeClass}`}>
                          <DisasterIcon size={12} />
                          <span>{disaster.label}</span>
                        </span>
                      </td>

                      {/* Severity & Urgency */}
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

                      {/* Affected Population */}
                      <td className="px-4 py-3 font-mono">
                        <div className="text-slate-200 font-medium">
                          {req.affected_count.toLocaleString()} people
                        </div>
                        {req.num_families ? (
                          <div className="text-[10px] text-slate-500">
                            {req.num_families} families
                          </div>
                        ) : null}
                      </td>

                      {/* Resource Items Count */}
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {req.items?.length || 0} items
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                          req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' :
                          req.status === 'PARTIALLY_APPROVED' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold' :
                          req.status === 'DISPATCHED' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                          req.status === 'COMPLETED' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                          req.status === 'UNDER_REVIEW' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          req.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>

                      {/* Triage Actions */}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTriage(req);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emergency-orange/10 hover:bg-emergency-orange text-emergency-orange hover:text-slate-950 border border-emergency-orange/30 font-mono font-bold text-[11px] transition-all inline-flex items-center gap-1.5"
                        >
                          <span>TRIAGE / ALLOCATE</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ---------------- TRIAGE & ALLOCATION MODAL ------------------- */}
      {/* ============================================================== */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emergency-orange/10 border border-emergency-orange/30 flex items-center justify-center text-emergency-orange">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white font-mono">
                      TRIAGE & ALLOCATION: {selectedRequest.request_number}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span className="text-cyan-400">{selectedRequest.center_name}</span>
                    <span>•</span>
                    <span>{selectedRequest.affected_location}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloseTriage}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Error and Success Banners */}
              {actionError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <XCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
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

              {/* ============================================================== */}
              {/* --- INVENTORY ALLOCATION & FEASIBILITY CAPACITY ANALYSIS BAR --- */}
              {/* ============================================================== */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Boxes size={18} className="text-emergency-orange" />
                    <div>
                      <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-white">
                        Inventory Fulfillment Feasibility Analysis
                      </h4>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Calculates maximum fulfillable percentage based on current central depot stock.
                      </p>
                    </div>
                  </div>

                  {/* Percentage Capacity Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                      consignmentAnalytics.overallCoveragePct === 100 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : consignmentAnalytics.overallCoveragePct >= 50
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {consignmentAnalytics.overallCoveragePct}% Feasible from Stock
                    </span>
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Requested</span>
                    <span className="font-mono text-sm font-bold text-white">
                      {consignmentAnalytics.totalRequested.toLocaleString()} units
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Max In-Stock Feasible</span>
                    <span className="font-mono text-sm font-bold text-cyan-300">
                      {consignmentAnalytics.maxFulfillable.toLocaleString()} units
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ({consignmentAnalytics.overallCoveragePct}% of demand)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Operator Allocation</span>
                    <span className={`font-mono text-sm font-bold ${
                      consignmentAnalytics.overallAllocatedPct > 0 ? 'text-emergency-orange' : 'text-slate-400'
                    }`}>
                      {consignmentAnalytics.totalAllocated.toLocaleString()} units
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ({consignmentAnalytics.overallAllocatedPct}% fulfilled)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Depot Stock Impact</span>
                    <span className="font-mono text-sm font-bold text-amber-300">
                      {consignmentAnalytics.overallStockImpactPct}% consumed
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      (from {consignmentAnalytics.totalAvailable.toLocaleString()} available)
                    </span>
                  </div>
                </div>

                {/* Dual Visual Progress Meter */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Demand Fulfillment: {consignmentAnalytics.overallAllocatedPct}%</span>
                    <span>Max Feasible Ceiling: {consignmentAnalytics.overallCoveragePct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
                    <div 
                      className="h-full bg-emergency-orange rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, consignmentAnalytics.overallAllocatedPct)}%` }}
                    />
                  </div>
                </div>

                {/* Quick Presets Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal size={12} className="text-emergency-orange" />
                    <span>Quick Allocation Presets:</span>
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={handlePresetFullStock}
                      type="button"
                      className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 font-mono transition-colors"
                      title="Fulfill max possible based on inventory"
                    >
                      Fill Max Stock ({consignmentAnalytics.overallCoveragePct}%)
                    </button>
                    <button
                      onClick={() => handlePresetPercentDemand(75)}
                      type="button"
                      className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-colors"
                    >
                      75% Demand
                    </button>
                    <button
                      onClick={() => handlePresetPercentDemand(50)}
                      type="button"
                      className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-colors"
                    >
                      50% Demand
                    </button>
                    <button
                      onClick={() => handlePresetPercentDemand(25)}
                      type="button"
                      className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-colors"
                    >
                      25% Demand
                    </button>
                    <button
                      onClick={handlePresetReset}
                      type="button"
                      className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 font-mono transition-colors"
                    >
                      Clear All (0%)
                    </button>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* ---------- SIDE-BY-SIDE RESOURCE ALLOCATION MATRIX ----------- */}
              {/* ============================================================== */}
              <div className="space-y-3">
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 uppercase font-mono text-[10px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-3.5 py-2.5">Resource Line & Depot Location</th>
                        <th className="px-3 py-2.5 text-center">Requested</th>
                        <th className="px-3 py-2.5 text-center">Depot Stock & Max Feasibility</th>
                        <th className="px-3 py-2.5 text-center">Allocated Qty</th>
                        <th className="px-3 py-2.5 text-center">Allocation & Stock %</th>
                        <th className="px-3 py-2.5 text-center">Unmet Deficit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-sans">
                      {selectedRequest.items.map((item) => {
                        const stock = inventory.find(inv => inv.id === item.resource_id);
                        const available = stock ? stock.available_stock : 0;
                        const allocated = allocations[item.id] ?? 0;
                        const deficit = Math.max(0, item.requested_qty - allocated);
                        const hasInsufficientStock = item.requested_qty > available;

                        // Percentage calculations
                        const maxFeasibleCoveragePct = item.requested_qty > 0 
                          ? Math.min(100, Math.round((available / item.requested_qty) * 100)) 
                          : 100;
                        
                        const allocatedDemandPct = item.requested_qty > 0 
                          ? Math.min(100, Math.round((allocated / item.requested_qty) * 100)) 
                          : 0;
                        
                        const allocatedStockPct = available > 0 
                          ? Math.min(100, Math.round((allocated / available) * 100)) 
                          : 0;

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
                            <td className="px-3 py-3 text-center font-mono text-white font-bold">
                              {item.requested_qty.toLocaleString()} {item.resource?.unit || stock?.unit || 'units'}
                            </td>

                            {/* Depot Available Stock & Max Feasibility */}
                            <td className="px-3 py-3 text-center font-mono">
                              <div className={`font-bold ${
                                hasInsufficientStock ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                {available.toLocaleString()} {stock?.unit || ''}
                              </div>
                              <div className="mt-1">
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                  maxFeasibleCoveragePct === 100
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : maxFeasibleCoveragePct >= 50
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                }`}>
                                  {maxFeasibleCoveragePct}% Coverable
                                </span>
                              </div>
                            </td>

                            {/* Stepper Allocation Input */}
                            <td className="px-3 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={available}
                                  value={allocated}
                                  onChange={(e) => handleQtyChange(item.id, available, e.target.value)}
                                  className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-center font-mono text-sm font-bold text-white focus:outline-none focus:border-emergency-orange"
                                />
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleQtyChange(item.id, available, String(Math.min(item.requested_qty, available)))}
                                    className="text-[9px] px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono"
                                    title="Fulfill max stock"
                                  >
                                    Max
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQtyChange(item.id, available, '0')}
                                    className="text-[9px] px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 font-mono"
                                    title="Reset to 0"
                                  >
                                    0
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Allocation & Stock Percentage Display */}
                            <td className="px-3 py-3 text-center font-mono">
                              <div className="space-y-1">
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`text-[11px] font-bold ${
                                    allocatedDemandPct === 100 
                                      ? 'text-emerald-400' 
                                      : allocatedDemandPct > 0 
                                      ? 'text-emergency-orange' 
                                      : 'text-slate-500'
                                  }`}>
                                    {allocatedDemandPct}% of Request
                                  </span>
                                </div>

                                <div className="text-[10px] text-slate-400">
                                  {allocatedStockPct}% of In-Stock
                                </div>

                                {/* Mini Progress Bar */}
                                <div className="w-24 mx-auto h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                  <div 
                                    className={`h-full transition-all duration-200 ${
                                      allocatedDemandPct === 100 ? 'bg-emerald-400' : 'bg-emergency-orange'
                                    }`}
                                    style={{ width: `${allocatedDemandPct}%` }}
                                  />
                                </div>
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
                    className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-mono font-bold transition-colors disabled:opacity-50"
                  >
                    MARK UNDER REVIEW
                  </button>
                )}

                {/* 2. Partial Approval */}
                {['PENDING', 'UNDER_REVIEW'].includes(selectedRequest.status) && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => executeAllocationAction('PARTIALLY_APPROVED')}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 text-xs font-mono font-bold transition-colors disabled:opacity-50"
                  >
                    PARTIALLY APPROVE ({consignmentAnalytics.overallAllocatedPct}%)
                  </button>
                )}

                {/* 3. Full Approval */}
                {['PENDING', 'UNDER_REVIEW', 'PARTIALLY_APPROVED'].includes(selectedRequest.status) && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => executeAllocationAction('APPROVED')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-colors shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                  >
                    APPROVE CONSIGNMENT
                  </button>
                )}

                {/* 4. Dispatch */}
                {['APPROVED', 'PARTIALLY_APPROVED'].includes(selectedRequest.status) && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => executeAllocationAction('DISPATCHED')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition-colors shadow-lg shadow-blue-900/30 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Truck size={14} />
                    <span>DISPATCH CONVOY</span>
                  </button>
                )}

                {/* 5. Reject Request */}
                {!['REJECTED', 'DISPATCHED', 'COMPLETED'].includes(selectedRequest.status) && (
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => setConfirmRejectModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-mono font-bold transition-colors disabled:opacity-50"
                  >
                    REJECT REQUEST
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ---------------- CONFIRM REJECTION MODAL --------------------- */}
      {/* ============================================================== */}
      {confirmRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  Reject Consignment Request
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedRequest.request_number} • {selectedRequest.center_name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to reject this request? Rejection releases any reserved stock back to the central inventory pool. An official justification is strictly required.
            </p>

            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Mandatory Rejection Justification *
              </label>
              <textarea
                rows={3}
                required
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="e.g. Duplicate submission; items re-routed via Northern Depot..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRejectModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction || !operatorNotes.trim()}
                onClick={() => {
                  setConfirmRejectModal(false);
                  executeAllocationAction('REJECTED', operatorNotes);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-colors disabled:opacity-50"
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
