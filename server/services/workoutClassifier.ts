/**
 * INTELLIGENT WORKOUT CLASSIFIER
 *
 * Classifies running workouts based on RELATIVE PATTERNS within the activity,
 * not absolute pace thresholds. Works for beginners (6:00/km) and elites (3:30/km).
 *
 * Detection strategy:
 * 1. Specific 1km Laps Analysis (Zones-based)
 * 2. Series/Interval Structure Analysis (Warmup - Main - Cooldown)
 * 3. Fallback to basic RODAJE
 *
 * NOTE: Strictly uses LAPS (vueltas) for classification.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type WorkoutType =
  | 'SERIES'
  | 'TEMPO'
  | 'RODAJE'
  | 'CUESTAS'
  | 'RECUPERACION'
  | 'PROGRESIVO'
  | 'FARTLEK'
  | 'COMPETICION'
  | 'OTRO';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface StravaSplit {
  distance: number;           // meters
  moving_time: number;        // seconds
  elapsed_time: number;       // seconds
  average_speed: number;      // m/s
  elevation_difference?: number; // meters
}

export interface StravaLap {
  distance: number;           // meters
  moving_time: number;        // seconds
  elapsed_time: number;       // seconds
  average_speed: number;      // m/s
  total_elevation_gain?: number; // meters
  average_heartrate?: number; // bpm
  max_heartrate?: number;     // bpm
}

export interface StravaDetailedActivity {
  id: number;
  name: string;
  type: string;
  distance: number;           // meters
  moving_time: number;        // seconds
  elapsed_time: number;       // seconds
  total_elevation_gain?: number; // meters
  average_speed?: number;     // m/s
  average_heartrate?: number; // bpm
  max_heartrate?: number;     // bpm
  splits_metric?: StravaSplit[];
  laps?: StravaLap[];
}

interface WarmupCooldown {
  distance_m: number;
  time_s: number;
  avg_pace_per_km: number;
}

interface MainSetDetails {
  type: 'intervals' | 'sustained' | 'continuous' | 'variable';
  description: string;
  distance_m: number;
  time_s: number;
  avg_pace_per_km: number;
}

interface WorkoutStructure {
  warmup?: WarmupCooldown;
  main: MainSetDetails;
  cooldown?: WarmupCooldown;
}

export interface ClassificationResult {
  workout_type: WorkoutType;
  structure: WorkoutStructure;
  confidence: ConfidenceLevel;
  human_readable: string;
}

// Context for personalized classification
export interface ClassificationContext {
  hrZones?: {
    z1: { min: number; max: number };
    z2: { min: number; max: number };
    z3: { min: number; max: number };
    z4: { min: number; max: number };
    z5: { min: number; max: number };
  };
  athleteStats?: {
    avgEasyPace: number;     // sec/km
    avgCompetitionPace: number;
    avgEasyHR: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert m/s to min/km pace
 */
function speedToPace(speedMs: number): number {
  if (speedMs === 0) return 999;
  return (1000 / speedMs) / 60; // min/km
}

/**
 * Convert pace min/km to seconds/km
 */
function paceToSeconds(paceMinPerKm: number): number {
  return paceMinPerKm * 60;
}

/**
 * Calculate mean of array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Detect if distances in array are approximately equal (±10%)
 */
function areDistancesEqual(distances: number[], tolerance: number = 0.1): boolean {
  if (distances.length < 2) return false;

  const avg = mean(distances);
  const threshold = avg * tolerance;

  return distances.every(d => Math.abs(d - avg) <= threshold);
}

/**
 * Format pace for human reading (min:sec/km)
 */
function formatPace(paceMinPerKm: number): string {
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

/**
 * Format distance for human reading
 */
function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  const km = meters / 1000;
  return `${km.toFixed(km >= 10 ? 0 : 1)}km`;
}

// ============================================================================
// 1KM LAP LOGIC
// ============================================================================

/**
 * Check if the workout consists of standard 1km laps
 */
function classifyGeneric1kmLaps(
  activity: StravaDetailedActivity,
  laps: StravaLap[],
  context?: ClassificationContext
): ClassificationResult | null {
  if (!laps || laps.length === 0) return null;
  if (!context?.hrZones) return null; // We need HR zones for this specific logic

  // Check if all laps are ~1km (allow 2% error: 980m - 1020m)
  // We can ignore the very last lap if it's short (remainder)
  const mainLaps = laps.slice(0, laps.length - 1);
  const allLapsDistance = laps.length > 0 ? laps[0].distance : 0;

  // If only 1 lap, check if it's ~1km but usually 'runs' are longer.
  // Assuming a run is > 1km.

  // Strict 1km check for ALL laps except maybe the last one
  // If we have just 2 laps, we check the first one.
  // If we have 10 laps, first 9 must be 1km.

  if (laps.length < 2) return null; // Need at least 2 laps to establish a "1km lap pattern"

  const lapsToCheck = laps.slice(0, Math.max(1, laps.length - 1));
  const is1kmLaps = lapsToCheck.every(l => l.distance >= 980 && l.distance <= 1020);

  if (!is1kmLaps) return null;

  // Calculate HR stats
  const avgHR = activity.average_heartrate || 0;
  const maxHR = activity.max_heartrate || 0;
  const avgPace = speedToPace(activity.average_speed || 0);

  // CLASSIFICATION LOGIC
  const { z1, z2, z3, z4, z5 } = context.hrZones;

  // RODAJE: Avg and Max mainly in Z1-Z3
  // Allow brief excursions, but Avg should be definitely < Z4 min
  // Using Z3 max as boundary for Rodaje.
  if (avgHR <= z3.max) {
    return {
      workout_type: 'RODAJE',
      structure: {
        main: {
          type: 'continuous',
          description: 'Rodaje continuo',
          distance_m: activity.distance,
          time_s: activity.moving_time,
          avg_pace_per_km: avgPace
        }
      },
      confidence: 'high',
      human_readable: `Rodaje @ ${formatPace(avgPace)} (FC ${Math.round(avgHR)})`
    };
  }

  // TEMPO: Avg in Z3-Z4, can touch Z5
  // If Avg is in Z3 (upper end) or Z4
  // Tempo is harder than Rodaje but not Max.
  const isZ4 = avgHR >= z4.min && avgHR <= z4.max;
  const isHighZ3 = avgHR >= z3.min && avgHR <= z3.max; // Could be 'Tempo' if user defines it so, but logic says z3-z4.
  const isZ5 = avgHR >= z5.min;

  // Logic from prompt:
  // TEMPO: Si el pulso medio está entre Zona 3 y Zona 4 (pudiendo tocar la Zona 5 puntualmente).
  // COMPETICIÓN: Si la gran mayoría del tiempo el pulso está en Zona 5.

  if (!isZ5) {
    // If avg is Z3 or Z4 (and not Z1/Z2 because check above failed for <= Z3.max, wait... <= Z3.max catchs Z3)
    // Wait, prompt says: "RODAJE: Si el pulso medio y máximo se mantienen principalmente entre Zona 1 y Zona 3."
    // "TEMPO: Si el pulso medio está entre Zona 3 y Zona 4"
    // Overlap on Zone 3?
    // Let's restart the logic slightly to be precise.

    // Rodaje <= Z3 (mostly). Let's say Avg HR < Z3.Max
    // Tempo > Z3.Max and < Z5.Min? Or Avg is in Z3/Z4.

    // Let's use strict boundaries based on Avg HR
    if (avgHR < z3.max) {
      // Covered by first check? Prompt says "Zone 1 and Zone 3".
      // Assuming Z1..Z3 means <= Z3 Max.
      // If MaxHR touches Z4/Z5 significantly, maybe not Rodaje?
      // Prompt says "pulso medio y maximo se mantienen PRINCIPALMENTE entre Z1 y Z3".
      // So if Max HR > Z4.Min significantly, might be Tempo?
      // But let's stick to Avg HR as primary driver for simplicity as per 1km logic description (Avg HR is usually the key metrics for these steady runs).

      // Return RODAJE was correct.
    }

    // Tempo
    return {
      workout_type: 'TEMPO',
      structure: {
        main: {
          type: 'sustained',
          description: 'Tempo sostenido',
          distance_m: activity.distance,
          time_s: activity.moving_time,
          avg_pace_per_km: avgPace
        }
      },
      confidence: 'high',
      human_readable: `Tempo @ ${formatPace(avgPace)} (FC ${Math.round(avgHR)})`
    };
  }

  // COMPETICIÓN: Avg HR in Z5
  if (isZ5) {
    return {
      workout_type: 'COMPETICION',
      structure: {
        main: {
          type: 'sustained',
          description: 'Esfuerzo máximo / Competición',
          distance_m: activity.distance,
          time_s: activity.moving_time,
          avg_pace_per_km: avgPace
        }
      },
      confidence: 'high',
      human_readable: `Competición @ ${formatPace(avgPace)} (FC Z5)`
    };
  }

  return null;
}

// ============================================================================
// SERIES / INTERVALS DETECTION (LAPS)
// ============================================================================

interface LapPhase {
  index: number;
  type: 'warmup' | 'main' | 'cooldown';
  lap: StravaLap;
  pace: number;
}

/**
 * Identify phases: Warmup -> Main Block -> Cooldown
 * Improved logic using Pace Reference of Fastest Laps + Backwards Scan for Cooldown
 */
function identifyPhases(laps: StravaLap[]): LapPhase[] {
  if (laps.length < 2) {
    // Too few laps to have w/m/c structure, treat all as main
    return laps.map((l, i) => ({ index: i, type: 'main', lap: l, pace: speedToPace(l.average_speed) }));
  }

  const lapData = laps.map((l, i) => ({
    index: i,
    lap: l,
    pace: speedToPace(l.average_speed), // min/km
  }));

  // 1. Calculate Reference Work Pace
  // Use laps > 100m and > 15s to ignore "junk" laps from averages
  const validLaps = lapData.filter(l => l.lap.distance > 100 && l.lap.moving_time > 15);

  if (validLaps.length === 0) {
    return lapData.map(l => ({ ...l, type: 'main' }));
  }

  const sortedPaces = [...validLaps].sort((a, b) => a.pace - b.pace);
  // Take fastest 25% (or at least 1 lap)
  const numFastest = Math.max(1, Math.floor(validLaps.length * 0.25));
  const fastestLaps = sortedPaces.slice(0, numFastest);
  const refWorkPace = mean(fastestLaps.map(l => l.pace));

  // Thresholds
  // Warmup/Cooldown usually significantly slower (> 25-30% slower)
  // But let's use a slightly more conservative threshold to catch easy jogs
  const slowThreshold = refWorkPace * 1.25;

  // 2. DETECT COOLDOWN (Backwards Scan)
  // Iterate from end. Stop at first "Fast" lap.
  // A lap is Cooldown if:
  // - It is "Slow" (pace > threshold)
  // - OR It is "Long (>1km)" and relatively slow? User said: "If >1km and slow -> 100% cooldown"

  let cooldownStartIndex = laps.length; // Default: No cooldown

  for (let i = laps.length - 1; i >= 0; i--) {
    const lap = lapData[i];

    // Check if this lap belongs to the "Action"
    // It belongs to action if its pace is close to refWorkPace
    const isFast = lap.pace <= slowThreshold;

    if (isFast) {
      // Found the end of the main block
      break;
    } else {
      // This is likely cooldown
      cooldownStartIndex = i;
    }
  }

  // 3. DETECT WARMUP (Forward Scan)
  // Must end before Cooldown starts
  let warmupEndIndex = -1; // Default: No warmup phase index (so start at 0)

  for (let i = 0; i < cooldownStartIndex; i++) {
    const lap = lapData[i];

    // It is warmup if it is slow
    const isSlow = lap.pace > slowThreshold;

    if (!isSlow) {
      // Found the start of the main block
      break;
    } else {
      warmupEndIndex = i;
    }
  }

  // 4. Assign Types
  return lapData.map(l => {
    let type: 'warmup' | 'main' | 'cooldown' = 'main';
    if (l.index <= warmupEndIndex) type = 'warmup';
    else if (l.index >= cooldownStartIndex) type = 'cooldown';
    return { ...l, type };
  });
}

function classifyByLapsStructure(
  activity: StravaDetailedActivity,
  laps: StravaLap[],
  context?: ClassificationContext
): ClassificationResult | null {
  const phases = identifyPhases(laps);

  const mainLaps = phases.filter(p => p.type === 'main');
  const warmupLaps = phases.filter(p => p.type === 'warmup');
  const cooldownLaps = phases.filter(p => p.type === 'cooldown');

  if (mainLaps.length === 0) {
    return null;
  }

  // RE-CALCULATE Stats for Main Block only
  const mainPaces = mainLaps.map(l => l.pace);
  const sortedMainPaces = [...mainPaces].sort((a, b) => a - b);
  // Median pace of main block
  const medianMainPace = sortedMainPaces[Math.floor(sortedMainPaces.length / 2)];

  // Refined Work vs Recovery logic inside Main Block
  // Recovery is significantly slower than Work Paces.
  // If the Main Block is "Tempo", everything is roughly same pace.
  // If "Series", we have Fast (Work) and Slow (Recovery).

  // Let's define "Work" as anything faster than median * 1.05 (allowing 5% variance)
  // Recovery is slower laps.

  // NOTE: In variable fartlek, median might be tricky. 
  // Let's use the fastest laps of the main block as anchor.
  const top25MainPace = mean(sortedMainPaces.slice(0, Math.max(1, Math.floor(sortedMainPaces.length * 0.25))));
  const recoveryThreshold = top25MainPace * 1.20; // 20% slower than fast laps

  const startMainIndex = mainLaps[0].index;
  const endMainIndex = mainLaps[mainLaps.length - 1].index;

  // ANALYZE PATTERN: Check for Alternation
  // We want to see transitions from Work -> Recovery -> Work
  let transitions = 0;
  let workLapsCount = 0;

  // Classify each main lap temporarily as Work vs Recovery
  const classifiedMainLaps = mainLaps.map(l => {
    // Junk lap handling for type detection? 
    // If very short and slow -> Recovery
    const isJunk = l.lap.distance < 100 || l.lap.moving_time < 15;

    // Recovery if: Slow OR (Short AND Slowish)
    // Actually, short rest intervals (e.g. 1 min standing) might be 0 distance? Strava laps usually have some distance.
    // If pace is very slow, it's recovery.
    const isSlow = l.pace > recoveryThreshold;

    return {
      ...l,
      isRecovery: isSlow || (isJunk && isSlow), // If junk and super fast (GPS glitch), don't count as recovery? assume glitch is slow/stopped
    };
  });

  // Count transitions (Work -> Recovery or Recovery -> Work)
  for (let i = 0; i < classifiedMainLaps.length - 1; i++) {
    if (classifiedMainLaps[i].isRecovery !== classifiedMainLaps[i + 1].isRecovery) {
      transitions++;
    }
  }

  const workSegments = classifiedMainLaps.filter(l => !l.isRecovery);
  workLapsCount = workSegments.length;

  const avgWorkPace = workSegments.length > 0 ? mean(workSegments.map(s => s.pace)) : medianMainPace;
  const avgWorkDistance = workSegments.length > 0 ? mean(workSegments.map(s => s.lap.distance)) : 0;

  // CLASSIFICATION DECISION

  // 1. SERIES / FARTLEK: MUST have Alternating structure (Transitions >= 2)
  if (workLapsCount >= 2 && transitions >= 2) {
    // Series confirmed by structure
    return {
      workout_type: 'SERIES',
      structure: {
        warmup: warmupLaps.length > 0 ? {
          distance_m: warmupLaps.reduce((s, l) => s + l.lap.distance, 0),
          time_s: warmupLaps.reduce((s, l) => s + l.lap.moving_time, 0),
          avg_pace_per_km: mean(warmupLaps.map(l => l.pace))
        } : undefined,
        main: {
          type: 'intervals',
          description: `${workLapsCount} intervalos (+recuperaciones)`,
          distance_m: mainLaps.reduce((s, l) => s + l.lap.distance, 0),
          time_s: mainLaps.reduce((s, l) => s + l.lap.moving_time, 0),
          avg_pace_per_km: avgWorkPace
        },
        cooldown: cooldownLaps.length > 0 ? {
          distance_m: cooldownLaps.reduce((s, l) => s + l.lap.distance, 0),
          time_s: cooldownLaps.reduce((s, l) => s + l.lap.moving_time, 0),
          avg_pace_per_km: mean(cooldownLaps.map(l => l.pace))
        } : undefined
      },
      confidence: 'high',
      human_readable: `${workLapsCount} series @ ${formatPace(avgWorkPace)}`
    };
  }

  // 2. TEMPO (Sustained effort)
  // If distinct phases detected (Warmup/Cooldown) but Main Block has NO transitions (steady fast)
  if (warmupLaps.length > 0 || cooldownLaps.length > 0) {
    if (transitions < 2) {
      // It's a structured run, but steady main block.
      // Likely TEMPO.
      return {
        workout_type: 'TEMPO',
        structure: {
          main: {
            type: 'sustained',
            description: 'Bloque tempo sostenido',
            distance_m: mainLaps.reduce((s, l) => s + l.lap.distance, 0),
            time_s: mainLaps.reduce((s, l) => s + l.lap.moving_time, 0),
            avg_pace_per_km: medianMainPace
          }
        },
        confidence: 'medium',
        human_readable: `Tempo @ ${formatPace(medianMainPace)}`
      };
    }
  }

  // 3. Fallback for Manual Laps Series without explicit recovery (Transitions < 2 but multiple laps?)
  // If we are here, Transitions < 2 (OR work < 2, but work likely >=2 if laps exist).
  // If Phases exist, we returned TEMPO above.
  // If NO phases (just one block), and Transitions < 2 -> It's just a run (Rodaje).

  if (workLapsCount >= 2 && transitions >= 2) {
    return {
      workout_type: 'SERIES',
      structure: {
        main: {
          type: 'intervals',
          description: `${workLapsCount} series (Fartlek)`,
          distance_m: mainLaps.reduce((s, l) => s + l.lap.distance, 0),
          time_s: mainLaps.reduce((s, l) => s + l.lap.moving_time, 0),
          avg_pace_per_km: avgWorkPace
        }
      },
      confidence: 'medium',
      human_readable: `Fartlek/Series @ ${formatPace(avgWorkPace)}`
    };
  }

  return null;
}

// ============================================================================
// MAIN CLASSIFICATION FUNCTION
// ============================================================================

/**
 * Classify workout using new simplified Logic
 */
export function classifyWorkout(
  activity: StravaDetailedActivity,
  classificationContext?: ClassificationContext
): ClassificationResult {

  // 1. Check for Laps
  const hasLaps = activity.laps && activity.laps.length > 0;

  if (hasLaps) {
    // 1.1 Specific 1km Laps Logic
    const km1Result = classifyGeneric1kmLaps(activity, activity.laps!, classificationContext);
    if (km1Result) return km1Result;

    // 1.2 Series Structure Analysis
    const structureResult = classifyByLapsStructure(activity, activity.laps!, classificationContext);
    if (structureResult) return structureResult;
  }

  // 1.3 Check for Trails/Hills via Elevation
  const elevRatio = (activity.total_elevation_gain || 0) / (Math.max(1, activity.distance / 1000));
  if (elevRatio > 25) {
    return {
      workout_type: 'CUESTAS',
      structure: {
        main: {
          type: 'continuous',
          description: 'Desnivel significativo',
          distance_m: activity.distance,
          time_s: activity.moving_time,
          avg_pace_per_km: speedToPace(activity.average_speed || 0)
        }
      },
      confidence: 'medium',
      human_readable: `Rodaje con desnivel (+${Math.round(activity.total_elevation_gain || 0)}m)`
    };
  }

  // 2. Fallback: RODAJE
  const avgPace = speedToPace(activity.average_speed || activity.distance / activity.moving_time);

  return {
    workout_type: 'RODAJE',
    structure: {
      main: {
        type: 'continuous',
        description: 'Rodaje base',
        distance_m: activity.distance,
        time_s: activity.moving_time,
        avg_pace_per_km: avgPace
      }
    },
    confidence: 'low',
    human_readable: `${formatDistance(activity.distance)} rodaje @ ${formatPace(avgPace)}`
  };
}
