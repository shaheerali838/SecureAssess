import React from "react";
import NotificationItem from "./NotificationItem";

export const NotificationList = ({
  notifications = [],
  isLoading = false,
  onMarkRead,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-500 text-xs">
        Loading notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800 p-8 space-y-2">
        <div className="text-4xl mb-2">📭</div>
        <h3 className="text-sm font-semibold text-slate-300">All caught up!</h3>
        <p className="text-xs text-slate-500">You have no unread notifications or alerts at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default NotificationList;
