/**
 * DISTANCE ESTIMATOR SERVICE
 * Estimates distance for workouts based on duration and heart rate
 * Uses athlete's historical data to make intelligent predictions
 */

import { prisma } from '../config/prisma';

interface EstimationParams {
    userId: string;
    durationSeconds?: number;
    hrMin?: number;
    hrMax?: number;
    paceMin?: number;
    paceMax?: number;
}

/**
 * Estimate distance for a training block
 * Returns distance in meters
 */
export async function estimateDistance(params: EstimationParams): Promise<number> {
    const { userId, durationSeconds, hrMin, hrMax, paceMin, paceMax } = params;

    // If we have pace targets, use those
    if (paceMin && durationSeconds) {
        // pace is in seconds per km, so we calculate based on that
        const avgPace = paceMax ? (paceMin + paceMax) / 2 : paceMin;
        const kmPerSecond = 1000 / avgPace; // meters per second
        return Math.round(kmPerSecond * durationSeconds);
    }

    // If we have heart rate, try to find historical data
    if ((hrMin || hrMax) && durationSeconds) {
        const avgHr = hrMin && hrMax ? (hrMin + hrMax) / 2 : hrMin || hrMax || 0;

        // Get athlete's historical workouts with similar HR
        const historicalPace = await getHistoricalPaceAtHR(userId, avgHr);

        if (historicalPace) {
            const kmPerSecond = 1000 / historicalPace;
            return Math.round(kmPerSecond * durationSeconds);
        }
    }

    // Fallback: use generic pace estimation based on duration
    if (durationSeconds) {
        return estimateDistanceFromDuration(durationSeconds);
    }

    return 0;
}

/**
 * Get athlete's historical pace at a specific heart rate
 */
async function getHistoricalPaceAtHR(
    userId: string,
    targetHr: number
): Promise<number | null> {
    // Get workouts with similar HR (±10 bpm)
    const workouts = await prisma.completedWorkout.findMany({
        where: {
            userId,
            avgHeartRate: {
                gte: targetHr - 10,
                lte: targetHr + 10,
            },
            actualDistance: { not: null, gt: 0 },
            actualDuration: { not: null, gt: 0 },
        },
        select: {
            actualDistance: true,
            actualDuration: true,
            avgHeartRate: true,
        },
        orderBy: {
            completedAt: 'desc',
        },
        take: 10, // Use last 10 workouts
    });

    if (workouts.length === 0) return null;

    // Calculate average pace (seconds per km)
    const totalPace = workouts.reduce((sum, w) => {
        const distanceKm = w.actualDistance! / 1000;
        const pace = w.actualDuration! / distanceKm; // seconds per km
        return sum + pace;
    }, 0);

    return totalPace / workouts.length;
}

/**
 * Estimate distance based solely on duration
 * Uses generic "easy run" pace assumptions
 */
function estimateDistanceFromDuration(durationSeconds: number): number {
    // Assume average recreational runner pace: 6:00 min/km = 360 sec/km
    // This is conservative and should work for most athletes
    const estimatedPaceSecPerKm = 360;
    const kmPerSecond = 1000 / estimatedPaceSecPerKm;
    return Math.round(kmPerSecond * durationSeconds);
}

/**
 * Calculate total distance for a training plan
 * Includes estimations for blocks without explicit distance
 */
export async function calculatePlanDistance(
    userId: string,
    blocks: any[]
): Promise<number> {
    let totalDistance = 0;

    for (const block of blocks) {
        if (block.distanceMeters) {
            // Explicit distance
            totalDistance += block.distanceMeters * (block.repetitions || 1);
        } else if (block.durationSeconds || block.hrMin || block.hrMax) {
            // Estimate distance
            const estimated = await estimateDistance({
                userId,
                durationSeconds: block.durationSeconds,
                hrMin: block.hrMin,
                hrMax: block.hrMax,
                paceMin: block.paceMin,
                paceMax: block.paceMax,
            });
            totalDistance += estimated * (block.repetitions || 1);
        }
    }

    return Math.round(totalDistance);
}
