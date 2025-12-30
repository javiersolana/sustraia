import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Strava API config
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

// Workout classifier (simplified version for testing)
type WorkoutType = 'SERIES' | 'TEMPO' | 'RODAJE' | 'CUESTAS' | 'RECUPERACION' | 'PROGRESIVO' | 'FARTLEK' | 'OTRO';

interface StravaLap {
    distance: number;
    moving_time: number;
    elapsed_time: number;
    average_speed: number;
    total_elevation_gain?: number;
}

interface StravaSplit {
    distance: number;
    moving_time: number;
    elapsed_time: number;
    average_speed: number;
    elevation_difference?: number;
}

function speedToPace(speedMs: number): number {
    if (speedMs === 0) return 999;
    return (1000 / speedMs) / 60; // min/km
}

function formatPace(paceMinPerKm: number): string {
    const minutes = Math.floor(paceMinPerKm);
    const seconds = Math.round((paceMinPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
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

    console.log('Found Strava token, expires at:', stravaToken.expiresAt);

    // Check if we need to refresh
    const now = new Date();
    let accessToken = stravaToken.accessToken;

    if (stravaToken.expiresAt < now) {
        console.log('Token expired, refreshing...');
        // Would need to refresh here
    }

    // Get the 2x10' workout
    const workout = await prisma.completedWorkout.findFirst({
        where: {
            userId,
            title: { contains: '2x10' }
        }
    });

    if (!workout) {
        console.log('No 2x10 workout found');
        return;
    }

    console.log('\n=== Workout Found ===');
    console.log('Title:', workout.title);
    console.log('Strava ID:', workout.stravaId);

    // Fetch detailed activity from Strava
    try {
        console.log('\n=== Fetching from Strava ===');

        // Get activity details
        const activityResponse = await axios.get(
            `${STRAVA_API_BASE}/activities/${workout.stravaId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        const activity = activityResponse.data;
        console.log('\nActivity name:', activity.name);
        console.log('Type:', activity.type);
        console.log('Distance:', (activity.distance / 1000).toFixed(2), 'km');
        console.log('Moving time:', Math.round(activity.moving_time / 60), 'min');
        console.log('Elevation gain:', activity.total_elevation_gain, 'm');

        // Check splits_metric
        console.log('\n=== Splits Metric (per km auto) ===');
        if (activity.splits_metric) {
            console.log('Number of splits:', activity.splits_metric.length);
            for (const split of activity.splits_metric) {
                const pace = speedToPace(split.average_speed);
                console.log(`  Split: ${(split.distance / 1000).toFixed(2)}km @ ${formatPace(pace)} (elevation: ${split.elevation_difference || 0}m)`);
            }
        } else {
            console.log('No splits_metric data');
        }

        // Get laps
        console.log('\n=== Laps (user-created) ===');
        const lapsResponse = await axios.get(
            `${STRAVA_API_BASE}/activities/${workout.stravaId}/laps`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        const laps: StravaLap[] = lapsResponse.data;
        console.log('Number of laps:', laps.length);

        for (let i = 0; i < laps.length; i++) {
            const lap = laps[i];
            const pace = speedToPace(lap.average_speed);
            const restTime = lap.elapsed_time - lap.moving_time;
            console.log(`  Lap ${i + 1}: ${(lap.distance / 1000).toFixed(2)}km @ ${formatPace(pace)} (rest: ${restTime}s, elapsed: ${lap.elapsed_time}s, moving: ${lap.moving_time}s)`);
        }

        // Analyze for classification
        console.log('\n=== Classification Analysis ===');

        // Check if laps have rest periods
        const restTimes = laps.map(l => l.elapsed_time - l.moving_time);
        const lapsWithRest = restTimes.filter(r => r > 15).length;
        console.log('Laps with >15s rest:', lapsWithRest, '/', laps.length);

        // Calculate pace variation
        const paces = (activity.splits_metric || []).map((s: StravaSplit) => speedToPace(s.average_speed));
        const avgPace = paces.reduce((a: number, b: number) => a + b, 0) / paces.length;
        const variance = paces.reduce((sum: number, p: number) => sum + Math.pow(p - avgPace, 2), 0) / paces.length;
        const cv = Math.sqrt(variance) / avgPace;
        console.log('Coefficient of Variation (CV):', cv.toFixed(3));
        console.log('  CV < 0.05 = Steady pace (RODAJE)');
        console.log('  CV > 0.12 = High variation (FARTLEK)');
        console.log('  Between = Variable');

        // Identify warmup/cooldown
        const sortedPaces = [...paces].sort((a, b) => a - b);
        const medianPace = sortedPaces[Math.floor(sortedPaces.length / 2)];
        console.log('\nMedian pace:', formatPace(medianPace));

        let warmupKms = 0;
        let cooldownKms = 0;
        for (let i = 0; i < Math.min(3, paces.length); i++) {
            if (paces[i] > medianPace * 1.15) {
                warmupKms++;
            } else break;
        }
        for (let i = paces.length - 1; i >= Math.max(0, paces.length - 3); i--) {
            if (paces[i] > medianPace * 1.15) {
                cooldownKms++;
            } else break;
        }
        console.log('Detected warmup km:', warmupKms);
        console.log('Detected cooldown km:', cooldownKms);

        // Main set analysis
        const mainSetPaces = paces.slice(warmupKms, paces.length - cooldownKms);
        console.log('\nMain set splits:', mainSetPaces.length);
        if (mainSetPaces.length > 0) {
            const mainAvg = mainSetPaces.reduce((a: number, b: number) => a + b, 0) / mainSetPaces.length;
            console.log('Main set average pace:', formatPace(mainAvg));
        }

    } catch (error: any) {
        console.error('\nError fetching from Strava:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.log('\nToken expired - need to refresh');
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
