import axios from 'axios';
import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { classifyWorkout, WorkoutLabelType } from './labelClassifier';

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
 * Sync single Strava activity to completed workout with label classification
 */
export async function syncActivityToWorkout(
  userId: string,
  activity: StravaActivity,
  workoutId?: string
): Promise<{ created: boolean; label: WorkoutLabelType }> {
  const stravaId = activity.id.toString();

  // Check if already synced
  const existing = await prisma.completedWorkout.findUnique({
    where: { stravaId },
  });

  if (existing) {
    console.log(`Activity ${activity.id} already synced`);
    return { created: false, label: existing.label as WorkoutLabelType };
  }

  // Classify the workout based on title
  const label = classifyWorkout(activity.name);

  // Create completed workout
  await prisma.completedWorkout.create({
    data: {
      userId,
      workoutId: workoutId || null,
      title: activity.name,
      label,
      stravaId,
      stravaType: activity.type,
      completedAt: new Date(activity.start_date),
      actualDuration: activity.moving_time,
      actualDistance: activity.distance,
      avgHeartRate: activity.average_heartrate,
      maxHeartRate: activity.max_heartrate,
      calories: activity.calories,
    },
  });

  console.log(`Synced activity "${activity.name}" with label: ${label}`);
  return { created: true, label };
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

