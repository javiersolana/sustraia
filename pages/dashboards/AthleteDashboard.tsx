import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboards/Sidebar';
import Calendar from '../../components/dashboards/Calendar';
import ActivityDetailModal from '../../components/dashboards/ActivityDetailModal';
import { Role, WeeklyActivity } from '../../lib/types/dashboard';
import { Bell, Flame, ChevronRight, Clock, MapPin, PlayCircle, CheckCircle2, Circle, Loader2, X } from 'lucide-react';
import Card from '../../components/dashboards/ui/Card';
import Badge from '../../components/dashboards/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { api, type Stats, type Workout, type CompletedWorkout, type TrainingPlan, type User } from '../../lib/api/client';

interface CalendarEvent {
  id: string;
  date: Date;
  type: 'plan' | 'completed';
  title: string;
  data: TrainingPlan | (CompletedWorkout & { title?: string });
}

interface DashboardData {
  stats: Stats;
  upcomingWorkouts: Workout[];
  recentCompleted: CompletedWorkout[];
  unreadMessages: number;
  user?: { id: string; name: string; email: string; coachId?: string };
  coach?: { id: string; name: string; email: string } | null;
}

const AthleteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [dashboardData, profileData] = await Promise.all([
          api.stats.getDashboard(),
          api.auth.getProfile(),
        ]);

        // Get coach info if user has one
        let coachData = null;
        if ((profileData.user as any).coachId) {
          try {
            const coachResponse = await api.admin.getAllUsers();
            const coach = coachResponse.users.find(u => u.id === (profileData.user as any).coachId);
            if (coach) {
              coachData = { id: coach.id, name: coach.name, email: coach.email };
            }
          } catch (err) {
            console.log('Could not fetch coach info:', err);
          }
        }

        setData({
          ...dashboardData,
          user: profileData.user,
          coach: coachData,
        });

        // Fetch training plans for athlete
        try {
          const plans = await api.trainingPlans.getAll();
          setTrainingPlans(plans);
        } catch (err) {
          console.log('No training plans or error fetching:', err);
        }

        setError(null);
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex bg-sustraia-base min-h-screen">
        <Sidebar role={Role.ATHLETE} />
        <main className="flex-1 md:ml-72 p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-sustraia-accent animate-spin mx-auto mb-4" />
            <p className="text-sustraia-gray font-medium">Cargando tu dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-sustraia-base min-h-screen">
        <Sidebar role={Role.ATHLETE} />
        <main className="flex-1 md:ml-72 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 font-medium mb-4">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-sustraia-accent text-white rounded-full font-bold hover:bg-sustraia-accent-hover"
            >
              Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  // Generate streak data from weekly stats
  const streakDays = 7;
  const streakData = Array.from({ length: streakDays }, (_, i) => ({
    day: ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i],
    value: i < 6 ? Math.floor(Math.random() * 5) + 1 : Math.floor((data.stats.weeklyWorkouts || 0) / 7) || 1,
  }));

  // Generate weekly calendar from upcoming workouts
  const today = new Date();
  const weeklyCalendar: WeeklyActivity[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Find workout for this date
    const workout = data.upcomingWorkouts.find(w => {
      const wDate = new Date(w.date);
      return wDate.toDateString() === date.toDateString();
    });

    return {
      day: dayNames[date.getDay()],
      date: date.getDate().toString(),
      type: workout ? workout.type : 'REST',
      status: workout?.completedVersion ? 'COMPLETED' : 'PENDING',
      isToday: i === 0,
    };
  });

  // Generate calendar events from training plans and completed workouts
  const calendarEvents: CalendarEvent[] = [
    ...trainingPlans.map(plan => ({
      id: plan.id,
      date: new Date(plan.date),
      type: 'plan' as const,
      title: plan.title,
      data: plan,
    })),
    ...data.recentCompleted.map(workout => ({
      id: workout.id,
      date: new Date(workout.completedAt),
      type: 'completed' as const,
      title: (workout as any).title || 'Entrenamiento completado',
      data: workout,
    })),
  ];

  // Get next workout
  const nextWorkout = data.upcomingWorkouts[0];

  // Format date
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date().toLocaleDateString('es-ES', options);
  };

  return (
    <div className="flex bg-sustraia-base min-h-screen">
      <Sidebar role={Role.ATHLETE} />

      <main className="flex-1 md:ml-72 p-6 md:p-10 lg:p-12 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-sustraia-base/90 backdrop-blur-sm py-4 mb-8 flex items-center justify-between">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-display font-black text-3xl md:text-4xl text-sustraia-text tracking-tighter"
            >
              Hola, {data.user?.name || 'Atleta'}
            </motion.h2>
            <p className="text-sustraia-gray font-medium mt-1">{formatDate()}</p>
          </div>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full bg-white border border-sustraia-light-gray flex items-center justify-center shadow-sm text-sustraia-text"
            >
              <Bell size={20} />
            </motion.button>
            {data.unreadMessages > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-sustraia-base"></span>
            )}
          </div>
        </header>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-10">

          {/* Widget A: Next Workout */}
          <Card highlight delay={0} className="flex flex-col justify-between min-h-[240px]">
            {nextWorkout ? (
              <>
                <div>
                  <Badge variant="accent" className="bg-white/20 text-white border-none mb-4">
                    {new Date(nextWorkout.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
                  </Badge>
                  <h3 className="font-display text-3xl font-bold mb-2 leading-tight">
                    {nextWorkout.title}
                  </h3>
                  <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                    {nextWorkout.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={16} /> {Math.floor(nextWorkout.duration / 60)} min
                      </span>
                    )}
                    {nextWorkout.distance && (
                      <span className="flex items-center gap-1">
                        <MapPin size={16} /> {(nextWorkout.distance / 1000).toFixed(1)} km
                      </span>
                    )}
                  </div>
                </div>
                <button className="bg-white text-sustraia-accent font-bold py-3 px-6 rounded-full w-fit hover:bg-gray-100 transition-colors">
                  Ver detalles
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/60 font-medium">No hay entrenamientos programados</p>
              </div>
            )}
          </Card>

          {/* Widget B: Streak */}
          <Card delay={1} className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sustraia-gray font-medium text-sm uppercase tracking-wide">Entrenamientos semanales</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-display font-black text-5xl text-sustraia-text">{data.stats.weeklyWorkouts || 0}</span>
                  <span className="text-sustraia-gray font-medium">sesiones</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <Flame className="text-orange-500" size={20} />
              </div>
            </div>
            <div className="h-24 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={streakData}>
                  <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                    {streakData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 6 ? '#0033FF' : '#E5E5E5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Widget C: Weekly Goal */}
          <Card delay={2} className="flex flex-col items-center justify-center relative">
            {(() => {
              const weeklyGoal = 20000; // 20km default goal
              const current = data.stats.weeklyDistance || 0;
              const percentage = Math.min((current / weeklyGoal) * 100, 100);
              return (
                <>
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E5E5" strokeWidth="8" />
                      <motion.circle
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: percentage / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="#0033FF"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="1"
                        strokeDashoffset="0"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display font-bold text-xl">
                        {(current / 1000).toFixed(1)} / {weeklyGoal / 1000}
                      </span>
                      <span className="text-xs text-sustraia-gray font-medium uppercase">km</span>
                    </div>
                  </div>
                  <p className="mt-4 font-medium text-sustraia-gray">{percentage.toFixed(0)}% del objetivo semanal</p>
                </>
              );
            })()}
          </Card>
        </div>

        {/* Weekly Calendar Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-xl">Tu Semana</h3>
            <button
              onClick={() => setShowFullCalendar(true)}
              className="text-sm font-bold text-sustraia-accent hover:text-sustraia-accent-hover"
            >
              Ver calendario completo
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {weeklyCalendar.map((day, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`
                  p-4 rounded-3xl min-h-[140px] flex flex-col justify-between border transition-all
                  ${day.isToday
                    ? 'bg-white border-sustraia-accent ring-1 ring-sustraia-accent shadow-md'
                    : 'bg-white border-sustraia-light-gray hover:border-gray-300'
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-xs text-sustraia-gray font-medium uppercase">{day.day}</span>
                    <span className="font-display font-bold text-lg">{day.date}</span>
                  </div>
                  {day.status === 'COMPLETED' && <CheckCircle2 className="text-green-500 w-5 h-5" />}
                  {day.status === 'PENDING' && <Circle className="text-gray-300 w-5 h-5" />}
                </div>

                <div className="mt-2">
                  {day.type === 'REST' ? (
                    <span className="text-sm font-medium text-gray-400">Descanso</span>
                  ) : (
                    <Badge variant={day.type === 'RUN' ? 'accent' : 'warning'} className="w-full justify-center">
                      {day.type === 'RUN' ? 'Carrera' : 'Fuerza'}
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Last Sessions */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl">Últimas sesiones</h3>
              <button
                onClick={() => navigate('/dashboard/atleta/actividades')}
                className="text-sm font-bold text-sustraia-accent hover:text-sustraia-accent-hover"
              >
                Ver todas →
              </button>
            </div>
            <div className="space-y-4">
              {data.recentCompleted.length > 0 ? (
                data.recentCompleted.slice(0, 5).map((completed, i) => {
                  const duration = completed.actualDuration || 0;
                  const distance = completed.actualDistance || 0;
                  const pace = distance > 0 ? (duration / (distance / 1000)) : 0;
                  const title = (completed as any).title || completed.workout?.title || 'Entrenamiento';
                  const displayText = (completed as any).humanReadable || title;

                  // Get relative time
                  const getRelativeTime = (date: string): string => {
                    const now = new Date();
                    const activityDate = new Date(date);
                    const diffHours = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffHours / 24);

                    if (diffHours < 1) return 'Hace menos de 1 hora';
                    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
                    if (diffDays === 1) return 'Ayer';
                    if (diffDays < 7) return `Hace ${diffDays} días`;
                    return activityDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                  };

                  return (
                    <Card
                      key={completed.id}
                      delay={4 + i}
                      noPadding
                      className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group cursor-pointer hover:shadow-lg"
                      onClick={() => navigate(`/dashboard/atleta/actividades/${completed.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-sustraia-accent transition-colors">
                          <PlayCircle className="text-sustraia-accent group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sustraia-text">{displayText}</h4>
                          <p className="text-sm text-sustraia-gray">
                            {getRelativeTime(completed.completedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6 md:gap-10">
                        {duration > 0 && (
                          <div>
                            <span className="block text-xs text-sustraia-gray uppercase font-bold">Tiempo</span>
                            <span className="font-display font-bold text-lg">
                              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        )}
                        {distance > 0 && (
                          <div>
                            <span className="block text-xs text-sustraia-gray uppercase font-bold">Distancia</span>
                            <span className="font-display font-bold text-lg">{(distance / 1000).toFixed(2)} km</span>
                          </div>
                        )}
                        {pace > 0 && (
                          <div>
                            <span className="block text-xs text-sustraia-gray uppercase font-bold">Ritmo</span>
                            <span className="font-display font-bold text-lg">
                              {Math.floor(pace / 60)}:{Math.floor(pace % 60).toString().padStart(2, '0')} /km
                            </span>
                          </div>
                        )}
                      </div>

                      <button className="hidden md:block text-sustraia-accent font-bold text-sm hover:underline">
                        Ver análisis →
                      </button>
                    </Card>
                  );
                })
              ) : (
                <Card delay={4} className="text-center py-12">
                  <p className="text-sustraia-gray mb-4">Aún no has completado ningún entreno</p>
                  <button
                    onClick={() => navigate('/dashboard/atleta')}
                    className="text-sustraia-accent font-bold text-sm hover:underline"
                  >
                    Sincroniza tu Strava para empezar
                  </button>
                </Card>
              )}
            </div>
          </section>

          {/* Coach Info */}
          <section className="mb-8">
            <h3 className="font-display font-bold text-xl mb-4">Tu Coach</h3>
            {data.coach ? (
              <Card delay={8} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sustraia-accent text-white flex items-center justify-center font-bold text-lg">
                  {data.coach.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{data.coach.name}</h4>
                  <p className="text-xs text-sustraia-gray">{data.coach.email}</p>
                </div>
              </Card>
            ) : (
              <Card delay={8} className="text-center py-8">
                <p className="text-sustraia-gray text-sm mb-3">Aún no tienes un coach asignado</p>
                <p className="text-xs text-gray-400">Contacta con un administrador para asignar uno</p>
              </Card>
            )}
          </section>
        </div>
      </main>

      {/* Fullscreen Calendar Modal */}
      <AnimatePresence>
        {showFullCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-sustraia-base z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="font-display font-bold text-xl">Calendario</h2>
              <button
                onClick={() => setShowFullCalendar(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Calendar */}
            <div className="flex-1 overflow-auto p-4">
              <Calendar
                events={calendarEvents}
                onEventClick={(event) => setSelectedEvent(event)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Detail Modal */}
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
              className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              {selectedEvent.type === 'plan' ? (
                <div className="p-6">
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

                  {(selectedEvent.data as TrainingPlan).description && (
                    <p className="text-gray-600 mb-4">
                      {(selectedEvent.data as TrainingPlan).description}
                    </p>
                  )}

                  <h4 className="font-bold text-sm uppercase text-gray-500 mb-3">Bloques de entrenamiento</h4>
                  <div className="space-y-2">
                    {(selectedEvent.data as TrainingPlan).blocks?.map((block, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className={`w-3 h-3 rounded-full ${block.type === 'WARMUP' ? 'bg-yellow-400' :
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
                </div>
              ) : (
                <ActivityDetailModal
                  activity={selectedEvent.data as CompletedWorkout}
                  onClose={() => setSelectedEvent(null)}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AthleteDashboard;

