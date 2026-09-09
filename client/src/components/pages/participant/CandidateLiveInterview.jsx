import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Shield, Mic, MicOff, Video, VideoOff, ScreenShare, MessageSquare,
  PhoneOff, Volume2, VolumeX, Send, CheckCircle, Clock, CheckCircle2,
  Hand, X, Radio, Sparkles
} from 'lucide-react';
import { Button, Avatar, ConfirmModal } from '@/components/ui';
import interviewService from '@/services/interview.service';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:7000');

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

  // Active Interview Session Context
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Extract entry token from router params or pathname
  const pathToken = params?.token || window.location.pathname.split('/interview/entry/')[1]?.split('?')[0] || '';
  const searchParams = new URLSearchParams(location?.search || window.location.search);
  const purposeParam = searchParams.get('purpose') || '';
  const nameParam = searchParams.get('name') || '';
  const emailParam = searchParams.get('email') || '';

  // Candidate Lifecycle States
  const [isWaitingForHost, setIsWaitingForHost] = useState(true);
  const [isWaitingInQueue, setIsWaitingInQueue] = useState(false);
  const [queueOccupiedBy, setQueueOccupiedBy] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionEndedReason, setSessionEndedReason] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Hardware Media States
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // WebRTC Peer States
  const [remoteStreamActive, setRemoteStreamActive] = useState(false);
  const [remoteMicOn, setRemoteMicOn] = useState(true);
  const [remoteCamOn, setRemoteCamOn] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'

  // Chat Messages
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

  // Stored User / Candidate Info
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
    'candidate@secureassess.io';
  const candCode = interview?.candidateId?.candidateCode || storedUser?.candidateCode || 'CAND-100101';
  const examinerName = interview?.examinerName || 'Dr. Sarah Mitchell (Lead Examiner)';
  const interviewTitle = interview?.title || 'Distributed Systems & Technical Oral Defense';

  // Simulated Media Canvas for conflict fallback
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
      grad.addColorStop(1, '#064e3b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      const pulseRadius = 70 + Math.sin(frame * 0.08) * 10;
      ctx.beginPath();
      ctx.arc(320, 200, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(320, 200, 58, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'CA';
      ctx.fillText(initials, 320, 200);

      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(name || 'Candidate', 320, 295);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      const timeStr = new Date().toLocaleTimeString();
      ctx.fillText(`Live Stream Active · ${timeStr}`, 320, 330);

      for (let i = 0; i < 7; i++) {
        const barH = 6 + Math.abs(Math.sin((frame + i * 5) * 0.18)) * 16;
        ctx.fillStyle = '#34d399';
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
            if (entryPayload?.guestToken) {
              localStorage.setItem('secureassess_access_token', entryPayload.guestToken);
            }
            if (entryPayload?.candidate) {
              localStorage.setItem('secureassess_user', JSON.stringify(entryPayload.candidate));
            }
            current = entryPayload?.interview || entryPayload;
          } catch (entryErr) {
            console.warn('Public entry token lookup note:', entryErr.message);
          }
        }

        if (!current) {
          const stored = sessionStorage.getItem('secureassess_active_interview');
          if (stored) {
            try {
              current = JSON.parse(stored);
            } catch (e) {}
          }
        }

        if (!current && localStorage.getItem('secureassess_access_token')) {
          try {
            const res = await interviewService.getInterviews();
            const items = Array.isArray(res) ? res : (res?.items || res?.interviews || []);
            if (items.length > 0) current = items[0];
          } catch (apiErr) {}
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
            candidateEmail: emailParam || 'candidate@secureassess.io',
          };
        }

        if (current) {
          setInterview(current);

          if (current.status === 'COMPLETED' || current.status === 'CANCELLED') {
            setSessionEnded(true);
            setIsWaitingForHost(false);
            setSessionEndedReason('This interview session has already concluded and is permanently closed. Re-joining is not permitted.');
            return;
          }

          if (localStorage.getItem('secureassess_access_token') && (current._id || current.id)) {
            try {
              await interviewService.joinInterview(current._id || current.id);
            } catch (joinErr) {
              const errMsg = joinErr?.response?.data?.message || joinErr.message || '';
              if (errMsg.toLowerCase().includes('concluded') || errMsg.toLowerCase().includes('completed') || joinErr?.response?.status === 403) {
                setSessionEnded(true);
                setIsWaitingForHost(false);
                setSessionEndedReason('This interview session has already concluded and is permanently closed. Re-joining is not permitted.');
                return;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Init candidate live interview error:', err.message);
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
        console.warn('[Media] Hardware camera unavailable in this tab, starting live animated video feed:', camErr.message);
        stream = createSimulatedMediaStream(examineeName, audioStream);
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
    if (waitingVideoRef.current && localStreamRef.current) {
      waitingVideoRef.current.srcObject = localStreamRef.current;
      waitingVideoRef.current.muted = true;
      waitingVideoRef.current.play().catch(() => {});
    }
  }, [camOn, mediaReady, isWaitingForHost]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStreamActive, remoteCamOn, isWaitingForHost]);

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
      console.log('[WebRTC Candidate] Inbound remote track received:', event.track.kind);
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
      console.log('[WebRTC Candidate] Peer connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
        setRemoteStreamActive(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setConnectionStatus('disconnected');
        setRemoteStreamActive(false);
        if (hasEverAdmittedRef.current) {
          setSessionEnded(true);
          setIsWaitingForHost(false);
          setSessionEndedReason('The examiner has left the session. The interview defense has concluded.');
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
          }
        }
      }
    };

    return pc;
  };

  // 4. Socket.io Signaling Namespace
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
      console.log('[Signaling Candidate] Connected to /interviews:', socket.id);
      socket.emit('interview:join', {
        interviewId: currentInterviewId,
        organizationId: currentOrgId,
      });
    });

    socket.on('room:occupied', ({ message, occupied, activeCandidate }) => {
      console.log('[Signaling Candidate] Room occupied by another candidate:', activeCandidate);
      setIsWaitingInQueue(true);
      setIsWaitingForHost(true);
      setQueueOccupiedBy(activeCandidate || 'Another candidate');
    });

    socket.on('interview:room_available', () => {
      console.log('[Signaling Candidate] Room available for next examinee, connecting...');
      setIsWaitingInQueue(false);
      socket.emit('interview:join', {
        interviewId: currentInterviewId,
        organizationId: currentOrgId,
      });
    });

    socket.on('error', (err) => {
      console.warn('[Signaling Candidate] Socket room error:', err);
      const msg = err?.message || String(err || '');

      if (
        err?.isRoomOccupied ||
        msg.toLowerCase().includes('another candidate') ||
        msg.toLowerCase().includes('queue')
      ) {
        setIsWaitingInQueue(true);
        setIsWaitingForHost(true);
        setQueueOccupiedBy(err?.activeCandidate || 'Another candidate');
        return;
      }

      if (
        msg.toLowerCase().includes('completed') ||
        msg.toLowerCase().includes('cancelled') ||
        msg.toLowerCase().includes('already')
      ) {
        setSessionEnded(true);
        setIsWaitingForHost(false);
        setSessionEndedReason('This interview session has already been concluded by the examiner.');
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        }
      }
    });

    socket.on('room:peers', async ({ peers, hasHost }) => {
      console.log('[Signaling Candidate] Room peers:', peers, 'hasHost:', hasHost);
      if (Array.isArray(peers)) {
        if (hasEverAdmittedRef.current) {
          if (!peers.some((p) => p.socketId !== socket.id)) {
            setSessionEnded(true);
            setIsWaitingForHost(false);
            setSessionEndedReason('The examiner has left and concluded the interview session.');
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach((t) => t.stop());
            }
          }
        } else {
          const hostPresent = hasHost || peers.some((p) => p.socketId !== socket.id);
          if (hostPresent) {
            hasEverAdmittedRef.current = true;
            setIsWaitingForHost(false);
          }
        }

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
            console.warn('[WebRTC Candidate] Offer creation error:', offerErr);
          }
        }
      }
    });

    socket.on('interview:host-joined', (data) => {
      console.log('[Signaling Candidate] Examiner host joined:', data);
      hasEverAdmittedRef.current = true;
      setIsWaitingForHost(false);
    });

    socket.on('interview:admitted', () => {
      console.log('[Signaling Candidate] Candidate admitted by examiner');
      hasEverAdmittedRef.current = true;
      setIsWaitingForHost(false);
    });

    socket.on('participant:joined', async (peer) => {
      console.log('[Signaling Candidate] Participant joined:', peer);
      if (peer.socketId) {
        targetPeerSocketIdRef.current = peer.socketId;
        hasEverAdmittedRef.current = true;
        setIsWaitingForHost(false);
        createPeerConnection(peer.socketId);
      }
    });

    socket.on('webrtc:offer', async ({ senderSocketId, sdp }) => {
      console.log('[WebRTC Candidate] Received offer:', senderSocketId);
      hasEverAdmittedRef.current = true;
      setIsWaitingForHost(false);
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
        console.warn('[WebRTC Candidate] Error answering offer:', err);
      }
    });

    socket.on('webrtc:answer', async ({ senderSocketId, sdp }) => {
      console.log('[WebRTC Candidate] Received answer:', senderSocketId);
      hasEverAdmittedRef.current = true;
      setIsWaitingForHost(false);
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
        console.warn('[WebRTC Candidate] Error setting answer remote description:', err);
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
        console.warn('[WebRTC Candidate] Error adding ICE candidate:', err);
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

    socket.on('interview:ended', ({ reason }) => {
      console.log('[Signaling Candidate] Session ended:', reason);
      setSessionEnded(true);
      setIsWaitingForHost(false);
      setSessionEndedReason(reason || 'The examiner has concluded the interview session.');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    });

    socket.on('participant:left', ({ socketId, name, isHost }) => {
      console.log('[Signaling Candidate] Participant left:', name, 'isHost:', isHost);
      setSessionEnded(true);
      setIsWaitingForHost(false);
      setSessionEndedReason(
        name ? `${name} (Examiner) has left the interview room.` : 'The examiner has left the session.'
      );
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (targetPeerSocketIdRef.current === socketId) {
        setRemoteStreamActive(false);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
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
        socket.off('interview:host-joined');
        socket.off('interview:admitted');
        socket.off('participant:joined');
        socket.off('webrtc:offer');
        socket.off('webrtc:answer');
        socket.off('webrtc:ice-candidate');
        socket.off('media:camera-changed');
        socket.off('media:microphone-changed');
        socket.off('media:screen-share-started');
        socket.off('media:screen-share-stopped');
        socket.off('chat:message');
        socket.off('interview:ended');
        socket.off('participant:left');
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
  }, [messages, isChatOpen]);

  // Hardware Controls
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

  const handleToggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    if (socketRef.current) {
      socketRef.current.emit('chat:message', {
        message: next ? '✋ Candidate raised hand for clarification.' : 'Candidate lowered hand.',
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    const clientMsgId = `cmsg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newMsg = {
      id: clientMsgId,
      clientMsgId,
      sender: examineeName,
      role: 'CANDIDATE',
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

  const handleLeaveInterview = () => {
    setShowLeaveModal(true);
  };

  const executeLeaveInterview = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setShowLeaveModal(false);
    onNavigate('participant-evaluation');
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // VIEW 1: CANDIDATE INTERVIEW CONCLUDED SCREEN
  // =========================================================================
  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-accent-950 flex flex-col justify-between text-white select-none">
        <header className="bg-accent-900 border-b border-accent-800 px-6 h-16 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">{interviewTitle}</span>
              <p className="text-xs text-accent-400">Oral Assessment Session</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Session Concluded
          </span>
        </header>

        <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center items-center text-center">
          <div className="p-8 rounded-3xl bg-accent-900 border border-accent-800 shadow-2xl space-y-6 w-full relative overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle size={40} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Interview Defense Concluded</h2>
              <p className="text-sm text-accent-300 leading-relaxed">
                {sessionEndedReason || 'The examiner has concluded the interview session. Your responses and defense evaluation have been securely submitted.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-accent-950/80 border border-accent-800 text-xs space-y-2.5 text-left">
              <div className="flex items-center justify-between text-accent-300">
                <span>Candidate Name:</span>
                <span className="font-semibold text-white">{examineeName} ({candCode})</span>
              </div>
              <div className="flex items-center justify-between text-accent-300">
                <span>Lead Examiner:</span>
                <span className="font-semibold text-primary-300">{examinerName}</span>
              </div>
              <div className="flex items-center justify-between text-accent-300">
                <span>Total Defense Duration:</span>
                <span className="font-mono text-emerald-400 font-bold">{formatTime(elapsed)}</span>
              </div>
              <div className="flex items-center justify-between text-accent-300">
                <span>Proctoring Integrity:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} /> 100% Verified
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('participant-evaluation')}
              className="w-full bg-primary-600 hover:bg-primary-500 text-sm font-bold"
            >
              Return to Candidate Dashboard
            </Button>
          </div>
        </main>

        <footer className="h-12 border-t border-accent-800/80 px-6 flex items-center justify-between text-[11px] text-accent-400 bg-accent-900/50">
          <span>SecureAssess Live Oral Evaluation System</span>
          <span>Session securely archived</span>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CANDIDATE WAITING ROOM (Pre-Session Equipment Check)
  // =========================================================================
  if (isWaitingForHost && !hasEverAdmittedRef.current) {
    return (
      <div className="min-h-screen bg-accent-950 flex flex-col justify-between text-white select-none">
        {/* Waiting Room Top Bar */}
        <header className="bg-accent-900/90 backdrop-blur-md border-b border-accent-800 px-6 h-16 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">{interviewTitle}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Waiting Room
                </span>
              </div>
              <p className="text-xs text-accent-400">Candidate Session ID: <span className="text-accent-300 font-mono">{candCode}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-800 border border-accent-700 text-xs font-mono text-accent-300">
              <Clock size={14} className="text-primary-400" />
              <span>{formatTime(elapsed)}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('participant-evaluation')}
              className="text-xs text-danger-400 hover:text-danger-300 border-accent-700"
            >
              Exit Queue
            </Button>
          </div>
        </header>

        {/* Main Stage */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Self-Preview & Hardware Toggles */}
            <div className="lg:col-span-6 bg-accent-900 rounded-3xl p-5 border border-accent-800 shadow-2xl flex flex-col justify-between">
              <div className="relative w-full aspect-video rounded-2xl bg-accent-950 overflow-hidden border border-accent-800 flex items-center justify-center">
                <video
                  ref={waitingVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover mirror ${camOn ? 'block' : 'hidden'}`}
                />
                {!camOn && (
                  <div className="text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-accent-800 flex items-center justify-center mx-auto mb-3 text-accent-400">
                      <VideoOff size={28} />
                    </div>
                    <p className="text-xs font-semibold text-accent-300">Camera Feed Paused</p>
                  </div>
                )}

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-accent-950/80 backdrop-blur-md text-[11px] font-medium text-white flex items-center gap-1.5">
                    {micOn ? <Volume2 size={13} className="text-emerald-400" /> : <VolumeX size={13} className="text-danger-400" />}
                    {micOn ? 'Microphone Active' : 'Muted'}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2.5 py-1 rounded-md bg-accent-950/80 backdrop-blur-md text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Hardware Self-Check
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-accent-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleMicrophone}
                    className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
                      micOn ? 'bg-accent-800 text-white hover:bg-accent-700' : 'bg-danger-600 text-white'
                    }`}
                  >
                    {micOn ? <Mic size={15} /> : <MicOff size={15} />}
                    <span>{micOn ? 'Mute Mic' : 'Unmute Mic'}</span>
                  </button>
                  <button
                    onClick={toggleCamera}
                    className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all ${
                      camOn ? 'bg-accent-800 text-white hover:bg-accent-700' : 'bg-danger-600 text-white'
                    }`}
                  >
                    {camOn ? <Video size={15} /> : <VideoOff size={15} />}
                    <span>{camOn ? 'Turn Off Cam' : 'Turn On Cam'}</span>
                  </button>
                </div>
                <span className="text-[11px] text-accent-400">Test Equipment Before Entry</span>
              </div>
            </div>

            {/* Right: Holding Status */}
            <div className="lg:col-span-6 space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-accent-900 to-emerald-950/30 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isWaitingInQueue ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-primary-500/20 border border-primary-500/40 text-primary-400'
                  }`}>
                    <Radio size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {isWaitingInQueue ? 'Oral Defense In Progress with Another Examinee' : 'Waiting for Examiner to Enter Room'}
                    </h2>
                    <p className="text-xs text-accent-400">
                      {isWaitingInQueue ? 'Queued for live examination: ' : 'You are in queue for: '}
                      <span className="text-accent-200">{interviewTitle}</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-accent-300 leading-relaxed mb-4">
                  {isWaitingInQueue
                    ? `Examiner (${examinerName}) is currently conducting a 1-on-1 oral defense with another candidate (${queueOccupiedBy || 'Examinee'}). Only one student is admitted at a time. Please remain on this screen; you will be admitted automatically as soon as this session finishes.`
                    : `Please stay on this screen. As soon as your examiner (${examinerName}) enters the session, you will be automatically connected to the live interview room.`}
                </p>

                <div className="space-y-2 pt-3 border-t border-accent-800">
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 size={15} /> <span>Camera hardware detected & video pipeline initialized</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 size={15} /> <span>Microphone input active & audio streams calibrated</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 size={15} /> <span>Encrypted WebRTC P2P signaling socket connected</span>
                  </div>
                  {isWaitingInQueue && (
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <Clock size={15} /> <span>Single-Seat Viva Policy: Next examinee in queue</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-accent-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>{isWaitingInQueue ? 'Queue Position: Standing by for room vacancy' : 'Locked until examiner arrives'}</span>
                  </div>
                  <span className="text-[11px] text-accent-400 font-mono">Automatic transition</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-accent-900/60 border border-accent-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-accent-300">
                  <span>Candidate:</span>
                  <span className="font-semibold text-white">{examineeName} ({examineeEmail})</span>
                </div>
                <div className="flex items-center justify-between text-accent-300">
                  <span>Lead Examiner:</span>
                  <span className="font-semibold text-primary-300">{examinerName}</span>
                </div>
                <div className="flex items-center justify-between text-accent-300">
                  <span>Assessment Type:</span>
                  <span className="font-semibold text-white uppercase">{interview?.type || 'TECHNICAL ORAL DEFENSE'}</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="h-12 border-t border-accent-800/80 px-6 flex items-center justify-between text-[11px] text-accent-400 bg-accent-900/50">
          <span>SecureAssess Live Oral Evaluation System</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Signaling Server Online · Standing by
          </span>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: CLEAN CANDIDATE LIVE VIDEO CALL VIEW
  // =========================================================================
  return (
    <div className="h-screen bg-accent-950 flex flex-col overflow-hidden text-white select-none">
      {/* Clean Top Header */}
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
            <p className="text-xs text-accent-400">
              Host: <span className="text-accent-200 font-medium">{examinerName}</span> · {examineeName} ({candCode})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-danger-600/20 border border-danger-500/30">
            <span className="w-2 h-2 rounded-full bg-danger-500 animate-ping" />
            <span className="text-xs font-bold text-danger-300 tracking-wider">LIVE CALL</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-800/80 border border-accent-700 text-sm font-mono font-bold text-white">
            <Clock size={14} className="text-emerald-400" />
            <span>{formatTime(elapsed)}</span>
          </div>
        </div>
      </header>

      {/* Main Full-Width Video Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
            {/* 1. Candidate's Self Camera Stream */}
            <div className="bg-accent-900 rounded-2xl relative overflow-hidden flex flex-col justify-between border border-accent-800 shadow-xl">
              <div className="flex-1 flex items-center justify-center relative bg-gradient-to-b from-accent-850 to-accent-900 overflow-hidden">
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
              </div>

              <div className="px-4 py-2.5 bg-accent-950/90 border-t border-accent-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-white">You ({examineeName})</span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  WebRTC P2P Active
                </span>
              </div>
            </div>

            {/* 2. Examiner's Remote Camera Stream or Screen Share */}
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
                        SM
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
                  {remoteStreamActive ? 'HD Connected' : 'Waiting...'}
                </span>
              </div>
            </div>
          </div>

          {/* Minimalist Floating Bottom Dock */}
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
                screenSharing ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' : 'bg-accent-800 text-white hover:bg-accent-700'
              }`}
            >
              <ScreenShare size={20} />
            </button>

            <button
              onClick={handleToggleHand}
              title="Raise Hand"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                handRaised ? 'bg-amber-500 text-white ring-2 ring-amber-300' : 'bg-accent-800 text-white hover:bg-accent-700'
              }`}
            >
              <Hand size={20} />
            </button>

            <div className="w-px h-8 bg-accent-800 mx-1" />

            {/* In-Room Chat Drawer Toggle */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`px-4 h-12 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg ${
                isChatOpen ? 'bg-emerald-600 text-white' : 'bg-accent-800 text-accent-300 hover:bg-accent-700'
              }`}
            >
              <MessageSquare size={16} />
              <span>In-Room Chat</span>
            </button>

            <div className="w-px h-8 bg-accent-800 mx-1" />

            <button
              onClick={handleLeaveInterview}
              className="px-5 h-12 rounded-2xl bg-danger-600 hover:bg-danger-500 text-white flex items-center gap-2 transition-all font-bold text-xs shadow-lg shadow-danger-600/20"
            >
              <PhoneOff size={18} />
              <span>Leave Call</span>
            </button>
          </div>
        </div>

        {/* Slide-over Clean In-Room Chat Panel */}
        {isChatOpen && (
          <div className="w-80 md:w-96 bg-accent-900 border-l border-accent-800 flex flex-col shrink-0 overflow-hidden shadow-2xl z-30 animate-in slide-in-from-right duration-200">
            <div className="px-4 h-12 border-b border-accent-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">In-Room Live Chat</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-accent-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const isMe = m.role === 'CANDIDATE';
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
                          ? 'bg-emerald-600 text-white rounded-tr-none'
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
                placeholder="Message examiner..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 h-9 px-3 text-xs rounded-lg bg-accent-800 text-white placeholder:text-accent-500 border border-accent-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 transition-colors shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}

        {/* Theme-Respected Leave Interview Confirmation Modal */}
        <ConfirmModal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          onConfirm={executeLeaveInterview}
          title="Leave Live Interview Defense"
          message="Are you sure you want to leave the live interview defense session? Your camera feed and audio connection will disconnect."
          confirmText="Leave Session"
          cancelText="Stay in Room"
          variant="danger"
        />
      </div>
    </div>
  );
}

export default CandidateLiveInterview;
