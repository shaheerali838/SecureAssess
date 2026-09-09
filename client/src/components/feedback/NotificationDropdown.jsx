import React from "react";
import NotificationItem from "./NotificationItem";

export const NotificationDropdown = ({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onViewAll,
  onClose,
}) => {
  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="text-[11px] text-slate-400 hover:text-white transition"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-800/40">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No notifications available.
          </div>
        ) : (
          notifications.slice(0, 5).map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkRead={onMarkRead}
            />
          ))
        )}
      </div>

      <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 text-center">
        <button
          onClick={() => {
            if (onViewAll) onViewAll();
            if (onClose) onClose();
          }}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
        >
          View All Notifications →
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
