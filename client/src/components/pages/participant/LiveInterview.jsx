import { useState, useEffect } from 'react';
import {
  Shield, Mic, MicOff, Video, VideoOff, ScreenShare, MessageSquare,
  Users, Settings, PhoneOff, Camera, Volume2, MoreVertical, Send,
  Plus, StickyNote,
} from 'lucide-react';
import { Badge } from '@/components/ui';






export function LiveInterview({ onNavigate }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [elapsed, setElapsed] = useState(2538); // 42:18
  const [activeQuestion, setActiveQuestion] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const interviewQuestions = [
    { q: 'Tell us about yourself and your background.', notes: 'Look for clear communication and relevant experience.' },
    { q: 'Describe a difficult situation you faced and how you resolved it.', notes: 'Assess problem-solving approach and resilience.' },
    { q: 'Walk us through a recent project you are proud of.', notes: 'Evaluate technical depth and ownership.' },
    { q: 'How do you handle working under pressure during critical situations?', notes: 'Industry-specific: assess composure and decision-making.' },
    { q: 'Where do you see yourself in the next 3 years?', notes: 'Evaluate ambition and alignment with organizational goals.' },
  ];

  return (
    <div className="h-screen bg-accent-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="bg-accent-900 border-b border-accent-800 px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Interview · Sarah Williams</p>
            <p className="text-xs text-accent-400">Pilot Training Program</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="danger" dot className="bg-danger-600/20 text-danger-300 border-danger-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-danger-500 animate-pulse" />
            Live
          </Badge>
          <span className="text-sm font-mono text-white">{formatTime(elapsed)}</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main video area */}
        <div className="flex-1 flex flex-col p-4">
          {/* Participant video (large) */}
          <div className="flex-1 bg-accent-800 rounded-2xl relative overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-accent-700 flex items-center justify-center mx-auto mb-3">
                <Camera size={36} className="text-accent-500" />
              </div>
              <p className="text-accent-300 text-sm">Sarah Williams</p>
              <p className="text-accent-500 text-xs">Participant Camera</p>
            </div>
            {/* Name label */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-accent-950/80 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">Sarah Williams</span>
            </div>
            {/* Recording indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-danger-600/90">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-medium text-white">Recording</span>
            </div>
          </div>

          {/* Interviewer video (small, picture-in-picture) */}
          <div className="absolute bottom-24 right-8 w-48 h-32 bg-accent-800 rounded-xl border-2 border-accent-700 relative overflow-hidden hidden lg:block">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-accent-700 flex items-center justify-center">
                <Camera size={18} className="text-accent-500" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-accent-950/80">
              <span className="text-xs text-white">Captain Lara Hassan</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-accent-700 text-white hover:bg-accent-600' : 'bg-danger-600 text-white hover:bg-danger-500'}`}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={() => setCamOn(!camOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-accent-700 text-white hover:bg-accent-600' : 'bg-danger-600 text-white hover:bg-danger-500'}`}
            >
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button className="w-12 h-12 rounded-full bg-accent-700 text-white hover:bg-accent-600 flex items-center justify-center transition-colors">
              <ScreenShare size={20} />
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showChat ? 'bg-primary-600 text-white' : 'bg-accent-700 text-white hover:bg-accent-600'}`}
            >
              <MessageSquare size={20} />
            </button>
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showParticipants ? 'bg-primary-600 text-white' : 'bg-accent-700 text-white hover:bg-accent-600'}`}
            >
              <Users size={20} />
            </button>
            <button className="w-12 h-12 rounded-full bg-accent-700 text-white hover:bg-accent-600 flex items-center justify-center transition-colors">
              <Settings size={20} />
            </button>
            <div className="w-px h-8 bg-accent-700 mx-1" />
            <button
              onClick={() => onNavigate('participant-evaluation')}
              className="px-4 h-12 rounded-full bg-danger-600 text-white hover:bg-danger-500 flex items-center gap-2 transition-colors"
            >
              <PhoneOff size={20} />
              <span className="text-sm font-medium">End Interview</span>
            </button>
          </div>
        </div>

        {/* Right panel - Interview guide / Chat */}
        <div className="w-80 bg-accent-900 border-l border-accent-800 flex flex-col shrink-0 hidden md:flex">
          {showChat ? (
            <>
              <div className="px-4 h-12 border-b border-accent-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Chat</span>
                <button onClick={() => setShowChat(false)} className="text-accent-400 hover:text-white"><MoreVertical size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-accent-400">Captain Lara Hassan</span>
                  <div className="bg-accent-800 rounded-lg rounded-tl-none px-3 py-2 max-w-[85%]">
                    <p className="text-sm text-white">Welcome to the interview. Please take your time with each question.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-xs text-accent-400">You</span>
                  <div className="bg-primary-600 rounded-lg rounded-tr-none px-3 py-2 max-w-[85%]">
                    <p className="text-sm text-white">Thank you, I'm ready to begin.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 border-t border-accent-800 flex gap-2">
                <input type="text" placeholder="Type a message..." className="flex-1 h-9 px-3 text-sm rounded-lg bg-accent-800 text-white placeholder:text-accent-500 border border-accent-700 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                <button className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-500 transition-colors">
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 h-12 border-b border-accent-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Interview Guide</span>
                <button className="text-accent-400 hover:text-white"><Plus size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {interviewQuestions.map((iq, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveQuestion(i)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${activeQuestion === i ? 'bg-primary-600/20 border border-primary-500/30' : 'bg-accent-800 hover:bg-accent-700'}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-bold mt-0.5 ${activeQuestion === i ? 'text-primary-400' : 'text-accent-500'}`}>Q{i + 1}</span>
                      <div className="flex-1">
                        <p className={`text-sm ${activeQuestion === i ? 'text-white' : 'text-accent-300'}`}>{iq.q}</p>
                        <p className="text-xs text-accent-500 mt-1 italic">{iq.notes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-accent-800 space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-800 text-accent-300 hover:bg-accent-700 text-sm transition-colors">
                  <Plus size={14} /> Add Question
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-warning-600/20 text-warning-300 hover:bg-warning-600/30 text-sm transition-colors">
                  <StickyNote size={14} /> Add Private Note
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Connection status bar */}
      <div className="bg-accent-900 border-t border-accent-800 px-4 h-8 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 text-success-500">
          <span className="w-2 h-2 rounded-full bg-success-500" />
          <span>Connected · Excellent quality</span>
        </div>
        <div className="flex items-center gap-3 text-accent-400">
          <span className="flex items-center gap-1"><Volume2 size={12} /> Audio: Clear</span>
          <span className="flex items-center gap-1"><Video size={12} /> Video: HD</span>
        </div>
      </div>
    </div>
  );
}
