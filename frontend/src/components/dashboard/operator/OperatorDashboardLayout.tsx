import { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  Boxes, 
  ShieldCheck, 
  LogOut, 
  Home, 
  Radio, 
  Bell, 
  Volume2, 
  VolumeX, 
  Menu, 
  X, 
  RefreshCw
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import OperatorOverviewView from './OperatorOverviewView';
import OperatorRequestsView from './OperatorRequestsView';
import OperatorInventoryView from './OperatorInventoryView';
import OperatorAuditLogView from './OperatorAuditLogView';
import OperatorNotificationsDrawer from './OperatorNotificationsDrawer';
import type { 
  OperatorNavTab, 
  OperatorKPIs, 
  RequisitionRecord, 
  ResourceItem, 
  LowStockAlert, 
  AllocationLogRecord, 
  NotificationRecord,
  ReliefCenterRecord
} from './types';
import type { AuthResponse } from '../../auth/types';

interface NavItem {
  id: OperatorNavTab;
  label: string;
  icon: any;
  badge?: number;
  badgeColor?: string;
}

interface OperatorDashboardLayoutProps {
  currentUser: AuthResponse;
  onLogout: () => void;
  onReturnToHome: () => void;
}

export default function OperatorDashboardLayout({
  currentUser,
  onLogout,
  onReturnToHome,
}: OperatorDashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<OperatorNavTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Data states
  const [kpis, setKpis] = useState<OperatorKPIs>({
    total_requests: 0,
    pending_requests: 0,
    under_review_requests: 0,
    approved_requests: 0,
    partially_approved_requests: 0,
    rejected_requests: 0,
    dispatched_requests: 0,
    completed_requests: 0,
    dispatched_resources: 0,
    total_centers: 0,
    incoming_requests: 0,
    available_inventory: 0,
    total_inventory: 0,
    low_stock_count: 0,
  });
  const [requisitions, setRequisitions] = useState<RequisitionRecord[]>([]);
  const [inventory, setInventory] = useState<ResourceItem[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AllocationLogRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [reliefCenters, setReliefCenters] = useState<ReliefCenterRecord[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequisitionRecord | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Master fetch function
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [statsData, reqsData, invData, alertsData, logsData, notifsData, centersData] = await Promise.all([
        ApiClient.get<OperatorKPIs>('/requests/stats'),
        ApiClient.get<RequisitionRecord[]>('/requests/'),
        ApiClient.get<ResourceItem[]>('/resources/'),
        ApiClient.get<LowStockAlert[]>('/resources/alerts/low-stock').catch(() => []),
        ApiClient.get<AllocationLogRecord[]>('/requests/allocations/audit-logs').catch(() => []),
        ApiClient.get<NotificationRecord[]>('/notifications/').catch(() => []),
        ApiClient.get<ReliefCenterRecord[]>('/relief-centers/').catch(() => []),
      ]);

      setKpis(statsData);
      setRequisitions(reqsData);
      setInventory(invData);
      setLowStockAlerts(alertsData);
      setAuditLogs(logsData);
      setNotifications(notifsData);
      setReliefCenters(centersData);
    } catch (err) {
      console.warn('Operator dashboard data sync error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Controlled 15-second polling for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  const handleSelectRequisitionFromAnywhere = (req: RequisitionRecord) => {
    setSelectedRequest(req);
    setActiveTab('requests');
  };

  const handleSelectRequestById = (requestId: number) => {
    const found = requisitions.find(r => r.id === requestId);
    if (found) {
      setSelectedRequest(found);
      setActiveTab('requests');
    }
  };

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Command Overview', icon: LayoutDashboard },
    { 
      id: 'requests', 
      label: 'Requisitions Triage', 
      icon: Inbox,
      badge: kpis.pending_requests > 0 ? kpis.pending_requests : undefined 
    },
    { 
      id: 'inventory', 
      label: 'Warehouse Inventory', 
      icon: Boxes,
      badge: lowStockAlerts.length > 0 ? lowStockAlerts.length : undefined,
      badgeColor: 'bg-red-500' 
    },
    { id: 'audit_log', label: 'Allocation Audit Trail', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans select-none">
      {/* ----------------- TOP TACTICAL COMMAND BAR ----------------- */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div
            onClick={onReturnToHome}
            className="cursor-pointer flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emergency-orange/20 border border-emergency-orange/50 flex items-center justify-center text-emergency-orange group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <Radio size={16} className="animate-pulse" />
            </div>
            <div>
              <div className="text-base font-black tracking-widest text-white font-mono flex items-center gap-1">
                <span>RESQ</span>
                <span className="text-emergency-orange">-X</span>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-emergency-orange font-mono hidden sm:block">
                Central Operator Command
              </p>
            </div>
          </div>
        </div>

        {/* Center: System Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300">DISASTER RELIEF GRID:</span>
          <span className="text-emerald-400 font-bold">OPERATIONAL</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400">{kpis.total_centers ?? 0} RELIEF ZONES CONNECTED</span>
        </div>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => fetchAllData()}
            disabled={refreshing}
            className={`p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors ${
              refreshing ? 'animate-spin text-emergency-orange' : ''
            }`}
            title="Refresh dashboard data"
          >
            <RefreshCw size={15} />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title={soundEnabled ? 'Emergency audio enabled' : 'Emergency audio muted'}
          >
            {soundEnabled ? <Volume2 size={15} className="text-cyan-400" /> : <VolumeX size={15} />}
          </button>

          {/* Notification Bell with Badge */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Open Tactical Alerts Drawer"
          >
            <Bell size={15} className={unreadNotifCount > 0 ? 'text-emergency-orange' : ''} />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emergency-orange text-slate-950 font-mono text-[10px] font-black flex items-center justify-center animate-bounce shadow-md">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Operator Profile Badge */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-white shadow-inner">
              {currentUser.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                {currentUser.username}
              </div>
              <div className="text-[10px] font-mono text-emergency-orange uppercase tracking-wider">
                Operator
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-800 transition-colors"
            title="Sign out of Command Center"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ----------------- MAIN LAYOUT BODY ----------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-950/60 backdrop-blur-md p-4 space-y-1">
          <div className="px-3 py-2 mb-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">
              Command Modules
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== 'requests') setSelectedRequest(null);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emergency-orange/15 text-white font-bold border border-emergency-orange/40 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    className={isActive ? 'text-emergency-orange' : 'text-slate-400'}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      item.badgeColor 
                        ? `${item.badgeColor} text-white` 
                        : 'bg-emergency-orange text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-6 mt-auto border-t border-slate-800/80 space-y-2">
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-[11px] font-mono space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Total Requisitions:</span>
                <span className="text-white font-bold">{kpis.total_requests}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Depots:</span>
                <span className="text-cyan-300 font-bold">Central Bay</span>
              </div>
              <div className="flex justify-between">
                <span>Storage SKUs:</span>
                <span className="text-emerald-400 font-bold">{inventory.length}</span>
              </div>
            </div>

            <button
              onClick={onReturnToHome}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Home size={15} />
              <span>Public Landing Page</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div 
              className="w-64 h-full bg-slate-950 p-4 border-r border-slate-800 flex flex-col space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-mono text-xs font-bold text-emergency-orange uppercase">
                  Operator Modules
                </span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                      if (item.id !== 'requests') setSelectedRequest(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                      isActive
                        ? 'bg-emergency-orange/20 text-white font-bold border border-emergency-orange/40'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={isActive ? 'text-emergency-orange' : ''} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emergency-orange text-slate-950 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#02050e]">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3 font-mono text-xs">
              <RefreshCw size={28} className="animate-spin text-emergency-orange" />
              <span>SYNCING COMMAND CENTER DATA BUS...</span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OperatorOverviewView
                  kpis={kpis}
                  requisitions={requisitions}
                  lowStockAlerts={lowStockAlerts}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onSelectRequisition={handleSelectRequisitionFromAnywhere}
                  onRefresh={() => fetchAllData()}
                />
              )}

              {activeTab === 'requests' && (
                <OperatorRequestsView
                  requisitions={requisitions}
                  inventory={inventory}
                  reliefCenters={reliefCenters}
                  selectedRequest={selectedRequest}
                  onSelectRequest={setSelectedRequest}
                  onRefresh={() => fetchAllData()}
                />
              )}

              {activeTab === 'inventory' && (
                <OperatorInventoryView
                  inventory={inventory}
                  lowStockAlerts={lowStockAlerts}
                  onRefresh={() => fetchAllData()}
                />
              )}

              {activeTab === 'audit_log' && (
                <OperatorAuditLogView
                  auditLogs={auditLogs}
                  onRefresh={() => fetchAllData()}
                  onRequestSelect={handleSelectRequestById}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ----------------- NOTIFICATIONS DRAWER ----------------- */}
      <OperatorNotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onRefresh={() => fetchAllData(true)}
        onRequestSelect={handleSelectRequestById}
      />
    </div>
  );
}
