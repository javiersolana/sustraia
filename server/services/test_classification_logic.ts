
import { classifyWorkout, StravaDetailedActivity, StravaLap, ClassificationContext } from './workoutClassifier';

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
// Need to adjust HR average for the whole activity roughly
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

// This should be classified as SERIES (manual laps without rest) or TEMPO?
// If we have 4 fast laps and then slow, it's likely a structure.
// classifyByLapsStructure logic -> transitions?
// Main Block = 4 fast laps. 
// Transitions = 0 (all fast).
// But we have Cooldown?
// Code says: "If Detected distinct phases (Warmup/Cool) but Main block is steady -> TEMPO"
// OR "If Main Block is multiple fast laps (manual series without rest?) -> SERIES (medium confidence)"
// Let's see what it returns. Ideally it detects structure.
// Actually, if it's 4 fast laps, it might look like a single block. 
// If phases are identified (Cooldown exists), and Main is steady -> TEMPO.
// Determine expected based on logic: It has Cooldown. Main is steady. -> TEMPO.
// BUT if the user considers 4x1km as Series... well without rest it IS a Tempo run effectively.
runTest('Robust Cooldown Check (Tempo/Series)', cooldownTestActivity, 'TEMPO');

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
