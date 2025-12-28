import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

/**
 * Calculate and store stats for a user
 */
export async function calculateStats(userId: string, date: Date = new Date()) {
  // Get all completed workouts for the user
  const completedWorkouts = await prisma.completedWorkout.findMany({
    where: { userId },
    include: { workout: true },
  });

  // Total stats
  const totalWorkouts = completedWorkouts.length;
  const totalDistance = completedWorkouts.reduce(
    (sum, w) => sum + (w.actualDistance || 0),
    0
  );
  const totalDuration = completedWorkouts.reduce(
    (sum, w) => sum + (w.actualDuration || 0),
    0
  );

  // Weekly stats (last 7 days)
  const weekAgo = new Date(date);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyWorkouts = completedWorkouts.filter(
    (w) => new Date(w.completedAt) >= weekAgo
  );
  const weeklyDistance = weeklyWorkouts.reduce(
    (sum, w) => sum + (w.actualDistance || 0),
    0
  );
  const weeklyDuration = weeklyWorkouts.reduce(
    (sum, w) => sum + (w.actualDuration || 0),
    0
  );

  // Monthly stats (last 30 days)
  const monthAgo = new Date(date);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const monthlyWorkouts = completedWorkouts.filter(
    (w) => new Date(w.completedAt) >= monthAgo
  );
  const monthlyDistance = monthlyWorkouts.reduce(
    (sum, w) => sum + (w.actualDistance || 0),
    0
  );
  const monthlyDuration = monthlyWorkouts.reduce(
    (sum, w) => sum + (w.actualDuration || 0),
    0
  );

  // Store/update stats
  const stats = [
    { metricName: 'totalWorkouts', value: totalWorkouts },
    { metricName: 'totalDistance', value: totalDistance },
    { metricName: 'totalDuration', value: totalDuration },
    { metricName: 'weeklyWorkouts', value: weeklyWorkouts.length },
    { metricName: 'weeklyDistance', value: weeklyDistance },
    { metricName: 'weeklyDuration', value: weeklyDuration },
    { metricName: 'monthlyWorkouts', value: monthlyWorkouts.length },
    { metricName: 'monthlyDistance', value: monthlyDistance },
    { metricName: 'monthlyDuration', value: monthlyDuration },
  ];

  // Upsert each stat
  for (const stat of stats) {
    await prisma.stat.upsert({
      where: {
        userId_metricName_date: {
          userId,
          metricName: stat.metricName,
          date,
        },
      },
      update: {
        value: stat.value,
      },
      create: {
        userId,
        metricName: stat.metricName,
        value: stat.value,
        date,
      },
    });
  }

  return stats;
}

/**
 * Get user stats
 */
export async function getStats(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Recalculate stats
    const stats = await calculateStats(req.user.userId);

    // Format stats as object
    const statsObj = stats.reduce(
      (acc, stat) => {
        acc[stat.metricName] = stat.value;
        return acc;
      },
      {} as Record<string, number>
    );

    res.json({ stats: statsObj });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

/**
 * Get stats history (time series)
 */
export async function getStatsHistory(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { metricName } = req.params;
    const days = Math.min(parseInt(req.query.days as string) || 30, 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await prisma.stat.findMany({
      where: {
        userId: req.user.userId,
        metricName,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    res.json({ stats });
  } catch (error) {
    console.error('Get stats history error:', error);
    res.status(500).json({ error: 'Failed to fetch stats history' });
  }
}

/**
 * Get dashboard overview (for athletes)
 */
export async function getDashboard(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Recalculate stats
    const stats = await calculateStats(req.user.userId);

    // Get upcoming workouts
    const upcomingWorkouts = await prisma.workout.findMany({
      where: {
        assignedTo: req.user.userId,
        date: {
          gte: new Date(),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: 5,
    });

    // Get recent completed workouts
    const recentCompleted = await prisma.completedWorkout.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        workout: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 5,
    });

    // Get unread messages
    const unreadMessages = await prisma.message.count({
      where: {
        toId: req.user.userId,
        read: false,
      },
    });

    res.json({
      stats: stats.reduce(
        (acc, stat) => {
          acc[stat.metricName] = stat.value;
          return acc;
        },
        {} as Record<string, number>
      ),
      upcomingWorkouts,
      recentCompleted,
      unreadMessages,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

/**
 * Get coach dashboard (overview of athletes)
 */
export async function getCoachDashboard(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Only coaches can access this' });
    }

    // Get all athletes
    const athletes = await prisma.user.findMany({
      where: {
        coachId: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Get stats for each athlete
    const athletesWithStats = await Promise.all(
      athletes.map(async (athlete) => {
        const stats = await calculateStats(athlete.id);

        return {
          ...athlete,
          stats: stats.reduce(
            (acc, stat) => {
              acc[stat.metricName] = stat.value;
              return acc;
            },
            {} as Record<string, number>
          ),
        };
      })
    );

    // Get recent workouts created
    const recentWorkouts = await prisma.workout.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
          },
        },
        completedVersion: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Get unread messages
    const unreadMessages = await prisma.message.count({
      where: {
        toId: req.user.userId,
        read: false,
      },
    });

    res.json({
      athletes: athletesWithStats,
      recentWorkouts,
      unreadMessages,
    });
  } catch (error) {
    console.error('Get coach dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch coach dashboard data' });
  }
}
