import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Hand, VideoOff, FlipHorizontal } from 'lucide-react';
import { Avatar } from '@/components/ui';

export const CandidateVideoStage = ({
  localVideoRef,
  remoteVideoRef,
  camOn,
  micOn,
  handRaised,
  examineeName,
  examinerName,
  remoteStreamActive,
  remoteCamOn,
}) => {
  const [isMirrored, setIsMirrored] = useState(false);

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
      {/* 1. Candidate's Self Camera Stream */}
      <div className="bg-accent-900 rounded-2xl relative overflow-hidden flex flex-col justify-between border border-accent-800 shadow-xl">
        <div className="flex-1 flex items-center justify-center relative bg-gradient-to-b from-accent-850 to-accent-900 overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)', transition: 'transform 0.2s ease-in-out' }}
            className={`w-full h-full object-cover ${camOn ? 'block' : 'hidden'}`}
          />
          {!camOn && (
            <div className="text-center p-6">
              <div className="w-20 h-20 rounded-full bg-accent-800 flex items-center justify-center mx-auto mb-3 text-accent-500">
                <VideoOff size={32} />
              </div>
              <p className="text-sm font-semibold text-accent-300">Your Camera is Paused</p>
            </div>
          )}

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-2 py-1 rounded-md bg-accent-950/80 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5">
              {micOn ? <Volume2 size={12} className="text-emerald-400" /> : <VolumeX size={12} className="text-danger-400" />}
              {micOn ? 'Audio Active' : 'Audio Muted'}
            </span>
            <span className="px-2 py-1 rounded-md bg-accent-950/80 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5">
              <Shield size={12} className="text-emerald-400" /> Proctor Verified
            </span>
            {handRaised && (
              <span className="px-2 py-1 rounded-md bg-amber-500/90 text-[11px] font-bold text-white flex items-center gap-1 animate-bounce">
                <Hand size={12} /> Hand Raised
              </span>
            )}
          </div>

          {/* Quick Flip Camera Button */}
          <button
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            title={isMirrored ? "Unmirror Camera (Natural View)" : "Mirror Camera"}
            className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-accent-950/80 hover:bg-accent-800/90 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5 transition-all border border-accent-700/50 cursor-pointer shadow-md"
          >
            <FlipHorizontal size={13} className={isMirrored ? "text-primary-400" : "text-accent-300"} />
            <span>{isMirrored ? "Mirrored" : "Natural View"}</span>
          </button>
        </div>

        <div className="px-4 py-2.5 bg-accent-950/90 border-t border-accent-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">You ({examineeName})</span>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            WebRTC P2P Active
          </span>
        </div>
      </div>

      {/* 2. Examiner's Remote Camera Stream */}
      <div className="bg-accent-900 rounded-2xl relative overflow-hidden flex flex-col justify-between border border-accent-800 shadow-xl">
        <div className="flex-1 flex items-center justify-center relative bg-accent-900 overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${remoteStreamActive && remoteCamOn ? 'block' : 'hidden'}`}
          />
          {!(remoteStreamActive && remoteCamOn) && (
            <div className="text-center p-6">
              <div className="relative inline-block mb-3">
                <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-2xl font-bold shadow-xl">
                  {examinerName ? examinerName.slice(0, 2).toUpperCase() : 'EX'}
                </div>
                <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full ring-2 ring-accent-900 ${
                  remoteStreamActive ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                }`} />
              </div>
              <p className="text-sm font-bold text-white">{examinerName}</p>
              <p className="text-xs text-accent-400">
                {remoteStreamActive ? 'Examiner Camera Active (1080p)' : 'Connecting with examiner feed...'}
              </p>
            </div>
          )}

          <div className="absolute top-4 left-4">
            <span className="px-2 py-1 rounded-md bg-accent-950/80 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5">
              <Avatar name={examinerName} color="#9333ea" size="xs" />
              Lead Examiner / Host
            </span>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-accent-950/90 border-t border-accent-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">{examinerName}</span>
          <span className="text-[11px] text-accent-400 font-mono">
            {remoteStreamActive ? '1080p 60fps Ultra HD' : 'Establishing Secure P2P...'}
          </span>
        </div>
      </div>
    </div>
  );
};
