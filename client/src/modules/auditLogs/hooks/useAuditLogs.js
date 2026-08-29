import { useState, useEffect, useCallback } from "react";
import { auditLogService } from "../services/auditLog.service";

export const useAuditLogs = (initialFilters = {}) => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async (customParams = {}) => {
    try {
      setIsLoading(true);
      const queryParams = { ...filters, ...customParams };
      const res = await auditLogService.getAuditLogs(queryParams);
      setLogs(res.data?.items || []);
      setPagination(res.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const changePage = (page) => {
    fetchLogs({ page });
  };

  return {
    logs,
    pagination,
    filters,
    isLoading,
    error,
    updateFilters,
    changePage,
    refetch: fetchLogs,
  };
};

export default useAuditLogs;
