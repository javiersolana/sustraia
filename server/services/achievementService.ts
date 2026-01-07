/**
 * ACHIEVEMENT SERVICE
 * Handles checking and awarding achievements based on user activity
 */

import { prisma } from '../config/prisma';
import { AchievementCategory } from '@prisma/client';
import { emitAchievementEarned } from './socketService';

export interface AchievementDefinition {
    code: string;
    name: string;
    description: string;
    icon: string;
    category: AchievementCategory;
    threshold?: number;
}

// Predefined achievements
export const ACHIEVEMENTS: AchievementDefinition[] = [
    // Streak achievements
    {
        code: 'STREAK_7',
        name: 'Primera Semana',
        description: '7 días consecutivos de actividad',
        icon: '🔥',
        category: 'STREAK',
        threshold: 7,
    },
    {
        code: 'STREAK_30',
        name: 'Un Mes Imparable',
        description: '30 días consecutivos de actividad',
        icon: '💪',
        category: 'STREAK',
        threshold: 30,
    },
    {
        code: 'STREAK_60',
        name: '60 Días de Hierro',
        description: '60 días consecutivos de actividad. ¡Constancia élite!',
        icon: '🏆',
        category: 'STREAK',
        threshold: 60,
    },
    // Distance achievements
    {
        code: 'DISTANCE_50K',
        name: 'Media Maratón Total',
        description: '50km acumulados',
        icon: '👟',
        category: 'DISTANCE',
        threshold: 50000, // meters
    },
    {
        code: 'DISTANCE_100K',
        name: 'Centenario',
        description: '100km acumulados',
        icon: '🎯',
        category: 'DISTANCE',
        threshold: 100000,
    },
    {
        code: 'DISTANCE_500K',
        name: 'Medio Millar',
        description: '500km acumulados. ¡Leyenda!',
        icon: '🌟',
        category: 'DISTANCE',
        threshold: 500000,
    },
    // Workout count achievements
    {
        code: 'WORKOUTS_10',
        name: 'Primera Decena',
        description: '10 entrenos completados',
        icon: '✅',
        category: 'WORKOUT',
        threshold: 10,
    },
    {
        code: 'WORKOUTS_50',
        name: 'Medio Centenar',
        description: '50 entrenos completados',
        icon: '💯',
        category: 'WORKOUT',
        threshold: 50,
    },
    {
        code: 'WORKOUTS_100',
        name: 'Centenario de Entrenos',
        description: '100 entrenos completados. ¡Atleta comprometido!',
        icon: '🏅',
        category: 'WORKOUT',
        threshold: 100,
    },
    // Community achievements
    {
        code: 'FIRST_GROUP',
        name: 'Cuadrilla',
        description: 'Unirse a tu primer grupo de responsabilidad',
        icon: '👥',
        category: 'COMMUNITY',
    },
    {
        code: 'GROUP_CREATOR',
        name: 'Líder de Cuadrilla',
        description: 'Crear un grupo de responsabilidad',
        icon: '👑',
        category: 'COMMUNITY',
    },
    // Special achievements
    {
        code: 'STRAVA_CONNECTED',
        name: 'Conectado',
        description: 'Vincular cuenta de Strava',
        icon: '🔗',
        category: 'SPECIAL',
    },
    {
        code: 'FIRST_10K',
        name: 'Primer 10K',
        description: 'Completar tu primer entrenamiento de 10km',
        icon: '🏃',
        category: 'SPECIAL',
    },
];

/**
 * Seed achievements in database
 */
export async function seedAchievements(): Promise<void> {
    console.log('🏆 Seeding achievements...');

    for (const achievement of ACHIEVEMENTS) {
        await prisma.achievement.upsert({
            where: { code: achievement.code },
            update: {
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                category: achievement.category,
                threshold: achievement.threshold,
            },
            create: {
                code: achievement.code,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                category: achievement.category,
                threshold: achievement.threshold,
            },
        });
    }

    console.log(`✅ Seeded ${ACHIEVEMENTS.length} achievements`);
}

/**
 * Calculate user's current streak (consecutive active days)
 */
export async function calculateStreak(userId: string): Promise<number> {
    const workouts = await prisma.completedWorkout.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
    });

    if (workouts.length === 0) return 0;

    // Group by date (ignore time)
    const activeDays = new Set(
        workouts.map(w => w.completedAt.toISOString().split('T')[0])
    );

    const sortedDays = Array.from(activeDays).sort().reverse();

    // Check if today or yesterday was active
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!sortedDays.includes(today) && !sortedDays.includes(yesterday)) {
        return 0; // Streak broken
    }

    // Count consecutive days
    let streak = 0;
    let currentDate = new Date();

    for (let i = 0; i < 365; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (activeDays.has(dateStr)) {
            streak++;
        } else if (i > 0) {
            break; // Allow today to not have activity yet
        }
        currentDate = new Date(currentDate.getTime() - 86400000);
    }

    return streak;
}

/**
 * Get total distance for user (in meters)
 */
export async function getTotalDistance(userId: string): Promise<number> {
    const result = await prisma.completedWorkout.aggregate({
        where: { userId, actualDistance: { not: null } },
        _sum: { actualDistance: true },
    });
    return result._sum.actualDistance || 0;
}

/**
 * Get total workout count for user
 */
export async function getTotalWorkouts(userId: string): Promise<number> {
    return prisma.completedWorkout.count({ where: { userId } });
}

/**
 * Check and award achievements for a user
 * Returns array of newly earned achievements
 */
export async function checkAndAwardAchievements(userId: string): Promise<AchievementDefinition[]> {
    const newAchievements: AchievementDefinition[] = [];

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany();

    // Get user's existing achievements
    const userAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
    });
    const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));

    // Calculate user stats
    const [streak, totalDistance, totalWorkouts] = await Promise.all([
        calculateStreak(userId),
        getTotalDistance(userId),
        getTotalWorkouts(userId),
    ]);

    // Check each achievement
    for (const achievement of allAchievements) {
        if (earnedIds.has(achievement.id)) continue; // Already earned

        let earned = false;

        switch (achievement.category) {
            case 'STREAK':
                if (achievement.threshold && streak >= achievement.threshold) {
                    earned = true;
                }
                break;

            case 'DISTANCE':
                if (achievement.threshold && totalDistance >= achievement.threshold) {
                    earned = true;
                }
                break;

            case 'WORKOUT':
                if (achievement.threshold && totalWorkouts >= achievement.threshold) {
                    earned = true;
                }
                break;

            // COMMUNITY and SPECIAL achievements are awarded separately
        }

        if (earned) {
            await prisma.userAchievement.create({
                data: { userId, achievementId: achievement.id },
            });

            const def = ACHIEVEMENTS.find(a => a.code === achievement.code);
            if (def) {
                newAchievements.push(def);

                // Emit real-time notification
                emitAchievementEarned(userId, {
                    id: achievement.id,
                    code: achievement.code,
                    name: achievement.name,
                    icon: achievement.icon,
                });
            }
        }
    }

    return newAchievements;
}

/**
 * Award a specific achievement by code (for COMMUNITY/SPECIAL achievements)
 */
export async function awardAchievement(userId: string, code: string): Promise<boolean> {
    const achievement = await prisma.achievement.findUnique({
        where: { code },
    });

    if (!achievement) return false;

    // Check if already earned
    const existing = await prisma.userAchievement.findUnique({
        where: {
            userId_achievementId: { userId, achievementId: achievement.id },
        },
    });

    if (existing) return false; // Already has it

    await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
    });

    // Emit notification
    emitAchievementEarned(userId, {
        id: achievement.id,
        code: achievement.code,
        name: achievement.name,
        icon: achievement.icon,
    });

    return true;
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(userId: string) {
    return prisma.userAchievement.findMany({
        where: { userId },
        include: {
            achievement: true,
        },
        orderBy: { earnedAt: 'desc' },
    });
}

/**
 * Get all available achievements
 */
export async function getAllAchievements() {
    return prisma.achievement.findMany({
        orderBy: [{ category: 'asc' }, { threshold: 'asc' }],
    });
}
