import React, { useState } from "react";

export const AuditLogFilters = ({
  filters = {},
  onFilterChange,
  onExport,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ search: searchTerm });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Search by description, request ID, error code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
          >
            Search
          </button>
        </form>

        {/* Export Button */}
        <button
          onClick={() => onExport && onExport("CSV")}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
        >
          <span>📥</span> Export CSV
        </button>
      </div>

      {/* Filter Selects */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Status</label>
          <select
            value={filters.status || ""}
            onChange={(e) => onFilterChange({ status: e.target.value || undefined })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="DENIED">DENIED</option>
            <option value="WARNING">WARNING</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Resource</label>
          <select
            value={filters.resource || ""}
            onChange={(e) => onFilterChange({ resource: e.target.value || undefined })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Resources</option>
            <option value="ASSESSMENT">ASSESSMENT</option>
            <option value="ATTEMPT">ATTEMPT</option>
            <option value="RESULT">RESULT</option>
            <option value="QUESTION">QUESTION</option>
            <option value="USER">USER</option>
            <option value="ORGANIZATION">ORGANIZATION</option>
            <option value="PROCTORING_SESSION">PROCTORING</option>
            <option value="SECURITY">SECURITY</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Action</label>
          <select
            value={filters.action || ""}
            onChange={(e) => onFilterChange({ action: e.target.value || undefined })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="PERMISSION_DENIED">PERMISSION_DENIED</option>
            <option value="TENANT_ACCESS_DENIED">TENANT_ACCESS_DENIED</option>
            <option value="TOKEN_REUSE_DETECTED">TOKEN_REUSE_DETECTED</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Actor Type</label>
          <select
            value={filters.actorType || ""}
            onChange={(e) => onFilterChange({ actorType: e.target.value || undefined })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Actors</option>
            <option value="USER">USER</option>
            <option value="SYSTEM">SYSTEM</option>
            <option value="JOB">JOB</option>
            <option value="API">API</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AuditLogFilters;
