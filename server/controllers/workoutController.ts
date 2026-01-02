import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { emailService } from '../services/emailService';

// Validation rules
export const createWorkoutValidation = [
  body('date').isISO8601().withMessage('Valid date required'),
  body('type')
    .isIn(['RUN', 'RIDE', 'SWIM', 'STRENGTH', 'YOGA', 'OTHER'])
    .withMessage('Invalid workout type'),
  body('title').trim().isLength({ min: 1 }).withMessage('Title required'),
  body('description').optional().trim(),
  body('distance').optional().isFloat({ min: 0 }),
  body('duration').optional().isInt({ min: 0 }),
  body('intensity').optional().isIn(['easy', 'moderate', 'hard', 'race']),
  body('assignedTo').optional().isString(),
];

/**
 * Create new workout
 */
export async function createWorkout(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { date, type, title, description, distance, duration, intensity, assignedTo, notes } =
      req.body;

    // Verify user is a coach if assigning to someone
    if (assignedTo && req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Only coaches can assign workouts' });
    }

    const workout = await prisma.workout.create({
      data: {
        userId: req.user.userId,
        assignedTo,
        date: new Date(date),
        type,
        title,
        description,
        distance: distance ? parseFloat(distance) : null,
        duration: duration ? parseInt(duration) : null,
        intensity,
        notes,
      },
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Send email notification if workout is assigned to an athlete
    if (assignedTo && workout.athlete) {
      emailService.sendWorkoutAssignedEmail(
        workout.athlete.name,
        workout.athlete.email,
        workout.creator.name,
        {
          title: workout.title,
          date: workout.date,
          type: workout.type,
          description: workout.description || undefined,
          distance: workout.distance || undefined,
          duration: workout.duration || undefined,
        }
      ).catch(err => console.error('Failed to send workout assigned email:', err));
    }

    res.status(201).json({ workout });
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({ error: 'Failed to create workout' });
  }
}

/**
 * Get workouts (filtered by role)
 */
export async function getWorkouts(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    let where = {};

    if (req.user.role === 'COACH') {
      // Coaches see workouts they created
      where = { userId: req.user.userId };
    } else {
      // Athletes see workouts assigned to them
      where = { assignedTo: req.user.userId };
    }

    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where,
        include: {
          athlete: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          completedVersion: true,
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.workout.count({ where }),
    ]);

    res.json({
      workouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
}

/**
 * Get single workout
 */
export async function getWorkout(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    const workout = await prisma.workout.findUnique({
      where: { id },
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        completedVersion: true,
      },
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Check permissions
    const canAccess =
      workout.userId === req.user.userId || workout.assignedTo === req.user.userId;

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ workout });
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({ error: 'Failed to fetch workout' });
  }
}

/**
 * Update workout
 */
export async function updateWorkout(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    const workout = await prisma.workout.findUnique({
      where: { id },
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Only creator can update
    if (workout.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Only the creator can update this workout' });
    }

    const updated = await prisma.workout.update({
      where: { id },
      data: {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined,
      },
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({ workout: updated });
  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({ error: 'Failed to update workout' });
  }
}

/**
 * Delete workout
 */
export async function deleteWorkout(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    const workout = await prisma.workout.findUnique({
      where: { id },
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Only creator can delete
    if (workout.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Only the creator can delete this workout' });
    }

    await prisma.workout.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
}

/**
 * Complete a workout
 */
export async function completeWorkout(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const {
      actualDuration,
      actualDistance,
      avgHeartRate,
      maxHeartRate,
      calories,
      feeling,
      notes,
    } = req.body;

    const workout = await prisma.workout.findUnique({
      where: { id },
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Check if already completed
    const existing = await prisma.completedWorkout.findUnique({
      where: { workoutId: id },
    });

    if (existing) {
      return res.status(409).json({ error: 'Workout already completed' });
    }

    const completed = await prisma.completedWorkout.create({
      data: {
        workoutId: id,
        userId: req.user.userId,
        actualDuration: actualDuration ? parseInt(actualDuration) : null,
        actualDistance: actualDistance ? parseFloat(actualDistance) : null,
        avgHeartRate: avgHeartRate ? parseInt(avgHeartRate) : null,
        maxHeartRate: maxHeartRate ? parseInt(maxHeartRate) : null,
        calories: calories ? parseInt(calories) : null,
        feeling,
        notes,
      },
      include: {
        workout: true,
      },
    });

    res.status(201).json({ completedWorkout: completed });
  } catch (error) {
    console.error('Complete workout error:', error);
    res.status(500).json({ error: 'Failed to complete workout' });
  }
}
