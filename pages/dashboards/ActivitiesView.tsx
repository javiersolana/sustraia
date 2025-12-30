import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Calendar, MapPin, Heart, Zap, ChevronRight, Loader2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboards/Sidebar';
import Card from '../../components/dashboards/ui/Card';
import { Role } from '../../lib/types/dashboard';
import { api, type CompletedWorkout } from '../../lib/api/client';

// Helper: Format duration as HH:MM:SS or MM:SS
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Format distance as km
function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

// Helper: Format pace as min/km
function formatPace(meters: number, seconds: number): string {
  if (meters === 0) return '--:--';
  const paceSeconds = (seconds / meters) * 1000;
  const minutes = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}/km`;
}

// Helper: Get relative time
function getRelativeTime(date: string): string {
  const now = new Date();
  const activityDate = new Date(date);
  const diffMs = now.getTime() - activityDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Hace menos de 1 hora';
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return activityDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Helper: Get label display name
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

// Helper: Get activity icon
function getActivityIcon(label: string) {
  switch (label) {
    case 'SERIES':
      return <Zap className="w-5 h-5 text-orange-500" />;
    case 'TEMPO':
      return <Activity className="w-5 h-5 text-red-500" />;
    case 'CUESTAS':
      return <MapPin className="w-5 h-5 text-purple-500" />;
    case 'PROGRESIVO':
      return <TrendingUp className="w-5 h-5 text-blue-500" />;
    default:
      return <Activity className="w-5 h-5 text-sustraia-accent" />;
  }
}

export default function ActivitiesView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<CompletedWorkout[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await api.stats.getActivities(page, 20);
        setActivities(response.activities);
        setTotalPages(response.pagination.pages);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [page]);

  // Loading state
  if (loading && page === 1) {
    return (
      <div className="flex bg-sustraia-base min-h-screen">
        <Sidebar role={Role.ATHLETE} />
        <main className="flex-1 md:ml-72 p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-sustraia-accent animate-spin mx-auto mb-4" />
            <p className="text-sustraia-gray font-medium">Cargando actividades...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-sustraia-base min-h-screen">
      <Sidebar role={Role.ATHLETE} />

      <main className="flex-1 md:ml-72 p-6 md:p-10 lg:p-12 max-w-[1200px] mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="font-display font-black text-3xl text-sustraia-text tracking-tight mb-2">
            Tus Actividades
          </h1>
          <p className="text-sustraia-gray">
            {activities.length > 0
              ? `${activities.length} actividad${activities.length > 1 ? 'es' : ''} reciente${activities.length > 1 ? 's' : ''}`
              : 'No hay actividades aún'}
          </p>
        </header>

        {/* Activities List */}
        {activities.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg mb-2">Sin actividades</h3>
            <p className="text-sustraia-gray text-sm max-w-md mx-auto mb-6">
              Conecta tu cuenta de Strava o registra manualmente tus entrenamientos para empezar.
            </p>
            <button
              onClick={() => navigate('/dashboard/atleta')}
              className="px-6 py-2 bg-sustraia-accent text-white rounded-full font-medium hover:bg-sustraia-accent-hover transition-colors"
            >
              Volver al inicio
            </button>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const label = activity.label || 'OTRO';
              const displayName = activity.humanReadable || `${getLabelDisplayName(label)}`;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => navigate(`/dashboard/atleta/actividades/${activity.id}`)}
                  className="cursor-pointer"
                >
                  <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      {/* Left: Icon + Info */}
                      <div className="flex gap-4 flex-1">
                        <div className="mt-1">
                          {getActivityIcon(label)}
                        </div>

                        <div className="flex-1">
                          {/* Title */}
                          <h3 className="font-display font-bold text-lg mb-1">
                            {activity.title || displayName}
                          </h3>

                          {/* Date & Type */}
                          <div className="flex items-center gap-3 text-sm text-sustraia-gray mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {getRelativeTime(activity.completedAt)}
                            </span>
                            {activity.classificationConfidence && (
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                                {getLabelDisplayName(label)}
                              </span>
                            )}
                          </div>

                          {/* Metrics */}
                          <div className="flex items-center gap-6 text-sm">
                            {activity.actualDuration && (
                              <div>
                                <span className="font-mono font-bold text-sustraia-text">
                                  {formatDuration(activity.actualDuration)}
                                </span>
                              </div>
                            )}

                            {activity.actualDistance && (
                              <>
                                <div className="h-4 w-px bg-gray-200" />
                                <div>
                                  <span className="font-mono font-bold text-sustraia-text">
                                    {formatDistance(activity.actualDistance)}
                                  </span>
                                </div>
                              </>
                            )}

                            {activity.actualDistance && activity.actualDuration && (
                              <>
                                <div className="h-4 w-px bg-gray-200" />
                                <div>
                                  <span className="font-mono font-bold text-sustraia-text">
                                    {formatPace(activity.actualDistance, activity.actualDuration)}
                                  </span>
                                </div>
                              </>
                            )}

                            {activity.avgHeartRate && (
                              <>
                                <div className="h-4 w-px bg-gray-200" />
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4 text-red-500" />
                                  <span className="font-mono text-sustraia-text">
                                    {activity.avgHeartRate} bpm
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Human readable description */}
                          {activity.humanReadable && activity.title !== activity.humanReadable && (
                            <p className="mt-2 text-xs text-gray-500 italic">
                              {activity.humanReadable}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Arrow */}
                      <div className="ml-4">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {page > 1 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-sustraia-accent transition-colors"
                  >
                    Anterior
                  </button>
                )}

                <span className="px-4 py-2 text-gray-600">
                  Página {page} de {totalPages}
                </span>

                {page < totalPages && (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-sustraia-accent transition-colors"
                  >
                    Siguiente
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
