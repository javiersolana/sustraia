import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboards/Sidebar';
import { Role, WeeklyActivity } from '../../lib/types/dashboard';
import { Bell, Flame, ChevronRight, Clock, MapPin, PlayCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import Card from '../../components/dashboards/ui/Card';
import Badge from '../../components/dashboards/ui/Badge';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { api, type Stats, type Workout, type CompletedWorkout } from '../../lib/api/client';

interface DashboardData {
  stats: Stats;
  upcomingWorkouts: Workout[];
  recentCompleted: CompletedWorkout[];
  unreadMessages: number;
  user?: { id: string; name: string; email: string };
}

const AthleteDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [dashboardData, profileData] = await Promise.all([
          api.stats.getDashboard(),
          api.auth.getProfile(),
        ]);

        setData({
          ...dashboardData,
          user: profileData.user,
        });
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
                        <Clock size={16}/> {Math.floor(nextWorkout.duration / 60)} min
                      </span>
                    )}
                    {nextWorkout.distance && (
                      <span className="flex items-center gap-1">
                        <MapPin size={16}/> {(nextWorkout.distance / 1000).toFixed(1)} km
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
            <button className="text-sm font-bold text-sustraia-accent hover:text-sustraia-accent-hover">Ver calendario completo</button>
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
            <h3 className="font-display font-bold text-xl mb-6">Últimas sesiones</h3>
            <div className="space-y-4">
              {data.recentCompleted.length > 0 ? (
                data.recentCompleted.map((completed, i) => {
                  const duration = completed.actualDuration || 0;
                  const distance = completed.actualDistance || 0;
                  const pace = distance > 0 ? (duration / (distance / 1000)) : 0;

                  return (
                    <Card key={completed.id} delay={4 + i} noPadding className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-sustraia-accent transition-colors">
                          <PlayCircle className="text-sustraia-accent group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sustraia-text">{completed.workout?.title || 'Entrenamiento'}</h4>
                          <p className="text-sm text-sustraia-gray">
                            {new Date(completed.completedAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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
                        Ver análisis
                      </button>
                    </Card>
                  );
                })
              ) : (
                <Card delay={4} className="text-center py-12">
                  <p className="text-sustraia-gray">No hay sesiones completadas aún</p>
                </Card>
              )}
            </div>
          </section>

          {/* Coach Messages */}
          <section>
            <h3 className="font-display font-bold text-xl mb-6">Coach</h3>
            <Card delay={8} className="h-full">
              <div className="flex items-center gap-4 mb-6">
                <img src="https://picsum.photos/100/100" alt="Coach" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" />
                <div>
                  <h4 className="font-bold text-sm">Coach David</h4>
                  <p className="text-xs text-sustraia-gray">Head Coach</p>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                       <Badge variant="accent">NUEVO</Badge>
                       <span className="text-xs text-gray-400">Hace 2h</span>
                    </div>
                    <p className="text-sm text-sustraia-text leading-relaxed">
                      ¡Gran trabajo ayer! Mantuvisite el ritmo muy estable en los últimos kilómetros. Para hoy, enfócate en la técnica.
                    </p>
                 </div>

                 <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 opacity-60">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs text-gray-400">Hace 2d</span>
                    </div>
                    <p className="text-sm text-sustraia-text leading-relaxed truncate">
                      He ajustado las cargas de la próxima semana basándome en tu feedback...
                    </p>
                 </div>
              </div>

              <button className="w-full mt-6 py-3 rounded-full border border-sustraia-light-gray font-bold text-sm text-sustraia-text hover:bg-gray-50 transition-colors">
                Ver conversación completa
              </button>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AthleteDashboard;
