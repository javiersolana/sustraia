import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { classifyWorkout, StravaDetailedActivity } from '../server/services/workoutClassifier';

const prisma = new PrismaClient();
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const userId = 'cmjoiripb0000f1cu9fmid6l4'; // Javier Solana

    // Get Strava token
    const stravaToken = await prisma.stravaToken.findUnique({
        where: { userId }
    });

    if (!stravaToken) {
        console.log('No Strava token found for user');
        return;
    }

    const accessToken = stravaToken.accessToken;

    // Get all workouts without classification
    const workouts = await prisma.completedWorkout.findMany({
        where: {
            userId,
            stravaId: { not: null },
            humanReadable: null  // Simpler check - if no humanReadable, needs reclassification
        },
        orderBy: { completedAt: 'desc' }
    });

    console.log(`Found ${workouts.length} workouts to reclassify\n`);

    let success = 0;
    let failed = 0;

    for (const workout of workouts) {
        if (!workout.stravaId) continue;

        try {
            console.log(`Processing: ${workout.title}`);

            // Get activity details
            const activityResponse = await axios.get(
                `${STRAVA_API_BASE}/activities/${workout.stravaId}`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            const activity = activityResponse.data;

            // Get laps
            let laps = [];
            try {
                const lapsResponse = await axios.get(
                    `${STRAVA_API_BASE}/activities/${workout.stravaId}/laps`,
                    {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }
                );
                laps = lapsResponse.data.map((lap: any) => ({
                    distance: lap.distance,
                    moving_time: lap.moving_time,
                    elapsed_time: lap.elapsed_time,
                    average_speed: lap.average_speed,
                    total_elevation_gain: lap.total_elevation_gain
                }));
            } catch (e) {
                console.log('  No laps available');
            }

            // Build detailed activity
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
                })),
                laps: laps.length > 0 ? laps : undefined
            };

            // Classify
            const result = classifyWorkout(detailedActivity);

            console.log(`  → ${result.workout_type}: ${result.human_readable}`);

            // Update database
            const completeStructure = {
                classification: result.structure,
                rawData: {
                    splits: detailedActivity.splits_metric,
                    laps: detailedActivity.laps,
                    elevation: detailedActivity.total_elevation_gain
                }
            };

            await prisma.completedWorkout.update({
                where: { id: workout.id },
                data: {
                    label: result.workout_type,
                    workoutStructure: completeStructure as any,
                    humanReadable: result.human_readable,
                    classificationConfidence: result.confidence
                }
            });

            success++;

            // Rate limiting
            await sleep(200);

        } catch (error: any) {
            console.log(`  ❌ Error: ${error.response?.data?.message || error.message}`);
            failed++;
        }
    }

    console.log(`\n✅ Reclassification complete: ${success} success, ${failed} failed`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
