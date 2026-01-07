/**
 * Socket.io Client Hook
 * Real-time connection for messages and notifications
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

interface UseSocketOptions {
    autoConnect?: boolean;
}

interface Achievement {
    id: string;
    code: string;
    name: string;
    icon: string;
}

interface NewMessage {
    id: string;
    fromId: string;
    fromName: string;
    content: string;
    createdAt: Date;
}

interface TypingEvent {
    userId: string;
    userName?: string;
}

export function useSocket(options: UseSocketOptions = { autoConnect: true }) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [newMessages, setNewMessages] = useState<NewMessage[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

    const connect = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token || socketRef.current?.connected) return;

        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('connect', () => {
            console.log('🔌 Socket connected');
            setIsConnected(true);
        });

        socketRef.current.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setIsConnected(false);
        });

        // Message events
        socketRef.current.on('message:new', (message: NewMessage) => {
            console.log('📬 New message:', message);
            setNewMessages(prev => [...prev, message]);
        });

        socketRef.current.on('message:read', ({ messageId }: { messageId: string }) => {
            console.log('✓ Message read:', messageId);
        });

        // Achievement events
        socketRef.current.on('achievement:earned', (achievement: Achievement) => {
            console.log('🏆 Achievement earned:', achievement);
            setAchievements(prev => [...prev, achievement]);
        });

        // Typing events
        socketRef.current.on('typing:start', ({ userId, userName }: TypingEvent) => {
            setTypingUsers(prev => new Map(prev).set(userId, userName || 'Someone'));
        });

        socketRef.current.on('typing:stop', ({ userId }: TypingEvent) => {
            setTypingUsers(prev => {
                const next = new Map(prev);
                next.delete(userId);
                return next;
            });
        });
    }, []);

    const disconnect = useCallback(() => {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setIsConnected(false);
    }, []);

    // Join/leave group rooms
    const joinGroup = useCallback((groupId: string) => {
        socketRef.current?.emit('group:join', groupId);
    }, []);

    const leaveGroup = useCallback((groupId: string) => {
        socketRef.current?.emit('group:leave', groupId);
    }, []);

    // Typing indicators
    const startTyping = useCallback((recipientId?: string, groupId?: string) => {
        socketRef.current?.emit('typing:start', { recipientId, groupId });
    }, []);

    const stopTyping = useCallback((recipientId?: string, groupId?: string) => {
        socketRef.current?.emit('typing:stop', { recipientId, groupId });
    }, []);

    // Clear notifications
    const clearNewMessages = useCallback(() => setNewMessages([]), []);
    const clearAchievements = useCallback(() => setAchievements([]), []);

    // Auto-connect on mount
    useEffect(() => {
        if (options.autoConnect && localStorage.getItem('token')) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [options.autoConnect, connect, disconnect]);

    return {
        socket: socketRef.current,
        isConnected,
        newMessages,
        achievements,
        typingUsers: Array.from(typingUsers.values()),
        connect,
        disconnect,
        joinGroup,
        leaveGroup,
        startTyping,
        stopTyping,
        clearNewMessages,
        clearAchievements,
    };
}

export default useSocket;
