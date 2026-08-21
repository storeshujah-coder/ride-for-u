import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, Car, User, Users, FileText,
  Wallet, Shield, Building2, Settings as SettingsIcon,
  Circle, CheckCircle2, AlertCircle, X,
} from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import type { AppNotification, NotificationEntityType } from '@/types';

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Just now';

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getEntityIcon(type: NotificationEntityType) {
  switch (type) {
    case 'vehicle':
      return { icon: Car, bg: 'bg-sky-100 text-sky-700' };
    case 'driver':
      return { icon: User, bg: 'bg-emerald-100 text-emerald-700' };
    case 'subcontractor':
      return { icon: Users, bg: 'bg-violet-100 text-violet-700' };
    case 'monthly_record':
    case 'daily_record':
      return { icon: FileText, bg: 'bg-amber-100 text-amber-700' };
    case 'expense':
    case 'salary':
      return { icon: Wallet, bg: 'bg-rose-100 text-rose-700' };
    case 'user':
      return { icon: Shield, bg: 'bg-indigo-100 text-indigo-700' };
    case 'department':
      return { icon: Building2, bg: 'bg-teal-100 text-teal-700' };
    case 'settings':
    default:
      return { icon: SettingsIcon, bg: 'bg-slate-100 text-slate-700' };
  }
}

export function NotificationBell({ align = 'right' }: { align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isRinging, setIsRinging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    currentUser,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useStore();

  const prevCountRef = useRef(unreadNotificationsCount);

  // Trigger bell animation on new unread notifications
  useEffect(() => {
    if (unreadNotificationsCount > prevCountRef.current) {
      setIsRinging(true);
      const timer = setTimeout(() => setIsRinging(false), 2400);
      prevCountRef.current = unreadNotificationsCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadNotificationsCount;
  }, [unreadNotificationsCount]);

  // Notifications are strictly for Super Admin
  if (currentUser?.role !== 'super_admin') {
    return null;
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Filtered notifications
  const displayedNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const handleItemClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      markNotificationAsRead(notif.id);
    }
    setOpen(false);
    if (notif.targetUrl) {
      navigate(notif.targetUrl);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllNotificationsAsRead();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  return (
    <div className="relative inline-block" ref={panelRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative p-2 rounded-xl transition flex items-center justify-center ${
          open
            ? 'bg-sky-100 text-sky-700 ring-2 ring-sky-500/20'
            : isRinging
            ? 'bg-rose-50 text-rose-600 border border-rose-200 ring-2 ring-rose-400/30'
            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 shadow-sm'
        }`}
      >
        <Bell className={`w-5 h-5 transition-transform ${isRinging ? 'animate-bell-ring text-rose-600' : ''}`} />

        {/* Unread count badge */}
        {unreadNotificationsCount > 0 && (
          <span className={`absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-rose-600 text-white text-[11px] font-bold shadow-md shadow-rose-600/30 transition-transform duration-200 ${
            isRinging ? 'scale-110 ring-2 ring-rose-300 animate-pulse' : ''
          }`}>
            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {open && (
        <div
          className={`absolute mt-2 z-50 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          }`}
        >
          {/* Panel Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">
                  {unreadNotificationsCount} unread
                </span>
              )}
            </div>

            {unreadNotificationsCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center border-b border-slate-100 px-3 py-1.5 bg-white gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filter === 'all'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filter === 'unread'
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Unread ({unreadNotificationsCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                  <CheckCircle2 className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                  When staff members add, edit, or update vehicles, drivers, or duties, you'll be alerted here in real-time.
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const { icon: EntityIcon, bg: iconBg } = getEntityIcon(notif.entityType);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`group relative p-3.5 flex items-start gap-3 cursor-pointer transition ${
                      notif.isRead
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-sky-50/60 hover:bg-sky-50 border-l-4 border-sky-500'
                    }`}
                  >
                    {/* Entity Icon Badge */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBg}`}>
                      <EntityIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          {notif.actorName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-400">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className={`text-xs leading-snug ${notif.isRead ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                        {notif.message}
                      </p>

                      {notif.entityTitle && (
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          Target: <span className="font-medium text-slate-700">{notif.entityTitle}</span>
                        </p>
                      )}
                    </div>

                    {/* Right Action Icons */}
                    <div className="absolute right-3 top-3 flex items-center gap-1">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-sky-500" title="Unread" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, notif.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {displayedNotifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-400 font-medium">
                Click any notification to open the affected record directly
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
