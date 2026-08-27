import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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
        console.warn('[SocketService] Connection error (falling back to offline mock mode):', error.message);
      });

      return this.socket;
    } catch (err) {
      console.warn('[SocketService] Initialization error:', err);
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
    if (this.socket) {
      this.socket.emit('proctor-event', {
        roomId,
        eventType,
        timestamp: new Date().toISOString(),
        metadata,
      });
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

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
