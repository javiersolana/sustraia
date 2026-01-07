/**
 * ACCOUNTABILITY GROUP CONTROLLER
 * API endpoints for community/cuadrilla groups
 */

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { awardAchievement } from '../services/achievementService';
import { emitGroupMessage } from '../services/socketService';

// Validation rules
export const createGroupValidation = [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('description').optional().trim().isLength({ max: 200 }),
    body('weeklyGoal').optional().isInt({ min: 1, max: 7 }),
];

export const sendGroupMessageValidation = [
    body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Message must be 1-500 characters'),
];

/**
 * POST /groups - Create a new accountability group
 */
export async function createGroup(req: Request, res: Response) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { name, description, weeklyGoal, isPublic } = req.body;

        const group = await prisma.accountabilityGroup.create({
            data: {
                name,
                description,
                weeklyGoal: weeklyGoal || 4,
                isPublic: isPublic || false,
                creatorId: req.user.userId,
                members: {
                    create: {
                        userId: req.user.userId,
                        role: 'CREATOR',
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        // Award GROUP_CREATOR achievement
        await awardAchievement(req.user.userId, 'GROUP_CREATOR');

        res.status(201).json({ group });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
}

/**
 * GET /groups - List user's groups
 */
export async function getMyGroups(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const memberships = await prisma.groupMember.findMany({
            where: { userId: req.user.userId },
            include: {
                group: {
                    include: {
                        members: {
                            include: {
                                user: { select: { id: true, name: true } },
                            },
                        },
                        _count: { select: { messages: true } },
                    },
                },
            },
        });

        const groups = memberships.map(m => ({
            ...m.group,
            myRole: m.role,
            joinedAt: m.joinedAt,
        }));

        res.json({ groups });
    } catch (error) {
        console.error('Get my groups error:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
}

/**
 * GET /groups/:id - Get group details with leaderboard
 */
export async function getGroup(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { id } = req.params;

        // Check membership
        const membership = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId: id, userId: req.user.userId },
            },
        });

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this group' });
        }

        const group = await prisma.accountabilityGroup.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, name: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Calculate weekly leaderboard
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const leaderboard = await Promise.all(
            group.members.map(async (member) => {
                const workoutCount = await prisma.completedWorkout.count({
                    where: {
                        userId: member.userId,
                        completedAt: { gte: weekStart },
                    },
                });

                return {
                    user: member.user,
                    role: member.role,
                    weeklyWorkouts: workoutCount,
                    compliance: Math.round((workoutCount / group.weeklyGoal) * 100),
                };
            })
        );

        // Sort by compliance
        leaderboard.sort((a, b) => b.compliance - a.compliance);

        res.json({ group, leaderboard });
    } catch (error) {
        console.error('Get group error:', error);
        res.status(500).json({ error: 'Failed to fetch group' });
    }
}

/**
 * POST /groups/join - Join a group via invite code
 */
export async function joinGroup(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({ error: 'Invite code required' });
        }

        const group = await prisma.accountabilityGroup.findUnique({
            where: { inviteCode },
        });

        if (!group) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }

        // Check if already a member
        const existing = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId: group.id, userId: req.user.userId },
            },
        });

        if (existing) {
            return res.status(400).json({ error: 'Already a member of this group' });
        }

        await prisma.groupMember.create({
            data: {
                groupId: group.id,
                userId: req.user.userId,
                role: 'MEMBER',
            },
        });

        // Award FIRST_GROUP achievement on first group join
        await awardAchievement(req.user.userId, 'FIRST_GROUP');

        res.json({ success: true, group });
    } catch (error) {
        console.error('Join group error:', error);
        res.status(500).json({ error: 'Failed to join group' });
    }
}

/**
 * DELETE /groups/:id/leave - Leave a group
 */
export async function leaveGroup(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { id } = req.params;

        const membership = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId: id, userId: req.user.userId },
            },
        });

        if (!membership) {
            return res.status(404).json({ error: 'Not a member of this group' });
        }

        if (membership.role === 'CREATOR') {
            return res.status(400).json({ error: 'Creator cannot leave. Transfer ownership or delete group.' });
        }

        await prisma.groupMember.delete({
            where: {
                groupId_userId: { groupId: id, userId: req.user.userId },
            },
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({ error: 'Failed to leave group' });
    }
}

/**
 * GET /groups/:id/messages - Get group messages
 */
export async function getGroupMessages(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { id } = req.params;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

        // Check membership
        const membership = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId: id, userId: req.user.userId },
            },
        });

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this group' });
        }

        const messages = await prisma.groupMessage.findMany({
            where: { groupId: id },
            include: {
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });

        res.json({ messages });
    } catch (error) {
        console.error('Get group messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}

/**
 * POST /groups/:id/messages - Send message to group
 */
export async function sendGroupMessage(req: Request, res: Response) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { id } = req.params;
        const { content } = req.body;

        // Check membership
        const membership = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId: id, userId: req.user.userId },
            },
        });

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this group' });
        }

        const message = await prisma.groupMessage.create({
            data: {
                groupId: id,
                userId: req.user.userId,
                content,
            },
            include: {
                user: { select: { id: true, name: true } },
            },
        });

        // Emit real-time message
        emitGroupMessage(id, {
            id: message.id,
            userId: message.userId,
            userName: message.user.name,
            content: message.content,
            createdAt: message.createdAt,
        });

        res.status(201).json({ message });
    } catch (error) {
        console.error('Send group message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
}
