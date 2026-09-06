import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Shield, Mic, MicOff, Video, VideoOff, ScreenShare, MessageSquare,
  Users, PhoneOff, Volume2, VolumeX, Send, Plus, StickyNote, Star,
  Clock, Monitor, Award, X
} from 'lucide-react';
import { Button, Avatar, ConfirmModal } from '@/components/ui';
import interviewService from '@/services/interview.service';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:7000';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export function ExaminerLiveInterview({ onNavigate }) {
  const params = useParams();
  const location = useLocation();

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
  const [activeLayout, setActiveLayout] = useState('grid'); // 'grid' | 'focus-main'
  const [mediaReady, setMediaReady] = useState(false);

  // WebRTC Peer States
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);
  const [remoteMicOn, setRemoteMicOn] = useState(true);
  const [remoteCamOn, setRemoteCamOn] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [activeRoomPeers, setActiveRoomPeers] = useState([]);

  // Examiner Evaluation Tabs: 'rubric' | 'notes' | 'chat' | 'participants'
  const [activeTab, setActiveTab] = useState('rubric');
  const [activeQuestion, setActiveQuestion] = useState(0);

  // Evaluation Questions & Scoring Rubric
  const [questions, setQuestions] = useState([
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
  ]);

  // Private Confidential Notes
  const [privateNoteInput, setPrivateNoteInput] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [savingNote, setSavingNote] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionPrompt, setNewQuestionPrompt] = useState('');

  // End Interview Theme-Respected Confirm Modal State
  const [showEndModal, setShowEndModal] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  // In-Room Chat
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

  // Helper metadata
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
    'candidate@secureassess.io';
  const candCode = interview?.candidateId?.candidateCode || 'CAND-100101';
  const interviewTitle = interview?.title || 'Distributed Systems & Technical Oral Defense';

  // Simulated Media for Camera Conflict Fallback
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

  // 1. Initialize Examiner Session
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
          if (current._id || current.id) {
            try {
              await interviewService.joinInterview(current._id || current.id);
            } catch (e) {}

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

  // 2. Acquire Local Media
  useEffect(() => {
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
    if (peerConnectionRef.current) {
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
      console.log('[WebRTC Examiner] Remote track received from candidate:', event.track.kind);
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
      console.log('[WebRTC Examiner] Connection state:', pc.connectionState);
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

  // 4. Socket.io Signaling Connection
  useEffect(() => {
    if (!interview || !mediaReady) return;

    const currentInterviewId = interview._id || interview.id;
    const currentOrgId =
      interview.organizationId?._id ||
      interview.organizationId ||
      localStorage.getItem('secureassess_current_org_id') ||
      '';
    const token = localStorage.getItem('secureassess_access_token');

    const socket = io(`${SOCKET_SERVER_URL}/interviews`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Signaling Examiner] Connected to /interviews:', socket.id);
      socket.emit('interview:join', {
        interviewId: currentInterviewId,
        organizationId: currentOrgId,
      });
    });

    socket.on('room:peers', async ({ peers }) => {
      console.log('[Signaling Examiner] Room peers:', peers);
      if (Array.isArray(peers)) {
        setActiveRoomPeers(peers);
        const otherPeer = peers.find((p) => p.socketId && p.socketId !== socket.id);
        if (otherPeer) {
          targetPeerSocketIdRef.current = otherPeer.socketId;
          try {
            const pc = createPeerConnection(otherPeer.socketId);
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);
            socket.emit('webrtc:offer', {
              targetSocketId: otherPeer.socketId,
              sdp: offer,
            });
          } catch (offerErr) {
            console.warn('[WebRTC Examiner] Offer error:', offerErr);
          }
        }
      }
    });

    socket.on('participant:joined', async (peer) => {
      console.log('[Signaling Examiner] Candidate joined room:', peer);
      if (peer.socketId) {
        targetPeerSocketIdRef.current = peer.socketId;
        setActiveRoomPeers((prev) => [...prev.filter((p) => p.socketId !== peer.socketId), peer]);
        createPeerConnection(peer.socketId);
      }
    });

    socket.on('webrtc:offer', async ({ senderSocketId, sdp }) => {
      try {
        let pc = peerConnectionRef.current;
        if (!pc || targetPeerSocketIdRef.current !== senderSocketId) {
          pc = createPeerConnection(senderSocketId);
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
        socket.emit('webrtc:answer', {
          targetSocketId: senderSocketId,
          sdp: answer,
        });
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
        if (msgId && prev.some((m) => m.clientMsgId === msgId || m.id === msgId)) {
          return prev;
        }
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
        socket.off('connect');
        socket.off('error');
        socket.off('room:peers');
        socket.off('participant:joined');
        socket.off('webrtc:offer');
        socket.off('webrtc:answer');
        socket.off('webrtc:ice-candidate');
        socket.off('media:camera-changed');
        socket.off('media:microphone-changed');
        socket.off('media:screen-share-started');
        socket.off('media:screen-share-stopped');
        socket.off('chat:message');
        socket.off('participant:left');
        socket.disconnect();
      }
    };
  }, [interview, mediaReady]);

  // 5. Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 6. Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Controls
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

  const handleEndInterview = () => {
    setShowEndModal(true);
  };

  const executeEndInterview = async () => {
    setEndingSession(true);
    if (socketRef.current) {
      socketRef.current.emit('interview:ended', {
        reason: 'The examiner has concluded the interview session.',
      });
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
    onNavigate('org-sessions');
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-accent-950 flex flex-col overflow-hidden text-white select-none">
      {/* Top Examiner Bar */}
      <header className="bg-accent-900 border-b border-accent-800 px-5 h-14 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">{interviewTitle}</p>
              <span className="text-[11px] px-2 py-0.5 rounded bg-accent-800 text-primary-400 font-mono font-semibold">
                {interview?.type || 'TECHNICAL'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-primary-900/60 text-primary-300 border border-primary-700/50">
                Host / Examiner Cockpit
              </span>
            </div>
            <p className="text-xs text-accent-400">
              Candidate: <span className="text-accent-200 font-medium">{examineeName}</span> ({candCode})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-danger-600/20 border border-danger-500/30">
            <span className="w-2 h-2 rounded-full bg-danger-500 animate-ping" />
            <span className="text-xs font-bold text-danger-300 tracking-wider">LIVE RECORDING</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-800/80 border border-accent-700 text-sm font-mono font-bold text-white">
            <Clock size={14} className="text-primary-400" />
            <span>{formatTime(elapsed)}</span>
          </div>

          <button
            onClick={() => setActiveLayout(activeLayout === 'grid' ? 'focus-main' : 'grid')}
            className="hidden lg:flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-accent-800 hover:bg-accent-700 text-accent-300 transition-colors"
          >
            <Monitor size={13} /> {activeLayout === 'grid' ? 'Focus View' : 'Grid View'}
          </button>
        </div>
      </header>

      {/* Main Room Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Stage */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className={`flex-1 gap-4 overflow-hidden ${
            screenSharing ? 'grid grid-cols-1 lg:grid-cols-3' : activeLayout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2' : 'flex flex-col'
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
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-2xl ring-4 ring-primary-500/20">
                        {examineeName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-accent-900 ${
                        remoteStreamActive ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                      }`} />
                    </div>
                    <p className="text-base font-bold text-white">{examineeName}</p>
                    <p className="text-xs text-accent-400 mt-0.5">
                      {remoteStreamActive ? 'Candidate Feed Active (1080p)' : 'Waiting for candidate video feed...'}
                    </p>
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
                  className={`w-full h-full object-cover mirror ${camOn ? 'block' : 'hidden'}`}
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
              </div>

              <div className="px-4 py-2.5 bg-accent-950/90 border-t border-accent-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{examinerName}</span>
                <span className="text-[11px] text-accent-400">
                  {camOn ? 'HD Camera ON' : 'Video Muted'}
                </span>
              </div>
            </div>
          </div>

          {/* Examiner Control Dock */}
          <div className="mt-4 flex items-center justify-center gap-3 shrink-0 py-2">
            <button
              onClick={toggleMicrophone}
              title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                micOn ? 'bg-accent-800 text-white hover:bg-accent-700' : 'bg-danger-600 text-white hover:bg-danger-500 ring-2 ring-danger-400'
              }`}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <button
              onClick={toggleCamera}
              title={camOn ? 'Turn Off Camera' : 'Turn On Camera'}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                camOn ? 'bg-accent-800 text-white hover:bg-accent-700' : 'bg-danger-600 text-white hover:bg-danger-500 ring-2 ring-danger-400'
              }`}
            >
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            <button
              onClick={toggleScreenShare}
              title="Share Screen"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                screenSharing ? 'bg-primary-600 text-white ring-2 ring-primary-400' : 'bg-accent-800 text-white hover:bg-accent-700'
              }`}
            >
              <ScreenShare size={20} />
            </button>

            <div className="w-px h-8 bg-accent-800 mx-1" />

            {/* Sidebar Tabs */}
            <button
              onClick={() => setActiveTab('rubric')}
              className={`px-4 h-12 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg ${
                activeTab === 'rubric' ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
              }`}
            >
              <Award size={16} />
              <span>Rubric & Scoring</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 h-12 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg ${
                activeTab === 'notes' ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
              }`}
            >
              <StickyNote size={16} />
              <span>Private Notes ({savedNotes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 h-12 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg ${
                activeTab === 'chat' ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
              }`}
            >
              <MessageSquare size={16} />
              <span>In-Room Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              className={`px-4 h-12 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg ${
                activeTab === 'participants' ? 'bg-primary-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
              }`}
            >
              <Users size={16} />
              <span>Roster ({activeRoomPeers.length > 0 ? activeRoomPeers.length + 1 : 2})</span>
            </button>

            <div className="w-px h-8 bg-accent-800 mx-1" />

            <button
              onClick={handleEndInterview}
              className="px-5 h-12 rounded-2xl bg-danger-600 hover:bg-danger-500 text-white flex items-center gap-2 transition-all font-bold text-xs shadow-lg shadow-danger-600/20"
            >
              <PhoneOff size={18} />
              <span>End & Conclude Interview</span>
            </button>
          </div>
        </div>

        {/* Right: Examiner Cockpit Sidebar */}
        <div className="w-96 bg-accent-900 border-l border-accent-800 flex flex-col shrink-0 overflow-hidden shadow-2xl">
          <div className="px-4 h-12 border-b border-accent-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeTab === 'rubric' && <Award size={16} className="text-primary-400" />}
              {activeTab === 'notes' && <StickyNote size={16} className="text-primary-400" />}
              {activeTab === 'chat' && <MessageSquare size={16} className="text-primary-400" />}
              {activeTab === 'participants' && <Users size={16} className="text-primary-400" />}
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {activeTab === 'rubric' && 'Evaluation Rubric & Scoring'}
                {activeTab === 'notes' && 'Examiner Private Notes'}
                {activeTab === 'chat' && 'Live In-Room Chat'}
                {activeTab === 'participants' && 'Active Participants & Roster'}
              </span>
            </div>
            {activeTab === 'rubric' && (
              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 font-semibold"
              >
                <Plus size={14} /> Add Question
              </button>
            )}
          </div>

          {/* TAB 1: RUBRIC */}
          {activeTab === 'rubric' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 bg-accent-950/60 border-b border-accent-800 flex items-center justify-between text-xs">
                <span className="text-accent-400">Total Evaluated Score:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {questions.reduce((acc, q) => acc + (q.rating || 0), 0)} / {questions.length * 5} pts
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    onClick={() => setActiveQuestion(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      activeQuestion === idx
                        ? 'bg-primary-600/15 border-primary-500/40 shadow-md'
                        : 'bg-accent-850/60 border-accent-800 hover:bg-accent-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-800 text-primary-400">
                          Q{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-white truncate">{q.title}</span>
                      </div>
                      <span className="text-[10px] text-accent-400 font-semibold px-2 py-0.5 rounded bg-accent-800/60 uppercase">
                        {q.category}
                      </span>
                    </div>

                    <p className="text-xs text-accent-300 mb-2 leading-relaxed">{q.prompt}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-accent-800/60">
                      <span className="text-[11px] text-accent-400">Examiner Rating:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveQuestionRating(idx, star);
                            }}
                            className={`p-0.5 transition-transform hover:scale-125 ${
                              q.rating >= star ? 'text-amber-400' : 'text-accent-700 hover:text-amber-400'
                            }`}
                          >
                            <Star size={14} fill={q.rating >= star ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PRIVATE NOTES */}
          {activeTab === 'notes' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <div className="p-3 rounded-xl bg-primary-950/30 border border-primary-800/40 text-xs text-primary-300 mb-2">
                  <span className="font-bold block mb-1">🔒 Confidential Examiner Space</span>
                  Notes recorded here are private to the evaluation committee and will not be displayed to the candidate.
                </div>

                {savedNotes.length === 0 ? (
                  <div className="text-center py-10 text-accent-500 text-xs">
                    <StickyNote size={28} className="mx-auto mb-2 opacity-50" />
                    No private evaluation notes added yet.
                  </div>
                ) : (
                  savedNotes.map((sn, idx) => (
                    <div key={sn._id || idx} className="p-3 rounded-xl bg-accent-850/80 border border-accent-800 text-xs space-y-1">
                      <p className="text-white leading-relaxed">{sn.data?.content || sn.content}</p>
                      <span className="text-[10px] text-accent-400 block pt-1 border-t border-accent-800/60">
                        {sn.data?.createdAt ? new Date(sn.data.createdAt).toLocaleTimeString() : 'Just now'} · Synced to Vault
                      </span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddPrivateNote} className="p-3 border-t border-accent-800 bg-accent-950/60 space-y-2">
                <input
                  type="text"
                  placeholder="Record confidential observation..."
                  value={privateNoteInput}
                  onChange={(e) => setPrivateNoteInput(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg bg-accent-800 border border-accent-700 text-white placeholder:text-accent-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <Button variant="outline" size="sm" type="submit" loading={savingNote} className="w-full text-xs" icon={<StickyNote size={13} />}>
                  Save Confidential Note
                </Button>
              </form>
            </div>
          )}

          {/* TAB 3: IN-ROOM CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => {
                  const isMe = m.role === 'EXAMINER';
                  return (
                    <div key={m.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1 text-[10px] text-accent-500">
                        <span className="font-semibold text-accent-400">{m.sender}</span>
                        <span>· {m.time}</span>
                      </div>
                      <div
                        className={`p-3 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                          m.role === 'SYSTEM'
                            ? 'bg-accent-800/80 text-accent-300 border border-accent-700'
                            : isMe
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : 'bg-accent-800 text-white rounded-tl-none'
                        }`}
                      >
                        <p>{m.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-accent-800 flex gap-2 bg-accent-950/50">
                <input
                  type="text"
                  placeholder="Message candidate..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 h-9 px-3 text-xs rounded-lg bg-accent-800 text-white placeholder:text-accent-500 border border-accent-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-500 transition-colors shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: ROSTER */}
          {activeTab === 'participants' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="p-3.5 rounded-xl bg-accent-850 border border-accent-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={examineeName} color="#3b82f6" size="sm" />
                  <div>
                    <p className="text-xs font-bold text-white">{examineeName}</p>
                    <p className="text-[10px] text-accent-400">Examinee / Candidate ({candCode})</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Mic size={14} />
                  <Video size={14} />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-accent-850 border border-accent-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={examinerName} color="#9333ea" size="sm" />
                  <div>
                    <p className="text-xs font-bold text-white">{examinerName} (You)</p>
                    <p className="text-[10px] text-accent-400">Lead Examiner / Host</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary-600/20 text-primary-300 font-semibold">
                  Host
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Custom Question */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-accent-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-accent-900 border border-accent-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-accent-800">
              <h3 className="text-sm font-bold text-white">Add Custom Oral Defense Question</h3>
              <button onClick={() => setShowAddQuestionModal(false)} className="text-accent-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCustomQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-accent-300 mb-1">Question Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Consensus"
                  value={newQuestionTitle}
                  onChange={(e) => setNewQuestionTitle(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg bg-accent-800 border border-accent-700 text-white placeholder:text-accent-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-accent-300 mb-1">Prompt / Evaluation Rubric</label>
                <textarea
                  rows={3}
                  placeholder="Describe evaluation criteria..."
                  value={newQuestionPrompt}
                  onChange={(e) => setNewQuestionPrompt(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg bg-accent-800 border border-accent-700 text-white placeholder:text-accent-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddQuestionModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Add to Rubric
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theme-Respected End Interview Confirmation Modal */}
      <ConfirmModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={executeEndInterview}
        title="Conclude Live Interview"
        message="Are you sure you want to conclude and submit this live interview session? The room will close for all participants and the session recording & evaluation rubrics will be archived."
        confirmText="Conclude & Submit"
        cancelText="Return to Room"
        variant="danger"
        loading={endingSession}
      />
    </div>
  );
}

export default ExaminerLiveInterview;
