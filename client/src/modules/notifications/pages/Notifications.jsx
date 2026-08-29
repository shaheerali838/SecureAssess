import React, { useState } from "react";
import useNotifications from "../hooks/useNotifications";
import NotificationList from "../components/NotificationList";
import NotificationPreferences from "../components/NotificationPreferences";

export const Notifications = () => {
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL", "UNREAD", "PREFERENCES"
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications(true);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "UNREAD") return !n.readAt;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-400">View assessment updates, evaluation results, and proctoring security notices.</p>
        </div>

        {unreadCount > 0 && activeTab !== "PREFERENCES" && (
          <button
            onClick={markAllAsRead}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
            activeTab === "ALL"
              ? "bg-blue-600 text-white"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab("UNREAD")}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
            activeTab === "UNREAD"
              ? "bg-blue-600 text-white"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setActiveTab("PREFERENCES")}
          className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
            activeTab === "PREFERENCES"
              ? "bg-blue-600 text-white"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          ⚙️ Preferences
        </button>
      </div>

      {/* Content */}
      {activeTab === "PREFERENCES" ? (
        <NotificationPreferences />
      ) : (
        <NotificationList
          notifications={filteredNotifications}
          isLoading={isLoading}
          onMarkRead={markAsRead}
          onDelete={deleteNotification}
        />
      )}
    </div>
  );
};

export default Notifications;
