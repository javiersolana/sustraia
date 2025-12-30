import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  Calendar,
  Clock,
  MapPin,
  Heart,
  Zap,
  TrendingUp,
  Loader2,
  Flame,
  Target,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  ReferenceLine,
  Legend,
  CartesianGrid,
} from 'recharts';
import Sidebar from '../../components/dashboards/Sidebar';
import Card from '../../components/dashboards/ui/Card';
import { Role } from '../../lib/types/dashboard';
import { api, type CompletedWorkout } from '../../lib/api/client';

// Helpers
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(meters)} m`;
}

function formatPace(meters: number, seconds: number): string {
  if (meters === 0) return '--:--';
  const paceSeconds = (seconds / meters) * 1000;
  const minutes = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}/km`;
}

function speedToPace(speedMs: number): string {
  if (speedMs === 0) return '--:--';
  const paceSeconds = 1000 / speedMs;
  const minutes = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}/km`;
}

function speedToPaceNumeric(speedMs: number): number {
  if (speedMs === 0) return 0;
  return 1000 / speedMs / 60; // min/km
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getLabelDisplayName(label: string): string {
  const displayNames: Record<string, string> = {
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
    OTRO: 'Entreno',
  };
  return displayNames[label] || 'Entreno';
}

// Detect lap type based on pace, HR and position
interface LapType {
  type: 'warmup' | 'work' | 'recovery' | 'cooldown';
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

function detectLapType(
  lap: any,
  index: number,
  totalLaps: number,
  avgPaceAll: number,
  avgHRAll: number
): LapType {
  const lapPace = speedToPaceNumeric(lap.average_speed);
  const lapHR = lap.average_heartrate;
  const restTime = lap.elapsed_time - lap.moving_time;

  // First lap(s) are likely warmup
  if (index === 0 && totalLaps > 3) {
    if (lapPace > avgPaceAll * 1.1 || (lapHR && lapHR < avgHRAll * 0.9)) {
      return {
        type: 'warmup',
        label: 'Calentamiento',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-l-amber-400',
      };
    }
  }

  // Last lap(s) are likely cooldown
  if (index === totalLaps - 1 && totalLaps > 3) {
    if (lapPace > avgPaceAll * 1.1 || (lapHR && lapHR < avgHRAll * 0.9)) {
      return {
        type: 'cooldown',
        label: 'Enfriamiento',
        color: 'text-sky-600',
        bgColor: 'bg-sky-50',
        borderColor: 'border-l-sky-400',
      };
    }
  }

  // Recovery laps: significant rest time or much slower pace
  if (restTime > 30 || lapPace > avgPaceAll * 1.25) {
    return {
      type: 'recovery',
      label: 'Recuperación',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-l-gray-300',
    };
  }

  // Work intervals: faster than average or high HR
  if (lapPace < avgPaceAll * 0.95 || (lapHR && lapHR > avgHRAll * 1.05)) {
    return {
      type: 'work',
      label: 'Serie',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-l-rose-400',
    };
  }

  // Default to work
  return {
    type: 'work',
    label: 'Serie',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-l-rose-400',
  };
}

type TabType = 'resumen' | 'vueltas' | 'splits' | 'graficas';

export default function ActivityAnalysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<CompletedWorkout | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('resumen');

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await api.stats.getActivity(id);
        setActivity(response.activity);
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  // Data Processing (Safe for null activity)
  const structure = activity?.workoutStructure as any;
  const rawData = structure?.rawData || {};
  const laps = rawData.laps || [];
  const splits = rawData.splits || [];

  // Calculate averages for lap type detection
  const avgPaceAll = laps.length > 0
    ? laps.reduce((sum: number, l: any) => sum + speedToPaceNumeric(l.average_speed), 0) / laps.length
    : 0;
  const lapsWithHR = laps.filter((l: any) => l.average_heartrate);
  const avgHRAll = lapsWithHR.length > 0
    ? lapsWithHR.reduce((sum: number, l: any) => sum + l.average_heartrate, 0) / lapsWithHR.length
    : 0;

  // Detect lap types
  const lapsWithTypes = laps.map((lap: any, index: number) => ({
    ...lap,
    lapType: detectLapType(lap, index, laps.length, avgPaceAll, avgHRAll),
  }));

  // Check if this is a series/interval workout
  const isSeriesWorkout = activity?.label === 'SERIES' || activity?.label === 'FARTLEK';
  const isCompetition = activity?.label === 'COMPETICION';

  const tabs = [
    { id: 'resumen' as TabType, label: 'Resumen' },
    ...(laps.length > 0 ? [{ id: 'vueltas' as TabType, label: 'Vueltas' }] : []),
    ...(splits.length > 0 ? [{ id: 'splits' as TabType, label: 'Splits' }] : []),
    { id: 'graficas' as TabType, label: 'Gráficas' },
  ];

  // Prepare chart data based on workout type
  const seriesChartData = React.useMemo(() => {
    return lapsWithTypes.map((lap: any, index: number) => ({
      name: `L${index + 1}`,
      pace: speedToPaceNumeric(lap.average_speed || 0),
      hr: Math.round(lap.average_heartrate || 0),
      type: lap.lapType.type,
      distance: lap.distance || 0,
      // For Tooltip
      formattedPace: speedToPace(lap.average_speed || 0),
      duration: formatDuration(lap.moving_time || 0),
      avgHr: Math.round(lap.average_heartrate || 0),
    }));
  }, [lapsWithTypes]);

  const rodajeChartData = React.useMemo(() => {
    // User wants "Pulso Medio y Pulso Máximo de cada vuelta de 1km"
    // Use laps if available (preferred)
    if (laps.length > 0) {
      // Accumulate distance for X axis
      let cumulativeDist = 0;
      return laps.map((lap: any, index: number) => {
        const dist = lap.distance || 0;
        cumulativeDist += dist;
        return {
          name: `${(cumulativeDist / 1000).toFixed(1)}k`,
          km: (cumulativeDist / 1000).toFixed(1), // for XAxis consistency
          avgHr: Math.round(lap.average_heartrate || 0),
          maxHr: Math.round(lap.max_heartrate || 0),
          pace: speedToPaceNumeric(lap.average_speed || 0), // useful context
          elevation: lap.total_elevation_gain || 0,
          lapIndex: index + 1
        };
      });
    }

    // Fallback to splits if no laps
    let cumulativeDist = 0;
    return splits.map((split: any, index: number) => {
      const dist = split.distance || 0;
      cumulativeDist += dist;
      return {
        name: `${(cumulativeDist / 1000).toFixed(1)}k`,
        km: (cumulativeDist / 1000).toFixed(1),
        avgHr: Math.round(split.average_heartrate || 0),
        maxHr: Math.round(split.max_heartrate || 0),
        pace: speedToPaceNumeric(split.average_speed || 0),
        elevation: split.elevation_difference || 0,
        lapIndex: index + 1
      };
    });
  }, [laps, splits]);

  if (loading) {
    return (
      <div className="flex bg-sustraia-base min-h-screen">
        <Sidebar role={Role.ATHLETE} />
        <main className="flex-1 md:ml-72 p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-sustraia-accent animate-spin mx-auto mb-4" />
            <p className="text-sustraia-gray font-medium">Cargando análisis...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex bg-sustraia-base min-h-screen">
        <Sidebar role={Role.ATHLETE} />
        <main className="flex-1 md:ml-72 p-6 flex items-center justify-center">
          <Card className="p-12 text-center max-w-md">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg mb-2">Actividad no encontrada</h3>
            <button
              onClick={() => navigate('/dashboard/atleta/actividades')}
              className="mt-4 px-6 py-2 bg-sustraia-accent text-white rounded-full font-medium hover:bg-sustraia-accent-hover transition-colors"
            >
              Volver a actividades
            </button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-sustraia-base min-h-screen">
      <Sidebar role={Role.ATHLETE} />

      <main className="flex-1 md:ml-72 p-6 md:p-10 lg:p-12 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/atleta/actividades')}
            className="flex items-center gap-2 text-sustraia-gray hover:text-sustraia-text mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

          <h1 className="font-display font-black text-3xl text-sustraia-text tracking-tight mb-2">
            {activity.title || 'Actividad'}
          </h1>

          <div className="flex items-center gap-3 text-sustraia-gray">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(activity.completedAt)}
            </span>
            {activity.label && (
              <span className="px-3 py-1 bg-sustraia-accent/10 text-sustraia-accent rounded-full text-sm font-medium">
                {getLabelDisplayName(activity.label)}
              </span>
            )}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {activity.actualDuration && (
            <Card className="p-6 text-center">
              <Clock className="w-6 h-6 text-sustraia-accent mx-auto mb-2" />
              <div className="font-mono font-black text-3xl text-sustraia-text mb-1">
                {formatDuration(activity.actualDuration)}
              </div>
              <div className="text-sm text-sustraia-gray">Tiempo</div>
            </Card>
          )}

          {activity.actualDistance && (
            <Card className="p-6 text-center">
              <MapPin className="w-6 h-6 text-sustraia-accent mx-auto mb-2" />
              <div className="font-mono font-black text-3xl text-sustraia-text mb-1">
                {formatDistance(activity.actualDistance)}
              </div>
              <div className="text-sm text-sustraia-gray">Distancia</div>
            </Card>
          )}

          {activity.actualDistance && activity.actualDuration && (
            <Card className="p-6 text-center">
              <Zap className="w-6 h-6 text-sustraia-accent mx-auto mb-2" />
              <div className="font-mono font-black text-3xl text-sustraia-text mb-1">
                {formatPace(activity.actualDistance, activity.actualDuration)}
              </div>
              <div className="text-sm text-sustraia-gray">Pace promedio</div>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 font-medium transition-colors relative ${activeTab === tab.id
                  ? 'text-sustraia-accent'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sustraia-accent"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'resumen' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Classification Info */}
              {activity.humanReadable && (
                <Card className="p-6">
                  <h3 className="font-display font-bold text-lg mb-4">Tipo detectado</h3>
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-sustraia-accent mt-1" />
                    <div>
                      <p className="font-medium text-sustraia-text">{activity.humanReadable}</p>
                      {activity.classificationConfidence && (
                        <p className="text-sm text-gray-500 mt-1">
                          Confianza:{' '}
                          {activity.classificationConfidence === 'high'
                            ? 'Alta'
                            : activity.classificationConfidence === 'medium'
                              ? 'Media'
                              : 'Baja'}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Heart Rate */}
              {(activity.avgHeartRate || activity.maxHeartRate) && (
                <Card className="p-6">
                  <h3 className="font-display font-bold text-lg mb-4">Frecuencia Cardíaca</h3>
                  <div className="space-y-3">
                    {activity.avgHeartRate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Promedio</span>
                        <span className="font-mono font-bold text-lg flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          {activity.avgHeartRate} bpm
                        </span>
                      </div>
                    )}
                    {activity.maxHeartRate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Máximo</span>
                        <span className="font-mono font-bold text-lg flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          {activity.maxHeartRate} bpm
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Calories */}
              {activity.calories && (
                <Card className="p-6">
                  <h3 className="font-display font-bold text-lg mb-4">Calorías</h3>
                  <div className="font-mono font-black text-3xl text-sustraia-text">
                    {activity.calories} kcal
                  </div>
                </Card>
              )}

              {/* Notes */}
              {activity.notes && (
                <Card className="p-6 lg:col-span-2">
                  <h3 className="font-display font-bold text-lg mb-4">Notas</h3>
                  <p className="text-gray-700">{activity.notes}</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'vueltas' && laps.length > 0 && (
            <Card className="p-6">
              <h3 className="font-display font-bold text-lg mb-6">
                Vueltas manuales ({laps.length})
              </h3>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <span className="text-gray-600">Calentamiento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <span className="text-gray-600">Serie</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  <span className="text-gray-600">Recuperación</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-400"></div>
                  <span className="text-gray-600">Enfriamiento</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">#</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tipo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Distancia
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Tiempo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Pace</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-red-500" /> Media
                        </span>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-red-500" /> Máx
                        </span>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Descanso
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lapsWithTypes.map((lap: any, index: number) => {
                      const restTime = lap.elapsed_time - lap.moving_time;
                      const lapType = lap.lapType as LapType;
                      return (
                        <tr
                          key={index}
                          className={`border-b border-gray-100 border-l-4 ${lapType.borderColor} ${lapType.bgColor}`}
                        >
                          <td className="py-3 px-4 font-medium">{index + 1}</td>
                          <td className={`py-3 px-4 text-sm font-medium ${lapType.color}`}>
                            {lapType.label}
                          </td>
                          <td className="py-3 px-4 font-mono">{formatDistance(lap.distance)}</td>
                          <td className="py-3 px-4 font-mono">{formatDuration(lap.moving_time)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-sustraia-accent">
                            {speedToPace(lap.average_speed)}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {lap.average_heartrate ? (
                              <span className="text-red-600">{Math.round(lap.average_heartrate)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {lap.max_heartrate ? (
                              <span className="text-red-600 font-bold">{Math.round(lap.max_heartrate)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-500">
                            {restTime > 0 ? `${Math.round(restTime)}s` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'splits' && splits.length > 0 && (
            <Card className="p-6">
              <h3 className="font-display font-bold text-lg mb-6">
                Splits por kilómetro ({splits.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Km</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Tiempo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Pace</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-red-500" /> Media
                        </span>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-red-500" /> Máx
                        </span>
                      </th>
                      {splits[0]?.elevation_difference !== undefined && (
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                          Desnivel
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {splits.map((split: any, index: number) => {
                      const pace = speedToPace(split.average_speed);
                      const paceNum = speedToPaceNumeric(split.average_speed);
                      const avgPace = splits.reduce((sum: number, s: any) =>
                        sum + speedToPaceNumeric(s.average_speed), 0) / splits.length;

                      // Color code based on pace relative to average
                      let paceColor = 'text-sustraia-accent';
                      if (paceNum < avgPace * 0.95) {
                        paceColor = 'text-green-600'; // Faster
                      } else if (paceNum > avgPace * 1.05) {
                        paceColor = 'text-orange-500'; // Slower
                      }

                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{index + 1}</td>
                          <td className="py-3 px-4 font-mono">{formatDuration(split.moving_time)}</td>
                          <td className={`py-3 px-4 font-mono font-bold ${paceColor}`}>
                            {pace}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {split.average_heartrate ? (
                              <span className="text-red-600">{Math.round(split.average_heartrate)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {split.max_heartrate ? (
                              <span className="text-red-600 font-bold">{Math.round(split.max_heartrate)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          {split.elevation_difference !== undefined && (
                            <td className="py-3 px-4 font-mono text-gray-600">
                              {split.elevation_difference > 0 ? '+' : ''}
                              {Math.round(split.elevation_difference)}m
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'graficas' && (
            <div className="space-y-6">

              {/* --- SERIES / INTERVALS CHART --- */}
              {isSeriesWorkout && laps.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-display font-bold text-lg mb-2">Análisis de Series</h3>
                  <p className="text-sm text-gray-500 mb-6">Ritmo y Frecuencia Cardíaca por vuelta</p>

                  <div className="overflow-x-auto">
                    <ComposedChart
                      width={800}
                      height={400}
                      data={seriesChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      style={{ maxWidth: '100%' }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <Legend verticalAlign="top" height={36} />
                      <XAxis
                        dataKey="name"
                        label={{ value: 'Vueltas', position: 'insideBottom', offset: -10 }}
                        tick={{ fontSize: 12 }}
                      />
                      {/* Pace Axis (Left, Reversed) */}
                      <YAxis
                        yAxisId="pace"
                        orientation="left"
                        reversed
                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        label={{ value: 'Ritmo (min/km)', angle: -90, position: 'insideLeft' }}
                        tickFormatter={(value) => {
                          const mins = Math.floor(value);
                          const secs = Math.round((value - mins) * 60);
                          return `${mins}:${secs.toString().padStart(2, '0')}`;
                        }}
                      />
                      {/* HR Axis (Right) */}
                      <YAxis
                        yAxisId="hr"
                        orientation="right"
                        domain={['dataMin - 10', 'dataMax + 10']}
                        label={{ value: 'FC (bpm)', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip
                        labelStyle={{ color: '#000', fontWeight: 'bold' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: any, name: string, props: any) => {
                          if (name === 'Ritmo') return [props.payload.formattedPace, name];
                          if (name === 'FC Media') return [`${value} bpm`, name];
                          return [value, name];
                        }}
                      />

                      {/* Pace Bar - Colored by type */}
                      <Bar yAxisId="pace" dataKey="pace" name="Ritmo" barSize={20} radius={[4, 4, 0, 0]}>
                        {seriesChartData.map((entry: any, index: number) => {
                          const colors: Record<string, string> = {
                            warmup: '#fbbf24', // amber
                            work: '#f43f5e',   // rose
                            recovery: '#9ca3af', // gray
                            cooldown: '#38bdf8', // sky
                          };
                          return <Cell key={index} fill={colors[entry.type] || '#8884d8'} />;
                        })}
                      </Bar>

                      {/* HR Line */}
                      <Line
                        yAxisId="hr"
                        type="monotone"
                        dataKey="hr"
                        name="FC Media"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </div>
                </Card>
              )}

              {/* --- RODAJE / TEMPO / CONTINUOUS CHART --- */}
              {(!isSeriesWorkout) && (laps.length > 0 || splits.length > 0) && (
                <>
                  {/* Only show HR chart if we have HR data */}
                  {rodajeChartData.some(d => d.avgHr > 0 || d.maxHr > 0) ? (
                    <Card className="p-6">
                      <h3 className="font-display font-bold text-lg mb-2">Deriva Cardíaca (Cardiac Drift)</h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Evolución del pulso medio y máximo por {laps.length > 0 ? 'vuelta' : 'km'}
                      </p>

                      <ComposedChart
                        width={800}
                        height={400}
                        data={rodajeChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        style={{ maxWidth: '100%' }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <Legend verticalAlign="top" height={36} />
                        <XAxis
                          dataKey="name"
                          label={{ value: 'Distancia', position: 'insideBottom', offset: -10 }}
                        />

                        {/* HR Axis */}
                        <YAxis
                          domain={['dataMin - 5', 'dataMax + 5']}
                          label={{ value: 'FC (bpm)', angle: -90, position: 'insideLeft' }}
                        />

                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />

                        <Area
                          type="monotone"
                          dataKey="maxHr"
                          name="FC Máxima"
                          stroke="#f87171"
                          fill="#fecaca"
                          fillOpacity={0.4}
                          strokeWidth={2}
                        />

                        <Line
                          type="monotone"
                          dataKey="avgHr"
                          name="FC Media"
                          stroke="#dc2626"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#dc2626', strokeWidth: 2, stroke: '#fff' }}
                        />
                      </ComposedChart>
                    </Card>
                  ) : (
                    <Card className="p-6">
                      <h3 className="font-display font-bold text-lg mb-2">Frecuencia Cardíaca</h3>
                      <div className="text-center py-8">
                        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No hay datos de frecuencia cardíaca para esta actividad</p>
                        <p className="text-sm text-gray-400 mt-1">Asegúrate de que tu monitor de FC esté conectado durante los entrenamientos</p>
                      </div>
                    </Card>
                  )}

                  {/* Elevation profile if available */}
                  {(laps.some((l: any) => l.total_elevation_gain) || splits[0]?.elevation_difference !== undefined) && (
                    <Card className="p-6">
                      <h3 className="font-display font-bold text-lg mb-2">Perfil de Elevación</h3>
                      <p className="text-sm text-gray-500 mb-6">Desnivel acumulado durante la actividad</p>
                      <div className="overflow-x-auto">
                        <AreaChart
                          width={800}
                          height={256}
                          data={rodajeChartData.map((d, i, arr) => ({
                            ...d,
                            cumulativeElev: arr.slice(0, i + 1).reduce((sum, x) => sum + x.elevation, 0),
                          }))}
                          style={{ maxWidth: '100%' }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <defs>
                            <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="name"
                            label={{ value: 'Distancia', position: 'insideBottom', offset: -5 }}
                          />
                          <YAxis
                            label={{ value: 'Elevación (m)', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip
                            formatter={(value: number) => [`${Math.round(value)}m`, 'Elevación']}
                            labelFormatter={(label) => `Km ${label}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="cumulativeElev"
                            stroke="#10B981"
                            strokeWidth={2}
                            fill="url(#elevGradient)"
                          />
                        </AreaChart>
                      </div>
                    </Card>
                  )}

                  {/* Pace consistency chart */}
                  <Card className="p-6">
                    <h3 className="font-display font-bold text-lg mb-2">Consistencia del Ritmo</h3>
                    <p className="text-sm text-gray-500 mb-6">Variación del pace respecto a la media</p>
                    <div className="overflow-x-auto">
                      <BarChart
                        width={800}
                        height={256}
                        data={rodajeChartData.map(d => {
                          const data = rodajeChartData;
                          const avgPace = data.reduce((sum, x) => sum + x.pace, 0) / data.length;
                          return {
                            ...d,
                            diff: ((d.pace - avgPace) / avgPace) * 100,
                          };
                        })}
                        style={{ maxWidth: '100%' }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`}
                          domain={[-15, 15]}
                        />
                        <Tooltip
                          formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, 'Variación']}
                          labelFormatter={(label) => `Km ${label}`}
                        />
                        <ReferenceLine y={0} stroke="#9ca3af" />
                        <Bar dataKey="diff" radius={[4, 4, 0, 0]}>
                          {rodajeChartData.map((_, index) => {
                            const data = rodajeChartData;
                            const avgPace = data.reduce((sum, x) => sum + x.pace, 0) / data.length;
                            const diff = ((data[index].pace - avgPace) / avgPace) * 100;
                            return <Cell key={index} fill={diff > 0 ? '#f97316' : '#22c55e'} />;
                          })}
                        </Bar>
                      </BarChart>
                    </div>
                  </Card>
                </>
              )}

              {/* Fallback when no data */}
              {splits.length === 0 && laps.length === 0 && (
                <Card className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-display font-bold text-lg mb-2">
                    No hay datos de gráficas
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Esta actividad no tiene splits ni vueltas detalladas para mostrar gráficas.
                  </p>
                </Card>
              )}

              {/* Basic stats chart when only have general data */}
              {splits.length === 0 && laps.length === 0 && activity.actualDistance && activity.actualDuration && (
                <Card className="p-6">
                  <h3 className="font-display font-bold text-lg mb-4">Resumen de la Actividad</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-2xl">
                      <Flame className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-3xl font-mono font-bold text-blue-700">
                        {formatDistance(activity.actualDistance)}
                      </div>
                      <div className="text-sm text-blue-600 mt-1">Distancia total</div>
                    </div>
                    <div className="text-center p-6 bg-green-50 rounded-2xl">
                      <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-3xl font-mono font-bold text-green-700">
                        {formatDuration(activity.actualDuration)}
                      </div>
                      <div className="text-sm text-green-600 mt-1">Tiempo total</div>
                    </div>
                    <div className="text-center p-6 bg-purple-50 rounded-2xl">
                      <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-3xl font-mono font-bold text-purple-700">
                        {formatPace(activity.actualDistance, activity.actualDuration)}
                      </div>
                      <div className="text-sm text-purple-600 mt-1">Pace promedio</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
