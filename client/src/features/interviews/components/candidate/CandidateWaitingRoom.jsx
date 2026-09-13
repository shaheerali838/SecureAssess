import React, { useState } from 'react';
import { Shield, Radio, Video, VideoOff, Mic, MicOff, Clock, Sparkles, FlipHorizontal } from 'lucide-react';

export const CandidateWaitingRoom = ({
  interviewTitle,
  examineeName,
  candCode,
  examinerName,
  waitingVideoRef,
  camOn,
  micOn,
  toggleCamera,
  toggleMicrophone,
}) => {
  const [isMirrored, setIsMirrored] = useState(false);

  return (
    <div className="min-h-screen bg-accent-950 flex flex-col justify-between text-white select-none">
      <header className="bg-accent-900 border-b border-accent-800 px-6 h-16 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">{interviewTitle}</span>
            <p className="text-xs text-accent-400">Oral Assessment Session</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>IN WAITING QUEUE</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col justify-center items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch">
          {/* Left: Camera & Audio Readiness Preview */}
          <div className="bg-accent-900 rounded-3xl p-5 border border-accent-800 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio size={16} className="text-emerald-400" /> Camera & Audio Check
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold">
                  Live Feed Active
                </span>
              </div>

              <div className="w-full aspect-video bg-accent-950 rounded-2xl relative overflow-hidden border border-accent-800 flex items-center justify-center">
                <video
                  ref={waitingVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)', transition: 'transform 0.2s ease-in-out' }}
                  className={`w-full h-full object-cover ${camOn ? 'block' : 'hidden'}`}
                />
                {!camOn && (
                  <div className="text-center p-4">
                    <VideoOff size={32} className="mx-auto text-accent-500 mb-2" />
                    <p className="text-xs text-accent-400">Camera is muted</p>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-accent-900/80 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1">
                  <Shield size={12} className="text-emerald-400" /> Identity Verified
                </div>

                {/* Quick Flip Camera Button */}
                <button
                  type="button"
                  onClick={() => setIsMirrored(!isMirrored)}
                  title={isMirrored ? "Unmirror Camera (Natural View)" : "Mirror Camera"}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-accent-900/80 hover:bg-accent-800 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5 transition-all border border-accent-700/50 cursor-pointer shadow-md"
                >
                  <FlipHorizontal size={13} className={isMirrored ? "text-primary-400" : "text-accent-300"} />
                  <span>{isMirrored ? "Mirrored" : "Natural View"}</span>
                </button>
              </div>
            </div>

            {/* Hardware Toggles */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-accent-800/80">
              <button
                type="button"
                onClick={toggleMicrophone}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  micOn ? 'bg-accent-800 text-white hover:bg-accent-700' : 'bg-danger-600 text-white'
                }`}
              >
                {micOn ? <Mic size={14} className="text-emerald-400" /> : <MicOff size={14} />}
                {micOn ? 'Mic Active' : 'Mic Muted'}
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  camOn ? 'bg-accent-800 text-white hover:bg-accent-700' : 'bg-danger-600 text-white'
                }`}
              >
                {camOn ? <Video size={14} className="text-emerald-400" /> : <VideoOff size={14} />}
                {camOn ? 'Camera Active' : 'Camera Paused'}
              </button>
            </div>
          </div>

          {/* Right: Waiting Status Card */}
          <div className="bg-accent-900 rounded-3xl p-6 border border-accent-800 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <Clock size={28} className="animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-white">Waiting for Examiner to Admit You</h2>
                <p className="text-xs text-accent-300 leading-relaxed">
                  You are in the waiting queue. The examiner has been notified and will admit you into the live interview room shortly.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-accent-950/90 border border-accent-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-accent-300">
                  <span>Candidate:</span>
                  <span className="font-semibold text-white">{examineeName} ({candCode})</span>
                </div>
                <div className="flex items-center justify-between text-accent-300">
                  <span>Assigned Examiner:</span>
                  <span className="font-semibold text-primary-300">{examinerName}</span>
                </div>
                <div className="flex items-center justify-between text-accent-300">
                  <span>Queue Status:</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    Ready for Admission
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-primary-950/40 border border-primary-800/40 text-xs text-primary-300 flex items-center gap-2.5">
              <Sparkles size={16} className="text-primary-400 shrink-0" />
              <span>Please keep this page open. Your screen will automatically launch the live call once admitted.</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="h-12 border-t border-accent-800/80 px-6 flex items-center justify-between text-[11px] text-accent-400 bg-accent-900/50">
        <span>SecureAssess Live Oral Evaluation System</span>
        <span>Encrypted WebRTC Channel Ready</span>
      </footer>
    </div>
  );
};
