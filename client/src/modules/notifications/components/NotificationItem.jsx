import React from "react";

export const NotificationItem = ({ notification, onMarkRead, onDelete, onClick = null }) => {
  const isUnread = !notification.readAt;

  const getTypeIcon = (type) => {
    switch (type) {
      case "ASSESSMENT_ASSIGNED":
      case "ASSESSMENT_INVITATION":
        return "📝";
      case "RESULT_PUBLISHED":
      case "RESULT_AVAILABLE":
        return "🏆";
      case "PROCTOR_WARNING":
      case "PROCTORING_VIOLATION":
        return "⚠️";
      case "SECURITY_ALERT":
      case "PASSWORD_CHANGED":
        return "🔒";
      case "EXAM_REMINDER":
      case "EXAM_EXPIRING":
        return "⏰";
      case "CERTIFICATE_ISSUED":
        return "📜";
      default:
        return "🔔";
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === "URGENT") return <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500/30">URGENT</span>;
    if (priority === "HIGH") return <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">HIGH</span>;
    return null;
  };

  return (
    <div
      onClick={() => {
        if (isUnread && onMarkRead) onMarkRead(notification._id);
        if (onClick) onClick(notification);
      }}
      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 relative group ${
        isUnread
          ? "bg-slate-800/90 border-blue-500/40 hover:border-blue-400"
          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="text-xl pt-0.5">{getTypeIcon(notification.type)}</div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className={`text-xs truncate ${isUnread ? "font-bold text-white" : "font-semibold text-slate-300"}`}>
              {notification.title}
            </h4>
            {getPriorityBadge(notification.priority)}
          </div>
          <span className="text-[10px] text-slate-500 whitespace-nowrap">
            {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
          {notification.message}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        {isUnread && onMarkRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification._id);
            }}
            className="text-[11px] text-blue-400 hover:text-blue-300 p-1 font-medium"
            title="Mark as read"
          >
            ✓
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification._id);
            }}
            className="text-[11px] text-slate-500 hover:text-red-400 p-1"
            title="Delete notification"
          >
            ✕
          </button>
        )}
      </div>

      {isUnread && (
        <span className="absolute left-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
      )}
    </div>
  );
};

export default NotificationItem;
