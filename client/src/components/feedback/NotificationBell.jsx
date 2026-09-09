import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import useNotifications from "../hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";

export const NotificationBell = ({ onViewAll = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(true, 10000);
  const bellRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={bellRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-1.5 rounded-xl text-accent-500 hover:text-accent-800 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors cursor-pointer shrink-0 focus:outline-none"
        aria-label="View notifications"
        title="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-danger-500 text-[10px] font-extrabold text-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={markAsRead}
          onMarkAllRead={markAllAsRead}
          onViewAll={onViewAll}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
