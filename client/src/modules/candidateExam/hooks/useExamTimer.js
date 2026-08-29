import { useState, useEffect, useRef } from 'react';

export const useExamTimer = (initialSeconds = 0, onExpire = null) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isLowTime = secondsRemaining > 0 && secondsRemaining <= 300; // Under 5 mins

  return {
    secondsRemaining,
    formattedTime: formatTime(secondsRemaining),
    isLowTime,
    isExpired: secondsRemaining <= 0,
    setSecondsRemaining,
  };
};

export default useExamTimer;
