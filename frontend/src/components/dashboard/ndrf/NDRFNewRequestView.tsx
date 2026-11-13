import { useState, useEffect, type FormEvent } from 'react';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Scale, 
  Info, 
  Calculator,
  RefreshCw,
  Droplets,
  Package,
  HeartPulse,
  Home,
  Shield,
  Layers
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import { calculateSphereEstimates } from './estimationEngine';
import type { 
  DisasterAssessmentInput, 
  ResourceItem, 
  RequestItemInput, 
  ReliefCenterProfile, 
  RequisitionRecord 
} from './types';

interface NDRFNewRequestViewProps {
  centerProfile: ReliefCenterProfile | null;
  onSuccess: (req: RequisitionRecord) => void;
}

export default function NDRFNewRequestView({ centerProfile, onSuccess }: NDRFNewRequestViewProps) {
  // Available warehouse resources fetched from backend
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  // Disaster Assessment Form State
  const [assessment, setAssessment] = useState<DisasterAssessmentInput>({
    disaster_type: (centerProfile?.disaster_type as any) || 'FLOOD',
    disaster_severity: (centerProfile?.severity_level as any) || 'HIGH',
    affected_population: centerProfile?.affected_population || 5000,
    num_families: Math.ceil((centerProfile?.affected_population || 5000) / 4.5),
    children_elderly_count: Math.ceil((centerProfile?.affected_population || 5000) * 0.35),
    medical_assistance_count: Math.ceil((centerProfile?.affected_population || 5000) * 0.04),
    affected_location: centerProfile?.location_name || '',
    special_instructions: '',
  });

  // Resource Request Items State
  const [requestItems, setRequestItems] = useState<RequestItemInput[]>([]);
  const [estimationApplied, setEstimationApplied] = useState(false);
  const [estimationRationale, setEstimationRationale] = useState<string[]>([]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load available resources on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const items = await ApiClient.get<ResourceItem[]>('/resources/');
        setResources(items);

        // Prepopulate default items (Water, Food, Medical, Blankets)
        const initial: RequestItemInput[] = [];
        const water = items.find(i => i.sku === 'WTR-CAN-01' || i.category === 'POTABLE_WATER');
        const food = items.find(i => i.sku === 'FOD-RAT-01' || i.category === 'FOOD_RATIONS');
        const med = items.find(i => i.sku === 'MED-TRM-01' || i.category === 'MEDICAL_SUPPLIES');
        const blank = items.find(i => i.sku === 'SHL-BLK-02' || (i.category === 'SHELTER_AND_BEDDING' && i.name.includes('Blanket')));

        if (water) initial.push({ resource_id: water.id, requested_qty: 250, resource: water });
        if (food) initial.push({ resource_id: food.id, requested_qty: 400, resource: food });
        if (med) initial.push({ resource_id: med.id, requested_qty: 20, resource: med });
        if (blank) initial.push({ resource_id: blank.id, requested_qty: 150, resource: blank });

        setRequestItems(initial);
      } catch (err: unknown) {
        console.error('Failed to load resources catalog:', err);
      } finally {
        setLoadingResources(false);
      }
    }
    loadCatalog();
  }, []);

  // Update num_families automatically when population changes
  const handlePopulationChange = (pop: number) => {
    const p = Math.max(0, pop);
    setAssessment(prev => ({
      ...prev,
      affected_population: p,
      num_families: Math.max(1, Math.ceil(p / 4.5)),
      children_elderly_count: Math.ceil(p * 0.35),
      medical_assistance_count: Math.ceil(p * 0.04),
    }));
  };

  // Run Population-Based Humanitarian Estimation Engine
  const handleRunEstimation = () => {
    if (!resources.length) return;

    const estimates = calculateSphereEstimates(assessment, resources);
    const rationales: string[] = [];

    const newItems: RequestItemInput[] = estimates.map(est => {
      const resItem = resources.find(r => r.id === est.resource_id);
      rationales.push(est.rationale);
      return {
        resource_id: est.resource_id,
        requested_qty: est.quantity,
        resource: resItem
      };
    });

    setRequestItems(newItems);
    setEstimationRationale(rationales);
    setEstimationApplied(true);
  };

  // Add Item to List
  const handleAddItem = (resId: number) => {
    const res = resources.find(r => r.id === resId);
    if (!res) return;
    if (requestItems.some(i => i.resource_id === resId)) return;

    setRequestItems(prev => [
      ...prev,
      { resource_id: res.id, requested_qty: 10, resource: res }
    ]);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setRequestItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update Quantity
  const handleQtyChange = (index: number, qty: number) => {
    setRequestItems(prev => {
      const next = [...prev];
      next[index].requested_qty = Math.max(1, qty);
      return next;
    });
  };

  // Compute Total Weight
  const totalWeightKg = requestItems.reduce((sum, item) => {
    const wt = item.resource?.weight_per_unit_kg || 1;
    return sum + (item.requested_qty * wt);
  }, 0);

  // Submit Requisition
  const handleSubmitRequisition = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccess(null);

    if (requestItems.length === 0) {
      setError('Please add at least one relief supply item to your requisition.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        center_id: centerProfile?.id,
        urgency_level: assessment.disaster_severity === 'CRITICAL' ? 'CRITICAL' : assessment.disaster_severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
        affected_count: assessment.affected_population,
        num_families: assessment.num_families,
        children_elderly_count: assessment.children_elderly_count,
        medical_assistance_count: assessment.medical_assistance_count,
        disaster_type: assessment.disaster_type,
        disaster_severity: assessment.disaster_severity,
        affected_location: assessment.affected_location.trim() || centerProfile?.location_name || 'Frontline Sector',
        special_instructions: assessment.special_instructions.trim() || undefined,
        items: requestItems.map(i => ({
          resource_id: i.resource_id,
          requested_qty: i.requested_qty
        }))
      };

      const result = await ApiClient.post<RequisitionRecord>('/requests/', payload);
      setSuccess(`Requisition ${result.request_number} filed successfully! Operator Command queue notified.`);

      // Notify parent after brief delay
      setTimeout(() => {
        onSuccess(result);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit requisition';
      setError(msg);
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'POTABLE_WATER':
        return <Droplets size={14} className="text-cyan-400" />;
      case 'FOOD_RATIONS':
        return <Package size={14} className="text-amber-400" />;
      case 'MEDICAL_SUPPLIES':
        return <HeartPulse size={14} className="text-rose-400" />;
      case 'SHELTER_AND_BEDDING':
        return <Home size={14} className="text-indigo-400" />;
      default:
        return <Layers size={14} className="text-emerald-400" />;
    }
  };

  return (
    <form onSubmit={handleSubmitRequisition} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-mono text-white tracking-wide flex items-center gap-2">
            <Shield size={22} className="text-emergency-orange" />
            <span>FRONT-LINE RELIEF REQUISITION</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Population-based resource estimation & emergency dispatch submission
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
            <Scale size={13} className="text-emergency-orange" />
            <span>Est. Total Payload:</span>
            <strong className="text-white">{(totalWeightKg / 1000).toFixed(2)} Tonnes</strong>
            <span className="text-[10px] text-slate-400">({totalWeightKg.toLocaleString()} kg)</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2.5">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ======================= LEFT: DISASTER INFORMATION FORM ======================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emergency-orange" />
              <span>Section 1 &bull; Disaster Field Assessment</span>
            </h2>

            {/* Disaster Type & Severity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Disaster Type
                </label>
                <select
                  value={assessment.disaster_type}
                  onChange={(e) => setAssessment({ ...assessment, disaster_type: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-emergency-orange focus:outline-none"
                >
                  <option value="FLOOD">FLOOD (Riverine/Inundation)</option>
                  <option value="CYCLONE">CYCLONE / Superstorm</option>
                  <option value="EARTHQUAKE">EARTHQUAKE</option>
                  <option value="LANDSLIDE">LANDSLIDE / Mudflow</option>
                  <option value="TSUNAMI">TSUNAMI</option>
                  <option value="FIRE">FOREST FIRE</option>
                  <option value="OTHER">OTHER EMERGENCY</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Disaster Severity
                </label>
                <select
                  value={assessment.disaster_severity}
                  onChange={(e) => setAssessment({ ...assessment, disaster_severity: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-emergency-orange focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL (Code Red)</option>
                  <option value="HIGH">HIGH (Severe Crisis)</option>
                  <option value="MEDIUM">MEDIUM (Moderate Impact)</option>
                  <option value="LOW">LOW (Localized)</option>
                </select>
              </div>
            </div>

            {/* Population & Families */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Affected Population
                </label>
                <input
                  type="number"
                  min="1"
                  value={assessment.affected_population}
                  onChange={(e) => handlePopulationChange(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-emergency-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Number of Families
                </label>
                <input
                  type="number"
                  min="1"
                  value={assessment.num_families}
                  onChange={(e) => setAssessment({ ...assessment, num_families: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-emergency-orange focus:outline-none"
                />
              </div>
            </div>

            {/* Vulnerable Demographic Counts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Children & Elderly
                </label>
                <input
                  type="number"
                  min="0"
                  value={assessment.children_elderly_count}
                  onChange={(e) => setAssessment({ ...assessment, children_elderly_count: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-emergency-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Requires Medical Care
                </label>
                <input
                  type="number"
                  min="0"
                  value={assessment.medical_assistance_count}
                  onChange={(e) => setAssessment({ ...assessment, medical_assistance_count: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-emergency-orange focus:outline-none"
                />
              </div>
            </div>

            {/* Affected Location */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Affected Location / Drop Sector
              </label>
              <input
                type="text"
                value={assessment.affected_location}
                onChange={(e) => setAssessment({ ...assessment, affected_location: e.target.value })}
                placeholder="e.g. Godavari Basin Sector 4, Bridge Terminal East"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-emergency-orange focus:outline-none"
              />
            </div>

            {/* Special Field Instructions */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Special Ground Instructions / Road Condition Notes
              </label>
              <textarea
                rows={3}
                value={assessment.special_instructions}
                onChange={(e) => setAssessment({ ...assessment, special_instructions: e.target.value })}
                placeholder="Specify road cutoffs, air-drop landing zones, or urgent medication SKUs needed immediately..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-emergency-orange focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Population-Based Estimator Banner */}
          <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-3">
            <div className="flex items-start gap-2.5">
              <Calculator size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold font-mono text-amber-300">
                  Sphere Standard Population-Based Estimator
                </h3>
                <p className="text-[11px] text-amber-200/80 leading-relaxed font-sans">
                  Automatically calculates baseline quotas using international Sphere humanitarian baselines ({assessment.affected_population.toLocaleString()} population &bull; {assessment.num_families} families &bull; {assessment.medical_assistance_count} medical casualties).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunEstimation}
              disabled={loadingResources}
              className="btn btn-amber w-full text-xs font-mono !py-2 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
            >
              <Sparkles size={14} />
              <span>CALCULATE SPHERE BASELINE ESTIMATES</span>
            </button>

            {estimationApplied && (
              <div className="p-2.5 rounded bg-slate-950/80 border border-amber-500/30 text-[10px] text-amber-300/90 font-mono space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Info size={11} />
                  <span>Advisory Formulation Applied:</span>
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                  {estimationRationale.slice(0, 3).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <p className="text-[9px] text-slate-400 italic pt-1">
                  *Field Coordinator Notice: Suggested quantities are planning baselines only and never represent guaranteed requirements.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ======================= RIGHT: RESOURCE REQUEST FORM ======================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Section 2 &bull; Relief Resource Manifest ({requestItems.length} items)</span>
              </h2>

              <span className="text-[11px] font-mono text-cyan-300">
                Total Units: {requestItems.reduce((acc, i) => acc + i.requested_qty, 0).toLocaleString()}
              </span>
            </div>

            {/* Selected Items List */}
            {requestItems.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No items added to manifest. Use the catalog below or run the Sphere Estimator.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {requestItems.map((item, idx) => (
                  <div
                    key={item.resource_id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 font-mono text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        {getCategoryIcon(item.resource?.category)}
                      </div>
                      <div className="truncate">
                        <div className="text-white font-bold truncate">
                          {item.resource?.name || `Resource #${item.resource_id}`}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>{item.resource?.sku}</span>
                          <span>&bull;</span>
                          <span>{item.resource?.weight_per_unit_kg} kg/{item.resource?.unit}</span>
                          <span>&bull;</span>
                          <span className="text-cyan-300">Prio: {item.resource?.priority_score}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(idx, item.requested_qty - 10)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.requested_qty}
                        onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-mono text-white text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleQtyChange(idx, item.requested_qty + 10)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-slate-400 w-12 text-left truncate">
                        {item.resource?.unit || 'units'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add More Items from Catalog Dropdown */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-[11px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Add Additional Supplies from Regional Catalog</span>
                <span className="text-[10px] text-slate-500">Live Central Inventory</span>
              </label>
              <div className="flex gap-2">
                <select
                  id="catalogSelect"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                  defaultValue=""
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    if (id) {
                      handleAddItem(id);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="" disabled>-- Select relief item to append --</option>
                  {resources
                    .filter(r => !requestItems.some(i => i.resource_id === r.id))
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        [{r.category}] {r.name} ({r.unit}, {r.weight_per_unit_kg}kg)
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Submission Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] font-mono text-slate-400">
                <span>Unique Request ID generated automatically on submission.</span>
              </div>

              <button
                type="submit"
                disabled={submitting || requestItems.length === 0}
                className="btn btn-amber text-xs font-mono !py-2.5 !px-6 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(249,115,22,0.35)]"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>FILING REQUISITION...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>SUBMIT REQUISITION TO OPERATOR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
