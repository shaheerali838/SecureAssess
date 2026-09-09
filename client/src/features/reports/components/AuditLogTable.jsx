import React from "react";
import SecurityEventBadge from "./SecurityEventBadge";

export const AuditLogTable = ({
  logs = [],
  isLoading = false,
  onSelectLog,
  pagination = {},
  onPageChange,
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
        Fetching audit event trails...
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
        No audit events matching current criteria.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Resource</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Request ID</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.map((log) => {
              const actorLabel = log.actorId
                ? `${log.actorId.firstName || ""} ${log.actorId.lastName || ""} (${log.actorId.email || ""})`
                : log.actorType;

              return (
                <tr
                  key={log._id}
                  onClick={() => onSelectLog && onSelectLog(log)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-200">
                    {actorLabel}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-400">
                    {log.action}
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                      {log.resource}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <SecurityEventBadge status={log.status} action={log.action} />
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                    {log.requestId || "—"}
                  </td>
                  <td className="py-3 px-4 text-right text-blue-400 font-semibold hover:underline">
                    View →
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/40 text-xs">
          <span className="text-slate-400">
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total logs)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 transition"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogTable;
