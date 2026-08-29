import { useState, useEffect, useRef, useCallback } from "react";
import { proctoringService } from "../services/proctoring.service";

export const useProctoring = (attemptId, initialOptions = {}) => {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("NOT_STARTED");
  const [mediaStream, setMediaStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [error, setError] = useState(null);
  const heartbeatIntervalRef = useRef(null);

  const startProctoring = useCallback(async () => {
    try {
      setError(null);
      // 1. Request Media Permissions if enabled
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMediaStream(stream);
      } catch (mediaErr) {
        console.warn("Camera/Mic stream access failed:", mediaErr);
      }

      // 2. Start Session on Server
      const res = await proctoringService.startSession(attemptId, {
        cameraEnabled: Boolean(stream?.getVideoTracks().length),
        microphoneEnabled: Boolean(stream?.getAudioTracks().length),
        browserInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
      });

      const activeSession = res.data.session;
      setSession(activeSession);
      setStatus(activeSession.status);

      // 3. Heartbeat setup every 15s
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = setInterval(async () => {
        try {
          const hbRes = await proctoringService.sendHeartbeat(activeSession._id);
          if (hbRes.data?.warnings?.length) {
            setWarnings(hbRes.data.warnings);
          }
        } catch (hbErr) {
          console.warn("Proctoring heartbeat error:", hbErr);
        }
      }, 15000);

      return activeSession;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  }, [attemptId]);

  const endProctoring = useCallback(async (reason = "") => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    if (session?._id) {
      try {
        await proctoringService.endSession(session._id, reason);
      } catch (err) {
        console.warn("End proctoring failed:", err);
      }
    }
    setStatus("ENDED");
  }, [session, mediaStream, screenStream]);

  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
    };
  }, [mediaStream]);

  return {
    session,
    status,
    mediaStream,
    screenStream,
    warnings,
    error,
    startProctoring,
    endProctoring,
  };
};

export default useProctoring;
