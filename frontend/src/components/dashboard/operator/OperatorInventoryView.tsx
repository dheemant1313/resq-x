import { useState, useMemo, useEffect } from 'react';
import { 
  Boxes, 
  PlusCircle, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  History, 
  Edit3, 
  X, 
  MapPin, 
  PackagePlus
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import type { 
  ResourceItem, 
  ResourceCategory, 
  LowStockAlert, 
  InventoryTransactionRecord 
} from './types';

interface OperatorInventoryViewProps {
  inventory: ResourceItem[];
  lowStockAlerts: LowStockAlert[];
  onRefresh: () => void;
}

const CATEGORIES: { label: string; value: ResourceCategory }[] = [
  { label: 'Potable Water', value: 'POTABLE_WATER' },
  { label: 'Food Rations', value: 'FOOD_RATIONS' },
  { label: 'Medical Supplies', value: 'MEDICAL_SUPPLIES' },
  { label: 'Shelter & Bedding', value: 'SHELTER_AND_BEDDING' },
  { label: 'Rescue Equipment', value: 'RESCUE_EQUIPMENT' },
  { label: 'Power & Communication', value: 'POWER_AND_COMMUNICATION' },
];

export default function OperatorInventoryView({
  inventory,
  lowStockAlerts,
  onRefresh,
}: OperatorInventoryViewProps) {
  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState<ResourceItem | null>(null);
  const [showEditModal, setShowEditModal] = useState<ResourceItem | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<ResourceItem | null>(null);

  // Add SKU Form
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ResourceCategory>('POTABLE_WATER');
  const [newUnit, setNewUnit] = useState('units');
  const [newLocation, setNewLocation] = useState('Central Bay-A');
  const [newWeight, setNewWeight] = useState(1.0);
  const [newPriority, setNewPriority] = useState(80);
  const [newStock, setNewStock] = useState(500);

  // Restock Form
  const [restockQty, setRestockQty] = useState<number>(100);
  const [restockNotes, setRestockNotes] = useState('');

  // Edit Form
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editUnit, setEditUnit] = useState('');

  // Transactions State
  const [transactions, setTransactions] = useState<InventoryTransactionRecord[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Submitting States
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filter inventory
  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchSku = item.sku.toLowerCase().includes(term);
        const matchName = item.name.toLowerCase().includes(term);
        const matchLoc = (item.storage_location || '').toLowerCase().includes(term);
        if (!matchSku && !matchName && !matchLoc) return false;
      }

      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      if (lowStockOnly && item.available_stock > 100) {
        return false;
      }

      return true;
    });
  }, [inventory, searchTerm, categoryFilter, lowStockOnly]);

  // Load transactions when History Drawer opens
  useEffect(() => {
    if (!showHistoryDrawer) return;
    async function loadHistory() {
      setLoadingTx(true);
      try {
        const data = await ApiClient.get<InventoryTransactionRecord[]>(
          `/resources/history/transactions?resource_id=${showHistoryDrawer?.id}`
        );
        setTransactions(data);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setLoadingTx(false);
      }
    }
    loadHistory();
  }, [showHistoryDrawer]);

  // Handle Create SKU
  const handleCreateSku = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      if (!newSku.trim() || !newName.trim()) {
        throw new Error('SKU Code and Item Name are strictly required.');
      }

      await ApiClient.post('/resources/', {
        sku: newSku.trim().toUpperCase(),
        name: newName.trim(),
        category: newCategory,
        unit: newUnit.trim(),
        storage_location: newLocation.trim(),
        weight_per_unit_kg: Number(newWeight),
        priority_score: Number(newPriority),
        total_stock: Number(newStock)
      });

      setFormSuccess('New inventory SKU successfully registered.');
      onRefresh();
      setTimeout(() => {
        setShowAddModal(false);
        setNewSku('');
        setNewName('');
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create resource SKU.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Restock
  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRestockModal) return;
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      if (restockQty <= 0) {
        throw new Error('Restock quantity must be greater than zero.');
      }

      await ApiClient.post(`/resources/${showRestockModal.id}/restock`, {
        quantity: restockQty,
        notes: restockNotes.trim() || undefined
      });

      setFormSuccess(`Successfully restocked +${restockQty} ${showRestockModal.unit} to warehouse.`);
      onRefresh();
      setTimeout(() => {
        setShowRestockModal(null);
        setRestockNotes('');
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to record restock transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit
  const handleEditSku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      await ApiClient.put(`/resources/${showEditModal.id}`, {
        name: editName.trim() || undefined,
        storage_location: editLocation.trim() || undefined,
        unit: editUnit.trim() || undefined
      });

      setFormSuccess('Resource SKU details updated.');
      onRefresh();
      setTimeout(() => {
        setShowEditModal(null);
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update resource SKU.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ----------------- LOW STOCK HIGHLIGHT BAR (IF PRESENT) ----------------- */}
      {lowStockAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <span className="text-xs uppercase font-mono font-bold text-red-400">
                Depot Stock Buffer Alert
              </span>
              <p className="text-xs text-slate-300">
                {lowStockAlerts.length} resource SKU{lowStockAlerts.length !== 1 ? 's are' : ' is'} below safety threshold (100 units).
              </p>
            </div>
          </div>
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors shrink-0 ${
              lowStockOnly 
                ? 'bg-red-500 text-slate-950' 
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
            }`}
          >
            {lowStockOnly ? 'Showing Low Stock Only' : 'Filter Low-Stock SKUs'}
          </button>
        </div>
      )}

      {/* ----------------- CONTROLS & FILTER BAR ----------------- */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by SKU code, item name, or storage bay location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emergency-orange/70 text-slate-100 placeholder-slate-500 text-xs focus:outline-none transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emergency-orange/60"
          >
            <option value="ALL">All Categories ({inventory.length})</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
              setFormError(null);
              setFormSuccess(null);
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emergency-orange hover:bg-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            <PlusCircle size={15} />
            <span>Add New SKU</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh inventory"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ----------------- INVENTORY DIRECTORY TABLE ----------------- */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes size={18} className="text-emergency-orange" />
            <span className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Central Depot Stock Directory
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-slate-700">
              {filteredItems.length} SKUs Listed
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 uppercase font-mono text-[10px] text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">Resource SKU & Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Depot Bay Location</th>
                <th className="px-4 py-3 text-center">Available Stock</th>
                <th className="px-4 py-3 text-center">Reserved</th>
                <th className="px-4 py-3 text-center">Total Stock</th>
                <th className="px-4 py-3 text-center">Unit Weight</th>
                <th className="px-4 py-3 text-right">Warehouse Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Boxes size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No Matching Inventory SKUs</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Clear your search or filters to see all available depot inventory.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.available_stock <= 100;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white group-hover:text-emergency-orange transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          ID #{item.id} • <span className="text-emergency-orange">{item.sku}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-cyan-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-slate-500" />
                          <span>{item.storage_location || 'Central Bay-A'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          isLowStock 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                            : 'text-emerald-400'
                        }`}>
                          {item.available_stock.toLocaleString()} {item.unit}
                        </span>
                        {isLowStock && (
                          <div className="text-[9px] text-red-400 font-mono mt-0.5">
                            Low Stock
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center font-mono text-amber-400">
                        {item.reserved_stock.toLocaleString()} {item.unit}
                      </td>

                      <td className="px-4 py-3.5 text-center font-mono text-white font-bold">
                        {item.total_stock.toLocaleString()} {item.unit}
                      </td>

                      <td className="px-4 py-3.5 text-center font-mono text-slate-400">
                        {item.weight_per_unit_kg} kg
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Restock Button */}
                          <button
                            onClick={() => {
                              setShowRestockModal(item);
                              setRestockQty(100);
                              setRestockNotes('');
                              setFormError(null);
                              setFormSuccess(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-mono font-bold text-xs flex items-center gap-1 shadow transition-colors"
                            title="Record incoming restock shipment"
                          >
                            <PackagePlus size={13} />
                            <span>Restock</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setShowEditModal(item);
                              setEditName(item.name);
                              setEditLocation(item.storage_location || '');
                              setEditUnit(item.unit);
                              setFormError(null);
                              setFormSuccess(null);
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="Edit SKU"
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* History Button */}
                          <button
                            onClick={() => setShowHistoryDrawer(item)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="View transaction history"
                          >
                            <History size={13} />
                          </button>
                        </div>
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
      {/* ----------------- ADD NEW RESOURCE SKU MODAL ----------------- */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PlusCircle size={18} className="text-emergency-orange" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Register New Inventory Resource SKU
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSku} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    SKU Identifier Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emergency-orange"
                    placeholder="e.g. WTR-DRK-01"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    Resource Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ResourceCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emergency-orange"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Resource Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emergency-orange"
                  placeholder="e.g. Standard Medical Trauma First Aid Pack"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    Measurement Unit *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emergency-orange"
                    placeholder="e.g. kits, cans, boxes"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    Storage Bay Location
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emergency-orange"
                    placeholder="e.g. Bay-C Medical Vault"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    Weight (kg/unit)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newWeight}
                    onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emergency-orange"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    Priority Score (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newPriority}
                    onChange={(e) => setNewPriority(parseInt(e.target.value) || 80)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emergency-orange"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emergency-orange"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-emergency-orange hover:bg-orange-400 text-slate-950 font-bold font-mono transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ----------------- RESTOCK SHIPMENT MODAL --------------------- */}
      {/* ============================================================== */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-teal-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PackagePlus size={18} className="text-teal-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Record Incoming Restock Shipment
                </h3>
              </div>
              <button 
                onClick={() => setShowRestockModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRestock} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                  {formSuccess}
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white text-sm">{showRestockModal.name}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center justify-between">
                  <span>SKU: {showRestockModal.sku}</span>
                  <span className="text-emerald-400">
                    Current Total: {showRestockModal.total_stock} {showRestockModal.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Incoming Shipment Quantity ({showRestockModal.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm font-bold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Logistics Invoice / Supplier Shipment Notes
                </label>
                <textarea
                  rows={2}
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="e.g. Delivery convoy TL-04 from State Emergency Reserve Depot..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold font-mono transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Commit Restock (+)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ----------------- EDIT SKU MODAL ---------------------------- */}
      {/* ============================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 size={18} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                  Update SKU: {showEditModal.sku}
                </h3>
              </div>
              <button 
                onClick={() => setShowEditModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSku} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                  {formSuccess}
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Storage Bay Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ----------------- INVENTORY HISTORY DRAWER ------------------ */}
      {/* ============================================================== */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
          <div 
            className="w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History size={18} className="text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono">
                    Stock Audit History
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {showHistoryDrawer.name} ({showHistoryDrawer.sku})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingTx ? (
                <div className="py-12 text-center text-slate-500 font-mono text-xs">
                  Loading ledger transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <History size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No Transaction History Recorded</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Restock shipments and allocation deductions for this SKU will appear here.
                  </p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                        tx.transaction_type === 'RESTOCK' ? 'bg-teal-500/20 text-teal-400 border-teal-500/40' :
                        tx.transaction_type === 'DISPATCH' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' :
                        'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}>
                        {tx.transaction_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono text-slate-300">
                      <span>Quantity Adjusted:</span>
                      <span className={`font-bold ${tx.quantity >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                        {tx.quantity >= 0 ? `+${tx.quantity}` : tx.quantity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono text-slate-400 text-[11px]">
                      <span>Available: {tx.previous_available} → {tx.new_available}</span>
                      <span>By: {tx.operator_username || 'Central Command'}</span>
                    </div>

                    {tx.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                        "{tx.notes}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
