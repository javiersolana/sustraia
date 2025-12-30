import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, TrendingUp, TrendingDown, Minus, Loader2, Zap, Trophy, Target, RefreshCw } from 'lucide-react';
import Sidebar from '../../components/dashboards/Sidebar';
import Card from '../../components/dashboards/ui/Card';
import { Role } from '../../lib/types/dashboard';
import { api, type CompletedWorkout, type StravaLap } from '../../lib/api/client';

// Types
interface WorkoutWithLaps extends CompletedWorkout {
    title?: string;
    stravaId?: string;
    laps?: StravaLap[];
}

interface WorkoutComparison {
    currentWorkout: {
        date: string;
        title: string;
        laps: StravaLap[];
        avgPace: number; // seconds per km
    };
    previousWorkout: {
        date: string;
        title: string;
        laps: StravaLap[];
        avgPace: number;
    } | null;
    comparison: {
        lapDiffs: number[]; // difference in pace per lap (negative = improved)
        improved: number;
        worsened: number;
        same: number;
        totalDiff: number;
        insight: string;
    } | null;
}

interface WorkoutTypeOption {
    label: string;
    value: string;
    count: number;
    workouts: WorkoutWithLaps[];
}

// Helper: Format time as MM:SS
function formatPace(secondsPerKm: number): string {
    const mins = Math.floor(secondsPerKm / 60);
    const secs = Math.round(secondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Format lap time
function formatLapTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Format time difference
function formatDiff(diff: number): string {
    const sign = diff <= 0 ? '' : '+';
    return `${sign}${diff.toFixed(1)}s`;
}

// Helper: Get status color
function getStatusColor(diff: number): string {
    if (diff < -0.5) return '#10B981'; // green - improved
    if (diff > 0.5) return '#EF4444'; // red - worsened
    return '#9CA3AF'; // gray - same
}

// Helper: Get status icon
function StatusIcon({ diff }: { diff: number }) {
    if (diff < -0.5) return <TrendingUp size={16} className="text-green-500" />;
    if (diff > 0.5) return <TrendingDown size={16} className="text-red-500" />;
    return <Minus size={16} className="text-gray-400" />;
}

// Helper: Normalize workout title for grouping
function normalizeTitle(title: string): string {
    // Remove time of day variations
    let normalized = title
        .toLowerCase()
        .replace(/\s+de\s+(tarde|mañana|noche|por la mañana)/g, '')
        .replace(/\s+por\s+la\s+(tarde|mañana|noche)/g, '')
        .trim();

    // Extract series patterns like "3x10'", "2x10' LT2", etc.
    const seriesMatch = normalized.match(/(\d+x\d+['"]?\s*(?:lt\d*|r\d*['"]?)*)/i);
    if (seriesMatch) {
        return seriesMatch[1].replace(/\s+/g, ' ').trim();
    }

    // Extract distance patterns like "10km", "5k"
    const distanceMatch = normalized.match(/(\d+(?:\.\d+)?\s*k(?:m)?)/i);
    if (distanceMatch) {
        return distanceMatch[1].toLowerCase();
    }

    // For generic "carrera" titles, use the main word
    if (normalized.includes('carrera')) {
        return 'rodaje';
    }

    return normalized.slice(0, 30);
}

// Helper: Calculate pace from lap
function getLapPace(lap: StravaLap): number {
    if (!lap.distance || !lap.elapsed_time) return 0;
    return (lap.elapsed_time / lap.distance) * 1000; // seconds per km
}

// Generate insight text  
function generateInsight(comparison: WorkoutComparison['comparison']): string {
    if (!comparison) return '';

    const { improved, worsened, lapDiffs } = comparison;
    const total = lapDiffs.length;

    if (total === 0) return '';

    if (improved >= total * 0.8) {
        return '🔥 ¡Sesión excepcional! Casi todos los laps mejorados.';
    }
    if (improved >= total * 0.6) {
        return '💪 Buen trabajo. Progreso sólido en la mayoría de laps.';
    }
    if (improved >= total * 0.4) {
        return '📈 Mejora moderada. Sigue trabajando la consistencia.';
    }
    if (worsened >= total * 0.6) {
        return '😴 Sesión más lenta. ¿Fatiga acumulada? Escucha a tu cuerpo.';
    }

    // Check if last laps improved (resistance)
    const lastThree = lapDiffs.slice(-3);
    if (lastThree.length >= 3 && lastThree.every(d => d < 0)) {
        return '⚡ ¡Últimos laps mejorados! Gran resistencia al final.';
    }

    return '📊 Rendimiento estable. Mantén la consistencia.';
}

export default function ProgressView() {
    const [loading, setLoading] = useState(true);
    const [loadingLaps, setLoadingLaps] = useState(false);
    const [workouts, setWorkouts] = useState<WorkoutWithLaps[]>([]);
    const [workoutTypes, setWorkoutTypes] = useState<WorkoutTypeOption[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [comparison, setComparison] = useState<WorkoutComparison | null>(null);

    // Fetch workouts on mount
    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                setLoading(true);
                const dashboardData = await api.stats.getDashboard();
                const allWorkouts = (dashboardData.recentCompleted || []) as WorkoutWithLaps[];
                setWorkouts(allWorkouts);

                // Group workouts by normalized title
                const typeMap = new Map<string, WorkoutWithLaps[]>();
                allWorkouts.forEach(w => {
                    const title = (w as any).title || '';
                    if (!title) return;

                    const normalizedTitle = normalizeTitle(title);
                    if (!typeMap.has(normalizedTitle)) {
                        typeMap.set(normalizedTitle, []);
                    }
                    typeMap.get(normalizedTitle)!.push(w);
                });

                const types: WorkoutTypeOption[] = Array.from(typeMap.entries())
                    .filter(([_, workoutList]) => workoutList.length >= 2)
                    .map(([label, workoutList]) => ({
                        label,
                        value: label,
                        count: workoutList.length,
                        workouts: workoutList.sort((a, b) =>
                            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
                        ),
                    }))
                    .sort((a, b) => b.count - a.count);

                setWorkoutTypes(types);
                if (types.length > 0) {
                    setSelectedType(types[0].value);
                }
            } catch (err) {
                console.error('Error fetching workouts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkouts();
    }, []);

    // Fetch laps and calculate comparison when selected type changes
    useEffect(() => {
        const fetchLapsAndCompare = async () => {
            if (!selectedType) {
                setComparison(null);
                return;
            }

            const selectedOption = workoutTypes.find(t => t.value === selectedType);
            if (!selectedOption || selectedOption.workouts.length === 0) {
                setComparison(null);
                return;
            }

            const typeWorkouts = selectedOption.workouts;
            const current = typeWorkouts[0];
            const previous = typeWorkouts.length > 1 ? typeWorkouts[1] : null;

            // Fetch laps from Strava for both workouts
            setLoadingLaps(true);

            let currentLaps: StravaLap[] = [];
            let previousLaps: StravaLap[] = [];

            try {
                const currentStravaId = (current as any).stravaId;
                if (currentStravaId) {
                    const result = await api.strava.getActivityLaps(parseInt(currentStravaId));
                    currentLaps = result.laps || [];
                }
            } catch (err) {
                console.log('Could not fetch laps for current workout:', err);
            }

            try {
                if (previous) {
                    const previousStravaId = (previous as any).stravaId;
                    if (previousStravaId) {
                        const result = await api.strava.getActivityLaps(parseInt(previousStravaId));
                        previousLaps = result.laps || [];
                    }
                }
            } catch (err) {
                console.log('Could not fetch laps for previous workout:', err);
            }

            setLoadingLaps(false);

            // Calculate comparison
            let comp: WorkoutComparison['comparison'] = null;

            if (previous && currentLaps.length > 0 && previousLaps.length > 0) {
                const minLen = Math.min(currentLaps.length, previousLaps.length);
                const lapDiffs: number[] = [];

                for (let i = 0; i < minLen; i++) {
                    const currentPace = getLapPace(currentLaps[i]);
                    const previousPace = getLapPace(previousLaps[i]);
                    lapDiffs.push(currentPace - previousPace);
                }

                const improved = lapDiffs.filter(d => d < -0.5).length;
                const worsened = lapDiffs.filter(d => d > 0.5).length;
                const same = lapDiffs.length - improved - worsened;
                const totalDiff = lapDiffs.reduce((a, b) => a + b, 0);

                comp = { lapDiffs, improved, worsened, same, totalDiff, insight: '' };
                comp.insight = generateInsight(comp);
            }

            const currentAvgPace = currentLaps.length > 0
                ? currentLaps.reduce((sum, lap) => sum + getLapPace(lap), 0) / currentLaps.length
                : 0;

            const previousAvgPace = previousLaps.length > 0
                ? previousLaps.reduce((sum, lap) => sum + getLapPace(lap), 0) / previousLaps.length
                : 0;

            setComparison({
                currentWorkout: {
                    date: current.completedAt,
                    title: (current as any).title || 'Entrenamiento',
                    laps: currentLaps,
                    avgPace: currentAvgPace,
                },
                previousWorkout: previous ? {
                    date: previous.completedAt,
                    title: (previous as any).title || 'Entrenamiento',
                    laps: previousLaps,
                    avgPace: previousAvgPace,
                } : null,
                comparison: comp,
            });
        };

        fetchLapsAndCompare();
    }, [selectedType, workoutTypes]);

    // Chart data for progression
    const chartData = useMemo(() => {
        if (!selectedType) return [];

        const selectedOption = workoutTypes.find(t => t.value === selectedType);
        if (!selectedOption) return [];

        return selectedOption.workouts
            .slice(0, 6)
            .reverse()
            .map(w => ({
                date: new Date(w.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                pace: w.actualDuration && w.actualDistance
                    ? (w.actualDuration / (w.actualDistance / 1000))
                    : 0,
                distance: w.actualDistance ? (w.actualDistance / 1000) : 0,
            }));
    }, [selectedType, workoutTypes]);

    // Loading state
    if (loading) {
        return (
            <div className="flex bg-sustraia-base min-h-screen">
                <Sidebar role={Role.ATHLETE} />
                <main className="flex-1 md:ml-72 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-sustraia-accent animate-spin mx-auto mb-4" />
                        <p className="text-sustraia-gray font-medium">Cargando tu progreso...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-sustraia-base min-h-screen">
            <Sidebar role={Role.ATHLETE} />

            <main className="flex-1 md:ml-72 p-6 md:p-10 lg:p-12 max-w-[1400px] mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="font-display font-black text-3xl text-sustraia-text tracking-tight mb-4">
                        Tu Progreso
                    </h1>

                    {/* Workout Type Selector */}
                    {workoutTypes.length > 0 ? (
                        <div className="relative inline-block">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-medium text-sm hover:border-sustraia-accent transition-colors"
                            >
                                <Zap size={16} className="text-sustraia-accent" />
                                <span className="capitalize">{selectedType || 'Seleccionar tipo'}</span>
                                <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden"
                                    >
                                        {workoutTypes.map(type => (
                                            <button
                                                key={type.value}
                                                onClick={() => {
                                                    setSelectedType(type.value);
                                                    setDropdownOpen(false);
                                                }}
                                                className={`w-full px-4 py-3 text-left text-sm flex justify-between items-center hover:bg-gray-50 ${selectedType === type.value ? 'bg-sustraia-accent/5 text-sustraia-accent' : ''
                                                    }`}
                                            >
                                                <span className="font-medium capitalize">{type.label}</span>
                                                <span className="text-xs text-gray-400">{type.count} entrenos</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <p className="text-sustraia-gray text-sm">
                            Necesitas al menos 2 entrenos similares para ver comparaciones.
                        </p>
                    )}
                </header>

                {/* Loading Laps */}
                {loadingLaps && (
                    <div className="mb-6 flex items-center gap-2 text-sustraia-gray">
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="text-sm">Cargando laps de Strava...</span>
                    </div>
                )}

                {/* Main Content */}
                {comparison ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Comparison Card - Takes 2 columns */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="lg:col-span-2"
                        >
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="font-display font-bold text-lg">
                                            {comparison.currentWorkout.title}
                                        </h2>
                                        <p className="text-sm text-sustraia-gray">
                                            {new Date(comparison.currentWorkout.date).toLocaleDateString('es-ES', {
                                                day: 'numeric', month: 'long'
                                            })} vs {comparison.previousWorkout
                                                ? new Date(comparison.previousWorkout.date).toLocaleDateString('es-ES', {
                                                    day: 'numeric', month: 'short'
                                                })
                                                : 'Primera vez'}
                                        </p>
                                    </div>
                                    <Target className="w-8 h-8 text-sustraia-accent" />
                                </div>

                                {/* Laps Comparison */}
                                {comparison.comparison && comparison.currentWorkout.laps.length > 0 ? (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                        {comparison.currentWorkout.laps.map((lap, i) => {
                                            const diff = comparison.comparison!.lapDiffs[i] || 0;
                                            const lapPace = getLapPace(lap);
                                            const maxPace = Math.max(...comparison.currentWorkout.laps.map(l => getLapPace(l))) * 1.1;
                                            const progress = maxPace > 0 ? ((maxPace - lapPace) / maxPace) * 100 : 0;
                                            const color = getStatusColor(diff);

                                            return (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.03, duration: 0.4 }}
                                                    className="flex items-center gap-3"
                                                >
                                                    <span className="text-xs text-gray-500 w-12 shrink-0">
                                                        Lap {i + 1}
                                                    </span>

                                                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.max(10, progress)}%` }}
                                                            transition={{ delay: i * 0.03 + 0.1, duration: 0.5, ease: 'easeOut' }}
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    </div>

                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: i * 0.03 + 0.3 }}
                                                        className="flex items-center gap-2 w-36 shrink-0 text-right"
                                                    >
                                                        <span className="font-mono text-xs text-gray-500">
                                                            {(lap.distance / 1000).toFixed(2)}km
                                                        </span>
                                                        <span className="font-mono text-sm font-medium">
                                                            {formatPace(lapPace)}
                                                        </span>
                                                        {comparison.previousWorkout && (
                                                            <>
                                                                <span
                                                                    className="text-xs font-medium"
                                                                    style={{ color }}
                                                                >
                                                                    ({formatDiff(diff)})
                                                                </span>
                                                                <StatusIcon diff={diff} />
                                                            </>
                                                        )}
                                                    </motion.div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : comparison.currentWorkout.laps.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-sustraia-gray">
                                            No se encontraron laps para este entreno.
                                            <br />
                                            <span className="text-xs">Asegúrate de que la actividad esté sincronizada con Strava.</span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Trophy className="w-12 h-12 text-sustraia-accent mx-auto mb-4" />
                                        <p className="text-sustraia-gray">
                                            Primera vez haciendo este entreno. ¡Sigue así! 🚀
                                        </p>
                                    </div>
                                )}
                            </Card>
                        </motion.div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Summary Card */}
                            {comparison.comparison && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                                >
                                    <Card className="p-6 text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                                            className="text-4xl mb-3"
                                        >
                                            {comparison.comparison.improved >= comparison.comparison.lapDiffs.length * 0.5
                                                ? '💪' : '📊'}
                                        </motion.div>

                                        <p className="font-display font-bold text-lg mb-1">
                                            Mejoraste {comparison.comparison.improved}/{comparison.comparison.lapDiffs.length} laps
                                        </p>

                                        <p className={`text-sm font-medium mb-3 ${comparison.comparison.totalDiff < 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {formatDiff(comparison.comparison.totalDiff)} total acumulado
                                        </p>

                                        <p className="text-xs text-sustraia-gray">
                                            {comparison.comparison.insight}
                                        </p>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Pace Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.5 }}
                            >
                                <Card className="p-6">
                                    <h3 className="font-display font-bold text-sm uppercase text-gray-500 mb-4">
                                        Resumen
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Ritmo actual</span>
                                            <span className="font-mono font-medium">
                                                {comparison.currentWorkout.avgPace > 0
                                                    ? formatPace(comparison.currentWorkout.avgPace) + '/km'
                                                    : '-'}
                                            </span>
                                        </div>
                                        {comparison.previousWorkout && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Ritmo anterior</span>
                                                <span className="font-mono font-medium">
                                                    {comparison.previousWorkout.avgPace > 0
                                                        ? formatPace(comparison.previousWorkout.avgPace) + '/km'
                                                        : '-'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Laps actuales</span>
                                            <span className="font-medium">{comparison.currentWorkout.laps.length}</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Progress Chart */}
                            {chartData.length >= 2 && chartData.some(d => d.pace > 0) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.5 }}
                                >
                                    <Card className="p-6">
                                        <h3 className="font-display font-bold text-sm uppercase text-gray-500 mb-4">
                                            Evolución ritmo medio
                                        </h3>
                                        <div className="h-40">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData}>
                                                    <XAxis
                                                        dataKey="date"
                                                        tick={{ fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tickFormatter={(v) => formatPace(v)}
                                                        domain={['dataMin - 10', 'dataMax + 10']}
                                                        reversed
                                                    />
                                                    <Tooltip
                                                        formatter={(value: number) => [formatPace(value) + '/km', 'Ritmo']}
                                                        labelFormatter={(label) => `Fecha: ${label}`}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="pace"
                                                        stroke="#0033FF"
                                                        strokeWidth={2}
                                                        dot={{ fill: '#0033FF', strokeWidth: 0, r: 4 }}
                                                        activeDot={{ r: 6 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </div>
                    </div>
                ) : (
                    <Card className="p-12 text-center">
                        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-display font-bold text-lg mb-2">Sin datos suficientes</h3>
                        <p className="text-sustraia-gray text-sm max-w-md mx-auto">
                            Necesitas al menos 2 entrenamientos similares para ver tu progreso.
                            Sincroniza tus actividades de Strava y vuelve aquí.
                        </p>
                    </Card>
                )}
            </main>
        </div>
    );
}
