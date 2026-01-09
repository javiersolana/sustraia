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

// Predefined achievements - MEGA EXPANSIÓN
export const ACHIEVEMENTS: AchievementDefinition[] = [
    // ========== STREAK ACHIEVEMENTS (Racha) ==========
    // Fáciles
    {
        code: 'STREAK_3',
        name: 'Tres en Raya',
        description: '3 días consecutivos de actividad',
        icon: 'Flame',
        category: 'STREAK',
        threshold: 3,
    },
    {
        code: 'STREAK_7',
        name: 'Primera Semana',
        description: '7 días consecutivos de actividad',
        icon: 'Flame',
        category: 'STREAK',
        threshold: 7,
    },
    {
        code: 'STREAK_14',
        name: 'Dos Semanas Fuertes',
        description: '14 días consecutivos de actividad',
        icon: 'Flame',
        category: 'STREAK',
        threshold: 14,
    },
    // Moderadas
    {
        code: 'STREAK_30',
        name: 'Un Mes Imparable',
        description: '30 días consecutivos de actividad',
        icon: 'Flame',
        category: 'STREAK',
        threshold: 30,
    },
    {
        code: 'STREAK_60',
        name: '60 Días de Hierro',
        description: '60 días consecutivos. ¡Constancia élite!',
        icon: 'Trophy',
        category: 'STREAK',
        threshold: 60,
    },
    // Difíciles
    {
        code: 'STREAK_100',
        name: 'Centenario de Fuego',
        description: '100 días consecutivos. ¡Eres imparable!',
        icon: 'Zap',
        category: 'STREAK',
        threshold: 100,
    },
    {
        code: 'STREAK_365',
        name: 'Año Completo',
        description: '365 días consecutivos. ¡LEYENDA ABSOLUTA!',
        icon: 'Award',
        category: 'STREAK',
        threshold: 365,
    },

    // ========== DISTANCE ACHIEVEMENTS (Distancia) ==========
    // Muy fáciles
    {
        code: 'DISTANCE_5K',
        name: 'Primeros 5K',
        description: '5km acumulados',
        icon: 'Footprints',
        category: 'DISTANCE',
        threshold: 5000,
    },
    {
        code: 'DISTANCE_10K',
        name: 'Primera Decena',
        description: '10km acumulados',
        icon: 'Footprints',
        category: 'DISTANCE',
        threshold: 10000,
    },
    {
        code: 'DISTANCE_21K',
        name: 'Media Maratón',
        description: '21km acumulados',
        icon: 'MapPin',
        category: 'DISTANCE',
        threshold: 21000,
    },
    // Fáciles
    {
        code: 'DISTANCE_42K',
        name: 'Maratón Completo',
        description: '42km acumulados',
        icon: 'MapPin',
        category: 'DISTANCE',
        threshold: 42000,
    },
    {
        code: 'DISTANCE_50K',
        name: 'Ultra Runner',
        description: '50km acumulados',
        icon: 'Target',
        category: 'DISTANCE',
        threshold: 50000,
    },
    {
        code: 'DISTANCE_100K',
        name: 'Centenario',
        description: '100km acumulados',
        icon: 'Target',
        category: 'DISTANCE',
        threshold: 100000,
    },
    // Moderadas
    {
        code: 'DISTANCE_250K',
        name: 'Cuarto de Millar',
        description: '250km acumulados',
        icon: 'Trophy',
        category: 'DISTANCE',
        threshold: 250000,
    },
    {
        code: 'DISTANCE_500K',
        name: 'Medio Millar',
        description: '500km acumulados. ¡Increíble!',
        icon: 'Star',
        category: 'DISTANCE',
        threshold: 500000,
    },
    // Difíciles
    {
        code: 'DISTANCE_1000K',
        name: 'Mil Kilómetros',
        description: '1000km acumulados. ¡Leyenda!',
        icon: 'Crown',
        category: 'DISTANCE',
        threshold: 1000000,
    },
    {
        code: 'DISTANCE_2000K',
        name: 'Ultra Maratonista',
        description: '2000km acumulados. ¡Élite mundial!',
        icon: 'Award',
        category: 'DISTANCE',
        threshold: 2000000,
    },

    // ========== WORKOUT COUNT ACHIEVEMENTS (Entrenamientos) ==========
    // Muy fáciles
    {
        code: 'WORKOUTS_1',
        name: 'Primer Paso',
        description: 'Completa tu primer entrenamiento',
        icon: 'CheckCircle2',
        category: 'WORKOUT',
        threshold: 1,
    },
    {
        code: 'WORKOUTS_5',
        name: 'Cinco Completos',
        description: '5 entrenos completados',
        icon: 'CheckCircle2',
        category: 'WORKOUT',
        threshold: 5,
    },
    {
        code: 'WORKOUTS_10',
        name: 'Primera Decena',
        description: '10 entrenos completados',
        icon: 'CheckCircle2',
        category: 'WORKOUT',
        threshold: 10,
    },
    // Fáciles
    {
        code: 'WORKOUTS_25',
        name: 'Veinticinco Sesiones',
        description: '25 entrenos completados',
        icon: 'Activity',
        category: 'WORKOUT',
        threshold: 25,
    },
    {
        code: 'WORKOUTS_50',
        name: 'Medio Centenar',
        description: '50 entrenos completados',
        icon: 'Activity',
        category: 'WORKOUT',
        threshold: 50,
    },
    {
        code: 'WORKOUTS_100',
        name: 'Centenario',
        description: '100 entrenos completados',
        icon: 'Trophy',
        category: 'WORKOUT',
        threshold: 100,
    },
    // Moderadas
    {
        code: 'WORKOUTS_250',
        name: 'Cuarto de Millar',
        description: '250 entrenos completados',
        icon: 'Award',
        category: 'WORKOUT',
        threshold: 250,
    },
    {
        code: 'WORKOUTS_500',
        name: 'Medio Millar',
        description: '500 entrenos. ¡Atleta de élite!',
        icon: 'Crown',
        category: 'WORKOUT',
        threshold: 500,
    },
    // Difíciles
    {
        code: 'WORKOUTS_1000',
        name: 'Mil Sesiones',
        description: '1000 entrenos. ¡LEYENDA ABSOLUTA!',
        icon: 'Sparkles',
        category: 'WORKOUT',
        threshold: 1000,
    },

    // ========== SPECIAL ACHIEVEMENTS (Especiales) ==========
    {
        code: 'STRAVA_CONNECTED',
        name: 'Conectado',
        description: 'Vincular cuenta de Strava',
        icon: 'Link',
        category: 'SPECIAL',
    },
    {
        code: 'FIRST_10K',
        name: 'Primer 10K',
        description: 'Completar un entrenamiento de 10km',
        icon: 'Target',
        category: 'SPECIAL',
    },
    {
        code: 'FIRST_HALF_MARATHON',
        name: 'Primera Media',
        description: 'Completar un entrenamiento de 21km',
        icon: 'Medal',
        category: 'SPECIAL',
    },
    {
        code: 'FIRST_MARATHON',
        name: 'Primer Maratón',
        description: 'Completar un entrenamiento de 42km',
        icon: 'Award',
        category: 'SPECIAL',
    },
    {
        code: 'EARLY_BIRD',
        name: 'Madrugador',
        description: 'Entrenar antes de las 6:00 AM',
        icon: 'Sunrise',
        category: 'SPECIAL',
    },
    {
        code: 'NIGHT_OWL',
        name: 'Búho Nocturno',
        description: 'Entrenar después de las 22:00',
        icon: 'Moon',
        category: 'SPECIAL',
    },
    {
        code: 'WEEKEND_WARRIOR',
        name: 'Guerrero de Fin de Semana',
        description: 'Completar entrenamientos sábado y domingo',
        icon: 'CalendarCheck',
        category: 'SPECIAL',
    },
    {
        code: 'SPEEDSTER_4MIN',
        name: 'Velocista Sub-4',
        description: 'Correr un km bajo 4:00 min/km',
        icon: 'Zap',
        category: 'SPECIAL',
    },
    {
        code: 'SPEEDSTER_3MIN',
        name: 'Velocista Élite',
        description: 'Correr un km bajo 3:30 min/km',
        icon: 'Rocket',
        category: 'SPECIAL',
    },
    {
        code: 'LONG_RUN_15K',
        name: 'Tirada Larga',
        description: 'Completar una carrera de 15km+',
        icon: 'TrendingUp',
        category: 'SPECIAL',
    },
    {
        code: 'LONG_RUN_30K',
        name: 'Ultra Tirada',
        description: 'Completar una carrera de 30km+',
        icon: 'Mountain',
        category: 'SPECIAL',
    },
    {
        code: 'CENTURY_WEEK',
        name: 'Semana Centenaria',
        description: 'Correr 100km en una semana',
        icon: 'TrendingUp',
        category: 'SPECIAL',
    },
    {
        code: 'MONTHLY_200K',
        name: 'Mes Épico',
        description: 'Correr 200km en un mes',
        icon: 'Calendar',
        category: 'SPECIAL',
    },
    {
        code: 'HEART_RATE_WARRIOR',
        name: 'Guerrero Cardíaco',
        description: 'Completar 10 entrenamientos monitoreando FC',
        icon: 'Heart',
        category: 'SPECIAL',
    },
    {
        code: 'CONSISTENCY_KING',
        name: 'Rey de la Consistencia',
        description: 'Entrenar 4+ veces por semana durante un mes',
        icon: 'Crown',
        category: 'SPECIAL',
    },

    // ========== COMMUNITY ACHIEVEMENTS (Comunidad) ==========
    {
        code: 'FIRST_GROUP',
        name: 'Cuadrilla',
        description: 'Unirse a tu primer grupo',
        icon: 'Users',
        category: 'COMMUNITY',
    },
    {
        code: 'GROUP_CREATOR',
        name: 'Líder de Cuadrilla',
        description: 'Crear un grupo de responsabilidad',
        icon: 'Crown',
        category: 'COMMUNITY',
    },
    {
        code: 'GROUP_VETERAN',
        name: 'Veterano de Grupo',
        description: 'Estar en un grupo durante 30 días',
        icon: 'Shield',
        category: 'COMMUNITY',
    },
    {
        code: 'GROUP_SUPPORTER',
        name: 'Apoyo Incondicional',
        description: 'Enviar 50 mensajes motivadores',
        icon: 'MessageCircle',
        category: 'COMMUNITY',
    },
    {
        code: 'SOCIAL_BUTTERFLY',
        name: 'Mariposa Social',
        description: 'Unirse a 3 grupos diferentes',
        icon: 'Users',
        category: 'COMMUNITY',
    },

    // ========== PERSONAL RECORDS (Récords Personales) ==========
    // 1K Records
    {
        code: 'PR_1K_SUB_5',
        name: 'Rayo 1K',
        description: 'Marca personal en 1km bajo 5:00 min',
        icon: 'Zap',
        category: 'SPECIAL',
    },
    {
        code: 'PR_1K_SUB_4',
        name: 'Velocista 1K',
        description: 'Marca personal en 1km bajo 4:00 min',
        icon: 'Rocket',
        category: 'SPECIAL',
    },
    {
        code: 'PR_1K_SUB_3',
        name: 'Élite 1K',
        description: 'Marca personal en 1km bajo 3:30 min',
        icon: 'Crown',
        category: 'SPECIAL',
    },
    // 3K Records
    {
        code: 'PR_3K_SUB_15',
        name: 'Rayo 3K',
        description: 'Marca personal en 3km bajo 15:00 min',
        icon: 'Zap',
        category: 'SPECIAL',
    },
    {
        code: 'PR_3K_SUB_12',
        name: 'Velocista 3K',
        description: 'Marca personal en 3km bajo 12:00 min',
        icon: 'Rocket',
        category: 'SPECIAL',
    },
    {
        code: 'PR_3K_SUB_10',
        name: 'Élite 3K',
        description: 'Marca personal en 3km bajo 10:00 min',
        icon: 'Award',
        category: 'SPECIAL',
    },
    // 5K Records
    {
        code: 'PR_5K_SUB_30',
        name: 'Sub-30 en 5K',
        description: 'Marca personal en 5km bajo 30:00 min',
        icon: 'Target',
        category: 'SPECIAL',
    },
    {
        code: 'PR_5K_SUB_25',
        name: 'Rápido en 5K',
        description: 'Marca personal en 5km bajo 25:00 min',
        icon: 'Zap',
        category: 'SPECIAL',
    },
    {
        code: 'PR_5K_SUB_20',
        name: 'Velocista 5K',
        description: 'Marca personal en 5km bajo 20:00 min',
        icon: 'Rocket',
        category: 'SPECIAL',
    },
    {
        code: 'PR_5K_SUB_18',
        name: 'Élite 5K',
        description: 'Marca personal en 5km bajo 18:00 min',
        icon: 'Crown',
        category: 'SPECIAL',
    },
    // 10K Records
    {
        code: 'PR_10K_SUB_60',
        name: 'Sub-60 en 10K',
        description: 'Marca personal en 10km bajo 60:00 min',
        icon: 'Target',
        category: 'SPECIAL',
    },
    {
        code: 'PR_10K_SUB_50',
        name: 'Rápido en 10K',
        description: 'Marca personal en 10km bajo 50:00 min',
        icon: 'Zap',
        category: 'SPECIAL',
    },
    {
        code: 'PR_10K_SUB_45',
        name: 'Velocista 10K',
        description: 'Marca personal en 10km bajo 45:00 min',
        icon: 'Rocket',
        category: 'SPECIAL',
    },
    {
        code: 'PR_10K_SUB_40',
        name: 'Élite 10K',
        description: 'Marca personal en 10km bajo 40:00 min',
        icon: 'Award',
        category: 'SPECIAL',
    },
    {
        code: 'PR_10K_SUB_35',
        name: 'Fenómeno 10K',
        description: 'Marca personal en 10km bajo 35:00 min',
        icon: 'Crown',
        category: 'SPECIAL',
    },
    // Half Marathon (21K) Records
    {
        code: 'PR_21K_SUB_2H',
        name: 'Sub-2h en Media',
        description: 'Marca personal en 21km bajo 2:00:00',
        icon: 'Target',
        category: 'SPECIAL',
    },
    {
        code: 'PR_21K_SUB_1H45',
        name: 'Rápido en Media',
        description: 'Marca personal en 21km bajo 1:45:00',
        icon: 'Zap',
        category: 'SPECIAL',
    },
    {
        code: 'PR_21K_SUB_1H30',
        name: 'Velocista Media',
        description: 'Marca personal en 21km bajo 1:30:00',
        icon: 'Rocket',
        category: 'SPECIAL',
    },
    {
        code: 'PR_21K_SUB_1H20',
        name: 'Élite Media',
        description: 'Marca personal en 21km bajo 1:20:00',
        icon: 'Award',
        category: 'SPECIAL',
    },
    // Marathon (42K) Records
    {
        code: 'PR_42K_SUB_4H',
        name: 'Sub-4h en Maratón',
        description: 'Marca personal en 42km bajo 4:00:00',
        icon: 'Target',
        category: 'SPECIAL',
    },
    {
        code: 'PR_42K_SUB_3H30',
        name: 'Rápido en Maratón',
        description: 'Marca personal en 42km bajo 3:30:00',
        icon: 'Zap',
        category: 'SPECIAL',
    },
    {
        code: 'PR_42K_SUB_3H',
        name: 'Sub-3 Maratón',
        description: 'Marca personal en 42km bajo 3:00:00',
        icon: 'Rocket',
        category: 'SPECIAL',
    },
    {
        code: 'PR_42K_SUB_2H45',
        name: 'Élite Maratón',
        description: 'Marca personal en 42km bajo 2:45:00',
        icon: 'Crown',
        category: 'SPECIAL',
    },
    // Improvement achievements
    {
        code: 'IMPROVED_5K',
        name: 'Mejora en 5K',
        description: 'Mejora tu tiempo en 5km en 2+ minutos',
        icon: 'TrendingUp',
        category: 'SPECIAL',
    },
    {
        code: 'IMPROVED_10K',
        name: 'Mejora en 10K',
        description: 'Mejora tu tiempo en 10km en 5+ minutos',
        icon: 'TrendingUp',
        category: 'SPECIAL',
    },
    {
        code: 'IMPROVED_HALF',
        name: 'Mejora en Media',
        description: 'Mejora tu tiempo en 21km en 10+ minutos',
        icon: 'TrendingUp',
        category: 'SPECIAL',
    },
    {
        code: 'IMPROVED_MARATHON',
        name: 'Mejora en Maratón',
        description: 'Mejora tu tiempo en 42km en 20+ minutos',
        icon: 'TrendingUp',
        category: 'SPECIAL',
    },
    {
        code: 'COMEBACK_KING',
        name: 'Rey del Regreso',
        description: 'Volver a entrenar después de 30+ días inactivo',
        icon: 'RotateCcw',
        category: 'SPECIAL',
    },
    {
        code: 'PACE_MASTER',
        name: 'Maestro del Ritmo',
        description: 'Mantener ritmo constante (±5 seg/km) en 10km+',
        icon: 'Activity',
        category: 'SPECIAL',
    },
    {
        code: 'ELEVATION_BEAST',
        name: 'Bestia de Cuestas',
        description: 'Completar entreno con 500m+ de desnivel',
        icon: 'Mountain',
        category: 'SPECIAL',
    },
    {
        code: 'NEGATIVE_SPLIT',
        name: 'Split Negativo',
        description: 'Segunda mitad más rápida que la primera',
        icon: 'TrendingUp',
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
