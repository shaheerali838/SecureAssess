import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing client-side proctoring telemetry,
 * focus loss/tab-switch detection, and anomaly logging.
 *
 * @param {Object} options
 * @param {boolean} [options.enabled=true] - Whether monitoring is active
 * @param {function} [options.onViolation] - Callback when an integrity violation occurs
 * @param {number} [options.maxAllowedViolations=3] - Violation limit before escalation
 */
export const useProctoring = ({
  enabled = true,
  onViolation,
  maxAllowedViolations = 3,
} = {}) => {
  const [violations, setViolations] = useState([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [integrityScore, setIntegrityScore] = useState(100);
  const onViolationRef = useRef(onViolation);

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  const recordViolation = useCallback((type, message) => {
    const timestamp = new Date().toISOString();
    const violationEntry = { id: `viol-${Date.now()}`, type, message, timestamp };

    setViolations((prev) => [...prev, violationEntry]);
    setIntegrityScore((prev) => Math.max(0, prev - (type === 'TAB_SWITCH' ? 5 : 8)));

    if (typeof onViolationRef.current === 'function') {
      onViolationRef.current(violationEntry);
    }
  }, []);

  // Monitor visibility change (Tab Switch / Window Blur)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          recordViolation(
            'TAB_SWITCH',
            `Focus lost / Tab switch detected (Event #${next})`
          );
          return next;
        });
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenExits((prev) => {
          const next = prev + 1;
          recordViolation(
            'FULLSCREEN_EXIT',
            `Candidate exited strict full-screen exam mode (Event #${next})`
          );
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [enabled, recordViolation]);

  const requestFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err.message);
    }
  }, []);

  return {
    violations,
    tabSwitchCount,
    fullscreenExits,
    integrityScore,
    isEscalated: violations.length >= maxAllowedViolations,
    requestFullscreen,
    recordViolation,
  };
};

export default useProctoring;
