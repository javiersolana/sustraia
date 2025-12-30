/**
 * INTELLIGENT WORKOUT CLASSIFIER
 *
 * Classifies running workouts based on RELATIVE PATTERNS within the activity,
 * not absolute pace thresholds. Works for beginners (6:00/km) and elites (3:30/km).
 *
 * Detection strategy:
 * 1. Analyze splits/laps structure
 * 2. Identify warmup/cooldown (outliers at start/end)
 * 3. Classify main set based on patterns (CV, trends, repetitions)
 * 4. Handle edge cases (GPS noise, mixed workouts)
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
 * Calculate coefficient of variation (CV = std_dev / mean)
 */
function calculateCV(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0;

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return stdDev / mean;
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
function areDistancesEqual(distances: number[]): boolean {
  if (distances.length < 2) return false;

  const avg = mean(distances);
  const threshold = avg * 0.1; // 10% tolerance

  return distances.every(d => Math.abs(d - avg) <= threshold);
}

/**
 * Detect pyramid pattern in distances (e.g., 400-800-1200-800-400)
 */
function isPyramidPattern(distances: number[]): boolean {
  if (distances.length < 3) return false;

  const halfway = Math.floor(distances.length / 2);

  // Check if first half is ascending
  for (let i = 0; i < halfway - 1; i++) {
    if (distances[i] >= distances[i + 1]) return false;
  }

  // Check if second half is descending (mirror of first)
  for (let i = halfway + 1; i < distances.length - 1; i++) {
    if (distances[i] <= distances[i + 1]) return false;
  }

  return true;
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

/**
 * Format time for human reading
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins}m`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// WARMUP/COOLDOWN DETECTION
// ============================================================================

/**
 * Identify warmup and cooldown sections based on pace outliers at start/end
 */
function identifyWarmupCooldown(
  splits: StravaSplit[]
): {
  warmupIndices: number[];
  cooldownIndices: number[];
  mainSetIndices: number[]
} {
  if (splits.length < 3) {
    return { warmupIndices: [], cooldownIndices: [], mainSetIndices: splits.map((_, i) => i) };
  }

  const paces = splits.map(s => speedToPace(s.average_speed));
  const allIndices = splits.map((_, i) => i);

  // Calculate median pace (more robust than mean)
  const sortedPaces = [...paces].sort((a, b) => a - b);
  const medianPace = sortedPaces[Math.floor(sortedPaces.length / 2)];

  let warmupEnd = 0;
  let cooldownStart = splits.length;

  // Detect warmup: first 1-3 splits that are >15% slower than median
  for (let i = 0; i < Math.min(3, splits.length); i++) {
    if (paces[i] > medianPace * 1.15) {
      warmupEnd = i + 1;
    } else {
      break;
    }
  }

  // Detect cooldown: last 1-3 splits that are >15% slower than median
  for (let i = splits.length - 1; i >= Math.max(0, splits.length - 3); i--) {
    if (paces[i] > medianPace * 1.15) {
      cooldownStart = i;
    } else {
      break;
    }
  }

  // Ensure cooldown doesn't overlap with warmup
  if (cooldownStart <= warmupEnd) {
    cooldownStart = splits.length;
  }

  const warmupIndices = allIndices.slice(0, warmupEnd);
  const cooldownIndices = allIndices.slice(cooldownStart);
  const mainSetIndices = allIndices.slice(warmupEnd, cooldownStart);

  return { warmupIndices, cooldownIndices, mainSetIndices };
}

/**
 * Calculate warmup/cooldown stats
 */
function calculateSegmentStats(splits: StravaSplit[], indices: number[]): WarmupCooldown | undefined {
  if (indices.length === 0) return undefined;

  const segmentSplits = indices.map(i => splits[i]);
  const totalDistance = segmentSplits.reduce((sum, s) => sum + s.distance, 0);
  const totalTime = segmentSplits.reduce((sum, s) => sum + s.moving_time, 0);
  const avgSpeed = totalDistance / totalTime;

  return {
    distance_m: totalDistance,
    time_s: totalTime,
    avg_pace_per_km: speedToPace(avgSpeed)
  };
}

// ============================================================================
// LAP ANALYSIS
// ============================================================================

interface LapClassification {
  index: number;
  lap: StravaLap;
  type: 'warmup' | 'work' | 'recovery' | 'cooldown';
  pace: number; // min/km
}

/**
 * Classify individual laps into segments (warmup, work, recovery, cooldown)
 * This handles patterns like: warmup - work - recovery - work - recovery - cooldown
 * 
 * Strategy:
 * 1. Identify recovery laps (very short <200m or extremely slow)
 * 2. Find work laps (fastest laps with significant distance)
 * 3. Classify remaining laps before first work as warmup, after last work as cooldown
 */
function classifyLapSegments(laps: StravaLap[]): LapClassification[] {
  if (!laps || laps.length < 2) return [];

  // Calculate pace for each lap
  const lapData = laps.map((lap, index) => ({
    index,
    lap,
    pace: speedToPace(lap.average_speed),
    distance: lap.distance
  }));

  // Step 1: Identify obvious recovery laps (very short distance)
  const recoveryIndices = new Set<number>();
  lapData.forEach((l, i) => {
    if (l.distance < 200) {
      recoveryIndices.add(i);
    }
  });

  // Step 2: Get laps with significant distance (>500m, excluding recovery)
  const significantLaps = lapData.filter(l => l.distance > 500 && !recoveryIndices.has(l.index));
  if (significantLaps.length === 0) return [];

  // Step 3: Find work laps = fastest laps (bottom 50% of pace)
  // Sort by pace ascending (faster = lower pace number)
  const sortedByPace = [...significantLaps].sort((a, b) => a.pace - b.pace);

  // Take the fastest 50% as potential work laps (at least 2)
  const workCandidateCount = Math.max(2, Math.ceil(sortedByPace.length * 0.5));
  const workCandidates = sortedByPace.slice(0, workCandidateCount);

  // Calculate work pace (average of fastest laps)
  const workPaces = workCandidates.map(l => l.pace);
  const avgWorkPace = mean(workPaces);

  // Step 4: Classify all laps
  // Recovery threshold: >2x work pace
  // Warmup/cooldown threshold: >1.25x work pace (and before/after work laps)
  const workPaceThreshold = avgWorkPace * 1.25;
  const recoveryPaceThreshold = avgWorkPace * 2;

  // Find range of work laps
  const workIndices = new Set(workCandidates.map(w => w.index));
  let firstWorkIndex = Infinity;
  let lastWorkIndex = -1;
  workCandidates.forEach(w => {
    if (w.index < firstWorkIndex) firstWorkIndex = w.index;
    if (w.index > lastWorkIndex) lastWorkIndex = w.index;
  });

  const result: LapClassification[] = [];

  for (let i = 0; i < lapData.length; i++) {
    const { index, lap, pace, distance } = lapData[i];

    // Recovery: very short OR extremely slow (walking pace)
    if (distance < 200 || pace > recoveryPaceThreshold) {
      result.push({ index, lap, type: 'recovery', pace });
    }
    // Work lap: among the fastest laps
    else if (workIndices.has(index)) {
      result.push({ index, lap, type: 'work', pace });
    }
    // Before first work lap and slower = warmup
    else if (i < firstWorkIndex && pace > workPaceThreshold) {
      result.push({ index, lap, type: 'warmup', pace });
    }
    // After last work lap and slower = cooldown
    else if (i > lastWorkIndex && pace > workPaceThreshold) {
      result.push({ index, lap, type: 'cooldown', pace });
    }
    // Everything else is work
    else {
      result.push({ index, lap, type: 'work', pace });
    }
  }

  return result;
}

/**
 * Analyze laps to detect intervals/series
 * Enhanced to detect recovery laps by pace/distance, not just elapsed-moving time
 */
function analyzeLaps(
  laps: StravaLap[]
): {
  hasSignificantLaps: boolean;
  hasRestPeriods: boolean;
  hasRecoveryLaps: boolean;
  lapDistances: number[];
  restTimes: number[];
  segments: LapClassification[];
} {
  if (!laps || laps.length < 3) {
    return {
      hasSignificantLaps: false,
      hasRestPeriods: false,
      hasRecoveryLaps: false,
      lapDistances: [],
      restTimes: [],
      segments: []
    };
  }

  const lapDistances = laps.map(l => l.distance);
  const restTimes = laps.map(l => l.elapsed_time - l.moving_time);
  const segments = classifyLapSegments(laps);

  // Check if laps have built-in rest (elapsed > moving)
  const lapsWithRest = restTimes.filter(r => r > 15).length;
  const hasRestPeriods = lapsWithRest >= laps.length * 0.7;

  // Check for recovery laps (separate laps marked during rest)
  const recoveryLaps = segments.filter(s => s.type === 'recovery');
  const hasRecoveryLaps = recoveryLaps.length >= 1;

  return {
    hasSignificantLaps: true,
    hasRestPeriods,
    hasRecoveryLaps,
    lapDistances,
    restTimes,
    segments
  };
}

/**
 * Classify workout based on laps
 * Enhanced to handle interval workouts where recovery periods are separate laps
 */
function classifyByLaps(
  activity: StravaDetailedActivity,
  laps: StravaLap[],
  classificationContext?: ClassificationContext
): ClassificationResult | null {
  const lapAnalysis = analyzeLaps(laps);

  if (!lapAnalysis.hasSignificantLaps) return null;

  const { hasRestPeriods, hasRecoveryLaps, lapDistances, restTimes, segments } = lapAnalysis;

  // ENHANCED: Detect interval workouts with recovery laps
  if (hasRecoveryLaps && segments.length > 0) {
    const workLaps = segments.filter(s => s.type === 'work');
    const recoveryLaps = segments.filter(s => s.type === 'recovery');
    const warmupLaps = segments.filter(s => s.type === 'warmup');
    const cooldownLaps = segments.filter(s => s.type === 'cooldown');

    // Need at least 2 work laps to be considered series
    if (workLaps.length >= 2) {
      const workDistances = workLaps.map(w => w.lap.distance);
      const workPaces = workLaps.map(w => w.pace);
      const avgWorkPace = mean(workPaces);
      const avgWorkDistance = mean(workDistances);

      // Calculate recovery time (total time of recovery laps)
      const totalRecoveryTime = recoveryLaps.reduce((sum, r) =>
        sum + r.lap.elapsed_time, 0);
      const avgRecoveryTime = recoveryLaps.length > 0
        ? Math.round(totalRecoveryTime / recoveryLaps.length)
        : 0;

      // Build warmup stats
      const warmupStats = warmupLaps.length > 0 ? {
        distance_m: warmupLaps.reduce((sum, w) => sum + w.lap.distance, 0),
        time_s: warmupLaps.reduce((sum, w) => sum + w.lap.moving_time, 0),
        avg_pace_per_km: mean(warmupLaps.map(w => w.pace))
      } : undefined;

      // Build cooldown stats  
      const cooldownStats = cooldownLaps.length > 0 ? {
        distance_m: cooldownLaps.reduce((sum, c) => sum + c.lap.distance, 0),
        time_s: cooldownLaps.reduce((sum, c) => sum + c.lap.moving_time, 0),
        avg_pace_per_km: mean(cooldownLaps.map(c => c.pace))
      } : undefined;

      // Work laps distance
      const workTotalDistance = workLaps.reduce((sum, w) => sum + w.lap.distance, 0);
      const workTotalTime = workLaps.reduce((sum, w) => sum + w.lap.moving_time, 0);

      // Create description based on time or distance
      const avgWorkTimeMin = Math.round(mean(workLaps.map(w => w.lap.moving_time)) / 60);
      let workDescription: string;

      // If work laps are similar duration (~10 min), describe by time
      if (avgWorkTimeMin >= 5 && areDistancesEqual(workLaps.map(w => w.lap.moving_time))) {
        workDescription = `${workLaps.length}x${avgWorkTimeMin}' @ ${formatPace(avgWorkPace)}`;
      }
      // If work laps are similar distance, describe by distance
      else if (areDistancesEqual(workDistances)) {
        workDescription = `${workLaps.length}x${formatDistance(avgWorkDistance)} @ ${formatPace(avgWorkPace)}`;
      }
      // Mixed intervals
      else {
        workDescription = `${workLaps.length} series @ ${formatPace(avgWorkPace)}`;
      }

      // Build human readable with all components
      const parts: string[] = [];
      if (warmupStats) {
        parts.push(`Calent: ${formatDistance(warmupStats.distance_m)} @ ${formatPace(warmupStats.avg_pace_per_km)}`);
      }
      parts.push(workDescription);
      if (avgRecoveryTime > 0) {
        parts.push(`r${Math.round(avgRecoveryTime / 60)}'`);
      }
      if (cooldownStats) {
        parts.push(`V.calma: ${formatDistance(cooldownStats.distance_m)}`);
      }

      return {
        workout_type: 'SERIES',
        structure: {
          warmup: warmupStats,
          main: {
            type: 'intervals',
            description: `${workLaps.length} bloques de trabajo`,
            distance_m: workTotalDistance,
            time_s: workTotalTime,
            avg_pace_per_km: avgWorkPace
          },
          cooldown: cooldownStats
        },
        confidence: 'high',
        human_readable: parts.join(' | ')
      };
    }
  }

  // Check for hill repeats (significant elevation)
  const avgElevation = laps.reduce((sum, l) => sum + (l.total_elevation_gain || 0), 0) / laps.length;
  if (avgElevation > 15) {
    const avgRestTime = Math.round(mean(restTimes.filter(r => r > 0)));
    const repCount = laps.length;

    return {
      workout_type: 'CUESTAS',
      structure: {
        main: {
          type: 'intervals',
          description: `${repCount} repeticiones en cuesta`,
          distance_m: activity.distance,
          time_s: activity.moving_time,
          avg_pace_per_km: speedToPace(activity.average_speed || activity.distance / activity.moving_time)
        }
      },
      confidence: 'high',
      human_readable: `${repCount} cuestas (${formatDistance(mean(lapDistances))}/rep, +${Math.round(avgElevation)}m/rep)`
    };
  }

  // Series with rest periods (elapsed > moving time)
  if (hasRestPeriods) {
    const avgRestTime = Math.round(mean(restTimes.filter(r => r > 0)));
    const repCount = laps.length;

    // Check if equal distances
    if (areDistancesEqual(lapDistances)) {
      const avgDistance = mean(lapDistances);
      const avgPace = speedToPace(mean(laps.map(l => l.distance / l.moving_time)));

      return {
        workout_type: 'SERIES',
        structure: {
          main: {
            type: 'intervals',
            description: `${repCount} repeticiones de ${formatDistance(avgDistance)}`,
            distance_m: activity.distance,
            time_s: activity.moving_time,
            avg_pace_per_km: avgPace
          }
        },
        confidence: 'high',
        human_readable: `${repCount}x${formatDistance(avgDistance)} @ ${formatPace(avgPace)} con ~${avgRestTime}s descanso`
      };
    }

    // Check for pyramid pattern
    if (isPyramidPattern(lapDistances)) {
      const pattern = lapDistances.map(d => formatDistance(d)).join('-');

      return {
        workout_type: 'SERIES',
        structure: {
          main: {
            type: 'intervals',
            description: `Pirámide: ${pattern}`,
            distance_m: activity.distance,
            time_s: activity.moving_time,
            avg_pace_per_km: speedToPace(activity.average_speed || activity.distance / activity.moving_time)
          }
        },
        confidence: 'high',
        human_readable: `Pirámide ${pattern} con ~${avgRestTime}s descanso`
      };
    }

    // Mixed intervals
    return {
      workout_type: 'SERIES',
      structure: {
        main: {
          type: 'intervals',
          description: `${repCount} repeticiones con distancias variables`,
          distance_m: activity.distance,
          time_s: activity.moving_time,
          avg_pace_per_km: speedToPace(activity.average_speed || activity.distance / activity.moving_time)
        }
      },
      confidence: 'medium',
      human_readable: `${repCount} series mixtas con ~${avgRestTime}s descanso`
    };
  }

  // LAPS WITHOUT RECOVERY - Could be RODAJE or COMPETICION
  // Uses personalized detection if athlete profile is available
  if (segments.length > 0) {
    const workLaps = segments.filter(s => s.type === 'work');

    // All laps are work laps (no warmup/cooldown detected) - continuous effort
    if (workLaps.length >= 3) {
      const paces = workLaps.map(w => w.pace);
      const avgPace = mean(paces);
      const avgPaceSeconds = avgPace * 60; // Convert to sec/km for comparison
      const cv = calculateCV(paces);
      const totalDistance = activity.distance;
      const avgHR = activity.average_heartrate;

      // Use classificationContext if provided (contains athlete-specific data)
      // This allows personalized detection based on HR zones and history
      // Note: classificationContext is passed via extended interface
      const context = (activity as any).classificationContext as ClassificationContext | undefined;

      let isRace = false;
      let raceReason = '';

      if (context?.hrZones && context?.athleteStats) {
        // PERSONALIZED DETECTION with athlete profile

        // 1. Check HR zones - is the athlete in Z5?
        if (avgHR && context.hrZones) {
          const isZ5 = avgHR >= context.hrZones.z5.min;
          const isHighZ4 = avgHR >= (context.hrZones.z4.min + context.hrZones.z4.max) / 2;

          if (isZ5) {
            isRace = true;
            raceReason = `FC ${avgHR} (Zona 5)`;
          } else if (isHighZ4 && cv < 0.05) {
            // High Z4 with very consistent pace = likely race
            isRace = true;
            raceReason = `FC ${avgHR} (Z4 alta) + ritmo constante`;
          }
        }

        // 2. Check pace vs historical average
        if (!isRace && context.athleteStats) {
          const threshold = context.athleteStats.avgEasyPace * 0.90; // 10% faster than easy
          if (avgPaceSeconds < threshold) {
            const percentFaster = Math.round((1 - avgPaceSeconds / context.athleteStats.avgEasyPace) * 100);
            isRace = true;
            raceReason = `${percentFaster}% más rápido que habitual`;
          }
        }

      } else {
        // GENERIC DETECTION without athlete profile (fallback)
        // Uses thresholds that work for most athletes

        const isHighHR = avgHR && avgHR > 170; // High absolute HR
        const isVeryConsistent = cv < 0.03;

        // Generic race indicators
        if (isVeryConsistent && isHighHR) {
          isRace = true;
          raceReason = `FC ${avgHR}bpm + CV ${(cv * 100).toFixed(1)}%`;
        } else if (cv < 0.025 && avgHR && avgHR > 160) {
          isRace = true;
          raceReason = `Esfuerzo alto sostenido`;
        }
      }

      if (isRace) {
        const distanceKm = totalDistance / 1000;
        let raceName = formatDistance(totalDistance);

        // Detect common race distances
        if (distanceKm >= 4.8 && distanceKm <= 5.2) raceName = '5K';
        else if (distanceKm >= 9.8 && distanceKm <= 10.2) raceName = '10K';
        else if (distanceKm >= 20.8 && distanceKm <= 21.5) raceName = 'Media Maratón';
        else if (distanceKm >= 41.5 && distanceKm <= 43) raceName = 'Maratón';

        return {
          workout_type: 'COMPETICION',
          structure: {
            main: {
              type: 'sustained',
              description: `Competición: ${raceName}`,
              distance_m: totalDistance,
              time_s: activity.moving_time,
              avg_pace_per_km: avgPace
            }
          },
          confidence: context?.hrZones ? 'high' : 'medium', // Higher confidence with personalized data
          human_readable: `🏆 ${raceName} @ ${formatPace(avgPace)}${raceReason ? ` (${raceReason})` : ''}`
        };
      }

      // Not a race - classify as RODAJE
      return {
        workout_type: 'RODAJE',
        structure: {
          main: {
            type: 'continuous',
            description: 'Rodaje continuo',
            distance_m: totalDistance,
            time_s: activity.moving_time,
            avg_pace_per_km: avgPace
          }
        },
        confidence: cv < 0.08 ? 'high' : 'medium',
        human_readable: `${formatDistance(totalDistance)} rodaje @ ${formatPace(avgPace)}${avgHR ? ` (${Math.round(avgHR)} bpm)` : ''}`
      };
    }
  }

  // Laps without meaningful pattern - fallback
  return null;
}

// ============================================================================
// SPLIT-BASED ANALYSIS
// ============================================================================

/**
 * Detect series pattern in splits (without laps) based on pace drops
 */
function detectSeriesInSplits(
  splits: StravaSplit[],
  mainSetIndices: number[]
): { isSeriesPattern: boolean; intervals: number } {
  if (mainSetIndices.length < 3) return { isSeriesPattern: false, intervals: 0 };

  const mainSplits = mainSetIndices.map(i => splits[i]);
  const paces = mainSplits.map(s => speedToPace(s.average_speed));
  const avgPace = mean(paces);

  // Detect "rest splits" - pace drops >40% (very slow)
  let intervals = 0;
  let inRest = false;

  for (const pace of paces) {
    const isRest = pace > avgPace * 1.4;

    if (!isRest && inRest) {
      // Transition from rest to work = new interval
      intervals++;
    }

    inRest = isRest;
  }

  // If first split is work (not rest), count it
  if (paces[0] <= avgPace * 1.4) {
    intervals++;
  }

  return {
    isSeriesPattern: intervals >= 3,
    intervals
  };
}

/**
 * Detect tempo structure: slow-fast-slow pattern
 */
function detectTempoStructure(
  splits: StravaSplit[],
  mainSetIndices: number[]
): boolean {
  if (mainSetIndices.length < 5) return false; // Need enough splits for pattern

  const mainSplits = mainSetIndices.map(i => splits[i]);
  const paces = mainSplits.map(s => speedToPace(s.average_speed));

  // Divide into thirds
  const third = Math.floor(paces.length / 3);
  const firstThird = paces.slice(0, third);
  const middleSection = paces.slice(third, third * 2);
  const lastThird = paces.slice(third * 2);

  const avgFirst = mean(firstThird);
  const avgMiddle = mean(middleSection);
  const avgLast = mean(lastThird);

  // Tempo pattern: first and last are >10% slower than middle
  const isTempoPattern = avgFirst > avgMiddle * 1.1 && avgLast > avgMiddle * 1.1;

  return isTempoPattern;
}

/**
 * Detect progressive run (accelerating throughout)
 */
function detectProgressive(
  splits: StravaSplit[],
  mainSetIndices: number[]
): boolean {
  if (mainSetIndices.length < 3) return false;

  const mainSplits = mainSetIndices.map(i => splits[i]);
  const paces = mainSplits.map(s => speedToPace(s.average_speed));

  // Compare first third vs last third
  const third = Math.floor(paces.length / 3);
  const firstThirdAvg = mean(paces.slice(0, third));
  const lastThirdAvg = mean(paces.slice(-third));

  // Progressive: last third is >10% faster (lower pace)
  return lastThirdAvg < firstThirdAvg * 0.9;
}

/**
 * Classify workout based on splits analysis
 */
function classifyBySplits(
  activity: StravaDetailedActivity,
  splits: StravaSplit[]
): ClassificationResult {
  const { warmupIndices, cooldownIndices, mainSetIndices } = identifyWarmupCooldown(splits);

  const warmup = calculateSegmentStats(splits, warmupIndices);
  const cooldown = calculateSegmentStats(splits, cooldownIndices);

  if (mainSetIndices.length === 0) {
    // No main set? Entire run is warmup/cooldown?
    return {
      workout_type: 'OTRO',
      structure: {
        main: {
          type: 'continuous',
          description: 'Actividad sin estructura clara',
          distance_m: activity.distance,
          time_s: activity.moving_time,
          avg_pace_per_km: speedToPace(activity.average_speed || activity.distance / activity.moving_time)
        }
      },
      confidence: 'low',
      human_readable: `${formatDistance(activity.distance)} sin estructura definida`
    };
  }

  const mainSplits = mainSetIndices.map(i => splits[i]);
  const mainPaces = mainSplits.map(s => speedToPace(s.average_speed));
  const cv = calculateCV(mainPaces);
  const avgMainPace = mean(mainPaces);
  const mainDistance = mainSplits.reduce((sum, s) => sum + s.distance, 0);
  const mainTime = mainSplits.reduce((sum, s) => sum + s.moving_time, 0);

  // Check for series pattern in splits
  const seriesDetection = detectSeriesInSplits(splits, mainSetIndices);
  if (seriesDetection.isSeriesPattern) {
    return {
      workout_type: 'SERIES',
      structure: {
        warmup,
        main: {
          type: 'intervals',
          description: `${seriesDetection.intervals} series detectadas por patrón de descanso`,
          distance_m: mainDistance,
          time_s: mainTime,
          avg_pace_per_km: avgMainPace
        },
        cooldown
      },
      confidence: 'medium',
      human_readable: `${seriesDetection.intervals} series @ ${formatPace(avgMainPace)} (patrón detectado en GPS)`
    };
  }

  // Check for progressive
  if (detectProgressive(splits, mainSetIndices)) {
    return {
      workout_type: 'PROGRESIVO',
      structure: {
        warmup,
        main: {
          type: 'continuous',
          description: 'Carrera progresiva con aceleración gradual',
          distance_m: mainDistance,
          time_s: mainTime,
          avg_pace_per_km: avgMainPace
        },
        cooldown
      },
      confidence: 'high',
      human_readable: `${formatDistance(mainDistance)} progresivo @ ${formatPace(avgMainPace)} (acelerando)`
    };
  }

  // Check for tempo structure
  if (detectTempoStructure(splits, mainSetIndices)) {
    return {
      workout_type: 'TEMPO',
      structure: {
        warmup,
        main: {
          type: 'sustained',
          description: 'Bloque a ritmo de tempo',
          distance_m: mainDistance,
          time_s: mainTime,
          avg_pace_per_km: avgMainPace
        },
        cooldown
      },
      confidence: 'high',
      human_readable: `${formatDistance(mainDistance)} tempo @ ${formatPace(avgMainPace)} con warm-up/cool-down`
    };
  }

  // Analyze by CV (coefficient of variation)
  if (cv < 0.05) {
    // Very constant pace - RODAJE
    const distanceKm = activity.distance / 1000;

    let rodajeType = 'RODAJE';
    if (distanceKm < 8) {
      return {
        workout_type: rodajeType as WorkoutType,
        structure: {
          warmup,
          main: {
            type: 'continuous',
            description: 'Rodaje corto a ritmo constante',
            distance_m: mainDistance,
            time_s: mainTime,
            avg_pace_per_km: avgMainPace
          },
          cooldown
        },
        confidence: 'high',
        human_readable: `${formatDistance(activity.distance)} rodaje @ ${formatPace(avgMainPace)}`
      };
    } else if (distanceKm >= 8 && distanceKm <= 15) {
      return {
        workout_type: rodajeType as WorkoutType,
        structure: {
          warmup,
          main: {
            type: 'continuous',
            description: 'Rodaje normal a ritmo constante',
            distance_m: mainDistance,
            time_s: mainTime,
            avg_pace_per_km: avgMainPace
          },
          cooldown
        },
        confidence: 'high',
        human_readable: `${formatDistance(activity.distance)} rodaje @ ${formatPace(avgMainPace)}`
      };
    } else {
      return {
        workout_type: rodajeType as WorkoutType,
        structure: {
          warmup,
          main: {
            type: 'continuous',
            description: 'Rodaje largo a ritmo constante',
            distance_m: mainDistance,
            time_s: mainTime,
            avg_pace_per_km: avgMainPace
          },
          cooldown
        },
        confidence: 'high',
        human_readable: `${formatDistance(activity.distance)} rodaje largo @ ${formatPace(avgMainPace)}`
      };
    }
  } else if (cv > 0.12) {
    // High variation - FARTLEK
    return {
      workout_type: 'FARTLEK',
      structure: {
        warmup,
        main: {
          type: 'variable',
          description: 'Cambios de ritmo sin estructura definida',
          distance_m: mainDistance,
          time_s: mainTime,
          avg_pace_per_km: avgMainPace
        },
        cooldown
      },
      confidence: 'medium',
      human_readable: `${formatDistance(activity.distance)} fartlek @ ${formatPace(avgMainPace)} (ritmo variable)`
    };
  } else {
    // Moderate variation (0.05 - 0.12) - could be anything, default to RODAJE
    return {
      workout_type: 'RODAJE',
      structure: {
        warmup,
        main: {
          type: 'continuous',
          description: 'Carrera continua con variación moderada',
          distance_m: mainDistance,
          time_s: mainTime,
          avg_pace_per_km: avgMainPace
        },
        cooldown
      },
      confidence: 'medium',
      human_readable: `${formatDistance(activity.distance)} rodaje @ ${formatPace(avgMainPace)}`
    };
  }
}

// ============================================================================
// MAIN CLASSIFICATION FUNCTION
// ============================================================================

/**
 * Classify workout using intelligent pattern analysis
 */
export function classifyWorkout(
  activity: StravaDetailedActivity,
  classificationContext?: ClassificationContext
): ClassificationResult {
  // Edge case: very short activity
  if (activity.distance < 1000) {
    return {
      workout_type: 'OTRO',
      structure: {
        main: {
          type: 'continuous',
          description: 'Actividad muy corta',
          distance_m: activity.distance,
          time_s: activity.moving_time,
          avg_pace_per_km: speedToPace(activity.average_speed || activity.distance / activity.moving_time)
        }
      },
      confidence: 'low',
      human_readable: `${formatDistance(activity.distance)} (distancia insuficiente para clasificar)`
    };
  }

  // Edge case: GPS data too noisy
  if (activity.splits_metric) {
    const paces = activity.splits_metric.map(s => speedToPace(s.average_speed));
    const cv = calculateCV(paces);

    if (cv > 0.25) {
      return {
        workout_type: 'OTRO',
        structure: {
          main: {
            type: 'continuous',
            description: 'Datos GPS con mucho ruido',
            distance_m: activity.distance,
            time_s: activity.moving_time,
            avg_pace_per_km: speedToPace(activity.average_speed || activity.distance / activity.moving_time)
          }
        },
        confidence: 'low',
        human_readable: `${formatDistance(activity.distance)} (datos GPS inconsistentes)`
      };
    }
  }

  // Check for elevation-based classification (hills/trail)
  if (activity.total_elevation_gain && activity.total_elevation_gain / (activity.distance / 1000) > 15) {
    // Significant elevation - could be trail/mountain run
    const splits = activity.splits_metric || [];
    const { mainSetIndices } = identifyWarmupCooldown(splits);

    // Check if there's a pattern of up-down-up (hill repeats without laps)
    let elevationChanges = 0;
    if (splits.length > 0 && mainSetIndices.length > 2) {
      const mainSplits = mainSetIndices.map(i => splits[i]);
      for (let i = 0; i < mainSplits.length - 1; i++) {
        const curr = mainSplits[i].elevation_difference || 0;
        const next = mainSplits[i + 1].elevation_difference || 0;

        // Detect up-down transitions
        if (curr > 5 && next < -5) {
          elevationChanges++;
        }
      }
    }

    if (elevationChanges >= 3) {
      return {
        workout_type: 'CUESTAS',
        structure: {
          main: {
            type: 'intervals',
            description: `Cuestas detectadas por patrón de desnivel`,
            distance_m: activity.distance,
            time_s: activity.moving_time,
            avg_pace_per_km: speedToPace(activity.average_speed || activity.distance / activity.moving_time)
          }
        },
        confidence: 'medium',
        human_readable: `${formatDistance(activity.distance)} cuestas (+${Math.round(activity.total_elevation_gain)}m)`
      };
    }
  }

  // STEP 1: Try to classify by laps (most reliable)
  if (activity.laps && activity.laps.length > 0) {
    const lapClassification = classifyByLaps(activity, activity.laps, classificationContext);
    if (lapClassification) {
      return lapClassification;
    }
  } // STEP 2: Classify by splits analysis
  if (activity.splits_metric && activity.splits_metric.length >= 2) {
    return classifyBySplits(activity, activity.splits_metric);
  }

  // STEP 3: Fallback - basic classification by distance and pace consistency
  const avgPace = speedToPace(activity.average_speed || activity.distance / activity.moving_time);
  const distanceKm = activity.distance / 1000;

  return {
    workout_type: 'RODAJE',
    structure: {
      main: {
        type: 'continuous',
        description: 'Carrera continua (sin datos detallados)',
        distance_m: activity.distance,
        time_s: activity.moving_time,
        avg_pace_per_km: avgPace
      }
    },
    confidence: 'low',
    human_readable: `${formatDistance(activity.distance)} rodaje @ ${formatPace(avgPace)} (clasificación básica)`
  };
}
