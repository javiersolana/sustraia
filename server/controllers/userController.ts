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
 * Get my coach info (for athletes)
 * Endpoint seguro que permite a atletas ver info básica de su coach
 */
export async function getMyCoach(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.userId;

        // Get user with coach relation
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                coachId: true,
                coach: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.coach) {
            return res.json({ coach: null });
        }

        res.json({ coach: user.coach });
    } catch (error) {
        console.error('Get my coach error:', error);
        res.status(500).json({ error: 'Failed to get coach info' });
    }
}
