
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

function speedToPace(speedMs: number): number {
    if (speedMs === 0) return 999;
    return (1000 / speedMs) / 60; // min/km
}

function paceToSeconds(paceMinPerKm: number): number {
    return paceMinPerKm * 60;
}

function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function formatPace(paceMinPerKm: number): string {
    const minutes = Math.floor(paceMinPerKm);
    const seconds = Math.round((paceMinPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)}m`;
    const km = meters / 1000;
    return `${km.toFixed(km >= 10 ? 0 : 1)}km`;
}

// ============================================================================
// 1KM LAP LOGIC
// ============================================================================

function classifyGeneric1kmLaps(
    activity: StravaDetailedActivity,
    laps: StravaLap[],
    context?: ClassificationContext
): ClassificationResult | null {
    if (!laps || laps.length === 0) return null;
    if (!context?.hrZones) return null;

    const mainLaps = laps.slice(0, laps.length - 1); // Ignore last lap for distance check
    if (laps.length < 2) return null;

    const lapsToCheck = laps.slice(0, Math.max(1, laps.length - 1));
    const is1kmLaps = lapsToCheck.every(l => l.distance >= 980 && l.distance <= 1020);

    if (!is1kmLaps) return null;

    const avgHR = activity.average_heartrate || 0;
    const avgPace = speedToPace(activity.average_speed || 0);
    const { z3, z4, z5 } = context.hrZones;

    if (avgHR <= z3.max) {
        return {
            workout_type: 'RODAJE',
            structure: {
                main: {
                    type: 'continuous',
                    description: 'Rodaje con vueltas automáticas de 1km',
                    distance_m: activity.distance,
                    time_s: activity.moving_time,
                    avg_pace_per_km: avgPace
                }
            },
            confidence: 'high',
            human_readable: `Rodaje 1km laps @ ${formatPace(avgPace)} (FC ${Math.round(avgHR)})`
        };
    }

    const isZ5 = avgHR >= z5.min;

    if (!isZ5) {
        return {
            workout_type: 'TEMPO',
            structure: {
                main: {
                    type: 'sustained',
                    description: 'Tempo run con vueltas de 1km',
                    distance_m: activity.distance,
                    time_s: activity.moving_time,
                    avg_pace_per_km: avgPace
                }
            },
            confidence: 'high',
            human_readable: `Tempo 1km laps @ ${formatPace(avgPace)} (FC ${Math.round(avgHR)})`
        };
    }

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

function identifyPhases(laps: StravaLap[]): LapPhase[] {
    if (laps.length < 2) {
        return laps.map((l, i) => ({ index: i, type: 'main', lap: l, pace: speedToPace(l.average_speed) }));
    }

    const lapData = laps.map((l, i) => ({
        index: i,
        lap: l,
        pace: speedToPace(l.average_speed),
    }));

    const validLaps = lapData.filter(l => l.lap.distance > 100 && l.lap.moving_time > 15);

    if (validLaps.length === 0) {
        return lapData.map(l => ({ ...l, type: 'main' }));
    }

    const sortedPaces = [...validLaps].sort((a, b) => a.pace - b.pace);
    const numFastest = Math.max(1, Math.floor(validLaps.length * 0.25));
    const fastestLaps = sortedPaces.slice(0, numFastest);
    const refWorkPace = mean(fastestLaps.map(l => l.pace));

    const slowThreshold = refWorkPace * 1.25;

    let cooldownStartIndex = laps.length;

    for (let i = laps.length - 1; i >= 0; i--) {
        const lap = lapData[i];
        const isFast = lap.pace <= slowThreshold;
        if (isFast) {
            break;
        } else {
            cooldownStartIndex = i;
        }
    }

    let warmupEndIndex = -1;

    for (let i = 0; i < cooldownStartIndex; i++) {
        const lap = lapData[i];
        const isSlow = lap.pace > slowThreshold;
        if (!isSlow) {
            break;
        } else {
            warmupEndIndex = i;
        }
    }

    return lapData.map(l => {
        let type: 'warmup' | 'main' | 'cooldown' = 'main';
        if (l.index <= warmupEndIndex) type = 'warmup';
        else if (l.index >= cooldownStartIndex) type = 'cooldown';
        return { ...l, type };
    });
}

function classifyByLapsStructure(
    activity: StravaDetailedActivity,
    laps: StravaLap[]
): ClassificationResult | null {
    const phases = identifyPhases(laps);

    const mainLaps = phases.filter(p => p.type === 'main');
    const warmupLaps = phases.filter(p => p.type === 'warmup');
    const cooldownLaps = phases.filter(p => p.type === 'cooldown');

    if (mainLaps.length === 0) {
        return null;
    }

    const mainPaces = mainLaps.map(l => l.pace);
    const sortedMainPaces = [...mainPaces].sort((a, b) => a - b);
    const medianMainPace = sortedMainPaces[Math.floor(sortedMainPaces.length / 2)];

    const top25MainPace = mean(sortedMainPaces.slice(0, Math.max(1, Math.floor(sortedMainPaces.length * 0.25))));
    const recoveryThreshold = top25MainPace * 1.20;

    const isRecoveryLikely = (l: LapPhase) => {
        const isShort = l.lap.distance < 500;
        const isSlow = l.pace > medianMainPace * 1.15;
        return isShort || isSlow;
    };

    let workCount = 0;
    let recoveryCount = 0;

    const mainSegments = mainLaps.map(l => {
        const isRecovery = isRecoveryLikely(l);
        if (isRecovery) recoveryCount++;
        else workCount++;
        return { ...l, isRecovery };
    });

    let transitions = 0;
    for (let i = 0; i < mainSegments.length - 1; i++) {
        if (mainSegments[i].isRecovery !== mainSegments[i + 1].isRecovery) {
            transitions++;
        }
    }

    const workSegments = mainSegments.filter(l => !l.isRecovery);
    workCount = workSegments.length;
    const avgWorkPace = workSegments.length > 0 ? mean(workSegments.map(s => s.pace)) : medianMainPace;
    const avgWorkDistance = workSegments.length > 0 ? mean(workSegments.map(s => s.lap.distance)) : 0;

    if (workCount >= 2) {
        if (transitions >= 2) {
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
                        description: `${workCount} intervalos (+recuperaciones)`,
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
                human_readable: `${workCount} series @ ${formatPace(avgWorkPace)}`
            };
        }

        if (warmupLaps.length > 0 || cooldownLaps.length > 0) {
            return {
                workout_type: 'SERIES',
                structure: {
                    main: {
                        type: 'intervals',
                        description: `${workCount} series (sin recuperación marcada)`,
                        distance_m: workSegments.reduce((s, l) => s + l.lap.distance, 0),
                        time_s: workSegments.reduce((s, l) => s + l.lap.moving_time, 0),
                        avg_pace_per_km: avgWorkPace
                    }
                },
                confidence: 'medium',
                human_readable: `${workCount}x${formatDistance(avgWorkDistance)} @ ${formatPace(avgWorkPace)}`
            };
        }
    }

    if (warmupLaps.length > 0 || cooldownLaps.length > 0) {
        if (transitions < 2) {
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

    return null;
}

// ============================================================================
// MAIN CLASSIFICATION FUNCTION
// ============================================================================

export function classifyWorkout(
    activity: StravaDetailedActivity,
    classificationContext?: ClassificationContext
): ClassificationResult {

    const hasLaps = activity.laps && activity.laps.length > 0;

    if (hasLaps) {
        const km1Result = classifyGeneric1kmLaps(activity, activity.laps!, classificationContext);
        if (km1Result) return km1Result;

        const structureResult = classifyByLapsStructure(activity, activity.laps!);
        if (structureResult) return structureResult;
    }

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


// Mock Data Helpers
const createLap = (distance: number, timeS: number, hr?: number): StravaLap => ({
    distance,
    moving_time: timeS,
    elapsed_time: timeS,
    average_speed: distance / timeS,
    average_heartrate: hr,
    max_heartrate: hr ? hr + 5 : undefined
});

const createActivity = (laps: StravaLap[], avgHR?: number): StravaDetailedActivity => {
    const distance = laps.reduce((s, l) => s + l.distance, 0);
    const time = laps.reduce((s, l) => s + l.moving_time, 0);
    return {
        id: 1,
        name: 'Test Activity',
        type: 'Run',
        distance,
        moving_time: time,
        elapsed_time: time,
        average_speed: distance / time,
        average_heartrate: avgHR || (laps.length > 0 ? laps.reduce((s, l) => s + (l.average_heartrate || 140), 0) / laps.length : 140),
        laps,
    };
};

const context: ClassificationContext = {
    hrZones: {
        z1: { min: 100, max: 120 },
        z2: { min: 121, max: 140 },
        z3: { min: 141, max: 155 },
        z4: { min: 156, max: 175 },
        z5: { min: 176, max: 200 }
    },
    athleteStats: {
        avgEasyPace: 5.5, // min/km
        avgCompetitionPace: 4.0,
        avgEasyHR: 135
    }
};

// TESTS

function runTest(name: string, activity: StravaDetailedActivity, expectedType: string) {
    const result = classifyWorkout(activity, context);
    // Relaxed check: Accept TEMPO or SERIES for some cases if logic is ambiguous but structure is detected
    const pass = result.workout_type === expectedType;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}: Expected ${expectedType}, got ${result.workout_type}`);
    if (!pass) {
        console.log('Result:', JSON.stringify(result, null, 2));
    }
}

console.log('--- STARTING PRE-DEPLOYMENT CHECKS ---');

// 1. 1km Laps - Rodaje (Z2)
const rodajeLaps = Array(5).fill(0).map(() => createLap(1000, 300, 135)); // 5:00/km, 135bpm (Z2)
runTest('1km Laps Rodaje (Z2)', createActivity(rodajeLaps, 135), 'RODAJE');

// 2. 1km Laps - Tempo (Z4)
const tempoLaps = Array(5).fill(0).map(() => createLap(1000, 240, 165)); // 4:00/km, 165bpm (Z4)
runTest('1km Laps Tempo (Z4)', createActivity(tempoLaps, 165), 'TEMPO');

// 3. 1km Laps - Competicion (Z5)
const raceLaps = Array(5).fill(0).map(() => createLap(1000, 210, 185)); // 3:30/km, 185bpm (Z5)
runTest('1km Laps Competicion (Z5)', createActivity(raceLaps, 185), 'COMPETICION');

// 4. Series with Recovery Laps
// 2km Warmup (Slow) + 3x(1km Fast + 200m Slow) + 2km Cooldown (Slow)
const warmup = [createLap(1000, 360, 130), createLap(1000, 360, 130)]; // 6:00/km
const series = [
    createLap(1000, 240, 170), // Fast 4:00/km
    createLap(200, 90, 120),   // Recov (Slow/Short)
    createLap(1000, 240, 170),
    createLap(200, 90, 120),
    createLap(1000, 240, 170),
    createLap(200, 90, 120),
];
const cooldown = [createLap(1000, 360, 130), createLap(1000, 360, 130)];

const seriesActivity = createActivity([...warmup, ...series, ...cooldown]);
seriesActivity.average_heartrate = 150;

runTest('Series with Recovery Laps', seriesActivity, 'SERIES');

// 5. Fallback - No Laps
const noLapsActivity: StravaDetailedActivity = {
    id: 2,
    name: 'No Laps Run',
    type: 'Run',
    distance: 5000,
    moving_time: 1800,
    elapsed_time: 1800,
    average_speed: 5000 / 1800,
    laps: []
};
runTest('No Laps Fallback', noLapsActivity, 'RODAJE');

// 6. Robust Cooldown Detection
// Fast laps followed by 1 long slow lap (>1km)
// 4x1km Fast (4:00/km) + 2km Slow (6:00/km)
const fastLaps = Array(4).fill(0).map(() => createLap(1000, 240, 170));
const longCooldown = createLap(2000, 720, 130); // 2km @ 6:00/km
const cooldownTestActivity = createActivity([...fastLaps, longCooldown]);

runTest('Robust Cooldown Check (Tempo/Series)', cooldownTestActivity, 'SERIES');

// 7. Series with Alternation and Cooldown
// Warmup + 3x(Fast+Slow) + Cooldown
const seriesWithCool = [
    createLap(1000, 360, 130), // Warmup
    createLap(1000, 240, 170), // Fast
    createLap(400, 120, 130),  // Slow
    createLap(1000, 240, 170), // Fast
    createLap(400, 120, 130),  // Slow
    createLap(1000, 240, 170), // Fast
    createLap(2000, 720, 130)  // Cooldown (Long)
];
runTest('Series with Alternation + Cooldown', createActivity(seriesWithCool), 'SERIES');

console.log('--- CHECKS COMPLETE ---');
