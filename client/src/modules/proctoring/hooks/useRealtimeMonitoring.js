import { useState, useEffect, useCallback } from "react";
import { proctoringService } from "../services/proctoring.service";

export const useRealtimeMonitoring = (sessionId, pollIntervalMs = 5000) => {
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;
    try {
      const [sessionRes, eventsRes, evidenceRes] = await Promise.all([
        proctoringService.getSessionDetails(sessionId),
        proctoringService.getSessionEvents(sessionId),
        proctoringService.getSessionEvidence(sessionId).catch(() => ({ data: [] })),
      ]);

      setSession(sessionRes.data);
      setEvents(eventsRes.data || []);
      setEvidence(evidenceRes.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(fetchSessionData, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchSessionData, pollIntervalMs]);

  const sendWarning = async (message) => {
    const res = await proctoringService.sendWarning(sessionId, message);
    await fetchSessionData();
    return res.data;
  };

  const pauseSession = async (reason = "") => {
    const res = await proctoringService.pauseSession(sessionId, reason);
    await fetchSessionData();
    return res.data;
  };

  const terminateSession = async (reason) => {
    const res = await proctoringService.terminateSession(sessionId, reason);
    await fetchSessionData();
    return res.data;
  };

  const reviewEvent = async (eventId, payload) => {
    const res = await proctoringService.reviewEvent(eventId, payload);
    await fetchSessionData();
    return res.data;
  };

  return {
    session,
    events,
    evidence,
    isLoading,
    error,
    refresh: fetchSessionData,
    sendWarning,
    pauseSession,
    terminateSession,
    reviewEvent,
  };
};

export default useRealtimeMonitoring;
