import React from 'react';
import { Mic, MicOff, Video, VideoOff, ScreenShare, Award, StickyNote, MessageSquare, Users, PhoneOff } from 'lucide-react';

export const ExaminerControlDock = ({
  micOn,
  toggleMicrophone,
  camOn,
  toggleCamera,
  screenSharing,
  toggleScreenShare,
  activeTab,
  setActiveTab,
  mobilePanelOpen,
  setMobilePanelOpen,
  savedNotesCount = 0,
  peersCount = 2,
  handleEndInterview,
}) => {
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setMobilePanelOpen(true);
  };

  return (
    <div className="mt-4 flex items-center justify-center gap-3 shrink-0 py-2">
      {/* Mic toggle */}
      <button
        type="button"
        onClick={toggleMicrophone}
        title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg cursor-pointer ${
          micOn ? 'bg-accent-800 text-white hover:bg-accent-700' : 'bg-danger-600 text-white hover:bg-danger-500 ring-2 ring-danger-400'
        }`}
      >
        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      {/* Cam toggle */}
      <button
        type="button"
        onClick={toggleCamera}
        title={camOn ? 'Turn Off Camera' : 'Turn On Camera'}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg cursor-pointer ${
          camOn ? 'bg-accent-800 text-white hover:bg-accent-700' : 'bg-danger-600 text-white hover:bg-danger-500 ring-2 ring-danger-400'
        }`}
      >
        {camOn ? <Video size={20} /> : <VideoOff size={20} />}
      </button>

      {/* Screen share toggle */}
      <button
        type="button"
        onClick={toggleScreenShare}
        title="Share Screen"
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg cursor-pointer ${
          screenSharing ? 'bg-primary-600 text-white ring-2 ring-primary-400' : 'bg-accent-800 text-white hover:bg-accent-700'
        }`}
      >
        <ScreenShare size={20} />
      </button>

      <div className="w-px h-8 bg-accent-800 mx-0.5 sm:mx-1" />

      {/* Rubric Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('rubric')}
        className={`px-3 sm:px-4 h-11 sm:h-12 rounded-2xl flex items-center gap-1.5 sm:gap-2 text-xs font-bold transition-all shadow-lg cursor-pointer ${
          activeTab === 'rubric' && mobilePanelOpen ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
        }`}
      >
        <Award size={16} />
        <span className="hidden md:inline">Rubric & Scoring</span>
      </button>

      {/* Notes Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('notes')}
        className={`px-3 sm:px-4 h-11 sm:h-12 rounded-2xl flex items-center gap-1.5 sm:gap-2 text-xs font-bold transition-all shadow-lg cursor-pointer ${
          activeTab === 'notes' && mobilePanelOpen ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
        }`}
      >
        <StickyNote size={16} />
        <span className="hidden md:inline">Notes ({savedNotesCount})</span>
      </button>

      {/* Chat Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('chat')}
        className={`px-3 sm:px-4 h-11 sm:h-12 rounded-2xl flex items-center gap-1.5 sm:gap-2 text-xs font-bold transition-all shadow-lg cursor-pointer ${
          activeTab === 'chat' && mobilePanelOpen ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
        }`}
      >
        <MessageSquare size={16} />
        <span className="hidden md:inline">Chat</span>
      </button>

      {/* Roster Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('participants')}
        className={`px-3 sm:px-4 h-11 sm:h-12 rounded-2xl flex items-center gap-1.5 sm:gap-2 text-xs font-bold transition-all shadow-lg cursor-pointer ${
          activeTab === 'participants' && mobilePanelOpen ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
        }`}
      >
        <Users size={16} />
        <span className="hidden md:inline">Roster ({peersCount})</span>
      </button>

      <div className="w-px h-8 bg-accent-800 mx-0.5 sm:mx-1" />

      {/* End Interview button */}
      <button
        type="button"
        onClick={handleEndInterview}
        className="px-3.5 sm:px-5 h-11 sm:h-12 rounded-2xl bg-danger-600 hover:bg-danger-500 text-white flex items-center gap-1.5 sm:gap-2 transition-all font-bold text-xs shadow-lg shadow-danger-600/20 cursor-pointer"
      >
        <PhoneOff size={18} />
        <span className="hidden sm:inline">End Interview</span>
      </button>
    </div>
  );
};
