import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing proctored examination countdown timers with auto-submit alerts.
 *
 * @param {Object} options
 * @param {number} options.durationMinutes - Total exam duration in minutes
 * @param {function} [options.onExpire] - Callback invoked when timer hits 0
 * @param {function} [options.onWarning] - Callback invoked when entering low-time threshold
 * @param {number} [options.warningMinutes=5] - Minutes remaining before triggering warning
 */
export const useExamTimer = ({
  durationMinutes = 60,
  onExpire,
  onWarning,
  warningMinutes = 5,
} = {}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isWarningTriggered, setIsWarningTriggered] = useState(false);
  const onExpireRef = useRef(onExpire);
  const onWarningRef = useRef(onWarning);

  useEffect(() => {
    onExpireRef.current = onExpire;
    onWarningRef.current = onWarning;
  }, [onExpire, onWarning]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (typeof onExpireRef.current === 'function') {
            onExpireRef.current();
          }
          return 0;
        }

        const next = prev - 1;
        if (next <= warningMinutes * 60 && !isWarningTriggered) {
          setIsWarningTriggered(true);
          if (typeof onWarningRef.current === 'function') {
            onWarningRef.current(next);
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, warningMinutes, isWarningTriggered]);

  const pauseTimer = useCallback(() => setIsPaused(true), []);
  const resumeTimer = useCallback(() => setIsPaused(false), []);
  const resetTimer = useCallback((newMinutes = durationMinutes) => {
    setSecondsRemaining(newMinutes * 60);
    setIsWarningTriggered(false);
  }, [durationMinutes]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const formattedTime = [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ]
    .filter(Boolean)
    .join(':');

  const progressPercent = Math.max(
    0,
    Math.min(100, (secondsRemaining / (durationMinutes * 60)) * 100)
  );

  return {
    secondsRemaining,
    formattedTime,
    progressPercent,
    isUrgent: secondsRemaining <= warningMinutes * 60,
    isExpired: secondsRemaining === 0,
    isPaused,
    pauseTimer,
    resumeTimer,
    resetTimer,
  };
};

export default useExamTimer;
