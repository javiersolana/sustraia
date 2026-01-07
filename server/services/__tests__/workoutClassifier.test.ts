/**
 * WORKOUT CLASSIFIER TESTS
 *
 * Test suite with 15 diverse real-world scenarios covering:
 * - Series (equal distances, pyramids, mixed)
 * - Tempo runs
 * - Easy/long runs
 * - Hill repeats
 * - Progressive runs
 * - Fartlek
 * - Edge cases
 */

import { describe, test, expect } from 'vitest';
import { classifyWorkout, StravaDetailedActivity, StravaSplit, WorkoutType } from '../workoutClassifier';

// Helper to create mock splits
function createSplits(paces: number[], elevations?: number[]): StravaSplit[] {
  return paces.map((paceMinPerKm, i) => {
    const speedMs = 1000 / (paceMinPerKm * 60); // Convert pace to m/s
    return {
      distance: 1000,
      moving_time: Math.round(paceMinPerKm * 60),
      elapsed_time: Math.round(paceMinPerKm * 60),
      average_speed: speedMs,
      elevation_difference: elevations ? elevations[i] : 0
    };
  });
}

// Helper to create activity
function createActivity(
  distance: number,
  movingTime: number,
  splits?: StravaSplit[],
  laps?: any[],
  elevation?: number
): StravaDetailedActivity {
  return {
    id: 1,
    name: 'Test Run',
    type: 'Run',
    distance,
    moving_time: movingTime,
    elapsed_time: movingTime,
    total_elevation_gain: elevation,
    average_speed: distance / movingTime,
    splits_metric: splits,
    laps
  };
}

describe('Workout Classifier - Series Detection', () => {
  test('Case 1: Classic 10x400m intervals with equal rest', () => {
    const laps = Array(10).fill(null).map(() => ({
      distance: 400,
      moving_time: 90,    // 1:30/400m = 3:45/km
      elapsed_time: 180,  // 90s rest
      average_speed: 400 / 90,
      total_elevation_gain: 0
    }));

    const activity = createActivity(4000, 900, undefined, laps);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('SERIES');
    expect(result.confidence).toBe('high');
    expect(result.human_readable).toContain('10x400m');
  });

  test('Case 2: Pyramid 400-800-1200-800-400', () => {
    const laps = [
      { distance: 400, moving_time: 92, elapsed_time: 182, average_speed: 400 / 92, total_elevation_gain: 0 },
      { distance: 800, moving_time: 195, elapsed_time: 285, average_speed: 800 / 195, total_elevation_gain: 0 },
      { distance: 1200, moving_time: 305, elapsed_time: 395, average_speed: 1200 / 305, total_elevation_gain: 0 },
      { distance: 800, moving_time: 198, elapsed_time: 288, average_speed: 800 / 198, total_elevation_gain: 0 },
      { distance: 400, moving_time: 94, elapsed_time: 184, average_speed: 400 / 94, total_elevation_gain: 0 }
    ];

    const activity = createActivity(3600, 884, undefined, laps);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('SERIES');
    expect(result.confidence).toBe('high');
    expect(result.human_readable).toContain('Pirámide');
  });

  test('Case 3: Series without laps (GPS detects rest)', () => {
    // Pattern: fast-slow-fast-slow-fast-slow
    const paces = [5.0, 4.2, 7.5, 4.1, 7.8, 4.3, 7.2, 4.0, 5.1];
    const splits = createSplits(paces);

    const activity = createActivity(9000, 2700, splits);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('SERIES');
    expect(result.confidence).toBe('medium');
  });

  test('Case 4: Mixed intervals (different distances)', () => {
    const laps = [
      { distance: 600, moving_time: 135, elapsed_time: 225, average_speed: 600 / 135, total_elevation_gain: 0 },
      { distance: 1000, moving_time: 240, elapsed_time: 330, average_speed: 1000 / 240, total_elevation_gain: 0 },
      { distance: 400, moving_time: 88, elapsed_time: 178, average_speed: 400 / 88, total_elevation_gain: 0 },
      { distance: 800, moving_time: 190, elapsed_time: 280, average_speed: 800 / 190, total_elevation_gain: 0 }
    ];

    const activity = createActivity(2800, 653, undefined, laps);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('SERIES');
    expect(result.confidence).toBe('medium');
  });
});

describe('Workout Classifier - Tempo & Sustained Efforts', () => {
  test('Case 5: Classic tempo with warm-up and cool-down', () => {
    // Warm-up (2km slow) + Tempo (6km fast) + Cool-down (2km slow)
    const paces = [5.5, 5.3, 4.2, 4.1, 4.2, 4.1, 4.2, 4.1, 5.4, 5.5];
    const splits = createSplits(paces);

    const activity = createActivity(10000, 2760, splits);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('TEMPO');
    expect(result.confidence).toBe('high');
    expect(result.structure.warmup).toBeDefined();
    expect(result.structure.cooldown).toBeDefined();
  });

  test('Case 6: Sustained tempo without structure', () => {
    // All at tempo pace, no warm-up/cool-down
    const paces = [4.1, 4.0, 4.1, 4.0, 4.1, 4.0];
    const splits = createSplits(paces);

    const activity = createActivity(6000, 1470, splits);
    const result = classifyWorkout(activity);

    // Could be RODAJE or TEMPO depending on CV
    expect(['RODAJE', 'TEMPO']).toContain(result.workout_type);
    expect(result.confidence).toBe('high');
  });
});

describe('Workout Classifier - Easy & Long Runs', () => {
  test('Case 7: Short easy run (5km)', () => {
    const paces = [5.2, 5.1, 5.2, 5.1, 5.2];
    const splits = createSplits(paces);

    const activity = createActivity(5000, 1560, splits);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('RODAJE');
    expect(result.confidence).toBe('high');
    expect(result.human_readable).toContain('rodaje');
  });

  test('Case 8: Long run (20km)', () => {
    const paces = Array(20).fill(5.3); // Very consistent 5:18/km
    const splits = createSplits(paces);

    const activity = createActivity(20000, 6360, splits);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('RODAJE');
    expect(result.confidence).toBe('high');
    expect(result.human_readable).toContain('rodaje largo');
  });

  test('Case 9: Medium run (12km)', () => {
    const paces = Array(12).fill(5.0);
    const splits = createSplits(paces);

    const activity = createActivity(12000, 3600, splits);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('RODAJE');
    expect(result.confidence).toBe('high');
  });
});

describe('Workout Classifier - Hills & Elevation', () => {
  test('Case 10: Hill repeats with laps', () => {
    const laps = Array(8).fill(null).map(() => ({
      distance: 300,
      moving_time: 90,
      elapsed_time: 200,  // 110s rest (downhill jog)
      average_speed: 300 / 90,
      total_elevation_gain: 25  // 25m uphill
    }));

    const activity = createActivity(2400, 720, undefined, laps, 200);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('CUESTAS');
    expect(result.confidence).toBe('high');
    expect(result.human_readable).toContain('cuestas');
  });

  test('Case 11: Trail run with lots of elevation (no laps)', () => {
    const paces = [5.5, 6.0, 6.5, 5.8, 6.2, 5.5, 6.0, 5.8];
    const elevations = [20, 25, 30, -15, 22, -10, 18, -20]; // Up-down pattern
    const splits = createSplits(paces, elevations);

    const activity = createActivity(8000, 2880, splits, undefined, 150);
    const result = classifyWorkout(activity);

    // High elevation/distance ratio should trigger detection
    expect(result.workout_type).toBe('CUESTAS');
    expect(result.confidence).toBe('medium');
  });
});

describe('Workout Classifier - Progressive & Variable Pace', () => {
  test('Case 12: Progressive run (negative split)', () => {
    // Start slow, gradually speed up
    const paces = [5.5, 5.3, 5.0, 4.8, 4.5, 4.3, 4.1, 4.0];
    const splits = createSplits(paces);

    const activity = createActivity(8000, 2376, splits);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('PROGRESIVO');
    expect(result.confidence).toBe('high');
    expect(result.human_readable).toContain('progresivo');
  });

  test('Case 13: Fartlek (random pace changes)', () => {
    // High variability without clear pattern
    const paces = [5.0, 4.2, 5.5, 3.8, 5.2, 4.5, 5.8, 4.0, 5.3, 4.3];
    const splits = createSplits(paces);

    const activity = createActivity(10000, 2940, splits);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('FARTLEK');
    expect(result.confidence).toBe('medium');
  });
});

describe('Workout Classifier - Edge Cases', () => {
  test('Case 14: Very short run (<1km)', () => {
    const paces = [4.5];
    const splits = createSplits(paces);
    splits[0].distance = 800;

    const activity = createActivity(800, 216, [splits[0]]);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('OTRO');
    expect(result.confidence).toBe('low');
  });

  test('Case 15: GPS noise (extremely variable)', () => {
    // Unrealistic pace jumps due to GPS errors
    const paces = [5.0, 2.0, 8.0, 3.5, 9.0, 4.0, 10.0, 3.0];
    const splits = createSplits(paces);

    const activity = createActivity(8000, 2880, splits);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('OTRO');
    expect(result.confidence).toBe('low');
    expect(result.human_readable).toContain('GPS');
  });

  test('Case 16: Beginner pace (6:30/km rodaje)', () => {
    // Test that classifier works for slower runners
    const paces = Array(8).fill(6.5);
    const splits = createSplits(paces);

    const activity = createActivity(8000, 3120, splits);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('RODAJE');
    expect(result.confidence).toBe('high');
  });

  test('Case 17: Elite pace (3:15/km rodaje)', () => {
    // Test that classifier works for fast runners
    const paces = Array(15).fill(3.25);
    const splits = createSplits(paces);

    const activity = createActivity(15000, 2925, splits);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('RODAJE');
    expect(result.confidence).toBe('high');
  });
});

describe('Workout Classifier - Real-world Mixed Scenarios', () => {
  test('Case 18: Tempo with only warmup (no cooldown)', () => {
    const paces = [5.5, 5.3, 4.1, 4.0, 4.1, 4.0, 4.1];
    const splits = createSplits(paces);

    const activity = createActivity(7000, 1890, splits);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('TEMPO');
    expect(result.structure.warmup).toBeDefined();
    expect(result.structure.cooldown).toBeUndefined();
  });

  test('Case 19: Series detected with minimal rest (15s)', () => {
    const laps = Array(6).fill(null).map(() => ({
      distance: 1000,
      moving_time: 240,   // 4:00/km
      elapsed_time: 255,  // Only 15s rest
      average_speed: 1000 / 240,
      total_elevation_gain: 0
    }));

    const activity = createActivity(6000, 1440, undefined, laps);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('SERIES');
    expect(result.confidence).toBe('high');
  });

  test('Case 20: Run without splits or laps (basic data only)', () => {
    const activity = createActivity(10000, 3000);
    const result = classifyWorkout(activity);

    expect(result.workout_type).toBe('RODAJE');
    expect(result.confidence).toBe('low');
    expect(result.human_readable).toContain('clasificación básica');
  });
});
