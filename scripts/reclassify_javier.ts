import { PrismaClient } from '@prisma/client';
import { getDetailedActivity } from '../server/services/stravaService';
import { classifyWorkout } from '../server/services/workoutClassifier';
import { calculateHRZones } from '../server/services/hrZonesService';
import { getAthleteHistoricalStats } from '../server/services/athleteHistoryService';

// We can't easily import the singleton if it's not exported in a way that works with ts-node relative paths easily without aliases
// But we can just use a new instance for this script
const prisma = new PrismaClient();

function mapWorkoutTypeToLabel(workoutType: string) {
    const mapping: any = {
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

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: 'Javier Solana' }, // Adjust if name is different
    });

    if (!user) {
        console.error('User Javier Solana not found');
        return;
    }

    console.log(`Found user: ${user.name} (${user.id})`);

    // Check Strava Token
    const token = await prisma.stravaToken.findUnique({ where: { userId: user.id } });
    if (!token) {
        console.error('No Strava token found for user');
        return;
    }

    const workouts = await prisma.completedWorkout.findMany({
        where: {
            userId: user.id,
            stravaId: { not: null }
        },
        orderBy: { completedAt: 'desc' },
        take: 50 // Reclassify last 50
    });

    console.log(`Found ${workouts.length} workouts to reclassify.`);

    // Context
    const hrZones = calculateHRZones(user.birthDate, user.maxHeartRate, user.restingHR);
    const historyStats = await getAthleteHistoricalStats(user.id);
    const context = { hrZones, athleteStats: historyStats || undefined };

    let changedCount = 0;

    for (const workout of workouts) {
        if (!workout.stravaId) continue;

        try {
            // Detailed activity is needed for accurate classification
            // We use the service function which handles token refresh
            const detailedActivity = await getDetailedActivity(user.id, parseInt(workout.stravaId));

            const classification = classifyWorkout(detailedActivity, context);
            const newLabel = mapWorkoutTypeToLabel(classification.workout_type);

            if (newLabel !== workout.label) {
                console.log(`[CHANGE] ${workout.title} (${workout.completedAt.toISOString().split('T')[0]})`);
                console.log(`   was: ${workout.label}, now: ${newLabel} (${classification.human_readable})`);
                changedCount++;

                // Update DB
                await prisma.completedWorkout.update({
                    where: { id: workout.id },
                    data: {
                        label: newLabel as any,
                        humanReadable: classification.human_readable,
                        classificationConfidence: classification.confidence,
                        workoutStructure: {
                            classification: classification.structure,
                            rawData: {
                                splits: detailedActivity.splits_metric,
                                laps: detailedActivity.laps,
                                // @ts-ignore
                                elevation: detailedActivity.total_elevation_gain
                            }
                        } as any
                    }
                });
            } else {
                console.log(`[skip] ${workout.title} -> ${newLabel} (Unchanged)`);
            }

            // Rate limit
            await new Promise(r => setTimeout(r, 1000));

        } catch (e: any) {
            console.error(`Failed to process ${workout.title}: ${e.message}`);
        }
    }

    console.log(`Finished. Changed ${changedCount} workouts.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
