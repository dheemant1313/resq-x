import { useState } from 'react';
import { 
  X, 
  CheckCheck, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  Package, 
  Info,
  ExternalLink
} from 'lucide-react';
import { ApiClient } from '../../../services/api';
import type { NotificationRecord } from './types';

interface OperatorNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationRecord[];
  onRefresh: () => void;
  onRequestSelect?: (requestId: number) => void;
}

export default function OperatorNotificationsDrawer({
  isOpen,
  onClose,
  notifications,
  onRefresh,
  onRequestSelect,
}: OperatorNotificationsDrawerProps) {
  const [markingAll, setMarkingAll] = useState(false);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await ApiClient.post('/notifications/mark-all-read', {});
      onRefresh();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await ApiClient.put(`/notifications/${id}/read`, {});
      onRefresh();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'APPROVED':
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'PARTIAL_APPROVAL':
        return <Clock size={16} className="text-amber-400" />;
      case 'DISPATCHED':
        return <Truck size={16} className="text-cyan-400" />;
      case 'REJECTED':
        return <XCircle size={16} className="text-rose-400" />;
      case 'LOW_STOCK':
        return <AlertTriangle size={16} className="text-red-400" />;
      case 'RESTOCKED':
        return <Package size={16} className="text-teal-400" />;
      default:
        return <Info size={16} className="text-slate-400" />;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PARTIAL_APPROVAL':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DISPATCHED':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'LOW_STOCK':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'RESTOCKED':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div 
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emergency-orange/20 border border-emergency-orange/40 flex items-center justify-center text-emergency-orange">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Command Notifications
              </h3>
              <p className="text-xs text-slate-400">
                {unreadCount} unread persistent alert{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck size={13} />
                <span>Read All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Bell size={36} className="stroke-1 mb-2 opacity-50" />
              <p className="text-sm font-medium">No Notifications Recorded</p>
              <p className="text-xs text-slate-600 mt-1">
                Incoming requisitions, dispatch updates, and low-stock alerts will populate here in real-time.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) handleMarkRead(notif.id);
                  if (notif.request_id && onRequestSelect) {
                    onRequestSelect(notif.request_id);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  notif.is_read
                    ? 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    : 'bg-slate-800/60 border-emergency-orange/30 hover:border-emergency-orange/60 shadow-[0_0_12px_rgba(249,115,22,0.1)] text-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getTypeIcon(notif.notification_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${getTypeBadgeClass(notif.notification_type)}`}>
                        {notif.notification_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold truncate text-slate-100 mb-0.5">
                      {notif.title}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed break-words">
                      {notif.message}
                    </p>

                    {(notif.center_name || notif.request_number) && (
                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        {notif.center_name && (
                          <span className="truncate max-w-[180px] font-mono text-cyan-300">
                            {notif.center_name}
                          </span>
                        )}
                        {notif.request_number && (
                          <span className="font-mono text-emergency-orange hover:underline flex items-center gap-1">
                            {notif.request_number}
                            <ExternalLink size={10} />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            PERSISTENT DISASTER RELIEF DISPATCH BUS
          </p>
        </div>
      </div>
    </div>
  );
}
