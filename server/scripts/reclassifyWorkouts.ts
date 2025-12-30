/**
 * Script to reclassify existing workouts that don't have classification data
 *
 * Usage: npx ts-node server/scripts/reclassifyWorkouts.ts [userId]
 */

import { prisma } from '../config/prisma';
import { getDetailedActivity } from '../services/stravaService';
import { classifyWorkout, WorkoutType, ClassificationContext } from '../services/workoutClassifier';
import { calculateHRZones } from '../services/hrZonesService';
import { getAthleteHistoricalStats } from '../services/athleteHistoryService';

type WorkoutLabelType = 'CALENTAMIENTO' | 'DESCALENTAMIENTO' | 'FUERZA' | 'SERIES' | 'TEMPO' | 'RODAJE' | 'CUESTAS' | 'RECUPERACION' | 'PROGRESIVO' | 'FARTLEK' | 'COMPETICION' | 'OTRO';

/**
 * Map WorkoutType from classifier to WorkoutLabel enum
 */
function mapWorkoutTypeToLabel(workoutType: WorkoutType): WorkoutLabelType {
  const mapping: Record<WorkoutType, WorkoutLabelType> = {
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

async function reclassifyWorkouts(userId?: string) {
  console.log('🔄 Starting reclassification process...\n');

  // Find workouts without classification
  const whereClause: any = {
    stravaId: { not: null },
    // Simplified check to avoid Prisma JSON null errors
    humanReadable: null
  };

  if (userId) {
    whereClause.userId = userId;
    console.log(`👤 Filtering by user: ${userId}\n`);
  }

  const workouts = await prisma.completedWorkout.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true, email: true, birthDate: true, maxHeartRate: true, restingHR: true }
      }
    },
    orderBy: { completedAt: 'desc' }
  });

  console.log(`📋 Found ${workouts.length} workouts to reclassify\n`);

  if (workouts.length === 0) {
    console.log('✅ All workouts are already classified!');
    return;
  }

  let success = 0;
  let failed = 0;

  for (const workout of workouts) {
    try {
      if (!workout.stravaId) {
        console.log(`⏭️  Skipping "${workout.title}" - no Strava ID`);
        failed++;
        continue;
      }

      console.log(`\n🔍 Processing: ${workout.title || 'Untitled'}`);
      console.log(`   Date: ${workout.completedAt.toLocaleDateString()}`);
      console.log(`   User: ${workout.user.name} (${workout.user.email})`);
      console.log(`   Strava ID: ${workout.stravaId}`);

      // Get detailed activity from Strava
      const detailedActivity = await getDetailedActivity(
        workout.userId,
        parseInt(workout.stravaId)
      );

      console.log(`   📊 Splits: ${detailedActivity.splits_metric?.length || 0}`);
      console.log(`   🏁 Laps: ${detailedActivity.laps?.length || 0}`);

      // Prepare classification context
      const hrZones = calculateHRZones(
        workout.user.birthDate,
        workout.user.maxHeartRate,
        workout.user.restingHR
      );

      const historyStats = await getAthleteHistoricalStats(workout.userId);

      const context: ClassificationContext = {
        hrZones,
        athleteStats: historyStats || undefined
      };

      if (workout.user.birthDate) {
        console.log(`   👤 Personalización activada (Edad: ${new Date().getFullYear() - workout.user.birthDate.getFullYear()})`);
      }

      // Classify
      const classification = classifyWorkout(detailedActivity, context);
      const label = mapWorkoutTypeToLabel(classification.workout_type);

      console.log(`   ✅ Classified as: ${classification.workout_type}`);
      console.log(`   📝 Description: ${classification.human_readable}`);
      console.log(`   🎯 Confidence: ${classification.confidence}`);

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

      console.log(`   💾 Saved to database`);
      success++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n🎉 Reclassification complete!`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${workouts.length}\n`);
}

// Run script
const userId = process.argv[2]; // Optional user ID argument

reclassifyWorkouts(userId)
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
