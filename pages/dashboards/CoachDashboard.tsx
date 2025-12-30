import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboards/Sidebar';
import { Role, AthleteRow } from '../../lib/types/dashboard';
import {
  Users,
  TrendingUp,
  Calendar,
  MessageSquare,
  Search,
  Plus,
  AlertCircle,
  MoreHorizontal,
  ChevronDown,
  Loader2
} from 'lucide-react';
import Card from '../../components/dashboards/ui/Card';
import Badge from '../../components/dashboards/ui/Badge';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { api, type Workout } from '../../lib/api/client';

interface Alert {
  id: string;
  type: 'missed_workout' | 'low_compliance' | 'no_activity';
  athleteId: string;
  athleteName: string;
  message: string;
  detail: string;
  createdAt: string;
}

interface CoachDashboardData {
  athletes: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    stats: Record<string, number>;
  }>;
  recentWorkouts: Workout[];
  unreadMessages: number;
  alerts: Alert[];
}

const CoachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<CoachDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const dashboardData = await api.stats.getCoachDashboard();
        setData(dashboardData);
        setError(null);
      } catch (err: any) {
        console.error('Coach dashboard error:', err);
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
        <Sidebar role={Role.COACH} />
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
        <Sidebar role={Role.COACH} />
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

  // Filter athletes by search query
  const filteredAthletes = data.athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate compliance data
  const complianceData = [
    { name: 'Sem 1', completed: 40, scheduled: 45 },
    { name: 'Sem 2', completed: 38, scheduled: 42 },
    { name: 'Sem 3', completed: 45, scheduled: 45 },
    { name: 'Sem 4', completed: 30, scheduled: 48 },
  ];

  // Calculate metrics
  const totalAthletes = data.athletes.length;
  const avgCompliance = data.athletes.length > 0
    ? data.athletes.reduce((sum, a) => sum + (a.stats.weeklyWorkouts || 0), 0) / data.athletes.length
    : 0;
  const todayWorkouts = data.recentWorkouts.filter(w => {
    const today = new Date().toDateString();
    return new Date(w.date).toDateString() === today;
  }).length;

  return (
    <div className="flex bg-sustraia-base min-h-screen">
      <Sidebar role={Role.COACH} />

      <main className="flex-1 md:ml-72 p-6 md:p-10 lg:p-12 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display font-black text-3xl text-sustraia-text tracking-tight">Panel de Entrenador</h1>
            <p className="text-sustraia-gray">Gestiona el rendimiento de tu equipo</p>
          </div>

          <div className="flex gap-4">
            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-3 bg-white border border-sustraia-light-gray rounded-full text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                Ver: Todos los atletas
                <ChevronDown size={16} />
              </button>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-sustraia-accent text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-sustraia-accent-hover transition-all">
              <Plus size={18} />
              Nuevo Atleta
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card delay={0} className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-2xl bg-blue-50 text-sustraia-accent">
                <Users size={24} />
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-4xl text-sustraia-text block">{totalAthletes}</span>
              <span className="text-sm text-sustraia-gray font-medium">Total Atletas</span>
            </div>
          </Card>

          <Card delay={1} className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-2xl bg-blue-50 text-sustraia-accent">
                <TrendingUp size={24} />
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-4xl text-sustraia-text block">
                {avgCompliance.toFixed(0)}
              </span>
              <span className="text-sm text-sustraia-gray font-medium">Entrenos promedio/semana</span>
            </div>
          </Card>

          <Card delay={2} className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-2xl bg-blue-50 text-sustraia-accent">
                <Calendar size={24} />
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-4xl text-sustraia-text block">{todayWorkouts}</span>
              <span className="text-sm text-sustraia-gray font-medium">Entrenos programados hoy</span>
            </div>
          </Card>

          <Card delay={3} className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl ${data.unreadMessages > 0 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-sustraia-accent'}`}>
                <MessageSquare size={24} />
              </div>
              {data.unreadMessages > 0 && <Badge variant="warning">Acción requerida</Badge>}
            </div>
            <div>
              <span className="font-display font-bold text-4xl text-sustraia-text block">{data.unreadMessages}</span>
              <span className="text-sm text-sustraia-gray font-medium">Mensajes</span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Main Table Section */}
          <div className="xl:col-span-2">
            <Card noPadding delay={4} className="overflow-hidden">
              <div className="p-6 border-b border-sustraia-light-gray flex justify-between items-center">
                <h3 className="font-display font-bold text-xl">Rendimiento de Atletas</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar atleta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-full bg-gray-50 border-none text-sm focus:ring-2 focus:ring-sustraia-accent outline-none w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-xs uppercase text-sustraia-gray font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Atleta</th>
                      <th className="px-6 py-4">Última Actividad</th>
                      <th className="px-6 py-4">Cumplimiento Semanal</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAthletes.length > 0 ? (
                      filteredAthletes.map((athlete, idx) => {
                        const weeklyWorkouts = athlete.stats.weeklyWorkouts || 0;
                        const compliance = Math.min((weeklyWorkouts / 4) * 100, 100); // Assuming 4 workouts/week target
                        const status = compliance > 70 ? 'ACTIVE' : 'ALERT';

                        return (
                          <motion.tr
                            key={athlete.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="hover:bg-gray-50 transition-colors group cursor-pointer"
                            onClick={() => navigate(`/coach/athlete/${athlete.id}`)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-sustraia-accent text-white flex items-center justify-center font-bold text-sm">
                                  {athlete.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold text-sustraia-text text-sm block">{athlete.name}</span>
                                  <span className="text-xs text-sustraia-gray">{athlete.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-sustraia-gray">
                                {new Date(athlete.createdAt).toLocaleDateString('es-ES')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 w-32">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${compliance > 80 ? 'bg-green-500' : compliance > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${compliance}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold">{compliance.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={status === 'ACTIVE' ? 'success' : 'warning'}>
                                {status === 'ACTIVE' ? 'Activo' : 'Alerta'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all text-sustraia-gray hover:text-sustraia-accent">
                                  <MessageSquare size={16} />
                                </button>
                                <button className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all text-sustraia-gray hover:text-sustraia-accent">
                                  <MoreHorizontal size={16} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sustraia-gray">
                          {searchQuery ? 'No se encontraron atletas' : 'No hay atletas asignados'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-sustraia-light-gray text-center">
                <button className="text-sm font-bold text-sustraia-gray hover:text-sustraia-accent transition-colors">Cargar más atletas</button>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-8">
            {/* Alerts Section */}
            {data.alerts && data.alerts.length > 0 && (
              <section>
                <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                  <AlertCircle className="text-red-500" />
                  Alertas ({data.alerts.length})
                </h3>
                <div className="space-y-4">
                  {data.alerts.map((alert, idx) => {
                    const alertColor = alert.type === 'missed_workout' ? 'red' :
                                       alert.type === 'no_activity' ? 'orange' : 'yellow';
                    const bgColor = alertColor === 'red' ? 'bg-red-50/50 border-red-100' :
                                    alertColor === 'orange' ? 'bg-orange-50/50 border-orange-100' :
                                    'bg-yellow-50/50 border-yellow-100';
                    const barColor = alertColor === 'red' ? 'bg-red-400' :
                                     alertColor === 'orange' ? 'bg-orange-400' : 'bg-yellow-400';
                    const iconBg = alertColor === 'red' ? 'bg-red-100 text-red-600' :
                                   alertColor === 'orange' ? 'bg-orange-100 text-orange-600' :
                                   'bg-yellow-100 text-yellow-600';
                    const btnStyle = alertColor === 'red' ? 'border-red-200 text-red-600 hover:bg-red-600' :
                                     alertColor === 'orange' ? 'border-orange-200 text-orange-600 hover:bg-orange-600' :
                                     'border-yellow-200 text-yellow-600 hover:bg-yellow-600';

                    return (
                      <Card
                        key={alert.id}
                        delay={6 + idx * 0.1}
                        className={`${bgColor} relative overflow-hidden group`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`}></div>
                        <div className="flex gap-4">
                          <div className={`min-w-[40px] h-10 rounded-full ${iconBg} flex items-center justify-center`}>
                            <AlertCircle size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{alert.detail}</p>
                            <button
                              onClick={() => navigate(`/coach/athlete/${alert.athleteId}`)}
                              className={`mt-3 text-xs font-bold bg-white px-3 py-1.5 rounded-full border ${btnStyle} hover:text-white transition-colors`}
                            >
                              Ver atleta
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* No alerts message */}
            {(!data.alerts || data.alerts.length === 0) && (
              <Card delay={6} className="bg-green-50/50 border-green-100">
                <div className="flex items-center gap-4">
                  <div className="min-w-[40px] h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">Todo en orden</p>
                    <p className="text-xs text-gray-500 mt-1">No hay alertas pendientes</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoachDashboard;
