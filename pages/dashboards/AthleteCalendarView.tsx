import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Plus, Calendar as CalendarIcon, Target, Heart, Zap, Clock, TrendingUp, MapPin, Activity } from 'lucide-react';
import Sidebar from '../../components/dashboards/Sidebar';
import Calendar from '../../components/dashboards/Calendar';
import Card from '../../components/dashboards/ui/Card';
import { Role } from '../../lib/types/dashboard';
import { api, type TrainingPlan, type CompletedWorkout } from '../../lib/api/client';

// Format pace (seconds per km to min:ss)
function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

interface CalendarEvent {
  id: string;
  date: Date;
  type: 'plan' | 'completed' | 'race';
  title: string;
  data: TrainingPlan | (CompletedWorkout & { title?: string }) | any;
}

export default function AthleteCalendarView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddRaceModal, setShowAddRaceModal] = useState(false);
  const [raceDate, setRaceDate] = useState<Date | null>(null);
  const [raceName, setRaceName] = useState('');
  const [raceDistance, setRaceDistance] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch training plans
        const plans = await api.trainingPlans.getAll();
        setTrainingPlans(plans);

        // Fetch completed workouts from dashboard
        const dashboardData = await api.stats.getDashboard();
        setCompletedWorkouts(dashboardData.recentCompleted || []);

      } catch (err) {
        console.error('Error fetching calendar data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate calendar events
  const calendarEvents: CalendarEvent[] = [
    ...trainingPlans.map(plan => ({
      id: plan.id,
      date: new Date(plan.date),
      type: 'plan' as const,
      title: plan.title,
      data: plan,
    })),
    ...completedWorkouts.map(workout => ({
      id: workout.id,
      date: new Date(workout.completedAt),
      type: 'completed' as const,
      title: (workout as any).title || 'Entrenamiento completado',
      data: workout,
    })),
  ];

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'completed') {
      navigate(`/dashboard/atleta/actividades/${event.id}`);
    } else {
      setSelectedEvent(event);
    }
  };

  const handleDayClick = (date: Date) => {
    // Open modal to add race/objective
    setRaceDate(date);
    setShowAddRaceModal(true);
  };

  if (loading) {
    return (
      <div className="flex bg-sustraia-base min-h-screen">
        <Sidebar role={Role.ATHLETE} />
        <main className="flex-1 md:ml-72 p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-sustraia-accent animate-spin mx-auto mb-4" />
            <p className="text-sustraia-gray font-medium">Cargando calendario...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-sustraia-base min-h-screen">
      <Sidebar role={Role.ATHLETE} />

      <main className="flex-1 md:ml-72 p-6 md:p-10 lg:p-12 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-3xl text-sustraia-text tracking-tight mb-2">
              Mi Calendario
            </h1>
            <p className="text-sustraia-gray">
              Entrenamientos programados y completados
            </p>
          </div>

          <button
            onClick={() => setShowAddRaceModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-sustraia-accent text-white rounded-full font-bold shadow-lg shadow-blue-500/30 hover:bg-sustraia-accent-hover transition-all"
          >
            <Target size={18} />
            Añadir Objetivo
          </button>
        </header>

        {/* Calendar */}
        <Calendar
          events={calendarEvents}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
        />

        {/* Event Detail Modal */}
        <AnimatePresence>
          {selectedEvent && selectedEvent.type === 'plan' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedEvent(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-display font-bold text-2xl text-sustraia-text">{selectedEvent.title}</h3>
                      <p className="text-sustraia-gray text-sm mt-1">
                        {new Date(selectedEvent.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Summary Stats */}
                  {(() => {
                    const plan = selectedEvent.data as TrainingPlan;
                    const totalDistance = plan.blocks?.reduce((sum, b) => sum + (b.distanceMeters || 0), 0) || 0;
                    const totalDuration = plan.blocks?.reduce((sum, b) => sum + (b.durationSeconds || 0), 0) || 0;

                    return (
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {totalDistance > 0 && (
                          <div className="bg-blue-50 rounded-2xl p-4 text-center">
                            <MapPin className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                            <span className="font-display font-bold text-xl text-blue-700 block">
                              {(totalDistance / 1000).toFixed(1)}
                            </span>
                            <span className="text-xs text-blue-600">km</span>
                          </div>
                        )}
                        {totalDuration > 0 && (
                          <div className="bg-green-50 rounded-2xl p-4 text-center">
                            <Clock className="w-5 h-5 text-green-600 mx-auto mb-1" />
                            <span className="font-display font-bold text-xl text-green-700 block">
                              {Math.floor(totalDuration / 60)}
                            </span>
                            <span className="text-xs text-green-600">min</span>
                          </div>
                        )}
                        <div className="bg-purple-50 rounded-2xl p-4 text-center">
                          <Activity className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                          <span className="font-display font-bold text-xl text-purple-700 block">
                            {plan.blocks?.length || 0}
                          </span>
                          <span className="text-xs text-purple-600">bloques</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Description */}
                  {(selectedEvent.data as TrainingPlan).description && (
                    <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {(selectedEvent.data as TrainingPlan).description}
                      </p>
                    </div>
                  )}

                  {/* Bloques de entrenamiento */}
                  <h4 className="font-bold text-sm uppercase text-gray-500 mb-3 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Estructura del entrenamiento
                  </h4>
                  <div className="space-y-3">
                    {(selectedEvent.data as TrainingPlan).blocks?.map((block, i) => {
                      const blockColor = block.type === 'WARMUP' ? 'yellow' :
                        block.type === 'RUN' ? 'green' :
                          block.type === 'INTERVALS' ? 'red' :
                            block.type === 'REST' ? 'gray' : 'blue';

                      const blockName = block.type === 'WARMUP' ? 'Calentamiento' :
                        block.type === 'RUN' ? 'Carrera continua' :
                          block.type === 'INTERVALS' ? 'Series' :
                            block.type === 'REST' ? 'Recuperación' : 'Enfriamiento';

                      return (
                        <div
                          key={i}
                          className={`p-4 rounded-2xl border-l-4 ${
                            blockColor === 'yellow' ? 'bg-yellow-50 border-yellow-400' :
                            blockColor === 'green' ? 'bg-green-50 border-green-500' :
                            blockColor === 'red' ? 'bg-red-50 border-red-500' :
                            blockColor === 'gray' ? 'bg-gray-100 border-gray-400' :
                            'bg-blue-50 border-blue-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-bold text-sm ${
                              blockColor === 'yellow' ? 'text-yellow-700' :
                              blockColor === 'green' ? 'text-green-700' :
                              blockColor === 'red' ? 'text-red-700' :
                              blockColor === 'gray' ? 'text-gray-600' :
                              'text-blue-700'
                            }`}>
                              {blockName}
                            </span>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                              Bloque {i + 1}
                            </span>
                          </div>

                          {/* Duration/Distance */}
                          <div className="flex flex-wrap gap-4 text-sm">
                            {block.distanceMeters && block.distanceMeters > 0 && (
                              <div className="flex items-center gap-1">
                                <MapPin size={14} className="text-gray-400" />
                                <span className="font-mono font-medium">
                                  {block.distanceMeters >= 1000
                                    ? `${(block.distanceMeters / 1000).toFixed(1)} km`
                                    : `${block.distanceMeters} m`
                                  }
                                </span>
                              </div>
                            )}
                            {block.durationSeconds && block.durationSeconds > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock size={14} className="text-gray-400" />
                                <span className="font-mono font-medium">
                                  {block.durationSeconds >= 60
                                    ? `${Math.floor(block.durationSeconds / 60)} min`
                                    : `${block.durationSeconds} seg`
                                  }
                                </span>
                              </div>
                            )}
                            {block.repetitions && block.repetitions > 1 && (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400">×</span>
                                <span className="font-mono font-medium">{block.repetitions} reps</span>
                              </div>
                            )}
                          </div>

                          {/* Pace targets */}
                          {(block.paceMin || block.paceMax) && (
                            <div className="mt-2 pt-2 border-t border-gray-200/50">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Ritmo objetivo:</span>
                                <span className="font-mono text-sm font-bold text-sustraia-accent">
                                  {block.paceMin && block.paceMax
                                    ? `${formatPace(block.paceMin)} - ${formatPace(block.paceMax)} /km`
                                    : block.paceMin
                                      ? `< ${formatPace(block.paceMin)} /km`
                                      : `> ${formatPace(block.paceMax!)} /km`
                                  }
                                </span>
                              </div>
                            </div>
                          )}

                          {/* HR targets */}
                          {(block.hrMin || block.hrMax) && (
                            <div className="mt-2 pt-2 border-t border-gray-200/50">
                              <div className="flex items-center gap-2">
                                <Heart size={14} className="text-red-400" />
                                <span className="text-xs text-gray-500">FC objetivo:</span>
                                <span className="font-mono text-sm font-bold text-red-600">
                                  {block.hrMin && block.hrMax
                                    ? `${block.hrMin} - ${block.hrMax} bpm`
                                    : block.hrMin
                                      ? `> ${block.hrMin} bpm`
                                      : `< ${block.hrMax} bpm`
                                  }
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Rest between reps */}
                          {block.restSeconds && block.restSeconds > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              Descanso entre series: {block.restSeconds >= 60
                                ? `${Math.floor(block.restSeconds / 60)} min`
                                : `${block.restSeconds} seg`
                              }
                            </div>
                          )}

                          {/* Notes */}
                          {block.notes && (
                            <div className="mt-2 pt-2 border-t border-gray-200/50">
                              <p className="text-xs text-gray-600 italic">{block.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="w-full mt-6 py-3 bg-sustraia-accent text-white rounded-full font-bold hover:bg-sustraia-accent-hover transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Race/Objective Modal */}
        <AnimatePresence>
          {showAddRaceModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddRaceModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-md w-full p-6"
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-display font-bold text-xl">Añadir Carrera/Objetivo</h3>
                  <button
                    onClick={() => setShowAddRaceModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la carrera
                    </label>
                    <input
                      type="text"
                      value={raceName}
                      onChange={(e) => setRaceName(e.target.value)}
                      placeholder="Ej: Maratón de Valencia"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sustraia-accent focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={raceDate ? raceDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setRaceDate(new Date(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sustraia-accent focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distancia (km)
                    </label>
                    <input
                      type="text"
                      value={raceDistance}
                      onChange={(e) => setRaceDistance(e.target.value)}
                      placeholder="Ej: 42.195"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sustraia-accent focus:border-transparent outline-none"
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    Tu entrenador recibirá una notificación cuando añadas un objetivo.
                  </p>

                  <button
                    onClick={async () => {
                      if (!raceName || !raceDate) {
                        alert('Por favor, rellena el nombre y la fecha de la carrera.');
                        return;
                      }

                      try {
                        // Get current user ID from auth
                        const profile = await api.auth.getProfile();
                        const athleteId = profile.user.id;

                        await api.goals.addAthleteGoal(athleteId, {
                          name: raceName,
                          date: raceDate.toISOString(),
                          distance: raceDistance ? parseFloat(raceDistance) : undefined,
                          type: 'race',
                        });

                        alert('¡Objetivo añadido! Tu entrenador será notificado.');
                        setShowAddRaceModal(false);
                        setRaceName('');
                        setRaceDistance('');
                        setRaceDate(null);
                      } catch (err) {
                        console.error('Error adding goal:', err);
                        alert('Error al añadir el objetivo. Por favor, inténtalo de nuevo.');
                      }
                    }}
                    className="w-full py-3 bg-sustraia-accent text-white rounded-full font-bold hover:bg-sustraia-accent-hover transition-colors"
                  >
                    Añadir Objetivo
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
