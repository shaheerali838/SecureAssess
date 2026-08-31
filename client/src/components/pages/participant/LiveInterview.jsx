import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Mic, MicOff, Video, VideoOff, ScreenShare, MessageSquare,
  Users, Settings, PhoneOff, Camera, Volume2, MoreVertical, Send,
  Plus, StickyNote, RefreshCw, UserCheck, LogOut, X, ArrowLeft,
  LayoutDashboard, CheckCircle2
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import interviewService from '@/services/interview.service';
import socketService from '@/services/socketService';
import { useAuth } from '@/contexts/AuthContext';

export function LiveInterview({ onNavigate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [interview, setInterview] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [privateNotes, setPrivateNotes] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Captain Lara Hassan', text: 'Welcome to the interview session. Please take your time with each question.', time: '00:01' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting to WebRTC relay...');
  const [isSignalingConnected, setIsSignalingConnected] = useState(false);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);

  // 1. Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Initialize Camera & Mic Media
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
          if (active) {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          }
        }
      } catch (mediaErr) {
        console.warn('[LiveInterview] Local camera access note:', mediaErr.message);
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 3. Join Interview Room & WebRTC Socket Signaling
  useEffect(() => {
    let isMounted = true;

    async function setupInterviewRoom() {
      try {
        let interviewId = sessionStorage.getItem('activeInterviewId');

        if (!interviewId || interviewId.startsWith('temp_')) {
          try {
            const listRes = await interviewService.getInterviews({ limit: 1 });
            const items = Array.isArray(listRes) ? listRes : (listRes?.items || listRes?.interviews || listRes?.data?.items || listRes?.data || []);
            if (items.length > 0) {
              interviewId = items[0]._id || items[0].id;
              if (isMounted) setInterview(items[0]);
            }
          } catch (lErr) {
            console.warn('Interviews list query note:', lErr.message);
          }
        } else {
          try {
            const detailsRes = await interviewService.getInterviewById(interviewId);
            const dData = detailsRes?.data || detailsRes;
            if (isMounted && dData) setInterview(dData);
          } catch (dErr) {
            console.warn('Interview details note:', dErr.message);
          }
        }

        let joinRes = null;
        let joinToken = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
        if (interviewId && !interviewId.startsWith('temp_')) {
          try {
            joinRes = await interviewService.joinInterview(interviewId);
            const jData = joinRes?.data || joinRes;
            if (isMounted) setSessionData(jData);
            if (jData?.token) joinToken = jData.token;
          } catch (jErr) {
            console.warn('Interview join note:', jErr.message);
          }
        }

        // Connect to /interviews socket namespace
        const socket = socketService.connectInterviewSocket(joinToken);
        socketRef.current = socket;

        if (socket) {
          socket.on('connect', () => {
            if (isMounted) {
              setIsSignalingConnected(true);
              setConnectionStatus('Connected · WebRTC Relay Active');
              if (interviewId) {
                socket.emit('interview:join', {
                  interviewId,
                  token: joinToken,
                  role: 'INTERVIEWER',
                  userName: user?.name || 'Sarah Williams',
                });
              }
            }
          });

          socket.on('participant:joined', (p) => {
            console.log('[LiveInterview] Remote participant connected:', p);
            if (isMounted) {
              setChatMessages((prev) => [
                ...prev,
                { sender: 'System', text: `${p.name || 'Participant'} entered the interview session.`, time: formatTime(elapsed) },
              ]);
            }
          });

          socket.on('chat:message', (msg) => {
            if (isMounted && msg) {
              setChatMessages((prev) => [
                ...prev,
                {
                  sender: msg.senderName || msg.sender || 'Examiner',
                  text: msg.message || msg.text || '',
                  time: formatTime(elapsed),
                },
              ]);
            }
          });

          socket.on('interview:ended', () => {
            if (isMounted) {
              cleanupAndExit();
              onNavigate('org-interviews');
            }
          });
        }
      } catch (err) {
        console.warn('LiveInterview setup note:', err.message);
        if (isMounted) setConnectionStatus('WebRTC Ready (Direct P2P)');
      }
    }

    setupInterviewRoom();

    return () => {
      isMounted = false;
      cleanupAndExit();
    };
  }, []);

  const cleanupAndExit = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (socketRef.current) {
      try {
        const iId = interview?._id || sessionStorage.getItem('activeInterviewId') || 'live-session';
        socketRef.current.emit('interview:leave', { interviewId: iId });
        socketRef.current.disconnect();
      } catch (sErr) {
        console.warn('Socket disconnect note:', sErr);
      }
      socketRef.current = null;
    }
  };

  const handleLeaveRoom = () => {
    cleanupAndExit();
    sessionStorage.removeItem('activeInterviewId');
    if (typeof onNavigate === 'function') {
      try { onNavigate('org-interviews'); } catch (e) {}
    }
    navigate('/organization/interviews');
  };

  const handleGoDashboard = () => {
    cleanupAndExit();
    sessionStorage.removeItem('activeInterviewId');
    if (typeof onNavigate === 'function') {
      try { onNavigate('org-dashboard'); } catch (e) {}
    }
    navigate('/organization/dashboard');
  };

  const handleEndInterview = async () => {
    if (window.confirm('Are you sure you want to end and finalize this interview session?')) {
      try {
        const currentId = interview?._id || sessionStorage.getItem('activeInterviewId');
        if (currentId && !currentId.startsWith('temp_')) {
          await interviewService.endInterview(currentId);
        }
        if (socketRef.current) {
          socketRef.current.emit('interview:ended', { interviewId: currentId });
        }
      } catch (err) {
        console.warn('End interview note:', err.message);
      }
      cleanupAndExit();
      sessionStorage.removeItem('activeInterviewId');
      if (typeof onNavigate === 'function') {
        try { onNavigate('participant-evaluation'); } catch (e) {}
      }
      navigate('/candidate/evaluation');
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleToggleMic = () => {
    const nextState = !micOn;
    setMicOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = nextState));
    }
    if (socketRef.current) {
      socketRef.current.emit('media:microphone-changed', { enabled: nextState });
    }
  };

  const handleToggleCam = () => {
    const nextState = !camOn;
    setCamOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = nextState));
    }
    if (socketRef.current) {
      socketRef.current.emit('media:camera-changed', { enabled: nextState });
    }
  };

  const handleSendChat = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      sender: user?.name || 'You',
      text: chatInput.trim(),
      time: formatTime(elapsed),
    };

    setChatMessages((prev) => [...prev, newMsg]);

    if (socketRef.current) {
      socketRef.current.emit('chat:message', {
        interviewId: interview?._id || 'live-session',
        senderName: user?.name || 'Sarah Williams',
        message: chatInput.trim(),
      });
    }

    setChatInput('');
  };

  const handleToggleScreenShare = async () => {
    try {
      if (!screenSharing) {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          setScreenSharing(true);
          if (socketRef.current) {
            socketRef.current.emit('media:screen-share-started', { interviewId: interview?._id || 'live-session' });
          }
          screenStream.getVideoTracks()[0].onended = () => {
            setScreenSharing(false);
            if (localVideoRef.current && localStreamRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
          };
        }
      } else {
        setScreenSharing(false);
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        if (socketRef.current) {
          socketRef.current.emit('media:screen-share-stopped', { interviewId: interview?._id || 'live-session' });
        }
      }
    } catch (err) {
      console.warn('Screen sharing note:', err.message);
    }
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setPrivateNotes((prev) => [
      ...prev,
      { text: noteInput.trim(), time: formatTime(elapsed) }
    ]);
    setNoteInput('');
    setShowNoteModal(false);
  };

  const candidateName = interview?.candidate?.firstName
    ? `${interview.candidate.firstName} ${interview.candidate.lastName || ''}`
    : (interview?.participant || 'Sarah Williams');
  const interviewerName = interview?.panelists?.[0]?.name || (interview?.createdBy ? `${interview.createdBy.firstName || ''} ${interview.createdBy.lastName || ''}`.trim() : 'Captain Lara Hassan');
  const interviewTitle = interview?.title || 'Technical & Operational Evaluation';

  const interviewQuestions = [
    { q: 'Tell us about yourself and your technical background.', notes: 'Look for clear communication and relevant domain exposure.' },
    { q: 'Describe a difficult operational challenge you faced and how you resolved it.', notes: 'Assess problem-solving approach and resilience.' },
    { q: 'Walk us through a complex system design or engineering project you led.', notes: 'Evaluate technical depth and architectural reasoning.' },
    { q: 'How do you prioritize decisions under high latency or ambiguous requirements?', notes: 'Assess composure, trade-offs, and critical judgment.' },
    { q: 'Where do you see yourself contributing within our technical division in the future?', notes: 'Evaluate vision, leadership, and institutional alignment.' },
  ];

  return (
    <div className="h-screen bg-accent-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="bg-accent-900 border-b border-accent-800 px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGoDashboard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-accent-800 hover:bg-accent-700 text-accent-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-white truncate">Live Session · {candidateName}</p>
            <p className="text-[11px] text-accent-400 truncate">{interviewTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge variant="danger" dot className="bg-danger-600/20 text-danger-300 border-danger-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-danger-500 animate-pulse" />
            Live WebRTC
          </Badge>
          <span className="text-xs sm:text-sm font-mono text-white">{formatTime(elapsed)}</span>

          <button
            type="button"
            onClick={handleLeaveRoom}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-danger-600/20 hover:bg-danger-600/30 text-danger-300 border border-danger-500/30 text-xs font-semibold transition-colors cursor-pointer ml-1"
            title="Leave Call"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Leave Call</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main video area */}
        <div className="flex-1 flex flex-col p-4">
          {/* Participant video (large) */}
          <div className="flex-1 bg-accent-900 rounded-2xl relative overflow-hidden flex items-center justify-center border border-accent-800">
            {camOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-accent-800 flex items-center justify-center mx-auto mb-3">
                  <Camera size={36} className="text-accent-500" />
                </div>
                <p className="text-accent-300 text-sm">{candidateName}</p>
                <p className="text-accent-500 text-xs">Camera Muted</p>
              </div>
            )}

            {/* Name label */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-accent-950/80 backdrop-blur-sm border border-accent-800/60">
              <span className="text-sm font-medium text-white">{candidateName}</span>
            </div>
            {/* Recording indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-danger-600/90 shadow-soft">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-medium text-white">Live Proctored Stream</span>
            </div>
          </div>

          {/* Interviewer video (small, picture-in-picture) */}
          <div className="absolute bottom-24 right-8 w-52 h-36 bg-accent-800 rounded-xl border-2 border-accent-700/80 shadow-medium relative overflow-hidden hidden lg:block">
            <div className="absolute inset-0 flex items-center justify-center bg-accent-900">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center mx-auto mb-1">
                  <UserCheck size={20} />
                </div>
                <p className="text-[11px] font-semibold text-accent-200">{interviewerName}</p>
                <p className="text-[10px] text-accent-400">Lead Examiner</p>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-accent-950/80">
              <span className="text-xs text-white">{interviewerName}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={handleToggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-accent-700 text-white hover:bg-accent-600' : 'bg-danger-600 text-white hover:bg-danger-500'}`}
              title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={handleToggleCam}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-accent-700 text-white hover:bg-accent-600' : 'bg-danger-600 text-white hover:bg-danger-500'}`}
              title={camOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button
              onClick={handleToggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${screenSharing ? 'bg-primary-600 text-white' : 'bg-accent-700 text-white hover:bg-accent-600'}`}
              title={screenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
            >
              <ScreenShare size={20} />
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showChat ? 'bg-primary-600 text-white' : 'bg-accent-700 text-white hover:bg-accent-600'}`}
              title="Live Chat"
            >
              <MessageSquare size={20} />
            </button>
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showParticipants ? 'bg-primary-600 text-white' : 'bg-accent-700 text-white hover:bg-accent-600'}`}
              title="Participants"
            >
              <Users size={20} />
            </button>

            <div className="w-px h-8 bg-accent-700 mx-2" />

            {/* Leave Room Button */}
            <button
              onClick={handleLeaveRoom}
              className="px-4 h-12 rounded-full bg-accent-800 text-accent-200 hover:bg-accent-700 flex items-center gap-2 transition-colors cursor-pointer border border-accent-700"
              title="Leave room and return to dashboard"
            >
              <LogOut size={18} />
              <span className="text-xs font-semibold">Leave Call</span>
            </button>

            {/* End Call for All & Grade */}
            <button
              onClick={handleEndInterview}
              className="px-4 h-12 rounded-full bg-danger-600 text-white hover:bg-danger-500 flex items-center gap-2 transition-colors cursor-pointer"
              title="End call and submit evaluation"
            >
              <PhoneOff size={18} />
              <span className="text-xs font-semibold">End & Grade</span>
            </button>
          </div>
        </div>

        {/* Right panel - Interview guide / Chat */}
        <div className="w-80 bg-accent-900 border-l border-accent-800 flex flex-col shrink-0 hidden md:flex">
          {showChat ? (
            <>
              <div className="px-4 h-12 border-b border-accent-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Live Session Chat</span>
                <button onClick={() => setShowChat(false)} className="text-accent-400 hover:text-white"><MoreVertical size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, idx) => {
                  const isMe = msg.sender === 'You' || msg.sender === candidateName;
                  return (
                    <div key={idx} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[11px] text-accent-400">{msg.sender} · {msg.time}</span>
                      <div className={`rounded-xl px-3 py-2 max-w-[85%] text-xs ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-accent-800 text-accent-100 rounded-tl-none border border-accent-700'}`}>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSendChat} className="p-3 border-t border-accent-800 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type message to examiners..."
                  className="flex-1 h-9 px-3 text-xs rounded-lg bg-accent-800 text-white placeholder:text-accent-500 border border-accent-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-500 transition-colors"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="px-4 h-12 border-b border-accent-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Examination Rubric Guide</span>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(true)}
                  className="text-accent-400 hover:text-white p-1"
                  title="Add Note"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {interviewQuestions.map((iq, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveQuestion(i)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors ${activeQuestion === i ? 'bg-primary-600/20 border border-primary-500/30' : 'bg-accent-800/80 hover:bg-accent-800 border border-accent-700/40'}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-bold mt-0.5 ${activeQuestion === i ? 'text-primary-400' : 'text-accent-500'}`}>Q{i + 1}</span>
                      <div className="flex-1">
                        <p className={`text-xs font-medium ${activeQuestion === i ? 'text-white' : 'text-accent-300'}`}>{iq.q}</p>
                        <p className="text-[11px] text-accent-500 mt-1 italic">{iq.notes}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {privateNotes.length > 0 && (
                  <div className="pt-3 border-t border-accent-800 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-accent-400">Examiner Notes</p>
                    {privateNotes.map((n, idx) => (
                      <div key={idx} className="p-2.5 bg-accent-800/60 border border-accent-700/50 rounded-lg text-xs space-y-1">
                        <p className="text-accent-200">{n.text}</p>
                        <p className="text-[10px] text-accent-400 font-mono">{n.time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-accent-800 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-accent-800 text-accent-300 hover:bg-accent-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Real-time Follow-up Note
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-accent-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-accent-900 dark:text-white">Record Examiner Note</h3>
              <button onClick={() => setShowNoteModal(false)} className="text-accent-400 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveNote} className="space-y-3">
              <textarea
                rows={3}
                required
                autoFocus
                placeholder="Candidate demonstrated deep understanding of distributed transactions..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full p-3 text-xs rounded-xl bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 text-accent-900 dark:text-white placeholder:text-accent-400 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNoteModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" icon={<CheckCircle2 size={14} />}>Save Note</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connection status bar */}
      <div className="bg-accent-900 border-t border-accent-800 px-4 h-8 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 text-success-500">
          <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
          <span>{connectionStatus}</span>
        </div>
        <div className="flex items-center gap-3 text-accent-400">
          <span className="flex items-center gap-1"><Volume2 size={12} /> Audio: 48kHz Stereo</span>
          <span className="flex items-center gap-1"><Video size={12} /> Video: 1080p 30fps</span>
        </div>
      </div>
    </div>
  );
}

export default LiveInterview;
