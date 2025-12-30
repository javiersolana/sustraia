/**
 * HR Zones Service
 * Calculates personalized heart rate zones based on athlete age
 * Uses formula: FCmax = 220 - age
 */

export interface HRZones {
    z1: { min: number; max: number }; // Recuperación (50-60%)
    z2: { min: number; max: number }; // Aeróbico (60-70%)
    z3: { min: number; max: number }; // Tempo (70-80%)
    z4: { min: number; max: number }; // Umbral (80-90%)
    z5: { min: number; max: number }; // VO2max (90-100%)
}

export interface TimeInZones {
    z1: number; // seconds
    z2: number;
    z3: number;
    z4: number;
    z5: number;
    total: number;
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Calculate FCmax using formula: 220 - age
 * Can be overridden with manual FCmax if provided
 */
export function calculateMaxHR(birthDate?: Date | null, manualMaxHR?: number | null): number {
    if (manualMaxHR && manualMaxHR > 0) {
        return manualMaxHR;
    }

    if (!birthDate) {
        // Default to 30 years old if no birth date
        return 190;
    }

    const age = calculateAge(birthDate);
    return 220 - age;
}

/**
 * Calculate HR zones based on max HR
 * Uses percentage-based zones (standard 5-zone model)
 */
export function calculateHRZones(
    birthDate?: Date | null,
    manualMaxHR?: number | null,
    restingHR?: number | null
): HRZones {
    const maxHR = calculateMaxHR(birthDate, manualMaxHR);

    // If resting HR provided, use Karvonen formula for more accuracy
    if (restingHR && restingHR > 0) {
        const hrReserve = maxHR - restingHR;

        return {
            z1: {
                min: Math.round(restingHR + hrReserve * 0.50),
                max: Math.round(restingHR + hrReserve * 0.60)
            },
            z2: {
                min: Math.round(restingHR + hrReserve * 0.60),
                max: Math.round(restingHR + hrReserve * 0.70)
            },
            z3: {
                min: Math.round(restingHR + hrReserve * 0.70),
                max: Math.round(restingHR + hrReserve * 0.80)
            },
            z4: {
                min: Math.round(restingHR + hrReserve * 0.80),
                max: Math.round(restingHR + hrReserve * 0.90)
            },
            z5: {
                min: Math.round(restingHR + hrReserve * 0.90),
                max: maxHR
            }
        };
    }

    // Simple percentage-based zones
    return {
        z1: { min: Math.round(maxHR * 0.50), max: Math.round(maxHR * 0.60) },
        z2: { min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.70) },
        z3: { min: Math.round(maxHR * 0.70), max: Math.round(maxHR * 0.80) },
        z4: { min: Math.round(maxHR * 0.80), max: Math.round(maxHR * 0.90) },
        z5: { min: Math.round(maxHR * 0.90), max: maxHR }
    };
}

/**
 * Get zone number (1-5) for a given HR
 */
export function getZoneForHR(hr: number, zones: HRZones): number {
    if (hr >= zones.z5.min) return 5;
    if (hr >= zones.z4.min) return 4;
    if (hr >= zones.z3.min) return 3;
    if (hr >= zones.z2.min) return 2;
    return 1;
}

/**
 * Check if HR is in race effort (Zone 5 or high Zone 4)
 */
export function isRaceHR(hr: number, zones: HRZones): boolean {
    return hr >= zones.z5.min || hr >= (zones.z4.min + zones.z4.max) / 2;
}

/**
 * Estimate time spent in each zone based on lap data
 * Each lap's HR is assumed constant for its duration
 */
export function calculateTimeInZones(
    laps: { moving_time: number; average_heartrate?: number }[],
    zones: HRZones
): TimeInZones {
    const timeInZones: TimeInZones = {
        z1: 0,
        z2: 0,
        z3: 0,
        z4: 0,
        z5: 0,
        total: 0
    };

    for (const lap of laps) {
        if (!lap.average_heartrate) continue;

        const zone = getZoneForHR(lap.average_heartrate, zones);
        const key = `z${zone}` as keyof TimeInZones;

        if (typeof timeInZones[key] === 'number') {
            (timeInZones as any)[key] += lap.moving_time;
        }
        timeInZones.total += lap.moving_time;
    }

    return timeInZones;
}

/**
 * Get percentage of time in Zone 5
 */
export function getZ5Percentage(timeInZones: TimeInZones): number {
    if (timeInZones.total === 0) return 0;
    return timeInZones.z5 / timeInZones.total;
}

/**
 * Check if workout effort indicates a race
 * Criteria: >40% time in Z5 OR average HR > 90% of max
 */
export function isRaceEffortByHR(
    laps: { moving_time: number; average_heartrate?: number }[],
    zones: HRZones,
    avgHR?: number
): { isRace: boolean; reason: string } {
    // Calculate time in zones
    const timeInZones = calculateTimeInZones(laps, zones);
    const z5Percentage = getZ5Percentage(timeInZones);

    // Check Z5 time (>40%)
    if (z5Percentage > 0.4) {
        return {
            isRace: true,
            reason: `${Math.round(z5Percentage * 100)}% en Z5`
        };
    }

    // Check average HR (>90% of max)
    if (avgHR && avgHR >= zones.z5.min) {
        return {
            isRace: true,
            reason: `FC ${avgHR} (Z5)`
        };
    }

    // High Z4 time could also indicate race (>60% in Z4+Z5)
    const z4z5Percentage = (timeInZones.z4 + timeInZones.z5) / timeInZones.total;
    if (z4z5Percentage > 0.6 && avgHR && avgHR >= zones.z4.min) {
        return {
            isRace: true,
            reason: `${Math.round(z4z5Percentage * 100)}% en Z4-Z5`
        };
    }

    return { isRace: false, reason: '' };
}
