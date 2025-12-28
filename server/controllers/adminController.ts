import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';

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
];

export async function createAthlete(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, coachId } = req.body;

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
        role: 'ATLETA',
        coachId: coachId || null,
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
        role: 'COACH',
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
 * Update user (assign/reassign coach)
 */
export const updateUserValidation = [
  body('name').optional().trim().isLength({ min: 2 }),
  body('coachId').optional().isString(),
];

export async function updateUser(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, coachId } = req.body;

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
