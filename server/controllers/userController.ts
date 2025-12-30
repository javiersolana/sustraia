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
