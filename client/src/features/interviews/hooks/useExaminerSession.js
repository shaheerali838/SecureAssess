import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import interviewService from '@/services/interview.service';

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

const DEFAULT_QUESTIONS = [
  {
    id: 'q1',
    title: 'Architectural Overview & Core Design Patterns',
    prompt: 'Explain the core distributed architectural decisions made in your implementation.',
    category: 'TECHNICAL',
    rating: 0,
    notes: '',
    completed: false,
  },
  {
    id: 'q2',
    title: 'Real-time WebSockets & State Synchronization',
    prompt: 'How do you handle peer-to-peer disconnects, network degradation, and reconciliation?',
    category: 'TECHNICAL',
    rating: 0,
    notes: '',
    completed: false,
  },
  {
    id: 'q3',
    title: 'Data Consistency & Concurrency Control',
    prompt: 'Describe your database transaction boundaries and concurrency lock strategies.',
    category: 'ALGORITHMS',
    rating: 0,
    notes: '',
    completed: false,
  },
  {
    id: 'q4',
    title: 'Critical Incident Response & Failure Modes',
    prompt: 'Walk through a scenario where a critical subsystem fails during peak proctoring load.',
    category: 'PROBLEM_SOLVING',
    rating: 0,
    notes: '',
    completed: false,
  },
];

const createSimulatedMediaStream = (name, audioStream) => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  let frame = 0;

  const intervalId = setInterval(() => {
    if (!ctx) return;
    frame++;
    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    const pulseRadius = 70 + Math.sin(frame * 0.08) * 10;
    ctx.beginPath();
    ctx.arc(320, 200, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(320, 200, 58, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'EX';
    ctx.fillText(initials, 320, 200);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(name || 'Examiner', 320, 295);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#94a3b8';
    const timeStr = new Date().toLocaleTimeString();
    ctx.fillText(`Live Stream Active · ${timeStr}`, 320, 330);

    for (let i = 0; i < 7; i++) {
      const barH = 6 + Math.abs(Math.sin((frame + i * 5) * 0.18)) * 16;
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(280 + i * 12, 380 - barH / 2, 6, barH);
    }
  }, 1000 / 30);

  const canvasStream = canvas.captureStream(30);
  const videoTrack = canvasStream.getVideoTracks()[0];
  const origStop = videoTrack.stop.bind(videoTrack);
  videoTrack.stop = () => {
    clearInterval(intervalId);
    origStop();
  };

  const audioTracks = audioStream ? audioStream.getAudioTracks() : [];
  return new MediaStream([...audioTracks, videoTrack]);
};

export function useExaminerSession({ onNavigate }) {
  // Active Session Context
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Stored User / Examiner Info
  const storedUser = JSON.parse(localStorage.getItem('secureassess_user') || '{}');
  const examinerName = `${storedUser?.firstName || ''} ${storedUser?.lastName || ''}`.trim() || 'Dr. Sarah Mitchell (Lead Examiner)';

  // Hardware Media States
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [activeLayout, setActiveLayout] = useState('grid');
  const [mediaReady, setMediaReady] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);

  // WebRTC Peer States
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);
  const [remoteMicOn, setRemoteMicOn] = useState(true);
  const [remoteCamOn, setRemoteCamOn] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [activeRoomPeers, setActiveRoomPeers] = useState([]);

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState('rubric');
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionPrompt, setNewQuestionPrompt] = useState('');

  // Rubric & Scoring
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [privateNoteInput, setPrivateNoteInput] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [savingNote, setSavingNote] = useState(false);

  // End Modal & Completion
  const [showEndModal, setShowEndModal] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

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
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const targetPeerSocketIdRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const chatBottomRef = useRef(null);

  // Metadata Helpers
  const examineeName =
    interview?.candidateName ||
    interview?.metadata?.candidateName ||
    (interview?.candidateId
      ? `${interview.candidateId.firstName || ''} ${interview.candidateId.lastName || ''}`.trim()
      : 'Candidate');
  const examineeEmail =
    interview?.candidateEmail ||
    interview?.metadata?.candidateEmail ||
    interview?.candidateId?.email ||
    '';
  const candCode = interview?.candidateId?.candidateCode || interview?.candidateCode || '';
  const interviewTitle = interview?.title || 'Live Technical Interview & Oral Defense';

  // 1. Initialize Session
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      try {
        let current = null;
        const stored = sessionStorage.getItem('secureassess_active_interview');
        if (stored) {
          try {
            current = JSON.parse(stored);
          } catch (e) {}
        }

        if (!current && localStorage.getItem('secureassess_access_token')) {
          try {
            const res = await interviewService.getInterviews();
            const items = Array.isArray(res) ? res : (res?.items || res?.interviews || []);
            if (items.length > 0) current = items[0];
          } catch (apiErr) {}
        }

        if (current) {
          setInterview(current);

          if (Array.isArray(current.questions) && current.questions.length > 0) {
            setQuestions(current.questions.map((q, idx) => ({
              id: q.id || `q_${idx + 1}`,
              title: q.title || `Question ${idx + 1}`,
              prompt: q.prompt || '',
              category: q.category || 'TECHNICAL',
              rating: q.rating || 0,
              notes: q.notes || '',
              completed: q.completed || false,
            })));
          }

          if (current.status === 'COMPLETED' || current.status === 'CANCELLED') {
            setSessionEnded(true);
            return;
          }

          if (current._id || current.id) {
            try {
              await interviewService.joinInterview(current._id || current.id);
            } catch (joinErr) {
              const errMsg = joinErr?.response?.data?.message || joinErr.message || '';
              if (errMsg.toLowerCase().includes('concluded') || errMsg.toLowerCase().includes('completed') || joinErr?.response?.status === 403) {
                setSessionEnded(true);
                return;
              }
            }

            try {
              const notes = await interviewService.getNotes(current._id || current.id);
              if (Array.isArray(notes)) setSavedNotes(notes);
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Init examiner interview error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  // 2. Media Acquisition
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
        console.warn('[Media Examiner] Camera conflict, starting live animated feed:', camErr.message);
        stream = createSimulatedMediaStream(examinerName, audioStream);
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
        if (peerConnectionRef.current) {
          stream.getTracks().forEach((track) => {
            peerConnectionRef.current.addTrack(track, stream);
          });
        }
      }

      setMediaReady(true);
    };

    startLocalMedia();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, []);

  // Sync streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});
    }
  }, [camOn, mediaReady]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStreamActive, remoteCamOn]);

  // 3. WebRTC Peer Connection Factory
  const createPeerConnection = (targetSocketId) => {
    if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
      try {
        peerConnectionRef.current.close();
      } catch (e) {}
    }

    targetPeerSocketIdRef.current = targetSocketId;
    pendingIceCandidatesRef.current = [];
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && targetSocketId) {
        socketRef.current.emit('webrtc:ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
        });
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
      setConnectionStatus('connected');
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
        setRemoteStreamActive(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setConnectionStatus('disconnected');
        setRemoteStreamActive(false);
      }
    };

    return pc;
  };

  const initiateOfferToPeer = async (targetSocketId) => {
    if (!targetSocketId || !socketRef.current) return;
    if (targetSocketId === socketRef.current.id) return;

    targetPeerSocketIdRef.current = targetSocketId;

    let pc = peerConnectionRef.current;
    if (!pc || pc.signalingState === 'closed') {
      pc = createPeerConnection(targetSocketId);
    } else if (localStreamRef.current) {
      const senders = pc.getSenders();
      localStreamRef.current.getTracks().forEach((track) => {
        if (!senders.some((s) => s.track?.id === track.id)) {
          pc.addTrack(track, localStreamRef.current);
        }
      });
    }

    if (pc.signalingState === 'have-local-offer') return;

    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socketRef.current.emit('webrtc:offer', { targetSocketId, sdp: offer });
      socketRef.current.emit('interview:admit-candidate', {
        candidateSocketId: targetSocketId,
        interviewId: interview?._id || interview?.id,
      });
    } catch (err) {
      console.warn('[WebRTC Examiner] Error initiating offer:', err);
    }
  };

  // 4. Socket.io Signaling
  useEffect(() => {
    if (!interview || !mediaReady) return;

    const currentInterviewId = interview._id || interview.id;
    const currentOrgId =
      interview.organizationId?._id ||
      interview.organizationId ||
      localStorage.getItem('secureassess_current_org_id') ||
      '';
    const token = localStorage.getItem('secureassess_access_token');

    const socketUrl = getSocketUrl();
    const socket = io(`${socketUrl}/interviews`, {
      auth: { token, role: 'EXAMINER', interviewId: currentInterviewId, organizationId: currentOrgId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('interview:join', { interviewId: currentInterviewId, organizationId: currentOrgId });
    });

    socket.on('room:peers', async ({ peers }) => {
      if (Array.isArray(peers)) {
        setActiveRoomPeers(peers);
        const otherPeer = peers.find((p) => p.socketId && p.socketId !== socket.id);
        if (otherPeer) initiateOfferToPeer(otherPeer.socketId);
      }
    });

    socket.on('participant:joined', async (peer) => {
      if (peer.socketId && peer.socketId !== socket.id) {
        setActiveRoomPeers((prev) => [...prev.filter((p) => p.socketId !== peer.socketId), peer]);
        initiateOfferToPeer(peer.socketId);
      }
    });

    socket.on('interview:candidate-ready', async ({ candidateSocketId }) => {
      const targetId = candidateSocketId || targetPeerSocketIdRef.current;
      if (targetId && targetId !== socket.id) initiateOfferToPeer(targetId);
    });

    socket.on('webrtc:offer', async ({ senderSocketId, sdp }) => {
      try {
        let pc = peerConnectionRef.current;
        if (!pc || targetPeerSocketIdRef.current !== senderSocketId) {
          pc = createPeerConnection(senderSocketId);
        }

        if (pc.signalingState !== 'stable') {
          try {
            await pc.setLocalDescription({ type: 'rollback' });
          } catch (rb) {}
        }

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        if (pendingIceCandidatesRef.current.length > 0) {
          for (const cand of pendingIceCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.warn);
          }
          pendingIceCandidatesRef.current = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', { targetSocketId: senderSocketId, sdp: answer });
      } catch (err) {
        console.warn('[WebRTC Examiner] Error answering offer:', err);
      }
    });

    socket.on('webrtc:answer', async ({ senderSocketId, sdp }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          if (pendingIceCandidatesRef.current.length > 0) {
            for (const cand of pendingIceCandidatesRef.current) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand)).catch(console.warn);
            }
            pendingIceCandidatesRef.current = [];
          }
        }
      } catch (err) {
        console.warn('[WebRTC Examiner] Error setting answer remote description:', err);
      }
    });

    socket.on('webrtc:ice-candidate', async ({ candidate }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else if (candidate) {
          pendingIceCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.warn('[WebRTC Examiner] Error adding ICE candidate:', err);
      }
    });

    socket.on('media:camera-changed', ({ enabled }) => setRemoteCamOn(enabled));
    socket.on('media:microphone-changed', ({ enabled }) => setRemoteMicOn(enabled));
    socket.on('media:screen-share-started', () => setScreenSharing(true));
    socket.on('media:screen-share-stopped', () => setScreenSharing(false));

    socket.on('chat:message', (msgPayload) => {
      const msgId = msgPayload.clientMsgId || msgPayload.id || `m_${Date.now()}`;
      setMessages((prev) => {
        if (msgId && prev.some((m) => m.clientMsgId === msgId || m.id === msgId)) return prev;
        return [
          ...prev,
          {
            id: msgId,
            clientMsgId: msgPayload.clientMsgId || msgId,
            sender: msgPayload.senderName || 'Participant',
            role: msgPayload.role || 'PARTICIPANT',
            text: msgPayload.message,
            time: new Date(msgPayload.timestamp || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ];
      });
    });

    socket.on('participant:left', ({ socketId }) => {
      if (targetPeerSocketIdRef.current === socketId) {
        setRemoteStreamActive(false);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
      setActiveRoomPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    return () => {
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (e) {}
      }
      if (socket) {
        socket.disconnect();
      }
    };
  }, [interview, mediaReady]);

  // 5. Timer
  useEffect(() => {
    if (sessionEnded) return;
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [sessionEnded]);

  // 6. Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Media Controls
  const toggleMicrophone = () => {
    const nextState = !micOn;
    setMicOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = nextState));
    }
    if (socketRef.current) {
      socketRef.current.emit('media:microphone-changed', { enabled: nextState });
    }
  };

  const toggleCamera = () => {
    const nextState = !camOn;
    setCamOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = nextState));
    }
    if (socketRef.current) {
      socketRef.current.emit('media:camera-changed', { enabled: nextState });
    }
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setScreenSharing(true);

        const screenTrack = stream.getVideoTracks()[0];
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) videoSender.replaceTrack(screenTrack);
        }

        if (socketRef.current) socketRef.current.emit('media:screen-share-started');
        screenTrack.onended = () => stopScreenSharing();
      } catch (err) {
        console.warn('[ScreenShare] Cancelled:', err.message);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setScreenSharing(false);

    if (peerConnectionRef.current && localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender && cameraTrack) videoSender.replaceTrack(cameraTrack);
    }

    if (socketRef.current) socketRef.current.emit('media:screen-share-stopped');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    const clientMsgId = `cmsg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newMsg = {
      id: clientMsgId,
      clientMsgId,
      sender: examinerName,
      role: 'EXAMINER',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => {
      if (prev.some((m) => m.clientMsgId === clientMsgId || m.id === clientMsgId)) return prev;
      return [...prev, newMsg];
    });

    if (socketRef.current) {
      socketRef.current.emit('chat:message', { message: text, clientMsgId });
    }

    setChatInput('');
  };

  const handleSaveQuestionRating = async (questionIdx, rating) => {
    const updated = [...questions];
    updated[questionIdx].rating = rating;
    updated[questionIdx].completed = true;
    setQuestions(updated);

    if (interview?._id || interview?.id) {
      try {
        await interviewService.addNote(interview._id || interview.id, {
          content: `Question: ${updated[questionIdx].title} - Score: ${rating}/5. ${updated[questionIdx].notes}`,
          category: updated[questionIdx].category,
          rating,
          isPrivate: true,
        });
      } catch (err) {
        console.warn('Could not autosave score:', err.message);
      }
    }
  };

  const handleAddPrivateNote = async (e) => {
    e.preventDefault();
    if (!privateNoteInput.trim()) return;

    const noteText = privateNoteInput.trim();
    setSavingNote(true);

    const localNote = {
      _id: `note_${Date.now()}`,
      content: noteText,
      data: { content: noteText, createdAt: new Date().toISOString() },
    };
    setSavedNotes((prev) => [localNote, ...prev]);
    setPrivateNoteInput('');

    if (interview?._id || interview?.id) {
      try {
        await interviewService.addNote(interview._id || interview.id, {
          content: noteText,
          category: 'GENERAL',
          isPrivate: true,
        });
      } catch (err) {
        console.warn('Add note error:', err.message);
      }
    }

    setSavingNote(false);
  };

  const handleCreateCustomQuestion = (e) => {
    e.preventDefault();
    if (!newQuestionTitle.trim()) return;

    const newQ = {
      id: `q_custom_${Date.now()}`,
      title: newQuestionTitle.trim(),
      prompt: newQuestionPrompt.trim() || 'Custom Evaluation Criteria',
      category: 'CUSTOM',
      rating: 0,
      notes: '',
      completed: false,
    };

    setQuestions((prev) => [...prev, newQ]);
    setActiveQuestion(questions.length);
    setNewQuestionTitle('');
    setNewQuestionPrompt('');
    setShowAddQuestionModal(false);
  };

  const cleanupMedia = () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((t) => t.stop());
        remoteStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (e) {}
        peerConnectionRef.current = null;
      }
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (e) {}
        socketRef.current = null;
      }
    } catch (err) {
      console.warn('Error during media cleanup:', err);
    }
  };

  const handleExitRoom = () => {
    cleanupMedia();
    onNavigate('org-interviews');
  };

  const handleEndInterview = () => {
    setShowEndModal(true);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const executeEndInterview = async () => {
    setEndingSession(true);
    try {
      if (socketRef.current) {
        socketRef.current.emit('interview:ended', {
          reason: 'The examiner has concluded the interview session.',
        });
        socketRef.current.emit('interview:concluded', {
          reason: 'Examiner finalized evaluation and concluded session.',
        });
      }
    } catch (sockErr) {
      console.warn('Socket conclude notice:', sockErr.message);
    }

    try {
      if (interview?._id || interview?.id) {
        await interviewService.endInterview(interview._id || interview.id);
      }
    } catch (err) {
      console.warn('End interview api error:', err.message);
    }

    const sessionData = {
      id: interview?._id || interview?.id || `iv-${Date.now()}`,
      participant: examineeName,
      email: examineeEmail,
      assessment: `[Live Interview] ${interviewTitle}`,
      assessmentCode: interview?.type ? `INTV-${interview.type.toUpperCase()}` : 'INTV-TECH',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      duration: formatTime(elapsed),
      date: 'Just Now',
      timestamp: new Date().toISOString(),
      violationsCount: 0,
      hasRecording: true,
      isLiveInterview: true,
      interviewData: interview,
      questions: questions,
    };

    try {
      sessionStorage.setItem('secureassess_active_review_session', JSON.stringify(sessionData));
      sessionStorage.removeItem('secureassess_active_interview');
    } catch (e) {}

    setShowEndModal(false);
    setEndingSession(false);
    cleanupMedia();
    setSessionEnded(true);
  };

  const handleHostNextCandidate = () => {
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        rating: 0,
        notes: '',
        completed: false,
      }))
    );
    setElapsed(0);
    setSavedNotes([]);
    setSessionEnded(false);
    setEndingSession(false);
    setShowEndModal(false);

    if (socketRef.current) {
      socketRef.current.emit('interview:room_available', {
        interviewId: interview?._id || interview?.id,
      });
    }
  };

  return {
    interview,
    loading,
    elapsed,
    examinerName,
    examineeName,
    examineeEmail,
    candCode,
    interviewTitle,
    micOn,
    camOn,
    screenSharing,
    activeLayout,
    setActiveLayout,
    isMirrored,
    setIsMirrored,
    remoteStreamActive,
    remoteMicOn,
    remoteCamOn,
    connectionStatus,
    activeRoomPeers,
    activeTab,
    setActiveTab,
    activeQuestion,
    setActiveQuestion,
    mobilePanelOpen,
    setMobilePanelOpen,
    questions,
    savedNotes,
    privateNoteInput,
    setPrivateNoteInput,
    savingNote,
    showAddQuestionModal,
    setShowAddQuestionModal,
    newQuestionTitle,
    setNewQuestionTitle,
    newQuestionPrompt,
    setNewQuestionPrompt,
    showEndModal,
    setShowEndModal,
    endingSession,
    sessionEnded,
    messages,
    chatInput,
    setChatInput,
    localVideoRef,
    remoteVideoRef,
    chatBottomRef,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    handleSendMessage,
    handleSaveQuestionRating,
    handleAddPrivateNote,
    handleCreateCustomQuestion,
    handleExitRoom,
    handleEndInterview,
    executeEndInterview,
    handleHostNextCandidate,
    formatTime,
  };
}
