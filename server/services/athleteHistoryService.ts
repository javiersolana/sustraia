/**
 * Athlete History Service
 * Compares current workout with athlete's historical performance
 */

import { prisma } from '../config/prisma';

export interface AthleteHistoricalStats {
    avgEasyPace: number;      // Average pace in easy/rodaje workouts (sec/km)
    avgCompetitionPace: number; // Average pace in competitions (sec/km)
    avgEasyHR: number;        // Average HR in easy workouts (bpm)
    workoutCount: number;     // Number of workouts analyzed
}

/**
 * Get athlete's historical stats from completed workouts
 * Calculates average pace and HR for different workout types
 */
export async function getAthleteHistoricalStats(
    userId: string
): Promise<AthleteHistoricalStats | null> {
    // Get completed workouts with pace and HR data
    const workouts = await prisma.completedWorkout.findMany({
        where: {
            userId,
            actualDistance: { gt: 0 },
            actualDuration: { gt: 0 }
        },
        select: {
            label: true,
            actualDistance: true,
            actualDuration: true,
            avgHeartRate: true
        },
        orderBy: { completedAt: 'desc' },
        take: 50 // Last 50 workouts
    });

    if (workouts.length < 3) {
        // Not enough data
        return null;
    }

    // Separate easy workouts (RODAJE) from faster workouts
    // Note: RECUPERACION and COMPETICION are not in Prisma enum, using RODAJE as easy pace reference
    const easyWorkouts = workouts.filter(w =>
        w.label === 'RODAJE'
    );

    // For competition pace, use the fastest workouts (SERIES or TEMPO as proxy for race efforts)
    const fastWorkouts = workouts.filter(w =>
        w.label === 'SERIES' || w.label === 'TEMPO'
    );

    // Calculate average easy pace (sec/km)
    let avgEasyPace = 0;
    let avgEasyHR = 0;
    if (easyWorkouts.length > 0) {
        const easyPaces = easyWorkouts.map(w =>
            (w.actualDuration! / (w.actualDistance! / 1000))
        );
        avgEasyPace = easyPaces.reduce((a, b) => a + b, 0) / easyPaces.length;

        const easyHRs = easyWorkouts.filter(w => w.avgHeartRate).map(w => w.avgHeartRate!);
        if (easyHRs.length > 0) {
            avgEasyHR = easyHRs.reduce((a, b) => a + b, 0) / easyHRs.length;
        }
    } else {
        // If no rodaje workouts, use overall average
        const allPaces = workouts.map(w =>
            (w.actualDuration! / (w.actualDistance! / 1000))
        );
        avgEasyPace = allPaces.reduce((a, b) => a + b, 0) / allPaces.length;

        const allHRs = workouts.filter(w => w.avgHeartRate).map(w => w.avgHeartRate!);
        if (allHRs.length > 0) {
            avgEasyHR = allHRs.reduce((a, b) => a + b, 0) / allHRs.length;
        }
    }

    // Calculate average competition/fast pace
    let avgCompetitionPace = avgEasyPace * 0.85; // Default: 15% faster than easy
    if (fastWorkouts.length > 0) {
        const compPaces = fastWorkouts.map(w =>
            (w.actualDuration! / (w.actualDistance! / 1000))
        );
        avgCompetitionPace = compPaces.reduce((a, b) => a + b, 0) / compPaces.length;
    }

    return {
        avgEasyPace,
        avgCompetitionPace,
        avgEasyHR,
        workoutCount: workouts.length
    };
}

/**
 * Check if current pace indicates race effort compared to history
 * Returns true if pace is significantly faster than usual
 */
export function isRacePaceByHistory(
    currentPace: number,  // sec/km
    stats: AthleteHistoricalStats
): { isRace: boolean; reason: string } {
    // If current pace is >10% faster than average easy pace, likely a race
    const threshold = stats.avgEasyPace * 0.90; // 10% faster

    if (currentPace < threshold) {
        const percentFaster = Math.round((1 - currentPace / stats.avgEasyPace) * 100);
        return {
            isRace: true,
            reason: `${percentFaster}% más rápido que habitual`
        };
    }

    // Also check if close to competition pace (within 5%)
    if (stats.avgCompetitionPace > 0 && currentPace <= stats.avgCompetitionPace * 1.05) {
        return {
            isRace: true,
            reason: 'Ritmo de competición'
        };
    }

    return { isRace: false, reason: '' };
}

/**
 * Combined check: is this a race effort by pace OR HR?
 */
export function isRaceEffort(
    currentPace: number,
    currentHR: number | undefined,
    stats: AthleteHistoricalStats
): { isRace: boolean; reason: string } {
    // Check pace
    const paceCheck = isRacePaceByHistory(currentPace, stats);
    if (paceCheck.isRace) {
        return paceCheck;
    }

    // Check HR if available
    if (currentHR && stats.avgEasyHR > 0) {
        // If HR is >15% higher than easy average, likely race
        const hrThreshold = stats.avgEasyHR * 1.15;
        if (currentHR > hrThreshold) {
            const percentHigher = Math.round((currentHR / stats.avgEasyHR - 1) * 100);
            return {
                isRace: true,
                reason: `FC ${percentHigher}% mayor que habitual`
            };
        }
    }

    return { isRace: false, reason: '' };
}
