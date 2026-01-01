import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboards/Sidebar';
import Calendar from '../../components/dashboards/Calendar';
import ActivityDetailModal from '../../components/dashboards/ActivityDetailModal';
import { Role, WeeklyActivity } from '../../lib/types/dashboard';
import { Bell, Flame, ChevronRight, Clock, MapPin, PlayCircle, CheckCircle2, Circle, Loader2, X, Heart, Activity, TrendingUp } from 'lucide-react';
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
  weeklyGoalKm?: number;
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
        const [dashboardData, profileData, coachResponse] = await Promise.all([
          api.stats.getDashboard(),
          api.auth.getProfile(),
          api.user.getMyCoach(),
        ]);

        setData({
          ...dashboardData,
          user: profileData.user,
          coach: coachResponse.coach,
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

  // Generate weekly calendar from training plans AND upcoming workouts
  const today = new Date();
  interface WeeklyActivityExtended extends WeeklyActivity {
    plan?: TrainingPlan;
    completed?: CompletedWorkout;
    fullDate: Date;
  }

  const weeklyCalendar: WeeklyActivityExtended[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Find training plan for this date (from coach)
    const plan = trainingPlans.find(p => {
      const pDate = new Date(p.date);
      return pDate.toDateString() === date.toDateString();
    });

    // Find workout for this date (legacy)
    const workout = data.upcomingWorkouts.find(w => {
      const wDate = new Date(w.date);
      return wDate.toDateString() === date.toDateString();
    });

    // Find if there's a completed workout for this date
    const completed = data.recentCompleted.find(c => {
      const cDate = new Date(c.completedAt);
      return cDate.toDateString() === date.toDateString();
    });

    // Determine type from plan or workout
    let type: string = 'REST';
    let title: string | undefined;
    if (plan) {
      // Infer type from plan blocks
      const hasIntervals = plan.blocks?.some(b => b.type === 'INTERVALS');
      const hasRun = plan.blocks?.some(b => b.type === 'RUN');
      type = hasIntervals ? 'INTERVALS' : hasRun ? 'RUN' : 'RUN';
      title = plan.title;
    } else if (workout) {
      type = workout.type;
      title = workout.title;
    }

    return {
      day: dayNames[date.getDay()],
      date: date.getDate().toString(),
      type,
      status: completed ? 'COMPLETED' : (plan || workout) ? 'PENDING' : 'REST',
      isToday: i === 0,
      title,
      plan,
      completed,
      fullDate: date,
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

  // Get next workout - prioritize training plans over legacy workouts
  const getNextTrainingPlan = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter training plans that are today or in the future, sorted by date
    const upcomingPlans = trainingPlans
      .filter(plan => {
        const planDate = new Date(plan.date);
        planDate.setHours(0, 0, 0, 0);
        return planDate >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return upcomingPlans[0] || null;
  };

  const nextTrainingPlan = getNextTrainingPlan();
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
            {nextTrainingPlan ? (
              <>
                <div>
                  <Badge variant="accent" className="bg-white/20 text-white border-none mb-4">
                    {new Date(nextTrainingPlan.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}
                  </Badge>
                  <h3 className="font-display text-3xl font-bold mb-2 leading-tight">
                    {nextTrainingPlan.title}
                  </h3>
                  {nextTrainingPlan.description && (
                    <p className="text-white/80 text-sm mb-2 line-clamp-2">
                      {nextTrainingPlan.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                    {nextTrainingPlan.blocks && nextTrainingPlan.blocks.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={16} /> {nextTrainingPlan.blocks.length} bloques
                      </span>
                    )}
                    {(() => {
                      // Calculate total distance from blocks
                      const totalDistance = nextTrainingPlan.blocks?.reduce((sum, block) =>
                        sum + (block.distanceMeters || 0), 0) || 0;
                      if (totalDistance > 0) {
                        return (
                          <span className="flex items-center gap-1">
                            <MapPin size={16} /> {(totalDistance / 1000).toFixed(1)} km
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedEvent({
                      id: nextTrainingPlan.id,
                      date: new Date(nextTrainingPlan.date),
                      type: 'plan',
                      title: nextTrainingPlan.title,
                      data: nextTrainingPlan,
                    });
                  }}
                  className="bg-white text-sustraia-accent font-bold py-3 px-6 rounded-full w-fit hover:bg-gray-100 transition-colors"
                >
                  Ver detalles
                </button>
              </>
            ) : nextWorkout ? (
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
              const weeklyGoalKm = data.weeklyGoalKm ?? 20; // From user settings, default 20km
              const weeklyGoal = weeklyGoalKm * 1000; // Convert to meters
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
                        {(current / 1000).toFixed(1)} / {weeklyGoalKm}
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
                onClick={() => {
                  if (day.plan) {
                    setSelectedEvent({
                      id: day.plan.id,
                      date: new Date(day.plan.date),
                      type: 'plan',
                      title: day.plan.title,
                      data: day.plan,
                    });
                  } else if (day.completed) {
                    navigate(`/dashboard/atleta/actividades/${day.completed.id}`);
                  }
                }}
                className={`
                  p-4 rounded-3xl min-h-[140px] flex flex-col justify-between border transition-all
                  ${day.isToday
                    ? 'bg-white border-sustraia-accent ring-1 ring-sustraia-accent shadow-md'
                    : 'bg-white border-sustraia-light-gray hover:border-gray-300'
                  }
                  ${(day.plan || day.completed) ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
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
                  {day.status === 'REST' || day.type === 'REST' ? (
                    <span className="text-sm font-medium text-gray-400">Descanso</span>
                  ) : (
                    <div className="space-y-1">
                      <Badge
                        variant={day.type === 'INTERVALS' ? 'warning' : 'accent'}
                        className="w-full justify-center text-xs"
                      >
                        {day.type === 'RUN' ? 'Carrera' : day.type === 'INTERVALS' ? 'Series' : 'Entreno'}
                      </Badge>
                      {day.title && (
                        <p className="text-xs text-gray-500 truncate" title={day.title}>
                          {day.title.length > 15 ? day.title.substring(0, 15) + '...' : day.title}
                        </p>
                      )}
                    </div>
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
                    const hasIntervals = plan.blocks?.some(b => b.type === 'INTERVALS');

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

                      // Format pace (seconds per km to min:ss)
                      const formatPace = (secPerKm: number) => {
                        const min = Math.floor(secPerKm / 60);
                        const sec = Math.round(secPerKm % 60);
                        return `${min}:${sec.toString().padStart(2, '0')}`;
                      };

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

