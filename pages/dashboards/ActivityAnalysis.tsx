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
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
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
    OTRO: 'Entreno',
  };
  return displayNames[label] || 'Entreno';
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

  const structure = activity.workoutStructure as any;
  const rawData = structure?.rawData || {};
  const laps = rawData.laps || [];
  const splits = rawData.splits || [];

  const tabs = [
    { id: 'resumen' as TabType, label: 'Resumen' },
    ...(laps.length > 0 ? [{ id: 'vueltas' as TabType, label: 'Vueltas' }] : []),
    ...(splits.length > 0 ? [{ id: 'splits' as TabType, label: 'Splits' }] : []),
    { id: 'graficas' as TabType, label: 'Gráficas' },
  ];

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
                className={`pb-3 font-medium transition-colors relative ${
                  activeTab === tab.id
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

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">#</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Distancia
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Tiempo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Pace</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                        Descanso
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {laps.map((lap: any, index: number) => {
                      const restTime = lap.elapsed_time - lap.moving_time;
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{index + 1}</td>
                          <td className="py-3 px-4 font-mono">{formatDistance(lap.distance)}</td>
                          <td className="py-3 px-4 font-mono">{formatDuration(lap.moving_time)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-sustraia-accent">
                            {speedToPace(lap.average_speed)}
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
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{index + 1}</td>
                          <td className="py-3 px-4 font-mono">{formatDuration(split.moving_time)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-sustraia-accent">
                            {pace}
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
              {/* Pace Chart */}
              {splits.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-display font-bold text-lg mb-6">Evolución del Pace</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={splits.map((split: any, index: number) => ({
                          km: index + 1,
                          pace: 1000 / split.average_speed / 60, // min/km
                        }))}
                      >
                        <XAxis
                          dataKey="km"
                          label={{ value: 'Kilómetro', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                          label={{ value: 'Pace (min/km)', angle: -90, position: 'insideLeft' }}
                          domain={['dataMin - 0.2', 'dataMax + 0.2']}
                        />
                        <Tooltip
                          formatter={(value: number) => {
                            const mins = Math.floor(value);
                            const secs = Math.round((value - mins) * 60);
                            return `${mins}:${secs.toString().padStart(2, '0')}/km`;
                          }}
                          labelFormatter={(label) => `Km ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="pace"
                          stroke="#0033FF"
                          strokeWidth={3}
                          dot={{ fill: '#0033FF', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Elevation Chart */}
              {splits.length > 0 && splits[0]?.elevation_difference !== undefined && (
                <Card className="p-6">
                  <h3 className="font-display font-bold text-lg mb-6">Perfil de Elevación</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={splits.map((split: any, index: number) => {
                          const cumulativeElevation = splits
                            .slice(0, index + 1)
                            .reduce((sum: number, s: any) => sum + (s.elevation_difference || 0), 0);
                          return {
                            km: index + 1,
                            elevation: cumulativeElevation,
                          };
                        })}
                      >
                        <XAxis
                          dataKey="km"
                          label={{ value: 'Kilómetro', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                          label={{ value: 'Elevación (m)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          formatter={(value: number) => `${Math.round(value)}m`}
                          labelFormatter={(label) => `Km ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="elevation"
                          stroke="#10B981"
                          fill="#10B981"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Empty state */}
              {splits.length === 0 && (
                <Card className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-display font-bold text-lg mb-2">
                    No hay datos de gráficas
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Esta actividad no tiene splits detallados para mostrar gráficas.
                  </p>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
