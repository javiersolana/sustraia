import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

import { calculateDynamicWeeklyGoal } from '../utils/goalCalculator';

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

  // Weekly stats (Monday-Sunday of current week)
  const today = new Date(date);
  const dayOfWeek = today.getDay();
  // Get Monday of current week (if Sunday=0, go back 6 days; else go back dayOfWeek-1 days)
  const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weeklyWorkouts = completedWorkouts.filter(
    (w) => new Date(w.completedAt) >= weekStart
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

    // Get user's weekly goal setting
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { weeklyGoalKm: true },
    });

    // Calculate dynamic goal based on training plans
    const weeklyGoalKm = await calculateDynamicWeeklyGoal(req.user.userId, user?.weeklyGoalKm || null);

    // Get upcoming workouts
    const upcomingWorkouts = await prisma.workout.findMany({
      where: {
        OR: [
          { assignedTo: req.user.userId }, // Assigned workouts
          { userId: req.user.userId }      // Created by user
        ],
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)), // From start of today
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

    // Get recent completed workouts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCompleted = await prisma.completedWorkout.findMany({
      where: {
        userId: req.user.userId,
        completedAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        workout: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 50,
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
      weeklyGoalKm,
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

    // Generate alerts for athletes with issues
    const alerts = await generateCoachAlerts(req.user.userId, athletes);

    res.json({
      athletes: athletesWithStats,
      recentWorkouts,
      unreadMessages,
      alerts,
    });
  } catch (error) {
    console.error('Get coach dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch coach dashboard data' });
  }
}

/**
 * Generate alerts for coach about athlete issues
 */
async function generateCoachAlerts(
  coachId: string,
  athletes: { id: string; name: string; email: string }[]
): Promise<Array<{
  id: string;
  type: 'missed_workout' | 'low_compliance' | 'no_activity';
  athleteId: string;
  athleteName: string;
  message: string;
  detail: string;
  createdAt: Date;
}>> {
  const alerts: Array<{
    id: string;
    type: 'missed_workout' | 'low_compliance' | 'no_activity';
    athleteId: string;
    athleteName: string;
    message: string;
    detail: string;
    createdAt: Date;
  }> = [];

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  for (const athlete of athletes) {
    // Check for missed assigned workouts (workouts in the past without completed workouts near that date)
    const pastWorkouts = await prisma.workout.findMany({
      where: {
        assignedTo: athlete.id,
        userId: coachId,
        date: {
          gte: sevenDaysAgo,
          lt: now,
        },
      },
      orderBy: { date: 'desc' },
    });

    for (const workout of pastWorkouts) {
      const workoutDate = new Date(workout.date);
      const dayBefore = new Date(workoutDate.getTime() - 24 * 60 * 60 * 1000);
      const dayAfter = new Date(workoutDate.getTime() + 24 * 60 * 60 * 1000);

      // Check if there's a completed workout within ±1 day of the assigned workout
      const completedNearWorkout = await prisma.completedWorkout.findFirst({
        where: {
          userId: athlete.id,
          completedAt: {
            gte: dayBefore,
            lte: dayAfter,
          },
        },
      });

      if (!completedNearWorkout) {
        const daysAgo = Math.floor((now.getTime() - workoutDate.getTime()) / (24 * 60 * 60 * 1000));
        alerts.push({
          id: `missed-${workout.id}`,
          type: 'missed_workout',
          athleteId: athlete.id,
          athleteName: athlete.name,
          message: `${athlete.name} no completó "${workout.title}"`,
          detail: `Hace ${daysAgo} día${daysAgo > 1 ? 's' : ''} • ${workout.title}`,
          createdAt: workoutDate,
        });
      }
    }

    // Check for athletes with no activity in 7+ days
    const lastActivity = await prisma.completedWorkout.findFirst({
      where: { userId: athlete.id },
      orderBy: { completedAt: 'desc' },
    });

    if (!lastActivity) {
      // No activity ever
      alerts.push({
        id: `no-activity-${athlete.id}`,
        type: 'no_activity',
        athleteId: athlete.id,
        athleteName: athlete.name,
        message: `${athlete.name} no tiene actividad registrada`,
        detail: 'Sin entrenamientos sincronizados',
        createdAt: now,
      });
    } else {
      const lastActivityDate = new Date(lastActivity.completedAt);
      const daysSinceActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000));

      if (daysSinceActivity >= 7) {
        alerts.push({
          id: `inactive-${athlete.id}`,
          type: 'no_activity',
          athleteId: athlete.id,
          athleteName: athlete.name,
          message: `${athlete.name} lleva ${daysSinceActivity} días sin entrenar`,
          detail: `Última actividad: ${lastActivityDate.toLocaleDateString('es-ES')}`,
          createdAt: lastActivityDate,
        });
      }
    }

    // Check low weekly compliance (less than 2 workouts when they usually do more)
    const weeklyWorkouts = await prisma.completedWorkout.count({
      where: {
        userId: athlete.id,
        completedAt: { gte: sevenDaysAgo },
      },
    });

    const previousWeekWorkouts = await prisma.completedWorkout.count({
      where: {
        userId: athlete.id,
        completedAt: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo,
        },
      },
    });

    // Alert if they did at least 3 workouts last week but less than 2 this week
    if (previousWeekWorkouts >= 3 && weeklyWorkouts < 2) {
      alerts.push({
        id: `low-compliance-${athlete.id}`,
        type: 'low_compliance',
        athleteId: athlete.id,
        athleteName: athlete.name,
        message: `${athlete.name} ha bajado su ritmo de entrenamiento`,
        detail: `${weeklyWorkouts} entreno${weeklyWorkouts !== 1 ? 's' : ''} esta semana vs ${previousWeekWorkouts} la anterior`,
        createdAt: now,
      });
    }
  }

  // Sort alerts by date (most recent first) and limit to 10
  return alerts
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);
}

/**
 * Get completed workouts for a specific athlete (coach only)
 */
export async function getAthleteWorkouts(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Only coaches can access this' });
    }

    const { athleteId } = req.params;

    // Verify this athlete belongs to the coach
    const athlete = await prisma.user.findFirst({
      where: {
        id: athleteId,
        coachId: req.user.userId,
      },
    });

    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    // Get completed workouts for the last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const completedWorkouts = await prisma.completedWorkout.findMany({
      where: {
        userId: athleteId,
        completedAt: {
          gte: sixtyDaysAgo,
        },
      },
      include: {
        workout: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 100,
    });

    res.json({ workouts: completedWorkouts });
  } catch (error) {
    console.error('Get athlete workouts error:', error);
    res.status(500).json({ error: 'Failed to fetch athlete workouts' });
  }
}

/**
 * Get single completed workout/activity by ID
 */
export async function getActivity(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    const activity = await prisma.completedWorkout.findUnique({
      where: { id },
      include: {
        workout: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Check permissions: user owns it OR user's coach
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { coachId: true, role: true },
    });

    const canAccess =
      activity.userId === req.user.userId ||
      (user?.role === 'COACH' && activity.user.id === req.user.userId) ||
      (user?.coachId && activity.user.id === user.coachId);

    if (!canAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
}

/**
 * Get all completed activities for authenticated user
 */
export async function getActivities(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      prisma.completedWorkout.findMany({
        where: {
          userId: req.user.userId,
        },
        include: {
          workout: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.completedWorkout.count({
        where: { userId: req.user.userId },
      }),
    ]);

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
}

/**
 * Get alerts for coach (low compliance, missed workouts, etc)
 */
export async function getCoachAlerts(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Only coaches can access alerts' });
    }

    const coachId = req.user.userId;

    // Get all athletes for this coach
    const athletes = await prisma.user.findMany({
      where: {
        coachId,
        role: 'ATLETA',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const alerts: Array<{
      id: string;
      type: 'missed_workout' | 'low_compliance' | 'no_activity';
      athleteId: string;
      athleteName: string;
      message: string;
      detail: string;
      createdAt: string;
    }> = [];

    // Calculate compliance for each athlete
    for (const athlete of athletes) {
      // Get weekly stats
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + mondayOffset);
      weekStart.setHours(0, 0, 0, 0);

      const weeklyWorkouts = await prisma.completedWorkout.count({
        where: {
          userId: athlete.id,
          completedAt: {
            gte: weekStart,
          },
        },
      });

      const weeklyGoal = 4; // Default target: 4 workouts/week
      const compliance = (weeklyWorkouts / weeklyGoal) * 100;

      // Alert: Low compliance (< 50%)
      if (compliance < 50) {
        alerts.push({
          id: `${athlete.id}-low-compliance`,
          type: 'low_compliance',
          athleteId: athlete.id,
          athleteName: athlete.name,
          message: `${athlete.name} solo completó ${weeklyWorkouts} de ${weeklyGoal} entrenos esta semana`,
          detail: `Compliance: ${compliance.toFixed(0)}%`,
          createdAt: new Date().toISOString(),
        });
      }

      // Alert: No activity in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentWorkouts = await prisma.completedWorkout.count({
        where: {
          userId: athlete.id,
          completedAt: {
            gte: sevenDaysAgo,
          },
        },
      });

      if (recentWorkouts === 0) {
        alerts.push({
          id: `${athlete.id}-no-activity`,
          type: 'no_activity',
          athleteId: athlete.id,
          athleteName: athlete.name,
          message: `${athlete.name} no ha registrado actividad en 7 días`,
          detail: 'Considera contactar al atleta',
          createdAt: new Date().toISOString(),
        });
      }
    }

    res.json({ alerts });
  } catch (error) {
    console.error('Get coach alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
}
