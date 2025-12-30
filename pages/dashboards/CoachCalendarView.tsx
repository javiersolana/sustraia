import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  ChevronRight,
  Users,
  X
} from 'lucide-react';
import Sidebar from '../../components/dashboards/Sidebar';
import Calendar from '../../components/dashboards/Calendar';
import Card from '../../components/dashboards/ui/Card';
import { Role } from '../../lib/types/dashboard';
import { api, type TrainingPlan, type CompletedWorkout } from '../../lib/api/client';

interface Athlete {
  id: string;
  name: string;
  email: string;
  stats: Record<string, number>;
}

interface CalendarEvent {
  id: string;
  date: Date;
  type: 'plan' | 'completed';
  title: string;
  data: TrainingPlan | (CompletedWorkout & { title?: string });
}

export default function CoachCalendarView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch athletes on mount
  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        setLoading(true);
        const dashboardData = await api.stats.getCoachDashboard();
        setAthletes(dashboardData.athletes || []);
      } catch (err) {
        console.error('Error fetching athletes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, []);

  // Fetch calendar data when athlete is selected
  useEffect(() => {
    if (!selectedAthlete) {
      setTrainingPlans([]);
      setCompletedWorkouts([]);
      return;
    }

    const fetchCalendarData = async () => {
      try {
        // Fetch training plans for this athlete
        const plans = await api.trainingPlans.getAll({ athleteId: selectedAthlete.id });
        setTrainingPlans(plans);

        // Fetch completed workouts for this athlete
        try {
          const workoutsData = await api.stats.getAthleteWorkouts(selectedAthlete.id);
          setCompletedWorkouts(workoutsData.workouts || []);
        } catch (err) {
          console.log('No completed workouts found:', err);
          setCompletedWorkouts([]);
        }
      } catch (err) {
        console.error('Error fetching calendar data:', err);
      }
    };

    fetchCalendarData();
  }, [selectedAthlete]);

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
      title: (workout as any).title || 'Entrenamiento',
      data: workout,
    })),
  ];

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleDayClick = (date: Date) => {
    // Navigate to create training plan for that day
    if (selectedAthlete) {
      navigate(`/coach/athlete/${selectedAthlete.id}?date=${date.toISOString()}`);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-sustraia-base min-h-screen">
        <Sidebar role={Role.COACH} />
        <main className="flex-1 md:ml-72 p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-sustraia-accent animate-spin mx-auto mb-4" />
            <p className="text-sustraia-gray font-medium">Cargando...</p>
          </div>
        </main>
      </div>
    );
  }

  // Show athlete selection if no athlete is selected
  if (!selectedAthlete) {
    return (
      <div className="flex bg-sustraia-base min-h-screen">
        <Sidebar role={Role.COACH} />

        <main className="flex-1 md:ml-72 p-6 md:p-10 lg:p-12 max-w-[1200px] mx-auto">
          <header className="mb-8">
            <h1 className="font-display font-black text-3xl text-sustraia-text tracking-tight mb-2">
              Calendario
            </h1>
            <p className="text-sustraia-gray">
              Selecciona un atleta para ver su calendario
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {athletes.map((athlete, idx) => (
              <motion.div
                key={athlete.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className="p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all"
                  onClick={() => setSelectedAthlete(athlete)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-sustraia-accent text-white flex items-center justify-center font-bold text-lg">
                      {athlete.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sustraia-text">{athlete.name}</h3>
                      <p className="text-sm text-sustraia-gray">{athlete.email}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </motion.div>
            ))}

            {athletes.length === 0 && (
              <Card className="p-12 text-center col-span-full">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-display font-bold text-lg mb-2">Sin atletas</h3>
                <p className="text-sustraia-gray text-sm">
                  No tienes atletas asignados aún.
                </p>
              </Card>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Show calendar for selected athlete
  return (
    <div className="flex bg-sustraia-base min-h-screen">
      <Sidebar role={Role.COACH} />

      <main className="flex-1 md:ml-72 p-6 md:p-10 lg:p-12 max-w-[1600px] mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedAthlete(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
            </button>
            <div>
              <h1 className="font-display font-black text-3xl text-sustraia-text tracking-tight mb-1">
                Calendario de {selectedAthlete.name}
              </h1>
              <p className="text-sustraia-gray">
                Gestiona los entrenamientos y objetivos
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/coach/athlete/${selectedAthlete.id}`)}
            className="px-6 py-3 bg-sustraia-accent text-white rounded-full font-bold shadow-lg shadow-blue-500/30 hover:bg-sustraia-accent-hover transition-all"
          >
            Ver perfil completo
          </button>
        </header>

        <Calendar
          events={calendarEvents}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
        />

        {/* Event Detail Modal */}
        <AnimatePresence>
          {selectedEvent && (
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
                className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="font-display font-bold text-xl">{selectedEvent.title}</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                <p className="text-sustraia-gray mb-4">
                  {new Date(selectedEvent.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>

                {selectedEvent.type === 'plan' && (
                  <>
                    {(selectedEvent.data as TrainingPlan).description && (
                      <p className="text-gray-600 mb-4">
                        {(selectedEvent.data as TrainingPlan).description}
                      </p>
                    )}

                    <h4 className="font-bold text-sm uppercase text-gray-500 mb-3">Bloques</h4>
                    <div className="space-y-2">
                      {(selectedEvent.data as TrainingPlan).blocks?.map((block, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <span className={`w-3 h-3 rounded-full ${
                            block.type === 'WARMUP' ? 'bg-yellow-400' :
                            block.type === 'RUN' ? 'bg-green-500' :
                            block.type === 'INTERVALS' ? 'bg-red-500' :
                            block.type === 'REST' ? 'bg-gray-400' :
                            'bg-blue-400'
                          }`} />
                          <div className="flex-1">
                            <span className="font-medium text-sm">
                              {block.type === 'WARMUP' ? 'Calentamiento' :
                                block.type === 'RUN' ? 'Carrera' :
                                block.type === 'INTERVALS' ? 'Series' :
                                block.type === 'REST' ? 'Descanso' :
                                'Enfriamiento'}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {block.durationSeconds
                                ? `${Math.floor(block.durationSeconds / 60)} min`
                                : block.distanceMeters
                                ? `${(block.distanceMeters / 1000).toFixed(1)} km`
                                : ''
                              }
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {selectedEvent.type === 'completed' && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distancia</span>
                      <span className="font-mono font-bold">
                        {((selectedEvent.data as CompletedWorkout).actualDistance || 0) / 1000} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiempo</span>
                      <span className="font-mono font-bold">
                        {Math.floor(((selectedEvent.data as CompletedWorkout).actualDuration || 0) / 60)} min
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
