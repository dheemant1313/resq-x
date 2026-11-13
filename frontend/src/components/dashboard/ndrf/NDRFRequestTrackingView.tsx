import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  GitFork, 
  Clock, 
  Truck, 
  CheckCheck, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  MessageSquare, 
  AlertCircle
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import type { RequisitionRecord, RequestStatus } from './types';

export default function NDRFRequestTrackingView() {
  const [requests, setRequests] = useState<RequisitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingRequest, setEditingRequest] = useState<RequisitionRecord | null>(null);
  const [editAffectedCount, setEditAffectedCount] = useState<number>(0);
  const [editInstructions, setEditInstructions] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  const fetchRequests = async () => {
    try {
      setActionError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      const data = await ApiClient.get<RequisitionRecord[]>(`/requests/?${params.toString()}`);
      setRequests(data);
      if (data.length > 0 && expandedId === null) {
        setExpandedId(data[0].id);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleCancelRequest = async (id: number, reqNumber: string) => {
    if (!confirm(`Are you sure you want to cancel and withdraw requisition ${reqNumber}?`)) {
      return;
    }

    setBusyAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await ApiClient.request(`/requests/${id}`, { method: 'DELETE' });
      setActionSuccess(`Requisition ${reqNumber} has been successfully cancelled and withdrawn.`);
      fetchRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel requisition';
      setActionError(msg);
    } finally {
      setBusyAction(false);
    }
  };

  const handleStartEdit = (req: RequisitionRecord) => {
    setEditingRequest(req);
    setEditAffectedCount(req.affected_count);
    setEditInstructions(req.special_instructions || '');
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;
    setBusyAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await ApiClient.request(`/requests/${editingRequest.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          affected_count: editAffectedCount,
          special_instructions: editInstructions
        })
      });
      setActionSuccess(`Requisition ${editingRequest.request_number} updated successfully.`);
      setEditingRequest(null);
      fetchRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update requisition';
      setActionError(msg);
    } finally {
      setBusyAction(false);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <Clock size={12} className="animate-spin text-amber-400" />
            PENDING
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/40">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            UNDER REVIEW
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 size={12} className="text-emerald-400" />
            APPROVED
          </span>
        );
      case 'PARTIALLY_APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40">
            <GitFork size={12} className="text-cyan-400" />
            PARTIALLY APPROVED
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/40">
            <Truck size={12} className="text-indigo-400" />
            DISPATCHED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/40">
            <CheckCheck size={12} className="text-teal-400" />
            COMPLETED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/40">
            <XCircle size={12} className="text-rose-400" />
            REJECTED
          </span>
        );
      default:
        return <span className="font-mono text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-950/80">
        <div className="space-y-1">
          <h1 className="text-lg font-black font-mono text-white tracking-wide flex items-center gap-2">
            <ClipboardList size={18} className="text-emergency-orange" />
            <span>REQUISITION TRACKING & ALLOCATION LOG</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Item-level approval, remaining deficits, dispatched progress, and operator notes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-300">
            <Filter size={13} className="text-cyan-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Statuses</option>
              <option value="PENDING" className="bg-slate-900">Pending</option>
              <option value="UNDER_REVIEW" className="bg-slate-900">Under Review</option>
              <option value="PARTIALLY_APPROVED" className="bg-slate-900">Partially Approved</option>
              <option value="APPROVED" className="bg-slate-900">Approved</option>
              <option value="DISPATCHED" className="bg-slate-900">Dispatched</option>
              <option value="COMPLETED" className="bg-slate-900">Completed</option>
              <option value="REJECTED" className="bg-slate-900">Rejected</option>
            </select>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ID or Location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none w-52"
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
            </div>
            <button
              type="submit"
              className="btn text-xs font-mono !py-1.5 !px-2.5 border-slate-700"
            >
              FIND
            </button>
          </form>

          <button
            onClick={fetchRequests}
            className="btn text-xs font-mono !py-1.5 !px-2.5 border-slate-700 hover:border-cyan-400 text-slate-300"
            title="Refresh stream"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 size={15} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Requests Stream */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-slate-400 flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-emergency-orange" />
          <span>Synchronizing requisitions with PostgreSQL database...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 text-center space-y-2">
          <ClipboardList size={32} className="text-slate-600 mx-auto" />
          <p className="text-xs font-mono text-slate-400">
            No requisitions found matching current filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isExpanded = expandedId === req.id;
            const canModify = req.status === 'PENDING' || req.status === 'UNDER_REVIEW';

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-lg transition-all"
              >
                {/* Header Summary Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-base font-black font-mono text-white tracking-wider">
                          {req.request_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          req.urgency_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                          req.urgency_level === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}>
                          {req.urgency_level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Filed: {new Date(req.created_at).toLocaleString()} &bull; {req.affected_count.toLocaleString()} People ({req.num_families} Families)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {getStatusBadge(req.status)}
                    <span className="text-xs font-mono text-slate-400 hidden md:inline">
                      {req.items?.length || 0} manifest items
                    </span>
                  </div>
                </div>

                {/* Expanded Item-Level Details & Allocation Progress */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/40 space-y-4">
                    {/* Manifest Item Breakdown Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                          <tr>
                            <th className="pb-2 font-semibold">RESOURCE ITEM</th>
                            <th className="pb-2 font-semibold text-center">REQUESTED</th>
                            <th className="pb-2 font-semibold text-center">APPROVED</th>
                            <th className="pb-2 font-semibold text-center text-amber-400">REMAINING DEFICIT</th>
                            <th className="pb-2 font-semibold text-center text-cyan-400">DISPATCHED</th>
                            <th className="pb-2 font-semibold">ALLOCATION RATIO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {req.items?.map((item) => {
                            const remaining = Math.max(0, item.requested_qty - item.approved_qty);
                            const percentApproved = Math.min(100, Math.round((item.approved_qty / item.requested_qty) * 100));

                            return (
                              <tr key={item.id} className="hover:bg-slate-900/60">
                                <td className="py-2.5 font-bold text-white">
                                  <span>{item.resource?.name || `Item #${item.resource_id}`}</span>
                                  <span className="text-[10px] text-slate-400 block font-normal">
                                    {item.resource?.sku} &bull; {item.resource?.unit}
                                  </span>
                                </td>
                                <td className="py-2.5 text-center text-slate-300 font-bold">
                                  {item.requested_qty.toLocaleString()}
                                </td>
                                <td className="py-2.5 text-center text-emerald-400 font-bold">
                                  {item.approved_qty.toLocaleString()}
                                </td>
                                <td className="py-2.5 text-center text-amber-300 font-bold">
                                  {remaining.toLocaleString()}
                                </td>
                                <td className="py-2.5 text-center text-indigo-300 font-bold">
                                  {item.dispatched_qty.toLocaleString()}
                                </td>
                                <td className="py-2.5 w-44">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                      <span>{percentApproved}% allocated</span>
                                      {item.dispatched_qty > 0 && (
                                        <span className="text-indigo-400 font-bold">
                                          {Math.round((item.dispatched_qty / item.requested_qty) * 100)}% dispatched
                                        </span>
                                      )}
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full ${percentApproved === 100 ? 'bg-emerald-500' : percentApproved > 0 ? 'bg-cyan-500' : 'bg-slate-700'}`}
                                        style={{ width: `${percentApproved}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Operator Remarks Box */}
                    {req.operator_notes && (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs font-mono space-y-1">
                        <span className="text-cyan-400 font-bold flex items-center gap-1.5 text-[11px]">
                          <MessageSquare size={13} />
                          <span>Central Logistics Operator Command Remarks:</span>
                        </span>
                        <p className="text-slate-200 italic pl-5">
                          "{req.operator_notes}"
                        </p>
                      </div>
                    )}

                    {/* Special Field Instructions */}
                    {req.special_instructions && (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-400">
                        <span className="text-slate-300 font-bold block mb-0.5">Field Dispatch Instructions:</span>
                        {req.special_instructions}
                      </div>
                    )}

                    {/* Modification Controls (Protected by Status Policy) */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[11px] font-mono text-slate-500">
                        {canModify ? (
                          <span className="text-amber-400/90">&bull; Modification unlocked (Requisition is {req.status})</span>
                        ) : (
                          <span className="text-slate-500">&bull; Modification locked: Cannot alter requisitions after approval or dispatch</span>
                        )}
                      </span>

                      {canModify && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(req)}
                            disabled={busyAction}
                            className="btn text-xs font-mono !py-1 !px-3 border-slate-700 hover:border-cyan-400 text-cyan-300 flex items-center gap-1.5"
                          >
                            <Edit3 size={13} />
                            <span>EDIT</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(req.id, req.request_number)}
                            disabled={busyAction}
                            className="btn text-xs font-mono !py-1 !px-3 border-rose-900/60 hover:border-rose-500 text-rose-400 flex items-center gap-1.5"
                          >
                            <Trash2 size={13} />
                            <span>CANCEL</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-400/40 bg-slate-950 p-6 space-y-4 font-mono shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 size={16} className="text-emergency-orange" />
              <span>Edit Requisition &bull; {editingRequest.request_number}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Affected Population Count</label>
                <input
                  type="number"
                  value={editAffectedCount}
                  onChange={(e) => setEditAffectedCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Field Coordinator Instructions</label>
                <textarea
                  rows={3}
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="btn flex-1 text-xs"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={busyAction}
                className="btn btn-amber flex-1 text-xs"
              >
                {busyAction ? 'SAVING...' : 'SAVE MODIFICATIONS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
