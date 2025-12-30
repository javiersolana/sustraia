/**
 * Label Classifier Service
 * Analyzes Strava activity titles and assigns appropriate workout labels
 */

export type WorkoutLabelType =
    | 'CALENTAMIENTO'
    | 'DESCALENTAMIENTO'
    | 'FUERZA'
    | 'SERIES'
    | 'TEMPO'
    | 'RODAJE'
    | 'CUESTAS'
    | 'RECUPERACION'
    | 'PROGRESIVO'
    | 'FARTLEK'
    | 'COMPETICION'
    | 'OTRO';

interface LabelRule {
    label: WorkoutLabelType;
    keywords: string[];
}

const LABEL_RULES: LabelRule[] = [
    {
        label: 'CALENTAMIENTO',
        keywords: ['calentamiento', 'warm up', 'warmup', 'warm-up', 'calentar'],
    },
    {
        label: 'DESCALENTAMIENTO',
        keywords: ['descalentamiento', 'cool down', 'cooldown', 'cool-down', 'enfriamiento', 'vuelta a la calma'],
    },
    {
        label: 'FUERZA',
        keywords: ['fuerza', 'gym', 'pesas', 'strength', 'weights', 'gimnasio', 'musculación', 'core'],
    },
    {
        label: 'SERIES',
        keywords: [
            'series', 'intervals', 'intervalos', 'repeticiones', 'reps',
            '400m', '800m', '1000m', '1k', '2k', '400s', '800s',
            'interval', 'track', 'pista', 'vo2max', 'vo2', 'speed', 'velocidad'
        ],
    },
    {
        label: 'TEMPO',
        keywords: ['tempo', 'threshold', 'umbral', 'ritmo', 'progresivo', 'progression', 'fartlek'],
    },
    {
        label: 'RODAJE',
        keywords: [
            'rodaje', 'easy', 'suave', 'recovery', 'recuperación', 'recuperacion',
            'jog', 'jogging', 'base', 'aerobico', 'aeróbico', 'lento', 'slow',
            'long run', 'tirada larga', 'tirada', 'domingo'
        ],
    },
    {
        label: 'CUESTAS',
        keywords: ['cuestas', 'hills', 'hill', 'subidas', 'montaña', 'mountain', 'trail', 'desnivel'],
    },
];

/**
 * Classify a workout based on its title
 */
export function classifyWorkout(title: string): WorkoutLabelType {
    if (!title) return 'OTRO';

    const normalizedTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    for (const rule of LABEL_RULES) {
        for (const keyword of rule.keywords) {
            const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (normalizedTitle.includes(normalizedKeyword)) {
                return rule.label;
            }
        }
    }

    return 'OTRO';
}

/**
 * Get label display name in Spanish
 */
export function getLabelDisplayName(label: WorkoutLabelType): string {
    const displayNames: Record<WorkoutLabelType, string> = {
        CALENTAMIENTO: 'Calentamiento',
        DESCALENTAMIENTO: 'Descalentamiento',
        FUERZA: 'Fuerza',
        SERIES: 'Series',
        TEMPO: 'Tempo',
        RODAJE: 'Rodaje',
        CUESTAS: 'Cuestas',
        RECUPERACION: 'Recuperación',
        PROGRESIVO: 'Progresivo',
        FARTLEK: 'Fartlek',
        COMPETICION: 'Competición',
        OTRO: 'Otro',
    };
    return displayNames[label];
}
