import { useEffect, useRef, useCallback } from "react";
import { proctoringService } from "../services/proctoring.service";

export const useSecurityEvents = (sessionId, isEnabled = true) => {
  const lastEventTimeRef = useRef({});

  const reportEvent = useCallback(
    async (type, metadata = {}, confidence = 1.0) => {
      if (!sessionId || !isEnabled) return;

      // Throttle client events within 1500ms
      const now = Date.now();
      const lastTime = lastEventTimeRef.current[type] || 0;
      if (now - lastTime < 1500) return;
      lastEventTimeRef.current[type] = now;

      try {
        await proctoringService.recordEvent(sessionId, {
          type,
          occurredAt: new Date().toISOString(),
          confidence,
          metadata,
          source: "BROWSER",
        });
      } catch (err) {
        console.warn(`Failed to report proctoring event ${type}:`, err);
      }
    },
    [sessionId, isEnabled]
  );

  useEffect(() => {
    if (!sessionId || !isEnabled) return;

    // 1. Tab / Visibility Switch
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportEvent("TAB_SWITCH", { state: "hidden" });
      } else {
        reportEvent("WINDOW_FOCUS", { state: "visible" });
      }
    };

    // 2. Window Blur / Focus
    const handleBlur = () => {
      reportEvent("WINDOW_BLUR");
    };

    // 3. Fullscreen Exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportEvent("FULLSCREEN_EXIT");
      } else {
        reportEvent("FULLSCREEN_ENTERED");
      }
    };

    // 4. Copy / Paste Attempts
    const handleCopy = (e) => {
      reportEvent("COPY_ATTEMPT");
    };
    const handlePaste = (e) => {
      reportEvent("PASTE_ATTEMPT");
    };

    // 5. Context Menu (Right Click)
    const handleContextMenu = (e) => {
      reportEvent("RIGHT_CLICK");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [sessionId, isEnabled, reportEvent]);

  return { reportEvent };
};

export default useSecurityEvents;
