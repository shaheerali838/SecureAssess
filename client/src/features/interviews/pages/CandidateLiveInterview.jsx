import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Shield, Clock } from 'lucide-react';
import { ConfirmModal } from '@/components/ui';
import interviewService from '@/services/interview.service';

import { CandidateWaitingRoom } from '../components/candidate/CandidateWaitingRoom';
import { CandidateVideoStage } from '../components/candidate/CandidateVideoStage';
import { CandidateMediaControls } from '../components/candidate/CandidateMediaControls';
import { CandidateChatDrawer } from '../components/candidate/CandidateChatDrawer';
import { CandidateConcludedView } from '../components/candidate/CandidateConcludedView';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://secureassess.onrender.com';
  }
  return 'http://localhost:7000';
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export function CandidateLiveInterview({ onNavigate }) {
  const params = useParams();
  const location = useLocation();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const pathToken = params?.token || window.location.pathname.split('/interview/entry/')[1]?.split('?')[0] || '';
  const searchParams = new URLSearchParams(location?.search || window.location.search);
  const purposeParam = searchParams.get('purpose') || '';
  const nameParam = searchParams.get('name') || '';
  const emailParam = searchParams.get('email') || '';

  // Lifecycle States
  const [isWaitingForHost, setIsWaitingForHost] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionEndedReason, setSessionEndedReason] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Hardware States
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // WebRTC Peer States
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);
  const [remoteMicOn, setRemoteMicOn] = useState(true);
  const [remoteCamOn, setRemoteCamOn] = useState(true);

  // Chat
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'System Room Bot',
      role: 'SYSTEM',
      text: 'Encrypted WebRTC P2P session active. Feeds and communication channels established.',
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const waitingVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const targetPeerSocketIdRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const hasEverAdmittedRef = useRef(false);
  const chatBottomRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem('secureassess_user') || '{}');
  const examineeName =
    interview?.candidateName ||
    interview?.metadata?.candidateName ||
    (storedUser?.firstName ? `${storedUser.firstName} ${storedUser.lastName || ''}`.trim() : nameParam) ||
    'Candidate';
  const examineeEmail =
    interview?.candidateEmail ||
    interview?.metadata?.candidateEmail ||
    storedUser?.email ||
    emailParam ||
    '';
  const candCode = interview?.candidateId?.candidateCode || interview?.candidateCode || storedUser?.candidateCode || '';
  const examinerName = interview?.examinerName || (interview?.examinerId ? `${interview.examinerId.firstName || ''} ${interview.examinerId.lastName || ''}`.trim() : 'Assigned Examiner');
  const interviewTitle = interview?.title || 'Live Technical Interview & Oral Defense';

  // 1. Initialize Interview Data
  useEffect(() => {
    const initInterview = async () => {
      setLoading(true);
      try {
        let current = null;
        if (pathToken) {
          try {
            const entryRes = await interviewService.getPublicEntryInterview(pathToken);
            const entryPayload = entryRes?.data || entryRes;
            if (entryPayload?.guestToken) localStorage.setItem('secureassess_access_token', entryPayload.guestToken);
            if (entryPayload?.candidate) localStorage.setItem('secureassess_user', JSON.stringify(entryPayload.candidate));
            current = entryPayload?.interview || entryPayload;
          } catch (e) {}
        }
        if (!current) {
          const stored = sessionStorage.getItem('secureassess_active_interview');
          if (stored) {
            try { current = JSON.parse(stored); } catch (e) {}
          }
        }
        if (!current) {
          current = {
            id: `guest_iv_${pathToken || Date.now().toString(36)}`,
            _id: `guest_iv_${pathToken || Date.now().toString(36)}`,
            title: purposeParam ? `${purposeParam.toUpperCase()} Live Interview` : '1-Time Live Technical Interview',
            type: 'TECHNICAL',
            status: 'LIVE',
            scheduledStartAt: new Date().toISOString(),
            candidateName: nameParam || 'Guest Candidate',
            candidateEmail: emailParam || storedUser?.email || '',
          };
        }
        setInterview(current);
      } catch (err) {
        console.warn('Init error:', err);
      } finally {
        setLoading(false);
      }
    };
    initInterview();
  }, [pathToken]);

  // 2. Acquire Local Media
  useEffect(() => {
    if (sessionEnded) return;
    let isMounted = true;

    const startLocalMedia = async () => {
      let stream = null;
      let audioStream = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      } catch (e) {}

      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        });
        const tracks = [...videoStream.getVideoTracks()];
        if (audioStream) tracks.push(...audioStream.getAudioTracks());
        stream = new MediaStream(tracks);
      } catch (camErr) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        const intervalId = setInterval(() => {
          if (!ctx) return;
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(examineeName, 320, 240);
        }, 1000 / 30);
        const canvasStream = canvas.captureStream(30);
        const videoTrack = canvasStream.getVideoTracks()[0];
        const origStop = videoTrack.stop.bind(videoTrack);
        videoTrack.stop = () => { clearInterval(intervalId); origStop(); };
        stream = new MediaStream([...(audioStream ? audioStream.getAudioTracks() : []), videoTrack]);
      }

      if (!isMounted) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (stream) {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => {});
        }
        if (waitingVideoRef.current) {
          waitingVideoRef.current.srcObject = stream;
          waitingVideoRef.current.muted = true;
          waitingVideoRef.current.play().catch(() => {});
        }
      }
      setMediaReady(true);
    };

    startLocalMedia();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // WebRTC Peer Connection Factory
  const createPeerConnection = (targetSocketId) => {
    if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
      try { peerConnectionRef.current.close(); } catch (e) {}
    }
    targetPeerSocketIdRef.current = targetSocketId;
    pendingIceCandidatesRef.current = [];
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && targetSocketId) {
        socketRef.current.emit('webrtc:ice-candidate', { targetSocketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      remoteStreamRef.current = stream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.play().catch(() => {});
      }
      setRemoteStreamActive(true);
      setIsWaitingForHost(false);
      hasEverAdmittedRef.current = true;
    };

    return pc;
  };

  // Socket.io Signaling
  useEffect(() => {
    if (!interview || !mediaReady) return;
    const currentInterviewId = interview._id || interview.id;
    const socket = io(`${getSocketUrl()}/interviews`, {
      auth: {
        token: localStorage.getItem('secureassess_access_token'),
        entryToken: pathToken,
        interviewId: currentInterviewId,
        candidateName: examineeName,
        candidateEmail: examineeEmail,
        role: 'CANDIDATE',
      },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('interview:join', { interviewId: currentInterviewId });
    });

    socket.on('interview:admitted', () => {
      setIsWaitingForHost(false);
      hasEverAdmittedRef.current = true;
      socket.emit('interview:candidate-ready', { interviewId: currentInterviewId });
    });

    socket.on('webrtc:offer', async ({ senderSocketId, sdp }) => {
      setIsWaitingForHost(false);
      hasEverAdmittedRef.current = true;
      targetPeerSocketIdRef.current = senderSocketId;
      const pc = createPeerConnection(senderSocketId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { targetSocketId: senderSocketId, sdp: answer });
    });

    socket.on('webrtc:answer', async ({ sdp }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    socket.on('webrtc:ice-candidate', async ({ candidate }) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription?.type) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    });

    socket.on('interview:ended', ({ reason }) => {
      setSessionEnded(true);
      setIsWaitingForHost(false);
      setSessionEndedReason(reason || 'The examiner has concluded the interview session.');
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
    });

    socket.on('participant:left', ({ isHost, name }) => {
      if (isHost) {
        setSessionEnded(true);
        setIsWaitingForHost(false);
        setSessionEndedReason(name ? `${name} (Examiner) has left the room.` : 'The examiner has left the session.');
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    });

    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, {
        id: msg.clientMsgId || `m_${Date.now()}`,
        sender: msg.senderName || 'Participant',
        role: msg.role || 'PARTICIPANT',
        text: msg.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    });

    return () => {
      if (peerConnectionRef.current) {
        try { peerConnectionRef.current.close(); } catch (e) {}
      }
      socket.disconnect();
    };
  }, [interview, mediaReady]);

  // Timer
  useEffect(() => {
    if (sessionEnded) return;
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [sessionEnded]);

  const toggleMicrophone = () => {
    const next = !micOn;
    setMicOn(next);
    if (localStreamRef.current) localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = next));
  };

  const toggleCamera = () => {
    const next = !camOn;
    setCamOn(next);
    if (localStreamRef.current) localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = next));
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setScreenSharing(true);
        const track = stream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(track);
        track.onended = () => {
          setScreenSharing(false);
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (sender && camTrack) sender.replaceTrack(camTrack);
        };
      } catch (e) {}
    } else {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      setScreenSharing(false);
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && camTrack) sender.replaceTrack(camTrack);
    }
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setMessages((p) => [...p, { id: `m_${Date.now()}`, sender: examineeName, role: 'CANDIDATE', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    socketRef.current?.emit('chat:message', { message: text });
    setChatInput('');
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (sessionEnded) {
    return (
      <CandidateConcludedView
        interviewTitle={interviewTitle}
        sessionEndedReason={sessionEndedReason}
        examineeName={examineeName}
        candCode={candCode}
        examinerName={examinerName}
        elapsed={elapsed}
        onNavigate={onNavigate}
      />
    );
  }

  if (isWaitingForHost) {
    return (
      <CandidateWaitingRoom
        interviewTitle={interviewTitle}
        examineeName={examineeName}
        candCode={candCode}
        examinerName={examinerName}
        waitingVideoRef={waitingVideoRef}
        camOn={camOn}
        micOn={micOn}
        toggleCamera={toggleCamera}
        toggleMicrophone={toggleMicrophone}
      />
    );
  }

  return (
    <div className="h-screen bg-accent-950 flex flex-col overflow-hidden text-white select-none">
      <header className="bg-accent-900/90 backdrop-blur-md border-b border-accent-800 px-6 h-14 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">{interviewTitle}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                Candidate Defense
              </span>
            </div>
            <p className="text-xs text-accent-400">Host: {examinerName} · {examineeName} ({candCode})</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-800/80 border border-accent-700 text-sm font-mono font-bold text-white">
            <Clock size={14} className="text-emerald-400" />
            <span>{formatTime(elapsed)}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <CandidateVideoStage
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            camOn={camOn}
            micOn={micOn}
            handRaised={handRaised}
            examineeName={examineeName}
            examinerName={examinerName}
            remoteStreamActive={remoteStreamActive}
            remoteCamOn={remoteCamOn}
          />
        </div>

        <CandidateChatDrawer
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendMessage={handleSendMessage}
          chatBottomRef={chatBottomRef}
          examineeName={examineeName}
        />
      </div>

      <CandidateMediaControls
        micOn={micOn}
        camOn={camOn}
        screenSharing={screenSharing}
        handRaised={handRaised}
        isChatOpen={isChatOpen}
        toggleMicrophone={toggleMicrophone}
        toggleCamera={toggleCamera}
        toggleScreenShare={toggleScreenShare}
        handleToggleHand={() => setHandRaised(!handRaised)}
        setIsChatOpen={setIsChatOpen}
        handleLeaveInterview={() => setShowLeaveModal(true)}
      />

      <ConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={() => {
          localStreamRef.current?.getTracks().forEach((t) => t.stop());
          setShowLeaveModal(false);
          onNavigate('participant-evaluation');
        }}
        title="Leave Interview Session?"
        message="Are you sure you want to leave the live interview call?"
        confirmText="Leave Call"
        variant="danger"
      />
    </div>
  );
}

export default CandidateLiveInterview;
