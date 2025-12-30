import { Request, Response } from 'express';
import { config } from '../config/env';
import {
  exchangeToken,
  storeTokens,
  getActivities,
  getActivity,
  getActivityLaps,
  syncActivityToWorkout,
  disconnectStrava,
  importInitialActivities,
  getDetailedActivity,
} from '../services/stravaService';
import { prisma } from '../config/prisma';
import { classifyWorkout, WorkoutType, ClassificationContext } from '../services/workoutClassifier';
import { calculateHRZones } from '../services/hrZonesService';
import { getAthleteHistoricalStats } from '../services/athleteHistoryService';

/**
 * Get Strava OAuth authorization URL
 */
export async function getAuthUrl(req: Request, res: Response) {
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${config.strava.clientId}&response_type=code&redirect_uri=${config.strava.redirectUri}&approval_prompt=force&scope=read,activity:read_all`;

  res.json({ authUrl });
}

/**
 * Handle Strava OAuth callback
 */
export async function handleCallback(req: Request, res: Response) {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Exchange code for tokens
    const tokenData = await exchangeToken(code);

    // Store tokens
    await storeTokens(req.user.userId, tokenData);

    res.json({
      success: true,
      athlete: tokenData.athlete,
    });
  } catch (error: any) {
    console.error('Strava callback error:', error?.response?.data || error?.message || error);
    res.status(500).json({
      error: 'Failed to connect Strava account',
      details: error?.response?.data?.message || error?.message
    });
  }
}

/**
 * Get user's Strava connection status
 */
export async function getConnectionStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const stravaToken = await prisma.stravaToken.findUnique({
      where: { userId: req.user.userId },
      select: {
        athleteId: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    res.json({
      connected: !!stravaToken,
      ...(stravaToken && {
        athleteId: stravaToken.athleteId,
        connectedAt: stravaToken.createdAt,
      }),
    });
  } catch (error) {
    console.error('Get Strava status error:', error);
    res.status(500).json({ error: 'Failed to get connection status' });
  }
}

/**
 * Get user's Strava activities
 */
export async function getUserActivities(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.perPage as string) || 30, 100);

    const activities = await getActivities(req.user.userId, { page, perPage });

    res.json({ activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
}

/**
 * Sync Strava activity to workout
 */
export async function syncActivity(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { activityId, workoutId } = req.body;

    if (!activityId) {
      return res.status(400).json({ error: 'Activity ID required' });
    }

    // Fetch activity details
    const activity = await getActivity(req.user.userId, parseInt(activityId));

    // Sync to workout
    await syncActivityToWorkout(req.user.userId, activity, workoutId);

    res.json({
      success: true,
      activity: {
        id: activity.id,
        name: activity.name,
        type: activity.type,
        distance: activity.distance,
        duration: activity.moving_time,
      },
    });
  } catch (error) {
    console.error('Sync activity error:', error);
    res.status(500).json({ error: 'Failed to sync activity' });
  }
}

/**
 * Disconnect Strava account
 */
export async function disconnect(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await disconnectStrava(req.user.userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Disconnect Strava error:', error);
    res.status(500).json({ error: 'Failed to disconnect Strava' });
  }
}

/**
 * Import initial Strava activities (last 4 weeks)
 */
export async function importActivities(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const weeks = parseInt(req.query.weeks as string) || 4;

    const result = await importInitialActivities(req.user.userId, weeks);

    res.json({
      success: true,
      imported: result.imported,
      skipped: result.skipped,
      activities: result.activities,
    });
  } catch (error: any) {
    console.error('Import activities error:', error);
    res.status(500).json({
      error: 'Failed to import activities',
      details: error?.message
    });
  }
}

/**
 * Webhook verification (Strava subscription)
 */
export async function verifyWebhook(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.strava.webhookVerifyToken) {
    console.log('Webhook verified');
    res.json({ 'hub.challenge': challenge });
  } else {
    res.sendStatus(403);
  }
}

/**
 * Handle webhook events
 */
export async function handleWebhook(req: Request, res: Response) {
  try {
    const event = req.body;

    console.log('Strava webhook event:', event);

    // Event types: create, update, delete
    // Aspect types: create, update, delete
    // Object types: activity, athlete

    if (event.object_type === 'activity' && event.aspect_type === 'create') {
      // New activity created
      const activityId = event.object_id;
      const athleteId = event.owner_id.toString();

      // Find user by Strava athlete ID
      const stravaToken = await prisma.stravaToken.findFirst({
        where: { athleteId },
      });

      if (stravaToken) {
        // Fetch and sync the activity
        const activity = await getActivity(stravaToken.userId, activityId);
        await syncActivityToWorkout(stravaToken.userId, activity);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.sendStatus(500);
  }
}

/**
 * Get activity laps/splits
 */
export async function getActivityLapsController(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const activityId = parseInt(req.params.activityId);

    if (isNaN(activityId)) {
      return res.status(400).json({ error: 'Invalid activity ID' });
    }

    const laps = await getActivityLaps(req.user.userId, activityId);

    res.json({ laps });
  } catch (error) {
    console.error('Get activity laps error:', error);
    res.status(500).json({ error: 'Failed to fetch activity laps' });
  }
}

/**
 * Map WorkoutType from classifier to WorkoutLabel enum
 */
function mapWorkoutTypeToLabel(workoutType: WorkoutType) {
  const mapping: Record<WorkoutType, any> = {
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
 * Reclassify all workouts for the current user
 * Query params:
 * - force: if true, reclassify ALL workouts (even already classified ones)
 */
export async function reclassifyWorkouts(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.userId;
    const forceAll = req.query.force === 'true';

    console.log(`🔄 Starting reclassification for user ${userId} (force: ${forceAll})`);

    // Find workouts to reclassify
    const whereClause = forceAll
      ? { userId, stravaId: { not: null } }
      : {
          userId,
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
        reclassified: 0,
        failed: 0,
        message: 'All workouts are already classified'
      });
    }

    let success = 0;
    let failed = 0;
    const results: any[] = [];

    // Get user profile for personalized classification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true, maxHeartRate: true, restingHR: true }
    });

    // Build classification context
    let classificationContext: ClassificationContext | undefined;
    if (user) {
      const hrZones = calculateHRZones(user.birthDate, user.maxHeartRate, user.restingHR);
      const historyStats = await getAthleteHistoricalStats(userId);
      classificationContext = {
        hrZones,
        athleteStats: historyStats || undefined
      };
      console.log(`👤 Using personalized classification with HR zones`);
    }

    for (const workout of workouts) {
      try {
        if (!workout.stravaId) {
          failed++;
          continue;
        }

        console.log(`🔍 Reclassifying: ${workout.title}`);

        // Get detailed activity from Strava
        const detailedActivity = await getDetailedActivity(userId, parseInt(workout.stravaId));

        console.log(`   📊 Splits: ${detailedActivity.splits_metric?.length || 0}`);
        console.log(`   🏁 Laps: ${detailedActivity.laps?.length || 0}`);
        console.log(`   💓 HR: avg ${detailedActivity.average_heartrate || 'N/A'}, max ${detailedActivity.max_heartrate || 'N/A'}`);

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
            label,
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

    console.log(`✅ Reclassification complete: ${success} success, ${failed} failed`);

    res.json({
      success: true,
      reclassified: success,
      failed,
      total: workouts.length,
      results
    });

  } catch (error: any) {
    console.error('Reclassify workouts error:', error);
    res.status(500).json({
      error: 'Failed to reclassify workouts',
      details: error?.message
    });
  }
}
