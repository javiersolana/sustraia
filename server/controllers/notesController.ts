import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

/**
 * Get notes for a specific athlete (coach only)
 */
export async function getAthleteNotes(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { athleteId } = req.params;

    // Verify the user is a coach and the athlete is assigned to them
    const coach = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, athletes: { select: { id: true } } },
    });

    if (!coach || coach.role !== 'COACH') {
      return res.status(403).json({ error: 'Only coaches can view athlete notes' });
    }

    const isAthleteAssigned = coach.athletes.some(a => a.id === athleteId);
    if (!isAthleteAssigned) {
      return res.status(403).json({ error: 'Athlete not assigned to this coach' });
    }

    const notes = await prisma.athleteNote.findMany({
      where: {
        coachId: req.user.userId,
        athleteId,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ notes });
  } catch (error) {
    console.error('Get athlete notes error:', error);
    res.status(500).json({ error: 'Failed to fetch athlete notes' });
  }
}

/**
 * Add a note for an athlete (coach only)
 */
export async function addAthleteNote(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { athleteId } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Verify the user is a coach and the athlete is assigned to them
    const coach = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, athletes: { select: { id: true } } },
    });

    if (!coach || coach.role !== 'COACH') {
      return res.status(403).json({ error: 'Only coaches can add athlete notes' });
    }

    const isAthleteAssigned = coach.athletes.some(a => a.id === athleteId);
    if (!isAthleteAssigned) {
      return res.status(403).json({ error: 'Athlete not assigned to this coach' });
    }

    const note = await prisma.athleteNote.create({
      data: {
        coachId: req.user.userId,
        athleteId,
        content: content.trim(),
      },
    });

    res.status(201).json({ note });
  } catch (error) {
    console.error('Add athlete note error:', error);
    res.status(500).json({ error: 'Failed to add athlete note' });
  }
}

/**
 * Delete a note (coach only)
 */
export async function deleteAthleteNote(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { noteId } = req.params;

    // Verify the note belongs to this coach
    const note = await prisma.athleteNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.coachId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }

    await prisma.athleteNote.delete({
      where: { id: noteId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete athlete note error:', error);
    res.status(500).json({ error: 'Failed to delete athlete note' });
  }
}

/**
 * Get goals for a specific athlete
 */
export async function getAthleteGoals(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { athleteId } = req.params;

    // Check if user is the athlete or their coach
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, athletes: { select: { id: true } } },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isAthlete = req.user.userId === athleteId;
    const isCoach = user.role === 'COACH' && user.athletes.some(a => a.id === athleteId);

    if (!isAthlete && !isCoach) {
      return res.status(403).json({ error: 'Not authorized to view these goals' });
    }

    const goals = await prisma.athleteGoal.findMany({
      where: { athleteId },
      orderBy: { date: 'asc' },
      include: {
        coach: {
          select: { name: true },
        },
      },
    });

    res.json({ goals });
  } catch (error) {
    console.error('Get athlete goals error:', error);
    res.status(500).json({ error: 'Failed to fetch athlete goals' });
  }
}

/**
 * Add a goal for an athlete (athlete or coach)
 */
export async function addAthleteGoal(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { athleteId } = req.params;
    const { name, date, distance, description, type = 'race' } = req.body;

    if (!name || !date) {
      return res.status(400).json({ error: 'Name and date are required' });
    }

    // Check if user is the athlete or their coach
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, athletes: { select: { id: true } } },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isAthlete = req.user.userId === athleteId;
    const isCoach = user.role === 'COACH' && user.athletes.some(a => a.id === athleteId);

    if (!isAthlete && !isCoach) {
      return res.status(403).json({ error: 'Not authorized to add goals for this athlete' });
    }

    const goal = await prisma.athleteGoal.create({
      data: {
        athleteId,
        coachId: isCoach ? req.user.userId : null,
        name,
        date: new Date(date),
        distance: distance ? parseFloat(distance) : null,
        description,
        type,
      },
    });

    // TODO: If athlete added a goal, notify the coach
    // This would be implemented with a notification system

    res.status(201).json({ goal });
  } catch (error) {
    console.error('Add athlete goal error:', error);
    res.status(500).json({ error: 'Failed to add athlete goal' });
  }
}

/**
 * Delete a goal
 */
export async function deleteAthleteGoal(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { goalId } = req.params;

    const goal = await prisma.athleteGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Only the athlete or the coach who created it can delete
    const canDelete =
      goal.athleteId === req.user.userId ||
      goal.coachId === req.user.userId;

    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this goal' });
    }

    await prisma.athleteGoal.delete({
      where: { id: goalId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete athlete goal error:', error);
    res.status(500).json({ error: 'Failed to delete athlete goal' });
  }
}
