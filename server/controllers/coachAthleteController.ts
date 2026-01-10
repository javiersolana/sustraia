import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

/**
 * Get all coaches for an athlete
 */
export async function getAthleteCoaches(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const coachRelationships = await prisma.coachAthlete.findMany({
      where: { athleteId: req.user.userId },
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

    const coaches = coachRelationships.map((rel) => rel.coach);

    res.json({ coaches });
  } catch (error) {
    console.error('Get athlete coaches error:', error);
    res.status(500).json({ error: 'Failed to get coaches' });
  }
}

/**
 * Get all athletes for a coach
 */
export async function getCoachAthletes(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const athleteRelationships = await prisma.coachAthlete.findMany({
      where: { coachId: req.user.userId },
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const athletes = athleteRelationships.map((rel) => rel.athlete);

    res.json({ athletes });
  } catch (error) {
    console.error('Get coach athletes error:', error);
    res.status(500).json({ error: 'Failed to get athletes' });
  }
}

/**
 * Add a coach to an athlete
 */
export async function addCoachToAthlete(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { coachId } = req.body;

    if (!coachId) {
      return res.status(400).json({ error: 'Coach ID required' });
    }

    // Verify coach exists and has COACH role
    const coach = await prisma.user.findUnique({
      where: { id: coachId },
      select: { id: true, role: true, name: true },
    });

    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    if (coach.role !== 'COACH') {
      return res.status(400).json({ error: 'User is not a coach' });
    }

    // Check if relationship already exists
    const existing = await prisma.coachAthlete.findUnique({
      where: {
        coachId_athleteId: {
          coachId,
          athleteId: req.user.userId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Coach already assigned' });
    }

    // Create relationship
    const relationship = await prisma.coachAthlete.create({
      data: {
        coachId,
        athleteId: req.user.userId,
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      coach: relationship.coach,
    });
  } catch (error) {
    console.error('Add coach error:', error);
    res.status(500).json({ error: 'Failed to add coach' });
  }
}

/**
 * Remove a coach from an athlete
 */
export async function removeCoachFromAthlete(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { coachId } = req.params;

    if (!coachId) {
      return res.status(400).json({ error: 'Coach ID required' });
    }

    // Delete relationship
    await prisma.coachAthlete.delete({
      where: {
        coachId_athleteId: {
          coachId,
          athleteId: req.user.userId,
        },
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Coach relationship not found' });
    }
    console.error('Remove coach error:', error);
    res.status(500).json({ error: 'Failed to remove coach' });
  }
}
