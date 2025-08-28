import { io } from 'socket.io-client';
import { getStoredToken } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.currentRoom = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.pendingEmissions = [];
  }

  connect(auth = {}) {
    // If already connected with same auth, return existing connection
    if (this.socket?.connected) {
      console.log('Socket already connected, reusing connection');
      return this.socket;
    }

    // Disconnect any existing socket first
    if (this.socket) {
      console.log('Disconnecting existing socket before creating new one');
      this.socket.disconnect();
      this.socket = null;
    }

    const token = getStoredToken();
    
    console.log('Creating new socket connection with auth:', { hasToken: !!token, ...auth });
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token,
        ...auth
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      forceNew: true, // Force a new connection
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Retry any pending emissions
      this.retryPendingEmissions();

      // Rejoin current room if we were in one
      if (this.currentRoom) {
        console.log('Attempting to rejoin room:', this.currentRoom);
        this.requestReconnect(this.currentRoom);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
      
      // Auto-reconnect after a short delay for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.socket.connect();
          }, 2000 * this.reconnectAttempts); // Exponential backoff
        }
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      
      // Emit custom error event for UI handling
      if (this.eventListeners.has('socket_error')) {
        this.eventListeners.get('socket_error').forEach(callback => {
          callback(error);
        });
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting to reconnect...', attemptNumber);
    });

    return this.socket;
  }

  connectAsGuest(guestId, guestUsername) {
    console.log('Connecting as guest:', { guestId, guestUsername });
    return this.connect({
      guestId,
      guestUsername
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
      this.currentRoom = null;
      this.reconnectAttempts = 0;
      this.pendingEmissions = [];
    }
  }

  // Event handling
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.on(event, callback);
    
    // Store listener for cleanup
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);
    
    // Remove from stored listeners
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    console.log(`Attempting to emit event: ${event}`, { 
      connected: this.socket?.connected, 
      hasSocket: !!this.socket,
      data 
    });
    
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit event:', event);
      // Store failed emissions for retry
      if (this.currentRoom && event !== 'reconnect_to_room') {
        this.pendingEmissions = this.pendingEmissions || [];
        this.pendingEmissions.push({ event, data });
      }
      return false;
    }

    console.log(`Emitting event: ${event}`, data);
    this.socket.emit(event, data);
    return true;
  }

  // Retry pending emissions when reconnected
  retryPendingEmissions() {
    if (this.pendingEmissions && this.pendingEmissions.length > 0) {
      console.log('Retrying pending emissions:', this.pendingEmissions.length);
      for (const { event, data } of this.pendingEmissions) {
        this.emit(event, data);
      }
      this.pendingEmissions = [];
    }
  }

  // Game-specific methods
  createRoom(gameData) {
    this.emit('create_room', gameData);
  }

  joinRoom(roomId, spectate = false) {
    this.currentRoom = roomId;
    this.emit('join_room', { roomId, spectate });
  }

  leaveRoom(roomId) {
    this.emit('leave_room', { roomId });
    if (this.currentRoom === roomId) {
      this.currentRoom = null;
    }
  }

  playerReady(roomId) {
    this.emit('player_ready', { roomId });
  }

  makeMove(roomId, from, to) {
    this.emit('make_move', { roomId, from, to });
  }

  promotePawn(roomId, from, to, promotion) {
    this.emit('promote_pawn', { roomId, from, to, promotion });
  }

  sendMessage(roomId, message) {
    this.emit('send_message', { roomId, message });
  }

  resign(roomId) {
    this.emit('resign', { roomId });
  }

  requestReconnect(roomId) {
    this.emit('reconnect_to_room', { roomId });
  }

  // Connection status
  isSocketConnected() {
    return this.socket?.connected || false;
  }

  // Get current room
  getCurrentRoom() {
    return this.currentRoom;
  }

  // Set current room
  setCurrentRoom(roomId) {
    this.currentRoom = roomId;
  }

  // Clear current room
  clearCurrentRoom() {
    this.currentRoom = null;
  }

  // Cleanup all listeners
  removeAllListeners() {
    if (this.socket) {
      this.eventListeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.eventListeners.clear();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
