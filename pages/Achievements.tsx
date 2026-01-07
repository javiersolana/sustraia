/**
 * Achievements Page
 * Displays user's earned medals and progress toward next achievements
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Target, Users, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api/client';

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

interface Progress {
    currentStreak: number;
    totalDistance: number;
    totalWorkouts: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
    STREAK: <Flame className="w-5 h-5" />,
    DISTANCE: <Target className="w-5 h-5" />,
    WORKOUT: <Trophy className="w-5 h-5" />,
    COMMUNITY: <Users className="w-5 h-5" />,
    SPECIAL: <Star className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
    STREAK: 'from-orange-500 to-red-500',
    DISTANCE: 'from-blue-500 to-cyan-500',
    WORKOUT: 'from-green-500 to-emerald-500',
    COMMUNITY: 'from-purple-500 to-pink-500',
    SPECIAL: 'from-yellow-500 to-amber-500',
};

const AchievementsPage: React.FC = () => {
    const navigate = useNavigate();
    const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
    const [myAchievements, setMyAchievements] = useState<UserAchievement[]>([]);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
        } catch (error) {
            console.error('Failed to load achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const earnedCodes = new Set(myAchievements.map(ua => ua.achievement.code));

    const categories = ['STREAK', 'DISTANCE', 'WORKOUT', 'COMMUNITY', 'SPECIAL'];
    const filteredAchievements = selectedCategory
        ? allAchievements.filter(a => a.category === selectedCategory)
        : allAchievements;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
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
                            Mis Logros
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            {myAchievements.length} de {allAchievements.length} desbloqueados
                        </p>
                    </div>
                </div>

                {/* Progress Stats */}
                {progress && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white"
                        >
                            <Flame className="w-8 h-8 mb-2 opacity-80" />
                            <p className="text-3xl font-bold">{progress.currentStreak}</p>
                            <p className="text-sm opacity-80">Días de racha</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-white"
                        >
                            <Target className="w-8 h-8 mb-2 opacity-80" />
                            <p className="text-3xl font-bold">
                                {(progress.totalDistance / 1000).toFixed(0)}
                            </p>
                            <p className="text-sm opacity-80">Km totales</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 text-white"
                        >
                            <Trophy className="w-8 h-8 mb-2 opacity-80" />
                            <p className="text-3xl font-bold">{progress.totalWorkouts}</p>
                            <p className="text-sm opacity-80">Entrenos</p>
                        </motion.div>
                    </div>
                )}

                {/* Category Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${!selectedCategory
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                            }`}
                    >
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat
                                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                }`}
                        >
                            {categoryIcons[cat]}
                            {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filteredAchievements.map((achievement, index) => {
                            const earned = earnedCodes.has(achievement.code);
                            const userAch = myAchievements.find(
                                ua => ua.achievement.code === achievement.code
                            );

                            return (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`relative rounded-2xl p-4 ${earned
                                            ? 'bg-white dark:bg-gray-800 shadow-lg'
                                            : 'bg-gray-100 dark:bg-gray-800/50 opacity-60'
                                        }`}
                                >
                                    {earned && (
                                        <div
                                            className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${categoryColors[achievement.category]
                                                } rounded-bl-full opacity-20`}
                                        />
                                    )}
                                    <div className="text-4xl mb-3">{achievement.icon}</div>
                                    <h3
                                        className={`font-semibold text-lg ${earned
                                                ? 'text-gray-900 dark:text-white'
                                                : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        {achievement.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {achievement.description}
                                    </p>
                                    {earned && userAch && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                            ✓ Desbloqueado{' '}
                                            {new Date(userAch.earnedAt).toLocaleDateString('es-ES')}
                                        </p>
                                    )}
                                    {!earned && achievement.threshold && (
                                        <div className="mt-2">
                                            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${categoryColors[achievement.category]
                                                        }`}
                                                    style={{
                                                        width: `${Math.min(
                                                            ((progress?.currentStreak || 0) /
                                                                achievement.threshold) *
                                                            100,
                                                            100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AchievementsPage;
