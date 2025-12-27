import React from 'react';
import Sidebar from '../../components/dashboards/Sidebar';
import { Role, WeeklyActivity } from '../../lib/types/dashboard';
import { Bell, Flame, ChevronRight, Clock, MapPin, PlayCircle, CheckCircle2, Circle } from 'lucide-react';
import Card from '../../components/dashboards/ui/Card';
import Badge from '../../components/dashboards/ui/Badge';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';

// Mock Data
const streakData = [
  { day: 'M', value: 4 },
  { day: 'T', value: 3 },
  { day: 'W', value: 5 },
  { day: 'T', value: 2 },
  { day: 'F', value: 5 },
  { day: 'S', value: 6 },
  { day: 'S', value: 4 },
];

const weeklyCalendar: WeeklyActivity[] = [
  { day: 'Lun', date: '12', type: 'RUN', status: 'COMPLETED' },
  { day: 'Mar', date: '13', type: 'STRENGTH', status: 'COMPLETED' },
  { day: 'Mié', date: '14', type: 'RUN', status: 'COMPLETED' },
  { day: 'Jue', date: '15', type: 'REST', status: 'COMPLETED' },
  { day: 'Vie', date: '16', type: 'RUN', status: 'PENDING', isToday: true },
  { day: 'Sáb', date: '17', type: 'RUN', status: 'PENDING' },
  { day: 'Dom', date: '18', type: 'REST', status: 'PENDING' },
];

const AthleteDashboard: React.FC = () => {
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
              Hola, Alex
            </motion.h2>
            <p className="text-sustraia-gray font-medium mt-1">Viernes, 16 Octubre</p>
          </div>

          <div className="relative">
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="w-12 h-12 rounded-full bg-white border border-sustraia-light-gray flex items-center justify-center shadow-sm text-sustraia-text"
             >
               <Bell size={20} />
             </motion.button>
             <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-sustraia-base"></span>
          </div>
        </header>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-10">

          {/* Widget A: Next Workout */}
          <Card highlight delay={0} className="flex flex-col justify-between min-h-[240px]">
            <div>
              <Badge variant="accent" className="bg-white/20 text-white border-none mb-4">
                HOY • 18:30
              </Badge>
              <h3 className="font-display text-3xl font-bold mb-2 leading-tight">
                Rodaje Suave + Progresivos
              </h3>
              <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                <span className="flex items-center gap-1"><Clock size={16}/> 55 min</span>
                <span className="flex items-center gap-1"><MapPin size={16}/> Parque</span>
              </div>
            </div>
            <button className="bg-white text-sustraia-accent font-bold py-3 px-6 rounded-full w-fit hover:bg-gray-100 transition-colors">
              Ver detalles
            </button>
          </Card>

          {/* Widget B: Streak */}
          <Card delay={1} className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                 <p className="text-sustraia-gray font-medium text-sm uppercase tracking-wide">Racha actual</p>
                 <div className="flex items-baseline gap-2 mt-2">
                   <span className="font-display font-black text-5xl text-sustraia-text">14</span>
                   <span className="text-sustraia-gray font-medium">días</span>
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
             <div className="relative w-40 h-40">
               <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                 <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E5E5" strokeWidth="8" />
                 <motion.circle
                   initial={{ pathLength: 0 }}
                   animate={{ pathLength: 0.6 }}
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
                 <span className="font-display font-bold text-xl">12 / 20</span>
                 <span className="text-xs text-sustraia-gray font-medium uppercase">km</span>
               </div>
             </div>
             <p className="mt-4 font-medium text-sustraia-gray">60% del objetivo semanal</p>
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
              {[1, 2, 3].map((item, i) => (
                <Card key={i} delay={4 + i} noPadding className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-sustraia-accent transition-colors">
                      <PlayCircle className="text-sustraia-accent group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sustraia-text">Rodaje Aeróbico 10k</h4>
                      <p className="text-sm text-sustraia-gray">Ayer • 18:45</p>
                    </div>
                  </div>

                  <div className="flex gap-6 md:gap-10">
                    <div>
                      <span className="block text-xs text-sustraia-gray uppercase font-bold">Tiempo</span>
                      <span className="font-display font-bold text-lg">52:30</span>
                    </div>
                    <div>
                      <span className="block text-xs text-sustraia-gray uppercase font-bold">Distancia</span>
                      <span className="font-display font-bold text-lg">10.02 km</span>
                    </div>
                    <div>
                      <span className="block text-xs text-sustraia-gray uppercase font-bold">Ritmo</span>
                      <span className="font-display font-bold text-lg">5:14 /km</span>
                    </div>
                  </div>

                  <button className="hidden md:block text-sustraia-accent font-bold text-sm hover:underline">
                    Ver análisis
                  </button>
                </Card>
              ))}
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
