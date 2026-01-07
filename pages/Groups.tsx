/**
 * Groups (Cuadrilla) Page
 * Community accountability groups with leaderboard and chat
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Plus,
    Copy,
    MessageCircle,
    Trophy,
    ArrowLeft,
    Send,
    UserPlus,
    Crown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api/client';
import { useSocket } from '../lib/hooks/useSocket';

interface Group {
    id: string;
    name: string;
    description?: string;
    weeklyGoal: number;
    inviteCode: string;
    createdAt: string;
    myRole: string;
    members: { user: { id: string; name: string } }[];
    _count: { messages: number };
}

interface LeaderboardEntry {
    user: { id: string; name: string };
    role: string;
    weeklyWorkouts: number;
    compliance: number;
}

interface GroupMessage {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
}

const GroupsPage: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [copiedCode, setCopiedCode] = useState(false);

    const { joinGroup, leaveGroup } = useSocket();

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadGroupDetails(selectedGroup);
            joinGroup(selectedGroup);
        }
        return () => {
            if (selectedGroup) {
                leaveGroup(selectedGroup);
            }
        };
    }, [selectedGroup, joinGroup, leaveGroup]);

    const loadGroups = async () => {
        try {
            const res = await api.groups.getAll();
            setGroups(res.groups);
        } catch (error) {
            console.error('Failed to load groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGroupDetails = async (id: string) => {
        try {
            const [groupRes, messagesRes] = await Promise.all([
                api.groups.get(id),
                api.groups.getMessages(id),
            ]);
            setLeaderboard(groupRes.leaderboard);
            setMessages(messagesRes.messages);
        } catch (error) {
            console.error('Failed to load group details:', error);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        try {
            const res = await api.groups.create({ name: newGroupName.trim() });
            await loadGroups();
            setSelectedGroup(res.group.id);
            setShowCreate(false);
            setNewGroupName('');
        } catch (error) {
            console.error('Failed to create group:', error);
        }
    };

    const handleJoinGroup = async () => {
        if (!inviteCode.trim()) return;
        try {
            const res = await api.groups.join(inviteCode.trim());
            await loadGroups();
            setSelectedGroup(res.group.id);
            setShowJoin(false);
            setInviteCode('');
        } catch (error) {
            console.error('Failed to join group:', error);
            alert('Código de invitación inválido');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup || !newMessage.trim()) return;
        try {
            const res = await api.groups.sendMessage(selectedGroup, newMessage.trim());
            setMessages(prev => [...prev, res.message]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const copyInviteCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const currentGroup = groups.find(g => g.id === selectedGroup);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:scale-105 transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Cuadrilla
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                Grupos de responsabilidad
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowJoin(true)}
                            className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium shadow-lg hover:scale-105 transition flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            Unirse
                        </button>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-medium shadow-lg hover:scale-105 transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Crear
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Groups List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Mis Grupos
                        </h2>
                        {groups.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No tienes grupos aún</p>
                                <p className="text-sm">Crea uno o únete con un código</p>
                            </div>
                        ) : (
                            groups.map(group => (
                                <motion.button
                                    key={group.id}
                                    onClick={() => setSelectedGroup(group.id)}
                                    className={`w-full text-left p-4 rounded-2xl transition ${selectedGroup === group.id
                                            ? 'bg-purple-600 text-white shadow-lg'
                                            : 'bg-white dark:bg-gray-800 hover:shadow-md'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedGroup === group.id
                                                    ? 'bg-white/20'
                                                    : 'bg-purple-100 dark:bg-purple-900'
                                                }`}
                                        >
                                            <Users
                                                className={`w-5 h-5 ${selectedGroup === group.id
                                                        ? 'text-white'
                                                        : 'text-purple-600 dark:text-purple-400'
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3
                                                className={`font-semibold ${selectedGroup === group.id
                                                        ? 'text-white'
                                                        : 'text-gray-900 dark:text-white'
                                                    }`}
                                            >
                                                {group.name}
                                            </h3>
                                            <p
                                                className={`text-sm ${selectedGroup === group.id
                                                        ? 'text-white/70'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                    }`}
                                            >
                                                {group.members.length} miembros
                                            </p>
                                        </div>
                                        {group.myRole === 'CREATOR' && (
                                            <Crown
                                                className={`w-4 h-4 ${selectedGroup === group.id
                                                        ? 'text-yellow-300'
                                                        : 'text-yellow-500'
                                                    }`}
                                            />
                                        )}
                                    </div>
                                </motion.button>
                            ))
                        )}
                    </div>

                    {/* Leaderboard */}
                    {currentGroup && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Ranking Semanal
                                </h2>
                                <button
                                    onClick={() => copyInviteCode(currentGroup.inviteCode)}
                                    className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                                >
                                    <Copy className="w-4 h-4" />
                                    {copiedCode ? '¡Copiado!' : 'Invitar'}
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Meta: {currentGroup.weeklyGoal} entrenos/semana
                            </p>
                            <div className="space-y-3">
                                {leaderboard.map((entry, index) => (
                                    <div
                                        key={entry.user.id}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0
                                                    ? 'bg-yellow-100 text-yellow-600'
                                                    : index === 1
                                                        ? 'bg-gray-200 text-gray-600'
                                                        : index === 2
                                                            ? 'bg-orange-100 text-orange-600'
                                                            : 'bg-gray-100 text-gray-500'
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {entry.user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {entry.weeklyWorkouts} entrenos
                                            </p>
                                        </div>
                                        <div
                                            className={`text-lg font-bold ${entry.compliance >= 100
                                                    ? 'text-green-600'
                                                    : entry.compliance >= 50
                                                        ? 'text-yellow-600'
                                                        : 'text-red-500'
                                                }`}
                                        >
                                            {entry.compliance}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Group Chat */}
                    {currentGroup && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg flex flex-col h-[500px]">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageCircle className="w-5 h-5 text-purple-600" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Chat del Grupo
                                </h2>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                                {messages.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Sin mensajes aún</p>
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                                        >
                                            <p className="font-medium text-sm text-purple-600 dark:text-purple-400">
                                                {msg.user.name}
                                            </p>
                                            <p className="text-gray-700 dark:text-gray-300">
                                                {msg.content}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(msg.createdAt).toLocaleTimeString('es-ES', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-2 rounded-xl bg-purple-600 text-white disabled:opacity-50 hover:bg-purple-700 transition"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                <AnimatePresence>
                    {showCreate && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                            onClick={() => setShowCreate(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4"
                                onClick={e => e.stopPropagation()}
                            >
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    Crear Cuadrilla
                                </h2>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="Nombre del grupo"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCreate(false)}
                                        className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateGroup}
                                        disabled={!newGroupName.trim()}
                                        className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-medium disabled:opacity-50"
                                    >
                                        Crear
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Join Modal */}
                <AnimatePresence>
                    {showJoin && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                            onClick={() => setShowJoin(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4"
                                onClick={e => e.stopPropagation()}
                            >
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    Unirse a una Cuadrilla
                                </h2>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={e => setInviteCode(e.target.value)}
                                    placeholder="Código de invitación"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowJoin(false)}
                                        className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleJoinGroup}
                                        disabled={!inviteCode.trim()}
                                        className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-medium disabled:opacity-50"
                                    >
                                        Unirse
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default GroupsPage;
