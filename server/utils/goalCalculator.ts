import { prisma } from '../config/prisma';

/**
 * Helper to calculate dynamic weekly goal from planned workouts
 * Falls back safely when no plans or data exist
 */
export async function calculateDynamicWeeklyGoal(
  userId: string,
  userGoalSetting: number | null
): Promise<number> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // ⚠️ SAFE FALLBACK:
  // TrainingPlan model may not exist or user has no plans yet
  if (!prisma?.trainingPlan) {
    return userGoalSetting ?? 20;
  }

  // Fetch training plans for this week
  const plans = await prisma.trainingPlan.findMany({
    where: {
      athleteId: userId,
      date: {
        gte: weekStart,
        lt: weekEnd
      }
    },
    include: {
      blocks: true
    }
  });

  // No plans found → fallback
  if (!plans || plans.length === 0) {
    return userGoalSetting ?? 20;
  }

  // Calculate total planned distance
  let totalPlannedMeters = 0;

  for (const plan of plans) {
    if (!plan.blocks) continue;

    for (const block of plan.blocks) {
      if (block.distanceMeters) {
        totalPlannedMeters += block.distanceMeters;
      } else if (block.durationSeconds) {
        // Estimate distance from duration
        let paceSecPerKm = 300; // Default 5:00/km

        if (block.type === 'WARMUP' || block.type === 'COOLDOWN') {
          paceSecPerKm = 360; // 6:00/km
        } else if (block.type === 'INTERVALS') {
          paceSecPerKm = 240; // 4:00/km
        }

        // Use block pace targets if available
        if (block.paceMin && block.paceMax) {
          paceSecPerKm = (block.paceMin + block.paceMax) / 2;
        }

        totalPlannedMeters += (block.durationSeconds / paceSecPerKm) * 1000;
      }
    }
  }

  // Return in km, rounded
  return Math.round(totalPlannedMeters / 1000);
}
