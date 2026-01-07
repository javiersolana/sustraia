/**
 * Messages Page
 * Private messaging between athletes and coaches
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Send,
    Loader2,
    ArrowLeft,
    User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, type Message, type User as UserType } from '../lib/api/client';
import { useSocket } from '../lib/hooks/useSocket';

interface Conversation {
    user: { id: string; name: string; email: string; role: string };
    lastMessage: { content: string; createdAt: string; read: boolean };
    unread: number;
}

const MessagesPage: React.FC = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const [coach, setCoach] = useState<{ id: string; name: string; email: string } | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const { socket } = useSocket();

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedUserId) {
            loadMessages(selectedUserId);
        }
    }, [selectedUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Listen for new messages via Socket.IO
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: Message) => {
            // If message is in current conversation, add it
            if (
                (message.fromId === selectedUserId || message.toId === selectedUserId) &&
                currentUser
            ) {
                setMessages(prev => [...prev, message]);
            }
            // Refresh conversations to update unread count
            loadConversations();
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket, selectedUserId, currentUser]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const profileRes = await api.auth.getProfile();
            setCurrentUser(profileRes.user);

            if (profileRes.user.role === 'ATLETA') {
                // For athletes: get their coach
                const coachRes = await api.user.getMyCoach();
                setCoach(coachRes.coach);
                if (coachRes.coach) {
                    setSelectedUserId(coachRes.coach.id);
                }
            } else if (profileRes.user.role === 'COACH') {
                // For coaches: load conversations
                await loadConversations();
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadConversations = async () => {
        try {
            const res = await api.messages.getConversations();
            setConversations(res.conversations);
            // Auto-select first conversation if none selected
            if (!selectedUserId && res.conversations.length > 0) {
                setSelectedUserId(res.conversations[0].user.id);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    };

    const loadMessages = async (userId: string) => {
        try {
            const res = await api.messages.getWith(userId);
            setMessages(res.messages);
            // Mark messages as read
            for (const msg of res.messages) {
                if (!msg.read && msg.toId === currentUser?.id) {
                    await api.messages.markAsRead(msg.id).catch(console.error);
                }
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await api.messages.send(selectedUserId, newMessage.trim());
            setMessages(prev => [...prev, res.message]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Error al enviar mensaje');
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const selectedUserName = currentUser?.role === 'ATLETA'
        ? coach?.name
        : conversations.find(c => c.user.id === selectedUserId)?.user.name;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Cargando mensajes...</p>
                </div>
            </div>
        );
    }

    // Athlete with no coach
    if (currentUser?.role === 'ATLETA' && !coach) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:scale-105 transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Mensajes
                        </h1>
                    </div>
                    <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                            No tienes un coach asignado todavía.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            Contacta con el administrador para que te asigne un coach.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:scale-105 transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Mensajes
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            {currentUser?.role === 'ATLETA'
                                ? `Conversación con ${coach?.name}`
                                : 'Conversaciones con atletas'}
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-12 gap-6">
                    {/* Conversations List (only for coaches) */}
                    {currentUser?.role === 'COACH' && (
                        <div className="md:col-span-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Atletas
                            </h2>
                            <div className="space-y-2">
                                {conversations.length === 0 ? (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                                        No hay conversaciones
                                    </p>
                                ) : (
                                    conversations.map(conv => (
                                        <button
                                            key={conv.user.id}
                                            onClick={() => setSelectedUserId(conv.user.id)}
                                            className={`w-full text-left p-3 rounded-xl transition ${
                                                selectedUserId === conv.user.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                        selectedUserId === conv.user.id
                                                            ? 'bg-white/20'
                                                            : 'bg-blue-100 dark:bg-blue-900'
                                                    }`}
                                                >
                                                    <User
                                                        className={`w-5 h-5 ${
                                                            selectedUserId === conv.user.id
                                                                ? 'text-white'
                                                                : 'text-blue-600 dark:text-blue-400'
                                                        }`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold truncate">
                                                        {conv.user.name}
                                                    </p>
                                                    <p
                                                        className={`text-sm truncate ${
                                                            selectedUserId === conv.user.id
                                                                ? 'text-white/70'
                                                                : 'text-gray-500 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {conv.lastMessage?.content ||
                                                            'Sin mensajes'}
                                                    </p>
                                                </div>
                                                {conv.unread > 0 && (
                                                    <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                                        {conv.unread}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Messages Panel */}
                    <div
                        className={`${
                            currentUser?.role === 'COACH' ? 'md:col-span-8' : 'md:col-span-12'
                        } bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col`}
                        style={{ height: '600px' }}
                    >
                        {selectedUserId ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {selectedUserName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {currentUser?.role === 'ATLETA'
                                                    ? 'Coach'
                                                    : 'Atleta'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <AnimatePresence>
                                        {messages.map(msg => {
                                            const isOwn = msg.fromId === currentUser?.id;
                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className={`flex ${
                                                        isOwn ? 'justify-end' : 'justify-start'
                                                    }`}
                                                >
                                                    <div
                                                        className={`max-w-xs px-4 py-3 rounded-2xl ${
                                                            isOwn
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                        }`}
                                                    >
                                                        <p className="text-sm">{msg.content}</p>
                                                        <p
                                                            className={`text-xs mt-1 ${
                                                                isOwn
                                                                    ? 'text-blue-100'
                                                                    : 'text-gray-500 dark:text-gray-400'
                                                            }`}
                                                        >
                                                            {new Date(
                                                                msg.createdAt
                                                            ).toLocaleTimeString('es-ES', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form
                                    onSubmit={handleSendMessage}
                                    className="p-4 border-t border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            placeholder="Escribe un mensaje..."
                                            disabled={sending}
                                            className="flex-1 px-4 py-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || sending}
                                            className="px-6 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                                        >
                                            {sending ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Selecciona una conversación
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;
