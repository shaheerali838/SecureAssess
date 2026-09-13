import React from 'react';
import { Mic, MicOff, Video, VideoOff, ScreenShare, Hand, MessageSquare, PhoneOff } from 'lucide-react';

export const CandidateMediaControls = ({
  micOn,
  camOn,
  screenSharing,
  handRaised,
  isChatOpen,
  unreadCount = 0,
  toggleMicrophone,
  toggleCamera,
  toggleScreenShare,
  handleToggleHand,
  setIsChatOpen,
  handleLeaveInterview,
}) => {
  return (
    <footer className="h-20 bg-accent-900/90 backdrop-blur-md border-t border-accent-800 px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left: Device status */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-accent-400">
          Status: <span className="text-emerald-400 font-semibold">Active Oral Defense</span>
        </span>
      </div>

      {/* Center Toolbar */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleMicrophone}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            micOn
              ? 'bg-accent-800 text-white hover:bg-accent-700'
              : 'bg-danger-600 text-white hover:bg-danger-500'
          }`}
          title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        <button
          type="button"
          onClick={toggleCamera}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            camOn
              ? 'bg-accent-800 text-white hover:bg-accent-700'
              : 'bg-danger-600 text-white hover:bg-danger-500'
          }`}
          title={camOn ? 'Pause Camera' : 'Turn On Camera'}
        >
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        <button
          type="button"
          onClick={toggleScreenShare}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            screenSharing
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : 'bg-accent-800 text-accent-300 hover:bg-accent-700 hover:text-white'
          }`}
          title={screenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
        >
          <ScreenShare size={18} />
        </button>

        <button
          type="button"
          onClick={handleToggleHand}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            handRaised
              ? 'bg-amber-500 text-white animate-bounce'
              : 'bg-accent-800 text-accent-300 hover:bg-accent-700 hover:text-white'
          }`}
          title={handRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand size={18} />
        </button>

        <button
          type="button"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-11 h-11 rounded-xl flex items-center justify-center relative transition-all ${
            isChatOpen
              ? 'bg-primary-600 text-white'
              : 'bg-accent-800 text-accent-300 hover:bg-accent-700 hover:text-white'
          }`}
          title="Toggle In-Session Chat"
        >
          <MessageSquare size={18} />
          {!isChatOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-accent-900">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Right: Leave */}
      <div>
        <button
          type="button"
          onClick={handleLeaveInterview}
          className="px-4 py-2.5 rounded-xl bg-danger-600/20 hover:bg-danger-600 border border-danger-500/30 text-danger-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
        >
          <PhoneOff size={15} /> Leave Call
        </button>
      </div>
    </footer>
  );
};
