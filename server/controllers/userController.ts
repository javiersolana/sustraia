import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';

/**
 * Update user weekly goal
 */
export const updateWeeklyGoalValidation = [
    body('weeklyGoalKm').isFloat({ min: 0 }).withMessage('Weekly goal must be a positive number'),
];

export async function updateWeeklyGoal(req: Request, res: Response) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { weeklyGoalKm } = req.body;
        const userId = req.user.userId;

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                weeklyGoalKm: parseFloat(weeklyGoalKm),
            },
            select: {
                id: true,
                weeklyGoalKm: true,
            },
        });

        res.json({ user });
    } catch (error) {
        console.error('Update weekly goal error:', error);
        res.status(500).json({ error: 'Failed to update weekly goal' });
    }
}

/**
 * Get my coaches info (for athletes)
 * Returns all coaches assigned to the athlete
 */
export async function getMyCoach(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.userId;

        // Get all coaches for this athlete using the new many-to-many structure
        const coachRelationships = await prisma.coachAthlete.findMany({
            where: { athleteId: userId },
            include: {
                coach: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        if (coachRelationships.length === 0) {
            return res.json({ coach: null, coaches: [] });
        }

        const coaches = coachRelationships.map(rel => rel.coach);

        // For backwards compatibility, return the first coach as "coach" and all as "coaches"
        res.json({
            coach: coaches[0], // Primary coach (first one)
            coaches, // All coaches
        });
    } catch (error) {
        console.error('Get my coach error:', error);
        res.status(500).json({ error: 'Failed to get coach info' });
    }
}
