import React from "react";

export const CandidateVideo = ({
  candidate,
  cameraActive = true,
  micActive = true,
  screenActive = false,
}) => {
  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 aspect-video flex items-center justify-center group shadow-lg">
      {cameraActive ? (
        <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
          <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center text-xl font-bold text-slate-300">
            {candidate?.firstName?.[0] || "C"}{candidate?.lastName?.[0] || "1"}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />
        </div>
      ) : (
        <div className="text-center p-4 text-slate-500">
          <div className="text-3xl mb-1">📵</div>
          <div className="text-xs">Camera Feed Inactive</div>
        </div>
      )}

      {/* Media Overlay Badges */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-white backdrop-blur-md ${cameraActive ? "bg-emerald-500/80" : "bg-red-500/80"}`}>
          CAM {cameraActive ? "ON" : "OFF"}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-white backdrop-blur-md ${micActive ? "bg-emerald-500/80" : "bg-red-500/80"}`}>
          MIC {micActive ? "ON" : "OFF"}
        </span>
        {screenActive && (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-white bg-blue-500/80 backdrop-blur-md">
            SCREEN LIVE
          </span>
        )}
      </div>

      {/* Candidate Name Bar */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
        <span className="font-semibold truncate">
          {candidate?.firstName} {candidate?.lastName}
        </span>
        <span className="text-[10px] text-slate-300 font-mono">
          {candidate?.candidateCode}
        </span>
      </div>
    </div>
  );
};

export default CandidateVideo;
