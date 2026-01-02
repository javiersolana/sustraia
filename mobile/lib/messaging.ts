import api from './api';

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  read: boolean;
  createdAt: string;
  from?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  to?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface Conversation {
  userId: string;
  userName: string;
  userRole: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export const messagingService = {
  /**
   * Get all conversations for current user
   */
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await api.get('/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  /**
   * Get messages with a specific user
   */
  getMessages: async (userId: string): Promise<Message[]> => {
    try {
      const response = await api.get(`/messages/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  /**
   * Send a message to a user
   */
  sendMessage: async (toId: string, content: string): Promise<Message | null> => {
    try {
      const response = await api.post('/messages', { toId, content });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  /**
   * Mark messages as read
   */
  markAsRead: async (userId: string): Promise<boolean> => {
    try {
      await api.patch(`/messages/${userId}/read`);
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  },

  /**
   * Get unread message count
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get('/messages/unread-count');
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },
};
