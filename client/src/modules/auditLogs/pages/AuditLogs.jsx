import React, { useState } from "react";
import useAuditLogs from "../hooks/useAuditLogs";
import AuditLogTable from "../components/AuditLogTable";
import AuditLogFilters from "../components/AuditLogFilters";
import AuditLogDetails from "../components/AuditLogDetails";
import auditLogService from "../services/auditLog.service";

export const AuditLogs = () => {
  const {
    logs,
    pagination,
    filters,
    isLoading,
    error,
    updateFilters,
    changePage,
  } = useAuditLogs();

  const [selectedLog, setSelectedLog] = useState(null);

  const handleExport = async (format = "CSV") => {
    try {
      const data = await auditLogService.exportAuditLogs({ ...filters, format });
      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Failed to export audit logs:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>🛡️</span> Security & Audit Activity
          </h1>
          <p className="text-xs text-slate-400">
            Immutable transaction records, authorization security audits, and tenant lifecycle activity.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Filters */}
      <AuditLogFilters
        filters={filters}
        onFilterChange={updateFilters}
        onExport={handleExport}
      />

      {/* Table */}
      <AuditLogTable
        logs={logs}
        isLoading={isLoading}
        onSelectLog={(log) => setSelectedLog(log)}
        pagination={pagination}
        onPageChange={changePage}
      />

      {/* Details Modal */}
      <AuditLogDetails
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};

export default AuditLogs;
