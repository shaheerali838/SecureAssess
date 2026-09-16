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
    <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-3 shrink-0 py-2 overflow-x-auto no-scrollbar max-w-full">
      {/* Mic toggle */}
      <button
        type="button"
        onClick={toggleMicrophone}
        title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg cursor-pointer shrink-0 ${
          micOn ? 'bg-accent-800 text-white hover:bg-accent-700' : 'bg-danger-600 text-white hover:bg-danger-500 ring-2 ring-danger-400'
        }`}
      >
        {micOn ? <Mic size={18} className="sm:w-5 sm:h-5" /> : <MicOff size={18} className="sm:w-5 sm:h-5" />}
      </button>

      {/* Cam toggle */}
      <button
        type="button"
        onClick={toggleCamera}
        title={camOn ? 'Turn Off Camera' : 'Turn On Camera'}
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg cursor-pointer shrink-0 ${
          camOn ? 'bg-accent-800 text-white hover:bg-accent-700' : 'bg-danger-600 text-white hover:bg-danger-500 ring-2 ring-danger-400'
        }`}
      >
        {camOn ? <Video size={18} className="sm:w-5 sm:h-5" /> : <VideoOff size={18} className="sm:w-5 sm:h-5" />}
      </button>

      {/* Screen share toggle */}
      <button
        type="button"
        onClick={toggleScreenShare}
        title="Share Screen"
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg cursor-pointer shrink-0 ${
          screenSharing ? 'bg-primary-600 text-white ring-2 ring-primary-400' : 'bg-accent-800 text-white hover:bg-accent-700'
        }`}
      >
        <ScreenShare size={18} className="sm:w-5 sm:h-5" />
      </button>

      <div className="w-px h-7 sm:h-8 bg-accent-800 mx-0.5 sm:mx-1 shrink-0" />

      {/* Rubric Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('rubric')}
        className={`px-2.5 sm:px-4 h-10 sm:h-12 rounded-2xl flex items-center gap-1.5 sm:gap-2 text-xs font-bold transition-all shadow-lg cursor-pointer shrink-0 ${
          activeTab === 'rubric' && mobilePanelOpen ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
        }`}
        title="Rubric & Evaluation Scoring"
      >
        <Award size={16} />
        <span className="hidden md:inline">Rubric & Scoring</span>
      </button>

      {/* Notes Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('notes')}
        className={`px-2.5 sm:px-4 h-10 sm:h-12 rounded-2xl flex items-center gap-1.5 sm:gap-2 text-xs font-bold transition-all shadow-lg cursor-pointer shrink-0 ${
          activeTab === 'notes' && mobilePanelOpen ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
        }`}
        title="Private Notes"
      >
        <StickyNote size={16} />
        <span className="hidden md:inline">Notes ({savedNotesCount})</span>
        <span className="md:hidden text-[10px] font-mono">({savedNotesCount})</span>
      </button>

      {/* Chat Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('chat')}
        className={`px-2.5 sm:px-4 h-10 sm:h-12 rounded-2xl flex items-center gap-1.5 sm:gap-2 text-xs font-bold transition-all shadow-lg cursor-pointer shrink-0 ${
          activeTab === 'chat' && mobilePanelOpen ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
        }`}
        title="In-Room Chat"
      >
        <MessageSquare size={16} />
        <span className="hidden md:inline">Chat</span>
      </button>

      {/* Roster Tab */}
      <button
        type="button"
        onClick={() => handleTabClick('participants')}
        className={`px-2.5 sm:px-4 h-10 sm:h-12 rounded-2xl flex items-center gap-1.5 sm:gap-2 text-xs font-bold transition-all shadow-lg cursor-pointer shrink-0 ${
          activeTab === 'participants' && mobilePanelOpen ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
        }`}
        title="Active Roster"
      >
        <Users size={16} />
        <span className="hidden md:inline">Roster ({peersCount})</span>
        <span className="md:hidden text-[10px] font-mono">({peersCount})</span>
      </button>

      <div className="w-px h-7 sm:h-8 bg-accent-800 mx-0.5 sm:mx-1 shrink-0" />

      {/* End Interview button */}
      <button
        type="button"
        onClick={handleEndInterview}
        className="px-3 sm:px-5 h-10 sm:h-12 rounded-2xl bg-danger-600 hover:bg-danger-500 text-white flex items-center gap-1.5 sm:gap-2 transition-all font-bold text-xs shadow-lg shadow-danger-600/20 cursor-pointer shrink-0"
        title="End Interview Session"
      >
        <PhoneOff size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span className="hidden sm:inline">End Interview</span>
      </button>
    </div>
  );
};
