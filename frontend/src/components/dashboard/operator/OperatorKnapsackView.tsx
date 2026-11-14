import { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  RefreshCw, 
  Info, 
  Sliders, 
  Table, 
  Code2, 
  Boxes, 
  ShieldAlert, 
  Scale, 
  Zap, 
  Cpu
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import type { 
  ResourceItem, 
  KnapsackItemInputDTO, 
  KnapsackRequestDTO, 
  KnapsackResponseDTO, 
  ApprovedConsignmentDTO 
} from './types';

interface OperatorKnapsackViewProps {
  inventory: ResourceItem[];
}

// Preset vehicle profiles for emergency logistics
const VEHICLE_PRESETS = [
  { id: 'VAN-01', name: 'Light Rapid Response Van', capacity_kg: 800, type: 'Light Van' },
  { id: 'TRK-4X4', name: '4x4 Offroad Rescue Truck', capacity_kg: 1500, type: 'Offroad' },
  { id: 'TRK-MED', name: 'NDRF Standard 5-Ton Carrier', capacity_kg: 5000, type: 'Medium Truck' },
  { id: 'TRK-HVY', name: 'Heavy 10-Ton Logistics Hauler', capacity_kg: 10000, type: 'Heavy Truck' },
  { id: 'AIR-HELI', name: 'Mi-17 Cargo Rescue Helicopter', capacity_kg: 3500, type: 'Air-Drop' },
  { id: 'CUSTOM', name: 'Custom Emergency Vehicle', capacity_kg: 2000, type: 'Custom' },
];

// Standard Academic / Viva Demonstration Test Cases
const VIVA_PRESETS = [
  {
    name: 'Classical DP vs Greedy Challenge',
    description: 'Demonstrates why Greedy heuristic fails (picks 39 pts) while DP finds global optimum (46 pts).',
    capacity_kg: 10,
    items: [
      { id: 'ITEM-A', name: 'Relief Consignment Alpha', weight_kg: 6, priority_score: 30, quantity: 1, category: 'MEDICAL_SUPPLIES' },
      { id: 'ITEM-B', name: 'Relief Consignment Bravo', weight_kg: 3, priority_score: 14, quantity: 1, category: 'FOOD_RATIONS' },
      { id: 'ITEM-C', name: 'Relief Consignment Charlie', weight_kg: 4, priority_score: 16, quantity: 1, category: 'POTABLE_WATER' },
      { id: 'ITEM-D', name: 'Relief Consignment Delta', weight_kg: 2, priority_score: 9, quantity: 1, category: 'SHELTER_AND_BEDDING' },
    ]
  },
  {
    name: 'Exact Capacity Match (100% Payload)',
    description: 'Demonstrates perfect capacity utilization with exact weight match.',
    capacity_kg: 50,
    items: [
      { id: 'WTR-CAN', name: '20L Potable Water Jerrycan', weight_kg: 20, priority_score: 80, quantity: 2, category: 'POTABLE_WATER' },
      { id: 'MED-KIT', name: 'Emergency Trauma Surgical Kit', weight_kg: 10, priority_score: 90, quantity: 1, category: 'MEDICAL_SUPPLIES' },
    ]
  },
  {
    name: 'Zero Vehicle Capacity Edge Case',
    description: 'Verifies robust handling when vehicle capacity is 0 kg.',
    capacity_kg: 0,
    items: [
      { id: 'FOD-01', name: 'Ready-to-Eat Emergency Food Packs', weight_kg: 15, priority_score: 75, quantity: 2, category: 'FOOD_RATIONS' },
    ]
  },
  {
    name: 'Empty Items Candidate List Edge Case',
    description: 'Verifies algorithm handling when no candidate items are provided.',
    capacity_kg: 500,
    items: []
  },
];

export default function OperatorKnapsackView({ inventory }: OperatorKnapsackViewProps) {
  // Vehicle Profile State
  const [selectedVehiclePreset, setSelectedVehiclePreset] = useState(VEHICLE_PRESETS[1].id);
  const [vehicleId, setVehicleId] = useState(VEHICLE_PRESETS[1].id);
  const [vehicleName, setVehicleName] = useState(VEHICLE_PRESETS[1].name);
  const [capacityKg, setCapacityKg] = useState<number>(VEHICLE_PRESETS[1].capacity_kg);

  // Cargo Items State
  const [candidateItems, setCandidateItems] = useState<KnapsackItemInputDTO[]>([]);
  const [approvedConsignments, setApprovedConsignments] = useState<ApprovedConsignmentDTO[]>([]);
  const [selectedConsignmentId, setSelectedConsignmentId] = useState<number | 'CUSTOM'>('CUSTOM');

  // Algorithm Results State
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<KnapsackResponseDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'results' | 'theory' | 'matrix'>('results');

  // Fetch approved consignments on mount
  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const data = await ApiClient.get<ApprovedConsignmentDTO[]>('/algorithms/knapsack/approved-consignments');
        setApprovedConsignments(data);
      } catch (err) {
        console.warn('Failed to load approved consignments:', err);
      }
    };
    fetchApproved();
  }, []);

  // Initialize with default humanitarian sample if candidate items empty
  useEffect(() => {
    if (candidateItems.length === 0 && inventory.length > 0) {
      const sample = inventory.slice(0, 5).map(inv => ({
        id: `SKU-${inv.id}`,
        name: inv.name,
        weight_kg: inv.weight_per_unit_kg,
        priority_score: inv.priority_score,
        quantity: Math.min(10, Math.max(1, Math.floor(inv.available_stock / 10))),
        category: typeof inv.category === 'string' ? inv.category : String(inv.category)
      }));
      setCandidateItems(sample);
    }
  }, [inventory, candidateItems.length]);

  // Handle vehicle preset change
  const handleVehiclePresetSelect = (presetId: string) => {
    setSelectedVehiclePreset(presetId);
    const preset = VEHICLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setVehicleId(preset.id);
      setVehicleName(preset.name);
      setCapacityKg(preset.capacity_kg);
    }
  };

  // Handle loading approved consignment
  const handleLoadApprovedConsignment = (reqId: number | 'CUSTOM') => {
    setSelectedConsignmentId(reqId);
    if (reqId === 'CUSTOM') return;

    const consignment = approvedConsignments.find(c => c.id === reqId);
    if (!consignment) return;

    const items: KnapsackItemInputDTO[] = consignment.items.map(itm => ({
      id: itm.id,
      name: itm.name,
      weight_kg: itm.weight_kg,
      priority_score: itm.priority_score,
      quantity: itm.quantity,
      category: itm.category
    }));

    setCandidateItems(items);
    setResult(null);
  };

  // Handle loading viva test case
  const handleLoadVivaPreset = (index: number) => {
    const preset = VIVA_PRESETS[index];
    setCapacityKg(preset.capacity_kg);
    setVehicleName(`Viva Case: ${preset.name}`);
    setCandidateItems([...preset.items]);
    setSelectedConsignmentId('CUSTOM');
    setSelectedVehiclePreset('CUSTOM');
    setResult(null);
    setError(null);
  };

  // Add Item to Candidate List
  const handleAddCandidateItem = (invItem: ResourceItem) => {
    // Check if already in list
    const existing = candidateItems.find(it => it.id === `SKU-${invItem.id}`);
    if (existing) {
      setCandidateItems(prev => prev.map(it => 
        it.id === `SKU-${invItem.id}` ? { ...it, quantity: it.quantity + 1 } : it
      ));
    } else {
      setCandidateItems(prev => [
        ...prev,
        {
          id: `SKU-${invItem.id}`,
          name: invItem.name,
          weight_kg: invItem.weight_per_unit_kg,
          priority_score: invItem.priority_score,
          quantity: 1,
          category: typeof invItem.category === 'string' ? invItem.category : String(invItem.category)
        }
      ]);
    }
  };

  // Remove Item
  const handleRemoveCandidateItem = (index: number) => {
    setCandidateItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const handleUpdateItemField = (index: number, field: keyof KnapsackItemInputDTO, value: any) => {
    setCandidateItems(prev => prev.map((it, i) => {
      if (i !== index) return it;
      return { ...it, [field]: value };
    }));
  };

  // Aggregate candidate payload weight
  const totalCandidateWeight = useMemo(() => {
    return candidateItems.reduce((acc, it) => acc + (it.weight_kg * it.quantity), 0);
  }, [candidateItems]);

  // Execute Knapsack Optimization
  const handleExecuteOptimization = async () => {
    setError(null);
    setOptimizing(true);

    try {
      const payload: KnapsackRequestDTO = {
        vehicle_id: vehicleId,
        vehicle_name: vehicleName,
        capacity_kg: Number(capacityKg),
        items: candidateItems,
        include_dp_table: true
      };

      const res = await ApiClient.post<KnapsackResponseDTO>('/algorithms/knapsack', payload);
      setResult(res);
      setActiveTab('results');
    } catch (err: any) {
      console.error('Optimization error:', err);
      setError(err.message || 'Failed to compute 0/1 Knapsack optimization.');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* ----------------- HEADER & CONTEXT NOTIFICATION -------------- */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emergency-orange/10 border border-emergency-orange/30 flex items-center justify-center text-emergency-orange">
              <Scale size={18} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wider">
              0/1 KNAPSACK VEHICLE CAPACITY OPTIMIZER
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Classical Dynamic Programming algorithm maximizing life-saving relief priority score within vehicle payload limits.
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-bold flex items-center gap-1.5">
            <Cpu size={14} className="text-cyan-400" />
            <span>DP O(N × W) RESOLUTION</span>
          </span>
          <span className="text-[11px] font-mono px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-emerald-400" />
            <span>PREVIEW MODE — ZERO DEDUCTION</span>
          </span>
        </div>
      </div>

      {/* Mandatory Separation Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs">
        <Info size={16} className="text-emergency-orange shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-slate-300 font-sans">
          <span className="font-mono font-bold text-white uppercase text-[11px] block">
            Algorithm Scope & Boundary Distinction
          </span>
          <p>
            The 0/1 Knapsack algorithm is strictly applied to single-vehicle physical cargo packing capacity. It does not replace fair inventory allocation across multiple relief centers. Simulating an optimization preview does not alter warehouse inventory or create dispatch logs until confirmed by an authorized operator.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ---------------- VEHICLE & CARGO CONFIGURATION --------------- */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vehicle Profile & Viva Presets */}
        <div className="space-y-6">
          {/* Vehicle Profile Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Truck size={18} className="text-emergency-orange" />
              <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-white">
                Vehicle Specifications & Carrying Limit
              </h3>
            </div>

            {/* Vehicle Presets */}
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5">
                Select Standard Response Fleet Profile
              </label>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleVehiclePresetSelect(preset.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedVehiclePreset === preset.id
                        ? 'bg-emergency-orange/15 border-emergency-orange text-white shadow-lg shadow-emergency-orange/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="text-[11px] font-bold font-mono truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Cap: {preset.capacity_kg.toLocaleString()} kg
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Vehicle Identifier / Plate
                </label>
                <input
                  type="text"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emergency-orange"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Vehicle Model / Description
                </label>
                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emergency-orange"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Maximum Carrying Payload Capacity (W in kg) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-3 pr-12 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-base font-bold focus:outline-none focus:border-emergency-orange"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                    KG
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic / Viva Demonstration Test Presets */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
              <Zap size={16} className="text-amber-400" />
              <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-white">
                Academic & Viva Test Case Presets
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              One-click benchmarks to evaluate corner cases and verify DP correctness during viva examination:
            </p>

            <div className="space-y-2">
              {VIVA_PRESETS.map((tc, idx) => (
                <button
                  key={tc.name}
                  type="button"
                  onClick={() => handleLoadVivaPreset(idx)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all group"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200 group-hover:text-amber-400">
                    <span>{tc.name}</span>
                    <span className="text-[10px] text-slate-500">{tc.capacity_kg} kg</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-sans leading-tight">
                    {tc.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Cargo Candidates & Execution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cargo Source Selector Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Boxes size={18} className="text-emergency-orange" />
                <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-white">
                  Candidate Cargo Items For Payload Optimization
                </h3>
              </div>

              {/* Load from Approved Requisitions Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] uppercase font-mono text-slate-400 shrink-0">
                  Import Requisition:
                </label>
                <select
                  value={selectedConsignmentId}
                  onChange={(e) => handleLoadApprovedConsignment(e.target.value === 'CUSTOM' ? 'CUSTOM' : Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-emergency-orange truncate max-w-xs"
                >
                  <option value="CUSTOM">Custom / Manual Selection ({candidateItems.length} items)</option>
                  {approvedConsignments.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.request_number} — {c.center_name} ({c.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Candidate Items Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 uppercase font-mono text-[10px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3.5 py-2.5">Item Name & SKU</th>
                    <th className="px-3 py-2.5 text-center">Unit Wt (kg)</th>
                    <th className="px-3 py-2.5 text-center">Priority (1-100)</th>
                    <th className="px-3 py-2.5 text-center">Quantity</th>
                    <th className="px-3 py-2.5 text-center">Total Weight</th>
                    <th className="px-3 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-sans">
                  {candidateItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                        No cargo items in candidate queue. Add items from the warehouse or load a viva benchmark.
                      </td>
                    </tr>
                  ) : (
                    candidateItems.map((item, idx) => (
                      <tr key={`${item.id}-${idx}`} className="hover:bg-slate-900/40">
                        {/* Name & ID */}
                        <td className="px-3.5 py-2.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItemField(idx, 'name', e.target.value)}
                            className="bg-transparent text-white font-medium text-xs focus:outline-none focus:border-b border-emergency-orange w-full"
                          />
                          <div className="text-[10px] font-mono text-slate-500">{item.id}</div>
                        </td>

                        {/* Unit Weight */}
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="number"
                            min={0.1}
                            step={0.5}
                            value={item.weight_kg}
                            onChange={(e) => handleUpdateItemField(idx, 'weight_kg', Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                            className="w-16 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-center font-mono text-xs text-white"
                          />
                        </td>

                        {/* Priority Score */}
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={item.priority_score}
                            onChange={(e) => handleUpdateItemField(idx, 'priority_score', Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                            className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-center font-mono text-xs text-emergency-orange font-bold"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemField(idx, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-center font-mono text-xs text-cyan-300 font-bold"
                          />
                        </td>

                        {/* Total Weight */}
                        <td className="px-3 py-2.5 text-center font-mono text-slate-300">
                          {(item.weight_kg * item.quantity).toFixed(1)} kg
                        </td>

                        {/* Action */}
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCandidateItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                            title="Remove item from candidate list"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Add from Inventory Dropdown */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono text-slate-400">
                  Quick Add SKU from Depot:
                </span>
                <select
                  onChange={(e) => {
                    const item = inventory.find(inv => inv.id === Number(e.target.value));
                    if (item) handleAddCandidateItem(item);
                  }}
                  defaultValue=""
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emergency-orange max-w-xs"
                >
                  <option value="" disabled>+ Choose warehouse resource...</option>
                  {inventory.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.weight_per_unit_kg} kg, Val: {inv.priority_score})
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Summary */}
              <div className="text-xs font-mono flex items-center gap-3">
                <span className="text-slate-400">
                  Candidate Weight: <strong className="text-white">{totalCandidateWeight.toFixed(1)} kg</strong>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">
                  Vehicle Cap: <strong className="text-cyan-300">{capacityKg.toLocaleString()} kg</strong>
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCandidateItems([])}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
              >
                Clear Items
              </button>

              <button
                type="button"
                disabled={optimizing}
                onClick={handleExecuteOptimization}
                className="px-6 py-2.5 rounded-xl bg-emergency-orange hover:bg-orange-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-lg shadow-emergency-orange/20 flex items-center gap-2 disabled:opacity-50"
              >
                {optimizing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>COMPUTING DP MATRIX...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>OPTIMIZE VEHICLE PAYLOAD (0/1 KNAPSACK)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <XCircle size={18} className="text-rose-400 shrink-0" />
          <span className="font-mono">{error}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* ---------------- OPTIMIZATION RESULTS SECTION ---------------- */}
      {/* ============================================================== */}
      {result && (
        <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Results Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeTab === 'results'
                  ? 'bg-emergency-orange text-slate-950 shadow-lg shadow-emergency-orange/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>OPTIMAL CARGO SELECTION</span>
            </button>

            <button
              onClick={() => setActiveTab('theory')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeTab === 'theory'
                  ? 'bg-emergency-orange text-slate-950 shadow-lg shadow-emergency-orange/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Code2 size={14} />
              <span>DP THEORY & DECISION LOG</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeTab === 'matrix'
                  ? 'bg-emergency-orange text-slate-950 shadow-lg shadow-emergency-orange/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Table size={14} />
              <span>DP STATE TABLE MATRIX</span>
            </button>
          </div>

          {/* Results Summary KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Packed Load</span>
              <span className="text-lg font-bold font-mono text-white mt-1 block">
                {result.total_weight_kg.toLocaleString()} kg
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                of {result.capacity_kg.toLocaleString()} kg max
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Remaining Margin</span>
              <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
                {result.remaining_capacity_kg.toLocaleString()} kg
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Payload Available</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Payload Utilization</span>
              <span className={`text-lg font-bold font-mono mt-1 block ${
                result.utilization_percentage >= 90 ? 'text-emerald-400' :
                result.utilization_percentage >= 50 ? 'text-amber-400' : 'text-slate-300'
              }`}>
                {result.utilization_percentage}%
              </span>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1.5">
                <div 
                  className={`h-full ${
                    result.utilization_percentage >= 90 ? 'bg-emerald-400' :
                    result.utilization_percentage >= 50 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, result.utilization_percentage)}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Max Priority Score</span>
              <span className="text-lg font-bold font-mono text-emergency-orange mt-1 block">
                {result.total_priority_score.toLocaleString()} pts
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Objective Realized</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">DP Computation</span>
              <span className="text-lg font-bold font-mono text-cyan-300 mt-1 block">
                {result.execution_time_ms} ms
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {result.selected_items.length} units selected
              </span>
            </div>
          </div>

          {/* TAB 1: Optimal Cargo Selection & Packing Representation */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              {/* High-Tech 2D Cargo Bay Visual Packing Representation */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Truck size={18} className="text-emergency-orange" />
                    <span className="text-xs uppercase font-mono font-bold text-white tracking-wider">
                      Vehicle Cargo Bay Payload Allocation Visualizer ({result.vehicle_name})
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {result.total_weight_kg} kg loaded / {result.capacity_kg} kg rated capacity
                  </span>
                </div>

                {/* Cargo Bay Graphic */}
                <div className="relative p-4 rounded-xl bg-slate-950 border-2 border-dashed border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-500 mb-2 flex items-center justify-between">
                    <span>FRONT CABIN [CAB]</span>
                    <span>CARGO BED REAR HATCH [TAILGATE]</span>
                  </div>

                  {result.selected_items.length === 0 ? (
                    <div className="py-10 text-center text-slate-600 font-mono text-xs">
                      CARGO BAY EMPTY — No items fit within payload constraints.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-900/40 rounded-lg min-h-[100px] items-center">
                      {result.grouped_summary.filter(g => g.selected_qty > 0).map((group, gIdx) => {
                        const colors = [
                          'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                          'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
                          'bg-amber-500/20 text-amber-300 border-amber-500/40',
                          'bg-purple-500/20 text-purple-300 border-purple-500/40',
                          'bg-orange-500/20 text-orange-300 border-orange-500/40',
                        ];
                        const colorClass = colors[gIdx % colors.length];

                        return (
                          <div 
                            key={group.id}
                            className={`p-3 rounded-xl border flex flex-col justify-between flex-1 min-w-[140px] max-w-[240px] ${colorClass}`}
                          >
                            <div>
                              <div className="text-xs font-bold font-mono truncate">{group.name}</div>
                              <div className="text-[10px] opacity-80 mt-0.5">
                                {group.selected_qty} × {group.unit_weight_kg} kg ({group.total_weight_kg} kg)
                              </div>
                            </div>
                            <div className="text-[10px] font-mono font-bold mt-2 pt-1 border-t border-current/20 flex justify-between">
                              <span>Priority: {group.priority_score}</span>
                              <span>Total: {group.total_priority} pts</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Grouped Allocation Breakdown Table */}
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>Selected Consignment Items (Packed into Vehicle)</span>
                  </span>
                  <span className="text-xs font-mono text-emerald-400">
                    {result.selected_items.length} discrete units selected
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 uppercase font-mono text-[10px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Resource Item</th>
                        <th className="px-4 py-3 text-center">Unit Weight</th>
                        <th className="px-4 py-3 text-center">Unit Priority</th>
                        <th className="px-4 py-3 text-center">Selected / Available Qty</th>
                        <th className="px-4 py-3 text-center">Total Weight Loaded</th>
                        <th className="px-4 py-3 text-center">Cumulative Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-sans">
                      {result.grouped_summary.map((g) => (
                        <tr key={g.id} className={g.selected_qty > 0 ? 'bg-slate-900/30' : 'opacity-40'}>
                          <td className="px-4 py-3">
                            <div className="font-bold text-white">{g.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{g.id}</div>
                          </td>

                          <td className="px-4 py-3 text-center font-mono">
                            {g.unit_weight_kg} kg
                          </td>

                          <td className="px-4 py-3 text-center font-mono text-emergency-orange font-bold">
                            {g.priority_score}
                          </td>

                          <td className="px-4 py-3 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              g.selected_qty === g.available_qty ? 'bg-emerald-500/20 text-emerald-300' :
                              g.selected_qty > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {g.selected_qty} of {g.available_qty}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center font-mono text-cyan-300 font-bold">
                            {g.total_weight_kg} kg
                          </td>

                          <td className="px-4 py-3 text-center font-mono text-emergency-orange font-bold">
                            {g.total_priority} pts
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Excluded Items List (If any) */}
              {result.unselected_items.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] font-bold uppercase">
                    <XCircle size={14} className="text-slate-500" />
                    <span>Excluded Items ({result.unselected_items.length} units omitted to honor vehicle weight limit)</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Array.from(new Set(result.unselected_items.map(it => it.name))).map((name) => {
                      const count = result.unselected_items.filter(it => it.name === name).length;
                      return (
                        <span key={name} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400">
                          {name} × {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DP Theory & Step-by-Step Backtracking Decision Log */}
          {activeTab === 'theory' && (
            <div className="space-y-6">
              {/* Mathematical Formulation Card */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                  <Code2 size={18} className="text-emergency-orange" />
                  <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-white">
                    Dynamic Programming Recurrence Relation & Complexity
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 border border-slate-800 space-y-1">
                  <div>DP[i][w] = DP[i-1][w]                                    if weight[i-1] &gt; w</div>
                  <div>DP[i][w] = max(DP[i-1][w], DP[i-1][w - weight[i-1]] + val[i-1]) otherwise</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Time Complexity</span>
                    <span className="font-mono text-white font-bold block mt-0.5">O(N × W)</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {result.dp_explanation?.time_complexity || 'Pseudo-polynomial time'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Space Complexity</span>
                    <span className="font-mono text-white font-bold block mt-0.5">O(N × W)</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {result.dp_explanation?.space_complexity || 'Full 2D state memoization grid'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Backtracking Technique</span>
                    <span className="font-mono text-white font-bold block mt-0.5">Bottom-Up Traceback</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Recovers exact item set from optimal value cell DP[N][W]
                    </span>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Backtracking Decision Log */}
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <Sliders size={16} className="text-emergency-orange" />
                    <span>Step-by-Step DP Decision Trace ({result.step_by_step_trace.length} evaluations)</span>
                  </span>
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/80 font-mono text-xs">
                  {result.step_by_step_trace.map((step) => (
                    <div key={step.step} className="p-3.5 flex items-start gap-3 hover:bg-slate-900/30">
                      <span className="text-slate-500 text-[10px] pt-0.5 shrink-0">
                        #{step.step.toString().padStart(2, '0')}
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        step.decision === 'INCLUDED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {step.decision}
                      </span>

                      <div className="flex-1 space-y-0.5">
                        <div className="text-white font-bold font-sans">
                          {step.name} <span className="font-mono text-slate-400 font-normal">({step.weight_kg} kg, {step.priority_score} pts)</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans">
                          {step.reason}
                        </div>
                      </div>

                      <div className="text-right text-[10px] text-slate-400 shrink-0">
                        Remaining: <strong className="text-cyan-300">{step.capacity_after_kg} kg</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Interactive DP State Matrix Table Viewer */}
          {activeTab === 'matrix' && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Table size={18} className="text-emergency-orange" />
                  <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-white">
                    Dynamic Programming Subproblem State Matrix DP[i][w]
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Sampled columns for legible visualization
                </span>
              </div>

              {result.dp_matrix_sample && result.matrix_headers ? (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-center text-xs font-mono">
                    <thead className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400">
                      <tr>
                        <th className="px-3 py-2 text-left">Item (Row i)</th>
                        {result.matrix_headers.col_weights.map((w, cIdx) => (
                          <th key={cIdx} className="px-2.5 py-2">
                            {w} kg
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-sans text-xs">
                      {result.dp_matrix_sample.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/50">
                          <td className="px-3 py-2 text-left font-mono text-slate-300 text-[11px] bg-slate-950/60 truncate max-w-xs">
                            {result.matrix_headers?.row_labels[rIdx] || `Row #${rIdx}`}
                          </td>
                          {row.map((val, cIdx) => {
                            const isOptimal = rIdx === result.dp_matrix_sample!.length - 1 && cIdx === row.length - 1;
                            return (
                              <td 
                                key={cIdx} 
                                className={`px-2.5 py-2 font-mono ${
                                  isOptimal 
                                    ? 'bg-emergency-orange/20 text-emergency-orange font-bold border border-emergency-orange/40' 
                                    : val > 0 ? 'text-white' : 'text-slate-600'
                                }`}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 font-mono text-xs">
                  DP matrix sampling was not requested or is unavailable.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
