import React, { useState, useEffect } from "react";
import notificationService from "../services/notification.service";

export const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    email: {
      enabled: true,
      assessmentAssigned: true,
      resultPublished: true,
      certificateIssued: true,
      interviewReminder: true,
      securityAlerts: true,
    },
    inApp: {
      enabled: true,
      assessmentAssigned: true,
      resultPublished: true,
      certificateIssued: true,
      interviewReminder: true,
      securityAlerts: true,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await notificationService.getPreferences();
        if (res.data) setPreferences(res.data);
      } catch (err) {
        console.warn("Failed to fetch preferences:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const handleToggle = (channel, key) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: !prev[channel]?.[key],
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await notificationService.updatePreferences(preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-slate-500 text-xs">Loading preferences...</div>;
  }

  return (
    <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-white">Notification Delivery Preferences</h3>
        <p className="text-xs text-slate-400">Configure how and when SecureAssess delivers alerts to your devices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Preferences */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
            <span className="text-xs font-bold text-white">📧 Email Notifications</span>
            <input
              type="checkbox"
              checked={preferences.email?.enabled}
              onChange={() => handleToggle("email", "enabled")}
              className="accent-blue-600 rounded"
            />
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between text-slate-300">
              <span>Assessment Invitations</span>
              <input
                type="checkbox"
                checked={preferences.email?.assessmentAssigned}
                onChange={() => handleToggle("email", "assessmentAssigned")}
                disabled={!preferences.email?.enabled}
                className="accent-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between text-slate-300">
              <span>Result Published</span>
              <input
                type="checkbox"
                checked={preferences.email?.resultPublished}
                onChange={() => handleToggle("email", "resultPublished")}
                disabled={!preferences.email?.enabled}
                className="accent-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between text-slate-300">
              <span>Certificate Issuance</span>
              <input
                type="checkbox"
                checked={preferences.email?.certificateIssued}
                onChange={() => handleToggle("email", "certificateIssued")}
                disabled={!preferences.email?.enabled}
                className="accent-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between text-slate-300">
              <span>Security Alerts (Mandatory)</span>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="accent-blue-600 rounded opacity-60"
              />
            </label>
          </div>
        </div>

        {/* In-App Preferences */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
            <span className="text-xs font-bold text-white">🔔 In-App Badges & Popups</span>
            <input
              type="checkbox"
              checked={preferences.inApp?.enabled}
              onChange={() => handleToggle("inApp", "enabled")}
              className="accent-blue-600 rounded"
            />
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between text-slate-300">
              <span>Assessment Reminders</span>
              <input
                type="checkbox"
                checked={preferences.inApp?.assessmentAssigned}
                onChange={() => handleToggle("inApp", "assessmentAssigned")}
                disabled={!preferences.inApp?.enabled}
                className="accent-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between text-slate-300">
              <span>Interview Invitations</span>
              <input
                type="checkbox"
                checked={preferences.inApp?.interviewReminder}
                onChange={() => handleToggle("inApp", "interviewReminder")}
                disabled={!preferences.inApp?.enabled}
                className="accent-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between text-slate-300">
              <span>Proctor Warnings</span>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="accent-blue-600 rounded opacity-60"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {saveSuccess && (
          <span className="text-xs text-emerald-400 font-medium">✓ Preferences updated successfully!</span>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="ml-auto px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </form>
  );
};

export default NotificationPreferences;
