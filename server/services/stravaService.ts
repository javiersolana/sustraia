import axios from 'axios';
import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { classifyWorkout as classifyByTitle, WorkoutLabelType } from './labelClassifier';
import {
  classifyWorkout as intelligentClassify,
  StravaDetailedActivity,
  StravaSplit,
  StravaLap as ClassifierStravaLap,
  WorkoutType,
  ClassificationResult,
  ClassificationContext
} from './workoutClassifier';
import { calculateHRZones } from './hrZonesService';
import { getAthleteHistoricalStats } from './athleteHistoryService';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth';

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
}

export interface StravaLap {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  lap_index: number;
  split?: number;
  start_index?: number;
  end_index?: number;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeToken(code: string): Promise<StravaTokenResponse> {
  try {
    const response = await axios.post(`${STRAVA_OAUTH_BASE}/token`, {
      client_id: config.strava.clientId,
      client_secret: config.strava.clientSecret,
      code,
      grant_type: 'authorization_code',
    });

    return response.data;
  } catch (error) {
    console.error('Strava token exchange error:', error);
    throw new Error('Failed to exchange Strava authorization code');
  }
}

/**
 * Refresh Strava access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
  try {
    const response = await axios.post(`${STRAVA_OAUTH_BASE}/token`, {
      client_id: config.strava.clientId,
      client_secret: config.strava.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    return response.data;
  } catch (error) {
    console.error('Strava token refresh error:', error);
    throw new Error('Failed to refresh Strava access token');
  }
}

/**
 * Get valid access token for user (auto-refresh if expired)
 */
export async function getValidToken(userId: string): Promise<string> {
  const stravaToken = await prisma.stravaToken.findUnique({
    where: { userId },
  });

  if (!stravaToken) {
    throw new Error('No Strava connection found');
  }

  const now = new Date();
  const expiresAt = new Date(stravaToken.expiresAt);

  // If token expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(stravaToken.refreshToken);

    // Update token in database
    await prisma.stravaToken.update({
      where: { userId },
      data: {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        expiresAt: new Date(refreshed.expires_at * 1000),
      },
    });

    return refreshed.access_token;
  }

  return stravaToken.accessToken;
}

/**
 * Store Strava tokens for user
 */
export async function storeTokens(
  userId: string,
  tokenData: StravaTokenResponse
): Promise<void> {
  await prisma.stravaToken.upsert({
    where: { userId },
    update: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(tokenData.expires_at * 1000),
      athleteId: tokenData.athlete.id.toString(),
      scope: 'read,activity:read_all',
    },
    create: {
      userId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(tokenData.expires_at * 1000),
      athleteId: tokenData.athlete.id.toString(),
      scope: 'read,activity:read_all',
    },
  });
}

/**
 * Fetch activities from Strava with date range
 */
export async function getActivities(
  userId: string,
  options: {
    page?: number;
    perPage?: number;
    after?: Date;
    before?: Date;
  } = {}
): Promise<StravaActivity[]> {
  const accessToken = await getValidToken(userId);
  const { page = 1, perPage = 30, after, before } = options;

  try {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (after) {
      params.after = Math.floor(after.getTime() / 1000);
    }
    if (before) {
      params.before = Math.floor(before.getTime() / 1000);
    }

    const response = await axios.get(`${STRAVA_API_BASE}/athlete/activities`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    });

    return response.data;
  } catch (error) {
    console.error('Strava get activities error:', error);
    throw new Error('Failed to fetch Strava activities');
  }
}

/**
 * Get single activity details
 */
export async function getActivity(userId: string, activityId: number): Promise<StravaActivity> {
  const accessToken = await getValidToken(userId);

  try {
    const response = await axios.get(`${STRAVA_API_BASE}/activities/${activityId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Strava get activity error:', error);
    throw new Error('Failed to fetch Strava activity');
  }
}

/**
 * Get detailed activity with splits and laps for intelligent classification
 */
export async function getDetailedActivity(
  userId: string,
  activityId: number
): Promise<StravaDetailedActivity> {
  const accessToken = await getValidToken(userId);

  try {
    // Get activity details
    const activityResponse = await axios.get(`${STRAVA_API_BASE}/activities/${activityId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const activity = activityResponse.data;

    // Get laps if available
    let laps: ClassifierStravaLap[] = [];
    try {
      const lapsResponse = await axios.get(
        `${STRAVA_API_BASE}/activities/${activityId}/laps`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      laps = lapsResponse.data.map((lap: any) => ({
        distance: lap.distance,
        moving_time: lap.moving_time,
        elapsed_time: lap.elapsed_time,
        average_speed: lap.average_speed,
        total_elevation_gain: lap.total_elevation_gain,
        average_heartrate: lap.average_heartrate,
        max_heartrate: lap.max_heartrate
      }));
    } catch (error) {
      console.log('No laps available for activity', activityId);
    }

    // Build detailed activity object
    const detailedActivity: StravaDetailedActivity = {
      id: activity.id,
      name: activity.name,
      type: activity.type,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      average_speed: activity.average_speed,
      average_heartrate: activity.average_heartrate,
      max_heartrate: activity.max_heartrate,
      splits_metric: activity.splits_metric?.map((split: any) => ({
        distance: split.distance,
        moving_time: split.moving_time,
        elapsed_time: split.elapsed_time,
        average_speed: split.average_speed,
        elevation_difference: split.elevation_difference
      })) as StravaSplit[] | undefined,
      laps: laps.length > 0 ? laps : undefined
    };

    return detailedActivity;
  } catch (error) {
    console.error('Strava get detailed activity error:', error);
    throw new Error('Failed to fetch detailed Strava activity');
  }
}

/**
 * Map WorkoutType from classifier to WorkoutLabel enum
 * Maps to existing Prisma WorkoutLabel values: CALENTAMIENTO, DESCALENTAMIENTO, FUERZA, SERIES, TEMPO, RODAJE, CUESTAS, OTRO
 */
function mapWorkoutTypeToLabel(workoutType: WorkoutType): WorkoutLabelType {
  const mapping: Record<WorkoutType, WorkoutLabelType> = {
    SERIES: 'SERIES',
    TEMPO: 'TEMPO',
    RODAJE: 'RODAJE',
    CUESTAS: 'CUESTAS',
    RECUPERACION: 'RODAJE', // Map to RODAJE (recovery run)
    PROGRESIVO: 'TEMPO',    // Map to TEMPO (progressive is similar to tempo)
    FARTLEK: 'SERIES',      // Map to SERIES (fartlek is interval-based)
    COMPETICION: 'SERIES',  // Map to SERIES (competition effort is high intensity)
    OTRO: 'OTRO'
  };

  return mapping[workoutType] || 'OTRO';
}

/**
 * Sync single Strava activity to completed workout with intelligent classification
 */
export async function syncActivityToWorkout(
  userId: string,
  activity: StravaActivity,
  workoutId?: string
): Promise<{ created: boolean; label: WorkoutLabelType; workoutType?: WorkoutType }> {
  const stravaId = activity.id.toString();

  // Check if already synced
  const existing = await prisma.completedWorkout.findUnique({
    where: { stravaId },
  });

  if (existing) {
    console.log(`Activity ${activity.id} already synced`);
    return { created: false, label: existing.label as WorkoutLabelType };
  }

  // Get detailed activity for intelligent classification
  let classification: ClassificationResult | null = null;
  let label: WorkoutLabelType;
  let detailedActivity: StravaDetailedActivity | null = null;

  try {
    detailedActivity = await getDetailedActivity(userId, activity.id);

    console.log(`🔍 Clasificando actividad: ${activity.name}`);
    console.log(`📊 Splits disponibles: ${detailedActivity.splits_metric?.length || 0}`);
    console.log(`🏁 Laps disponibles: ${detailedActivity.laps?.length || 0}`);

    // Gather context for personalized classification
    let classificationContext: ClassificationContext | undefined;

    // Get user profile for HR zones
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true, maxHeartRate: true, restingHR: true }
    });

    if (user) {
      // Calculate HR Zones
      const hrZones = calculateHRZones(user.birthDate, user.maxHeartRate, user.restingHR);

      // Get historical stats
      const historyStats = await getAthleteHistoricalStats(userId);

      classificationContext = {
        hrZones,
        athleteStats: historyStats || undefined
      };

      if (user.birthDate) {
        console.log(`👤 Personalización activada para atleta (Edad: ${new Date().getFullYear() - user.birthDate.getFullYear()})`);
      }
    }

    // Use intelligent classifier with context
    classification = intelligentClassify(detailedActivity, classificationContext);
    label = mapWorkoutTypeToLabel(classification.workout_type);

    console.log(`✅ Clasificación: ${classification.workout_type}`);
    console.log(`📝 Descripción: ${classification.human_readable}`);
    console.log(`🎯 Confidence: ${classification.confidence}`);
  } catch (error) {
    console.error('❌ Error in intelligent classification, falling back to title-based:', error);
    // Fallback to title-based classification
    label = classifyByTitle(activity.name);
    classification = null;
    detailedActivity = null;
  }

  // Build complete workout structure with classification + raw data
  const completeStructure = classification && detailedActivity ? {
    classification: classification.structure,
    rawData: {
      splits: detailedActivity.splits_metric,
      laps: detailedActivity.laps,
      elevation: detailedActivity.total_elevation_gain
    }
  } : null;

  // Create completed workout with full classification data
  await prisma.completedWorkout.create({
    data: {
      userId,
      workoutId: workoutId || null,
      title: activity.name,
      label: label as 'CALENTAMIENTO' | 'DESCALENTAMIENTO' | 'FUERZA' | 'SERIES' | 'TEMPO' | 'RODAJE' | 'CUESTAS' | 'OTRO',
      stravaId,
      stravaType: activity.type,
      completedAt: new Date(activity.start_date),
      actualDuration: activity.moving_time,
      actualDistance: activity.distance,
      avgHeartRate: activity.average_heartrate,
      maxHeartRate: activity.max_heartrate,
      calories: activity.calories,
      workoutStructure: completeStructure as any,
      classificationConfidence: classification?.confidence,
      humanReadable: classification?.human_readable
    },
  });

  console.log(`Synced activity "${activity.name}" with label: ${label}${classification ? ` (${classification.human_readable})` : ''}`);
  return {
    created: true,
    label,
    workoutType: classification?.workout_type
  };
}

/**
 * Import initial activities from Strava (last N weeks)
 */
export async function importInitialActivities(
  userId: string,
  weeks: number = 4
): Promise<{ imported: number; skipped: number; activities: { title: string; label: string }[] }> {
  const now = new Date();
  const after = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

  console.log(`Importing Strava activities from ${after.toISOString()} to ${now.toISOString()}`);

  let imported = 0;
  let skipped = 0;
  const importedActivities: { title: string; label: string }[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const activities = await getActivities(userId, {
      page,
      perPage: 100,
      after,
    });

    if (activities.length === 0) {
      hasMore = false;
      break;
    }

    for (const activity of activities) {
      const result = await syncActivityToWorkout(userId, activity);
      if (result.created) {
        imported++;
        importedActivities.push({
          title: activity.name,
          label: result.label,
        });
      } else {
        skipped++;
      }
    }

    // If we got less than requested, no more pages
    if (activities.length < 100) {
      hasMore = false;
    } else {
      page++;
    }
  }

  console.log(`Import complete: ${imported} imported, ${skipped} skipped`);
  return { imported, skipped, activities: importedActivities };
}

/**
 * Disconnect Strava for user
 */
export async function disconnectStrava(userId: string): Promise<void> {
  await prisma.stravaToken.delete({
    where: { userId },
  });
}

/**
 * Get activity laps/splits from Strava
 */
export async function getActivityLaps(
  userId: string,
  activityId: number
): Promise<StravaLap[]> {
  const accessToken = await getValidToken(userId);

  try {
    const response = await axios.get(
      `${STRAVA_API_BASE}/activities/${activityId}/laps`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Strava get activity laps error:', error);
    throw new Error('Failed to fetch Strava activity laps');
  }
}
