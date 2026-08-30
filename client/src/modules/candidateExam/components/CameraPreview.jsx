import React, { useRef, useEffect } from "react";

export const CameraPreview = ({ stream, isEnabled = true, isMuted = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-700 aspect-video shadow-md flex items-center justify-center">
      {isEnabled && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
          style={{ transform: "scaleX(-1)" }}
        />
      ) : (
        <div className="text-center p-4 text-slate-400">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Camera Feed Inactive</span>
        </div>
      )}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-medium text-white">
        <span className={`w-2 h-2 rounded-full ${isEnabled ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
        <span>{isEnabled ? "Live Feed" : "Camera Off"}</span>
      </div>
    </div>
  );
};

export default CameraPreview;
