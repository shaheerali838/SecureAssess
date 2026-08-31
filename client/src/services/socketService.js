import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:7000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    try {
      this.socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[SocketService] Connected to backend signaling server:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SocketService] Disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.warn('[SocketService] Connection warning (running with mock fallback):', error.message);
      });

      return this.socket;
    } catch (err) {
      console.warn('[SocketService] Initialization warning:', err);
      return null;
    }
  }

  joinRoom(roomId, userId, role) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit('join-room', { roomId, userId, role });
    }
  }

  sendSignal(roomId, signal, targetSocketId) {
    if (this.socket) {
      this.socket.emit('signal', { roomId, signal, targetSocketId });
    }
  }

  emitProctorEvent(roomId, eventType, metadata = {}) {
    if (!this.socket) this.connect();
    if (this.socket) {
      const payload = {
        roomId,
        eventType,
        timestamp: new Date().toISOString(),
        metadata,
      };
      this.socket.emit('proctor-event', payload);
      this.socket.emit('candidate-anomaly', payload);
    }
  }

  on(event, callback) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  connectInterviewSocket(token) {
    const url = `${SOCKET_SERVER_URL}/interviews`;
    try {
      const interviewSocket = io(url, {
        auth: { token },
        query: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      interviewSocket.on('connect', () => {
        console.log('[SocketService] Connected to /interviews namespace:', interviewSocket.id);
      });

      interviewSocket.on('connect_error', (err) => {
        console.warn('[SocketService] Interview namespace connection note:', err.message);
      });

      return interviewSocket;
    } catch (err) {
      console.warn('[SocketService] Interview namespace connection failed:', err);
      return null;
    }
  }

  joinInterviewRoom(socket, interviewId, token, participantInfo = {}) {
    if (socket) {
      socket.emit('interview:join', { interviewId, token, ...participantInfo });
    }
  }

  sendInterviewSignal(socket, event, data) {
    if (socket) {
      socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
