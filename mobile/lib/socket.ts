import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://api.sustraia.com';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  /**
   * Connect to socket server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Disconnect from socket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected manually');
    }
  }

  /**
   * Listen for new messages
   */
  onNewMessage(callback: (message: any) => void): void {
    this.socket?.on('new_message', callback);
  }

  /**
   * Remove message listener
   */
  offNewMessage(): void {
    this.socket?.off('new_message');
  }

  /**
   * Listen for message read status
   */
  onMessageRead(callback: (data: { userId: string }) => void): void {
    this.socket?.on('messages_read', callback);
  }

  /**
   * Remove message read listener
   */
  offMessageRead(): void {
    this.socket?.off('messages_read');
  }

  /**
   * Listen for typing indicator
   */
  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void {
    this.socket?.on('user_typing', callback);
  }

  /**
   * Emit typing indicator
   */
  emitTyping(toUserId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { toUserId, isTyping });
  }

  /**
   * Listen for user status changes
   */
  onUserStatus(callback: (data: { userId: string; isOnline: boolean; lastSeen?: string }) => void): void {
    this.socket?.on('user_status', callback);
  }

  /**
   * Remove user status listener
   */
  offUserStatus(): void {
    this.socket?.off('user_status');
  }

  /**
   * Request user status
   */
  requestUserStatus(userId: string): void {
    this.socket?.emit('get_user_status', { userId });
  }

  /**
   * Check if socket is connected
   */
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket instance (for custom events)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
