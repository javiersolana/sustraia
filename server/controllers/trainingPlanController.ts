import { Request, Response, NextFunction, RequestHandler } from 'express';
import { prisma } from '../config/prisma';

interface TrainingBlockInput {
    order: number;
    type: 'WARMUP' | 'RUN' | 'INTERVALS' | 'REST' | 'COOLDOWN';
    durationSeconds?: number;
    distanceMeters?: number;
    // For intervals
    repetitions?: number;
    restSeconds?: number;
    // Pace targets (seconds per km)
    paceMin?: number;
    paceMax?: number;
    // HR targets (bpm)
    hrMin?: number;
    hrMax?: number;
    // Legacy target fields (for backwards compatibility)
    targetType?: 'HEART_RATE' | 'PACE' | 'OPEN';
    targetMin?: number;
    targetMax?: number;
    notes?: string;
}

interface CreatePlanInput {
    athleteId: string;
    date: string;
    title: string;
    description?: string;
    blocks: TrainingBlockInput[];
}

/**
 * Create a new training plan with blocks
 */
export const createPlan: RequestHandler = async (req, res, next) => {
    try {
        const { athleteId, date, title, description, blocks } = req.body as CreatePlanInput;
        const coachId = req.user!.userId;

        // Verify user is a coach
        if (req.user!.role !== 'COACH') {
            res.status(403).json({ error: 'Only coaches can create training plans' });
            return;
        }

        // Verify athlete exists and belongs to this coach
        const athlete = await prisma.user.findFirst({
            where: {
                id: athleteId,
                coachId: coachId,
                role: 'ATLETA',
            },
        });

        if (!athlete) {
            res.status(404).json({ error: 'Athlete not found or not assigned to you' });
            return;
        }

        // Create plan with blocks in a transaction
        const plan = await prisma.trainingPlan.create({
            data: {
                coachId,
                athleteId,
                date: new Date(date),
                title,
                description,
                blocks: {
                    create: blocks.map((block, index) => ({
                        order: block.order ?? index,
                        type: block.type,
                        durationSeconds: block.durationSeconds,
                        distanceMeters: block.distanceMeters,
                        repetitions: block.repetitions,
                        restSeconds: block.restSeconds,
                        paceMin: block.paceMin,
                        paceMax: block.paceMax,
                        hrMin: block.hrMin,
                        hrMax: block.hrMax,
                        targetType: block.targetType,
                        targetMin: block.targetMin,
                        targetMax: block.targetMax,
                        notes: block.notes,
                    })),
                },
            },
            include: {
                blocks: {
                    orderBy: { order: 'asc' },
                },
                athlete: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        res.status(201).json(plan);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all training plans (coach sees their created, athlete sees assigned)
 */
export const getPlans: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { athleteId, startDate, endDate } = req.query;

    // 🔒 SAFE GUARD:
    // TrainingPlan model does not exist yet in Prisma
    if (!(prisma as any).trainingPlan) {
      return res.json([]);
    }

    let where: any = {};

    if (role === 'COACH') {
      where.coachId = userId;
      if (athleteId) {
        where.athleteId = athleteId as string;
      }
    } else {
      // Athlete sees their assigned plans
      where.athleteId = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const plans = await (prisma as any).trainingPlan.findMany({
      where,
      include: {
        blocks: {
          orderBy: { order: 'asc' },
        },
        athlete: {
          select: { id: true, name: true, email: true },
        },
        coach: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json(plans);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single training plan by ID
 */
export const getPlanById: RequestHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const role = req.user!.role;

        const plan = await prisma.trainingPlan.findUnique({
            where: { id },
            include: {
                blocks: {
                    orderBy: { order: 'asc' },
                },
                athlete: {
                    select: { id: true, name: true, email: true },
                },
                coach: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!plan) {
            res.status(404).json({ error: 'Training plan not found' });
            return;
        }

        // Check access
        if (role === 'COACH' && plan.coachId !== userId) {
            res.status(403).json({ error: 'Not authorized to view this plan' });
            return;
        }
        if (role === 'ATLETA' && plan.athleteId !== userId) {
            res.status(403).json({ error: 'Not authorized to view this plan' });
            return;
        }

        res.json(plan);
    } catch (error) {
        next(error);
    }
};

/**
 * Update a training plan
 */
export const updatePlan: RequestHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date, title, description, blocks } = req.body;
        const coachId = req.user!.userId;

        // Verify ownership
        const existingPlan = await prisma.trainingPlan.findFirst({
            where: { id, coachId },
        });

        if (!existingPlan) {
            res.status(404).json({ error: 'Training plan not found or not yours' });
            return;
        }

        // Update plan and replace blocks
        const plan = await prisma.$transaction(async (tx) => {
            // Delete existing blocks
            await tx.trainingBlock.deleteMany({
                where: { planId: id },
            });

            // Update plan and create new blocks
            return tx.trainingPlan.update({
                where: { id },
                data: {
                    date: date ? new Date(date) : undefined,
                    title,
                    description,
                    blocks: blocks ? {
                        create: blocks.map((block: TrainingBlockInput, index: number) => ({
                            order: block.order ?? index,
                            type: block.type,
                            durationSeconds: block.durationSeconds,
                            distanceMeters: block.distanceMeters,
                            repetitions: block.repetitions,
                            restSeconds: block.restSeconds,
                            paceMin: block.paceMin,
                            paceMax: block.paceMax,
                            hrMin: block.hrMin,
                            hrMax: block.hrMax,
                            targetType: block.targetType,
                            targetMin: block.targetMin,
                            targetMax: block.targetMax,
                            notes: block.notes,
                        })),
                    } : undefined,
                },
                include: {
                    blocks: {
                        orderBy: { order: 'asc' },
                    },
                    athlete: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
        });

        res.json(plan);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a training plan
 */
export const deletePlan: RequestHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coachId = req.user!.userId;

        // Verify ownership
        const existingPlan = await prisma.trainingPlan.findFirst({
            where: { id, coachId },
        });

        if (!existingPlan) {
            res.status(404).json({ error: 'Training plan not found or not yours' });
            return;
        }

        await prisma.trainingPlan.delete({
            where: { id },
        });

        res.json({ message: 'Training plan deleted' });
    } catch (error) {
        next(error);
    }
};
