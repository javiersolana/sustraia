import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { classifyWorkout, StravaDetailedActivity, StravaLap, StravaSplit } from '../server/services/workoutClassifier';

const prisma = new PrismaClient();
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

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

    // Get the 2x10' workout
    const workout = await prisma.completedWorkout.findFirst({
        where: {
            userId,
            title: { contains: '2x10' }
        }
    });

    if (!workout || !workout.stravaId) {
        console.log('No 2x10 workout found');
        return;
    }

    console.log('=== Testing Classification for:', workout.title, '===\n');

    try {
        // Get activity details
        const activityResponse = await axios.get(
            `${STRAVA_API_BASE}/activities/${workout.stravaId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        const activity = activityResponse.data;

        // Get laps
        const lapsResponse = await axios.get(
            `${STRAVA_API_BASE}/activities/${workout.stravaId}/laps`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        const rawLaps = lapsResponse.data;

        // Build detailed activity for classifier
        const detailedActivity: StravaDetailedActivity = {
            id: activity.id,
            name: activity.name,
            type: activity.type,
            distance: activity.distance,
            moving_time: activity.moving_time,
            elapsed_time: activity.elapsed_time,
            total_elevation_gain: activity.total_elevation_gain,
            average_speed: activity.average_speed,
            splits_metric: activity.splits_metric?.map((split: any) => ({
                distance: split.distance,
                moving_time: split.moving_time,
                elapsed_time: split.elapsed_time,
                average_speed: split.average_speed,
                elevation_difference: split.elevation_difference
            })),
            laps: rawLaps.map((lap: any) => ({
                distance: lap.distance,
                moving_time: lap.moving_time,
                elapsed_time: lap.elapsed_time,
                average_speed: lap.average_speed,
                total_elevation_gain: lap.total_elevation_gain
            }))
        };

        console.log('Activity:', activity.name);
        console.log('Laps count:', detailedActivity.laps?.length);
        console.log('Splits count:', detailedActivity.splits_metric?.length);
        console.log('\n--- Running Classification ---\n');

        // Classify
        const result = classifyWorkout(detailedActivity);

        console.log('✅ CLASSIFICATION RESULT:');
        console.log('  Workout Type:', result.workout_type);
        console.log('  Confidence:', result.confidence);
        console.log('  Human Readable:', result.human_readable);
        console.log('\n  Structure:', JSON.stringify(result.structure, null, 4));

        // Update the workout in database
        console.log('\n--- Updating Database ---');

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

        console.log('✅ Database updated successfully!');

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
