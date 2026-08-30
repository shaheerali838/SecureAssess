import React from "react";
import SecurityEventBadge from "./SecurityEventBadge";

export const AuditLogDetails = ({ log, onClose }) => {
  if (!log) return null;

  const actorLabel = log.actorId
    ? `${log.actorId.firstName || ""} ${log.actorId.lastName || ""} (${log.actorId.email || ""})`
    : log.actorType;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white">Audit Event Details</h3>
            <SecurityEventBadge status={log.status} action={log.action} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Action</span>
            <span className="font-bold text-white text-sm font-mono">{log.action}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Resource</span>
            <span className="font-bold text-white text-sm font-mono">{log.resource} ({log.resourceId || "N/A"})</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl col-span-2">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Actor</span>
            <span className="font-semibold text-slate-200">{actorLabel}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">IP Address</span>
            <span className="font-mono text-slate-300">{log.ipAddress || "—"}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Request ID</span>
            <span className="font-mono text-slate-300">{log.requestId || "—"}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl col-span-2">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Description</span>
            <span className="text-slate-200">{log.description}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl col-span-2">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Timestamp</span>
            <span className="font-mono text-slate-300">
              {log.createdAt ? new Date(log.createdAt).toUTCString() : "—"}
            </span>
          </div>
        </div>

        {/* Metadata JSON Viewer */}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-semibold text-slate-400">Contextual Metadata</span>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-40">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDetails;
