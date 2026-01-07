import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userName?: string;
}

interface JwtPayload {
    id: string;
    email: string;
    name: string;
    role: string;
}

let io: Server | null = null;

/**
 * Initialize Socket.io server with JWT authentication
 */
export function initializeSocket(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:3000',
                'https://sustraia.vercel.app',
                'https://sustrain.es',
                'https://www.sustrain.es',
                config.frontend.url,
            ].filter(Boolean),
            credentials: true,
        },
    });

    // Authentication middleware
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
            socket.userId = decoded.id;
            socket.userName = decoded.name;
            next();
        } catch (error) {
            return next(new Error('Invalid token'));
        }
    });

    // Connection handler
    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`🔌 User connected: ${socket.userName} (${socket.userId})`);

        // Join user's personal room for direct messages
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
        }

        // Handle joining group rooms
        socket.on('group:join', (groupId: string) => {
            socket.join(`group:${groupId}`);
            console.log(`👥 ${socket.userName} joined group: ${groupId}`);
        });

        // Handle leaving group rooms
        socket.on('group:leave', (groupId: string) => {
            socket.leave(`group:${groupId}`);
            console.log(`🚪 ${socket.userName} left group: ${groupId}`);
        });

        // Handle typing indicators
        socket.on('typing:start', (data: { recipientId?: string; groupId?: string }) => {
            if (data.recipientId) {
                socket.to(`user:${data.recipientId}`).emit('typing:start', {
                    userId: socket.userId,
                    userName: socket.userName,
                });
            } else if (data.groupId) {
                socket.to(`group:${data.groupId}`).emit('typing:start', {
                    userId: socket.userId,
                    userName: socket.userName,
                });
            }
        });

        socket.on('typing:stop', (data: { recipientId?: string; groupId?: string }) => {
            if (data.recipientId) {
                socket.to(`user:${data.recipientId}`).emit('typing:stop', {
                    userId: socket.userId,
                });
            } else if (data.groupId) {
                socket.to(`group:${data.groupId}`).emit('typing:stop', {
                    userId: socket.userId,
                });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.userName}`);
        });
    });

    console.log('✅ Socket.io initialized');
    return io;
}

/**
 * Get Socket.io server instance
 */
export function getIO(): Server | null {
    return io;
}

/**
 * Emit a new message to recipient
 */
export function emitNewMessage(recipientId: string, message: {
    id: string;
    fromId: string;
    fromName: string;
    content: string;
    createdAt: Date;
}) {
    if (io) {
        io.to(`user:${recipientId}`).emit('message:new', message);
    }
}

/**
 * Emit message read event
 */
export function emitMessageRead(senderId: string, messageId: string) {
    if (io) {
        io.to(`user:${senderId}`).emit('message:read', { messageId });
    }
}

/**
 * Emit new group message
 */
export function emitGroupMessage(groupId: string, message: {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: Date;
}) {
    if (io) {
        io.to(`group:${groupId}`).emit('group:message', message);
    }
}

/**
 * Emit achievement earned notification
 */
export function emitAchievementEarned(userId: string, achievement: {
    id: string;
    code: string;
    name: string;
    icon: string;
}) {
    if (io) {
        io.to(`user:${userId}`).emit('achievement:earned', achievement);
    }
}
