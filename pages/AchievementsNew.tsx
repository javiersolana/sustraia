/**
 * ACHIEVEMENTS PAGE - Nueva versión dopaminérgica
 * Sistema completo de logros con niveles, XP y notificaciones
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame, Target, Trophy, ChevronRight, Bell, Sparkles,
    Award, Zap, Crown, Star, CheckCircle2, Users, MapPin,
    Activity, TrendingUp, Heart, Calendar, Footprints,
    Link, Medal, Sunrise, Moon, CalendarCheck, Rocket,
    Mountain, Shield, MessageCircle, RotateCcw
} from 'lucide-react';
import { api } from '../lib/api/client';

const ICON_MAP: Record<string, React.ElementType> = {
    Flame, Target, Trophy, Award, Zap, Crown, Star, CheckCircle2, Users, MapPin,
    Activity, TrendingUp, Heart, Calendar, Footprints, Link, Medal, Sunrise,
    Moon, CalendarCheck, Rocket, Mountain, Shield, MessageCircle, Sparkles, RotateCcw
};

type AchievementCategory = 'Todos' | 'Racha' | 'Distancia' | 'Entreno' | 'Comunidad' | 'Especial';

const CATEGORY_MAP: Record<string, AchievementCategory> = {
    'STREAK': 'Racha',
    'DISTANCE': 'Distancia',
    'WORKOUT': 'Entreno',
    'COMMUNITY': 'Comunidad',
    'SPECIAL': 'Especial',
};

interface Achievement {
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    threshold?: number;
}

interface UserAchievement {
    id: string;
    earnedAt: string;
    achievement: Achievement;
}

interface UserStats {
    level: number;
    currentXp: number;
    nextLevelXp: number;
    streakDays: number;
    totalKm: number;
    totalWorkouts: number;
}

interface Progress {
    currentStreak: number;
    totalDistance: number;
    totalWorkouts: number;
}

const CATEGORIES: AchievementCategory[] = ['Todos', 'Racha', 'Distancia', 'Entreno', 'Comunidad', 'Especial'];

// Calculate level and XP based on total XP earned
function calculateLevelAndXP(totalXp: number): { level: number; currentXp: number; nextLevelXp: number } {
    let level = 1;
    let xpForNextLevel = 1000; // Base XP for level 2
    let totalXpForCurrentLevel = 0;

    while (totalXp >= totalXpForCurrentLevel + xpForNextLevel) {
        totalXpForCurrentLevel += xpForNextLevel;
        level++;
        xpForNextLevel = Math.floor(xpForNextLevel * 1.2); // 20% increase per level
    }

    const currentXp = totalXp - totalXpForCurrentLevel;

    return { level, currentXp, nextLevelXp: xpForNextLevel };
}

const AchievementsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState<AchievementCategory>('Todos');
    const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
    const [myAchievements, setMyAchievements] = useState<UserAchievement[]>([]);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [loading, setLoading] = useState(true);
    const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
    const [showNewAchievementModal, setShowNewAchievementModal] = useState(false);

    useEffect(() => {
        loadAchievements();
    }, []);

    const loadAchievements = async () => {
        try {
            const [allRes, mineRes] = await Promise.all([
                api.achievements.getAll(),
                api.achievements.getMine(),
            ]);

            setAllAchievements(allRes.achievements);
            setMyAchievements(mineRes.achievements);
            setProgress(mineRes.progress);

            // Check for new achievements
            await checkNewAchievements();
        } catch (error) {
            console.error('Failed to load achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkNewAchievements = async () => {
        try {
            const response = await api.achievements.check();
            if (response.newAchievements && response.newAchievements.length > 0) {
                setNewAchievements(response.newAchievements);
                setShowNewAchievementModal(true);
            }
        } catch (error) {
            console.error('Failed to check achievements:', error);
        }
    };

    const earnedCodes = new Set(myAchievements.map(ua => ua.achievement.code));

    const filteredAchievements = allAchievements.filter(
        (a) => activeCategory === 'Todos' || CATEGORY_MAP[a.category] === activeCategory
    );

    const unlockedCount = myAchievements.length;
    const totalCount = allAchievements.length;

    // Calculate user stats
    const totalXp = myAchievements.reduce((sum, ua) => {
        // Assume each achievement gives XP based on rarity (you can adjust this)
        return sum + 100; // Default 100 XP per achievement
    }, 0);

    const userStats = {
        ...calculateLevelAndXP(totalXp),
        streakDays: progress?.currentStreak || 0,
        totalKm: (progress?.totalDistance || 0) / 1000,
        totalWorkouts: progress?.totalWorkouts || 0,
    };

    const percentage = Math.min((userStats.currentXp / userStats.nextLevelXp) * 100, 100);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex text-gray-900 font-sans">
            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 lg:px-12 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <header className="flex justify-between items-start mb-8 md:mb-12">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                            Mis Logros
                        </h1>
                        <p className="text-gray-500">
                            Has desbloqueado{' '}
                            <span className="font-semibold text-gray-900">{unlockedCount}</span> de{' '}
                            <span className="font-semibold text-gray-900">{totalCount}</span> logros disponibles
                        </p>
                    </div>
                    <button
                        className="p-3 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                        onClick={() => navigate(-1)}
                    >
                        <Bell size={20} />
                    </button>
                </header>

                {/* Level & XP Bar - Dopamine Hit #1 */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden mb-8">
                    {/* Decorative background circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-2xl font-bold shadow-inner">
                                {userStats.level}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    Corredor de Élite
                                    <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
                                </h2>
                                <p className="text-blue-100">¡Sigue empujando, estás a punto de subir!</p>
                            </div>
                        </div>

                        <div className="flex-1 max-w-xl">
                            <div className="flex justify-between text-xs font-medium mb-2 uppercase tracking-wider text-blue-100">
                                <span>Experiencia</span>
                                <span>
                                    {userStats.currentXp} / {userStats.nextLevelXp} XP
                                </span>
                            </div>
                            <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-yellow-300 to-amber-500 rounded-full"
                                ></motion.div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid - Visual Reinforcement */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                        <div className="p-4 rounded-xl bg-orange-50 flex items-center justify-center">
                            <Flame className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                                Racha Actual
                            </p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-2xl font-bold text-gray-900">{userStats.streakDays} días</h3>
                            </div>
                            <p className="text-gray-400 text-sm">¡Estás que ardes!</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                        <div className="p-4 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Target className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                                Distancia Total
                            </p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-2xl font-bold text-gray-900">{userStats.totalKm.toFixed(0)} km</h3>
                            </div>
                            <p className="text-gray-400 text-sm">
                                {Math.floor(userStats.totalKm / 42)} maratones
                            </p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                        <div className="p-4 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                                Entrenos
                            </p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-2xl font-bold text-gray-900">{userStats.totalWorkouts}</h3>
                            </div>
                            <p className="text-gray-400 text-sm">Sesiones completadas</p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`
                px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border
                ${
                    activeCategory === cat
                        ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }
              `}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredAchievements.map((achievement) => {
                        const isUnlocked = earnedCodes.has(achievement.code);
                        const userAch = myAchievements.find((ua) => ua.achievement.code === achievement.code);
                        const IconComponent = ICON_MAP[achievement.icon] || Trophy;

                        // Calculate progress
                        let currentValue = 0;
                        if (achievement.category === 'STREAK') {
                            currentValue = progress?.currentStreak || 0;
                        } else if (achievement.category === 'DISTANCE') {
                            currentValue = progress?.totalDistance || 0;
                        } else if (achievement.category === 'WORKOUT') {
                            currentValue = progress?.totalWorkouts || 0;
                        }
                        const progressPercentage = achievement.threshold
                            ? Math.min((currentValue / achievement.threshold) * 100, 100)
                            : 0;

                        // Rarity colors
                        const rarityConfig = isUnlocked
                            ? {
                                  bg: 'bg-emerald-50',
                                  text: 'text-emerald-600',
                                  border: 'border-emerald-100',
                              }
                            : {
                                  bg: 'bg-slate-100',
                                  text: 'text-slate-600',
                                  border: 'border-slate-200',
                              };

                        const opacityClass = isUnlocked
                            ? 'opacity-100'
                            : 'opacity-60 grayscale-[0.8] hover:grayscale-0 hover:opacity-100 transition-all duration-300';

                        return (
                            <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden ${opacityClass}`}
                            >
                                {isUnlocked && (
                                    <div className="absolute top-0 right-0 p-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                )}

                                <div className="flex flex-col h-full">
                                    {/* Header with Icon */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className={`p-3 rounded-xl ${rarityConfig.bg} ${rarityConfig.text} group-hover:scale-110 transition-transform duration-300`}
                                        >
                                            <IconComponent size={24} strokeWidth={2.5} />
                                        </div>
                                        {isUnlocked && userAch && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                                {new Date(userAch.earnedAt).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="mb-4 flex-1">
                                        <h3 className="font-bold text-gray-900 mb-1 leading-tight">
                                            {achievement.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            {achievement.description}
                                        </p>
                                    </div>

                                    {/* Footer / Progress */}
                                    <div className="mt-auto">
                                        {!isUnlocked ? (
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[10px] font-semibold text-gray-400 uppercase">
                                                    <span>Progreso</span>
                                                    <span>{Math.floor(progressPercentage)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${progressPercentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="text-right text-[10px] text-gray-400 pt-1">
                                                    +100 XP
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-lg w-fit">
                                                <span>Desbloqueado</span>
                                                <span className="text-emerald-400">•</span>
                                                <span>+100 XP</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer Motivation */}
                <div className="mt-12 text-center pb-8">
                    <button className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                        Ver historial completo de actividades <ChevronRight size={16} />
                    </button>
                </div>
            </main>

            {/* New Achievement Modal - DOPAMINIC! */}
            <AnimatePresence>
                {showNewAchievementModal && newAchievements.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowNewAchievementModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl max-w-md w-full p-8 text-center relative overflow-hidden"
                        >
                            {/* Confetti background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 opacity-50"></div>

                            <div className="relative z-10">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 10, -10, 0],
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        repeatDelay: 2,
                                    }}
                                    className="text-6xl mb-4"
                                >
                                    🎉
                                </motion.div>

                                <h2 className="text-3xl font-black text-gray-900 mb-2">¡NUEVO LOGRO!</h2>
                                <p className="text-gray-600 mb-6">Has desbloqueado:</p>

                                {newAchievements.map((achievement) => {
                                    const IconComponent = ICON_MAP[achievement.icon] || Trophy;
                                    return (
                                        <div
                                            key={achievement.code}
                                            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white mb-4"
                                        >
                                            <IconComponent className="w-12 h-12 mx-auto mb-3" />
                                            <h3 className="text-xl font-bold mb-1">{achievement.name}</h3>
                                            <p className="text-blue-100 text-sm">{achievement.description}</p>
                                            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold">
                                                <Sparkles size={16} className="text-yellow-300" />
                                                +100 XP
                                            </div>
                                        </div>
                                    );
                                })}

                                <button
                                    onClick={() => setShowNewAchievementModal(false)}
                                    className="w-full py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-colors"
                                >
                                    ¡Seguir entrenando!
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AchievementsPage;
