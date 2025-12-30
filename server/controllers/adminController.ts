import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { UserRole } from '@prisma/client';
import { hashPassword } from '../utils/password';
import { getDetailedActivity } from '../services/stravaService';
import { classifyWorkout, WorkoutType, ClassificationContext } from '../services/workoutClassifier';
import { calculateHRZones } from '../services/hrZonesService';
import { getAthleteHistoricalStats } from '../services/athleteHistoryService';

/**
 * Admin middleware - check if user is admin
 * Note: For MVP, we'll use a simple role check. In production, add ADMIN role to enum.
 */
export function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // For MVP: Check if user is a specific admin email or coach with special permission
  // TODO: Add ADMIN role to UserRole enum in schema
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

/**
 * Get all users
 */
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        coachId: true,
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            athletes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * Get all coaches
 */
export async function getAllCoaches(req: Request, res: Response) {
  try {
    const coaches = await prisma.user.findMany({
      where: {
        role: 'COACH',
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            athletes: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({ coaches });
  } catch (error) {
    console.error('Get coaches error:', error);
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
}

/**
 * Create athlete with coach assignment
 */
export const createAthleteValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('coachId').optional().isString(),
  body('birthDate').optional().isISO8601().withMessage('Invalid date format'),
  body('maxHeartRate').optional().isInt({ min: 100, max: 250 }).withMessage('Max HR must be between 100-250'),
  body('restingHR').optional().isInt({ min: 30, max: 120 }).withMessage('Resting HR must be between 30-120'),
];

export async function createAthlete(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, coachId, birthDate, maxHeartRate, restingHR } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Verify coach exists if provided
    if (coachId) {
      const coach = await prisma.user.findUnique({
        where: { id: coachId, role: 'COACH' },
      });

      if (!coach) {
        return res.status(404).json({ error: 'Coach not found' });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create athlete
    const athlete = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.ATLETA,
        // ✅ Cambio aquí: usar sintaxis de relación
        ...(coachId && {
          coach: {
            connect: {
              id: coachId
            }
          }
        }),
        birthDate: birthDate ? new Date(birthDate) : null,
        maxHeartRate: maxHeartRate ? parseInt(maxHeartRate) : null,
        restingHR: restingHR ? parseInt(restingHR) : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        birthDate: true,
        maxHeartRate: true,
        restingHR: true,
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({ athlete });
  } catch (error) {
    console.error('Create athlete error:', error);
    res.status(500).json({ error: 'Failed to create athlete' });
  }
}

/**
 * Create coach
 */
export const createCoachValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
];

export async function createCoach(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create coach
    const coach = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.COACH,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ coach });
  } catch (error) {
    console.error('Create coach error:', error);
    res.status(500).json({ error: 'Failed to create coach' });
  }
}

/**
 * Update user (assign/reassign coach, update profile)
 */
export const updateUserValidation = [
  body('name').optional().trim().isLength({ min: 2 }),
  body('coachId').optional().isString(),
  body('birthDate').optional().isISO8601().withMessage('Invalid date format'),
  body('maxHeartRate').optional().isInt({ min: 100, max: 250 }),
  body('restingHR').optional().isInt({ min: 30, max: 120 }),
];

export async function updateUser(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, coachId, birthDate, maxHeartRate, restingHR } = req.body;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify coach exists if provided
    if (coachId) {
      const coach = await prisma.user.findUnique({
        where: { id: coachId, role: 'COACH' },
      });

      if (!coach) {
        return res.status(404).json({ error: 'Coach not found' });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(coachId !== undefined && { coachId: coachId || null }),
        ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
        ...(maxHeartRate !== undefined && { maxHeartRate: maxHeartRate ? parseInt(maxHeartRate) : null }),
        ...(restingHR !== undefined && { restingHR: restingHR ? parseInt(restingHR) : null }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
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

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

/**
 * Delete user
 */
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id },
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

/**
 * Get dashboard stats for admin
 */
export async function getAdminStats(req: Request, res: Response) {
  try {
    const [totalUsers, totalAthletes, totalCoaches, totalWorkouts, totalCompleted] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ATLETA' } }),
        prisma.user.count({ where: { role: 'COACH' } }),
        prisma.workout.count(),
        prisma.completedWorkout.count(),
      ]);

    res.json({
      stats: {
        totalUsers,
        totalAthletes,
        totalCoaches,
        totalWorkouts,
        totalCompleted,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
}

/**
 * Map WorkoutType from classifier to WorkoutLabel enum
 */
function mapWorkoutTypeToLabel(workoutType: WorkoutType) {
  const mapping: Record<WorkoutType, string> = {
    SERIES: 'SERIES',
    TEMPO: 'TEMPO',
    RODAJE: 'RODAJE',
    CUESTAS: 'CUESTAS',
    RECUPERACION: 'RECUPERACION',
    PROGRESIVO: 'PROGRESIVO',
    FARTLEK: 'FARTLEK',
    COMPETICION: 'COMPETICION',
    OTRO: 'OTRO'
  };
  return mapping[workoutType] || 'OTRO';
}

/**
 * Reclassify all workouts for a specific athlete (admin only)
 */
export async function reclassifyAthleteWorkouts(req: Request, res: Response) {
  try {
    const { athleteId } = req.params;
    const forceAll = req.query.force === 'true';

    // Verify athlete exists
    const athlete = await prisma.user.findUnique({
      where: { id: athleteId },
      select: { id: true, name: true, birthDate: true, maxHeartRate: true, restingHR: true },
    });

    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    // Check if athlete has Strava connected
    const stravaToken = await prisma.stravaToken.findUnique({
      where: { userId: athleteId },
    });

    if (!stravaToken) {
      return res.status(400).json({ error: 'Athlete does not have Strava connected' });
    }

    console.log(`🔄 Admin reclassification for athlete ${athlete.name} (${athleteId}) (force: ${forceAll})`);

    // Find workouts to reclassify
    const whereClause = forceAll
      ? { userId: athleteId, stravaId: { not: null } }
      : {
          userId: athleteId,
          stravaId: { not: null },
          OR: [
            { workoutStructure: null },
            { humanReadable: null },
            { classificationConfidence: null }
          ]
        };

    const workouts = await prisma.completedWorkout.findMany({
      where: whereClause,
      orderBy: { completedAt: 'desc' }
    });

    console.log(`📋 Found ${workouts.length} workouts to reclassify`);

    if (workouts.length === 0) {
      return res.json({
        success: true,
        athleteId,
        athleteName: athlete.name,
        reclassified: 0,
        failed: 0,
        message: 'All workouts are already classified'
      });
    }

    let success = 0;
    let failed = 0;
    const results: any[] = [];

    // Build classification context
    let classificationContext: ClassificationContext | undefined;
    const hrZones = calculateHRZones(athlete.birthDate, athlete.maxHeartRate, athlete.restingHR);
    const historyStats = await getAthleteHistoricalStats(athleteId);
    classificationContext = {
      hrZones,
      athleteStats: historyStats || undefined
    };

    for (const workout of workouts) {
      try {
        if (!workout.stravaId) {
          failed++;
          continue;
        }

        console.log(`🔍 Reclassifying: ${workout.title}`);

        // Get detailed activity from Strava
        const detailedActivity = await getDetailedActivity(athleteId, parseInt(workout.stravaId));

        // Classify with context
        const classification = classifyWorkout(detailedActivity, classificationContext);
        const label = mapWorkoutTypeToLabel(classification.workout_type);

        console.log(`   ✅ Classified as: ${classification.workout_type} (${classification.confidence})`);

        // Build complete structure
        const completeStructure = {
          classification: classification.structure,
          rawData: {
            splits: detailedActivity.splits_metric,
            laps: detailedActivity.laps,
            elevation: detailedActivity.total_elevation_gain
          }
        };

        // Update in database
        await prisma.completedWorkout.update({
          where: { id: workout.id },
          data: {
            label: label as any,
            workoutStructure: completeStructure as any,
            humanReadable: classification.human_readable,
            classificationConfidence: classification.confidence
          }
        });

        success++;
        results.push({
          id: workout.id,
          title: workout.title,
          type: classification.workout_type,
          description: classification.human_readable,
          confidence: classification.confidence
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`✅ Reclassification complete for ${athlete.name}: ${success} success, ${failed} failed`);

    res.json({
      success: true,
      athleteId,
      athleteName: athlete.name,
      reclassified: success,
      failed,
      total: workouts.length,
      results
    });

  } catch (error: any) {
    console.error('Reclassify athlete workouts error:', error);
    res.status(500).json({
      error: 'Failed to reclassify workouts',
      details: error?.message
    });
  }
}
