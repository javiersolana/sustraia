/**
 * ACHIEVEMENT CONTROLLER
 * API endpoints for achievements
 */

import { Request, Response } from 'express';
import {
    getAllAchievements,
    getUserAchievements,
    checkAndAwardAchievements,
    calculateStreak,
    getTotalDistance,
    getTotalWorkouts,
    seedAchievements
} from '../services/achievementService';

/**
 * GET /achievements - Get all available achievements
 */
export async function listAchievements(req: Request, res: Response) {
    try {
        const achievements = await getAllAchievements();
        res.json({ achievements });
    } catch (error) {
        console.error('List achievements error:', error);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
}

/**
 * GET /achievements/me - Get current user's earned achievements
 */
export async function getMyAchievements(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userAchievements = await getUserAchievements(req.user.userId);

        // Also get progress stats
        const [streak, totalDistance, totalWorkouts] = await Promise.all([
            calculateStreak(req.user.userId),
            getTotalDistance(req.user.userId),
            getTotalWorkouts(req.user.userId),
        ]);

        res.json({
            achievements: userAchievements,
            progress: {
                currentStreak: streak,
                totalDistance,
                totalWorkouts,
            }
        });
    } catch (error) {
        console.error('Get my achievements error:', error);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
}

/**
 * POST /achievements/check - Manually trigger achievement check
 * Useful for testing or catching up on missed achievements
 */
export async function checkAchievements(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const newAchievements = await checkAndAwardAchievements(req.user.userId);

        res.json({
            newAchievements,
            message: newAchievements.length > 0
                ? `¡Felicidades! Desbloqueaste ${newAchievements.length} logro(s)`
                : 'No hay nuevos logros'
        });
    } catch (error) {
        console.error('Check achievements error:', error);
        res.status(500).json({ error: 'Failed to check achievements' });
    }
}

/**
 * POST /achievements/seed - Seed achievements (ADMIN only)
 */
export async function seedAchievementsEndpoint(req: Request, res: Response) {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        await seedAchievements();
        res.json({ success: true, message: 'Achievements seeded' });
    } catch (error) {
        console.error('Seed achievements error:', error);
        res.status(500).json({ error: 'Failed to seed achievements' });
    }
}
