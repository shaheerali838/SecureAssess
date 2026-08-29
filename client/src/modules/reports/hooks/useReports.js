import { useState, useEffect, useCallback } from "react";
import { reportsService } from "../services/reports.service";

export const useReports = () => {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async (params = {}) => {
    try {
      setIsLoading(true);
      const res = await reportsService.getOrganizationDashboard(params);
      setDashboard(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    dashboard,
    isLoading,
    error,
    fetchDashboard,
  };
};

export default useReports;
