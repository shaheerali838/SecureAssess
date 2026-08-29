import { useEffect, useRef } from 'react';
import examService from '../services/exam.service';

export const useExamHeartbeat = (attemptId, intervalMs = 30000, onSyncTime = null) => {
  const onSyncTimeRef = useRef(onSyncTime);
  onSyncTimeRef.current = onSyncTime;

  useEffect(() => {
    if (!attemptId) return;

    const ping = async () => {
      try {
        const res = await examService.sendHeartbeat(attemptId);
        const data = res?.data || res;
        if (data?.timeRemainingSeconds !== undefined && onSyncTimeRef.current) {
          onSyncTimeRef.current(data.timeRemainingSeconds);
        }
      } catch (err) {
        console.warn('Heartbeat synchronization missed:', err);
      }
    };

    const interval = setInterval(ping, intervalMs);
    return () => clearInterval(interval);
  }, [attemptId, intervalMs]);
};

export default useExamHeartbeat;
