import React from 'react';
import { Volume2, VolumeX, Shield, VideoOff, FlipHorizontal } from 'lucide-react';
import { Avatar } from '@/components/ui';

export const ExaminerVideoStage = ({
  screenSharing,
  activeLayout,
  remoteVideoRef,
  remoteStreamActive,
  remoteCamOn,
  remoteMicOn,
  examineeName,
  localVideoRef,
  camOn,
  examinerName,
  isMirrored,
  setIsMirrored,
}) => {
  const candidateInitials = examineeName
    ? examineeName.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : 'CA';

  return (
    <div className={`flex-1 gap-4 overflow-hidden ${
      screenSharing
        ? 'grid grid-cols-1 lg:grid-cols-3'
        : activeLayout === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-2'
        : 'flex flex-col'
    }`}>
      {/* Box 1: Candidate's Remote Video Feed */}
      <div className={`bg-accent-900 rounded-2xl relative overflow-hidden flex flex-col justify-between border border-accent-800 shadow-xl ${
        screenSharing ? 'lg:col-span-1' : 'flex-1'
      }`}>
        <div className="flex-1 flex items-center justify-center relative bg-gradient-to-b from-accent-850 to-accent-900 overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${remoteStreamActive && remoteCamOn ? 'block' : 'hidden'}`}
          />
          {!(remoteStreamActive && remoteCamOn) && (
            <div className="text-center p-6">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-2xl ring-4 ring-primary-500/20 text-white">
                  {candidateInitials}
                </div>
                <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-accent-900 ${
                  remoteStreamActive ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                }`} />
              </div>
              <p className="text-xs text-accent-400 mt-0.5">
                {remoteStreamActive ? 'Candidate Feed Active (1080p)' : 'Connecting automatically... Ready when candidate joins'}
              </p>
              {!remoteStreamActive && (
                <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-800/80 border border-accent-700/60 text-accent-300 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Auto-Connecting WebRTC Stream...</span>
                </div>
              )}
            </div>
          )}

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-2 py-1 rounded-md bg-accent-950/80 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5">
              {remoteMicOn ? <Volume2 size={12} className="text-emerald-400" /> : <VolumeX size={12} className="text-danger-400" />}
              {remoteMicOn ? 'Candidate Audio Active' : 'Candidate Muted'}
            </span>
            <span className="px-2 py-1 rounded-md bg-accent-950/80 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5">
              <Shield size={12} className="text-primary-400" /> Proctor Verified
            </span>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-accent-950/90 border-t border-accent-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">{examineeName} (Examinee)</span>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {remoteStreamActive ? 'WebRTC P2P Active' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Box 2: Examiner's Local Video Feed or Shared Screen */}
      <div className="bg-accent-900 rounded-2xl relative overflow-hidden flex flex-col justify-between border border-accent-800 shadow-xl flex-1">
        <div className="flex-1 flex items-center justify-center relative bg-accent-900 overflow-hidden">
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
              <p className="text-sm font-semibold text-accent-300">Examiner Camera Paused</p>
            </div>
          )}

          <div className="absolute top-4 left-4">
            <span className="px-2 py-1 rounded-md bg-accent-950/80 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5">
              <Avatar name={examinerName} color="#9333ea" size="xs" />
              You ({examinerName} - Examiner)
            </span>
          </div>

          {/* Quick Flip Camera Button */}
          <button
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            title={isMirrored ? 'Unmirror Camera (Natural View)' : 'Mirror Camera'}
            className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-accent-950/80 hover:bg-accent-800/90 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5 transition-all border border-accent-700/50 cursor-pointer shadow-md"
          >
            <FlipHorizontal size={13} className={isMirrored ? 'text-primary-400' : 'text-accent-300'} />
            <span>{isMirrored ? 'Mirrored' : 'Natural View'}</span>
          </button>
        </div>

        <div className="px-4 py-2.5 bg-accent-950/90 border-t border-accent-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">{examinerName}</span>
          <span className="text-[11px] text-accent-400">
            {camOn ? 'HD Camera ON' : 'Video Muted'}
          </span>
        </div>
      </div>
    </div>
  );
};
