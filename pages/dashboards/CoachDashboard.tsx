import React from 'react';
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
  ChevronDown
} from 'lucide-react';
import Card from '../../components/dashboards/ui/Card';
import Badge from '../../components/dashboards/ui/Badge';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';

// Mock Data
const athletes: AthleteRow[] = [
  { id: '1', name: 'Ana García', avatar: 'https://picsum.photos/101/101', lastActivity: 'Hace 2h', compliance: 95, status: 'ACTIVE' },
  { id: '2', name: 'Carlos Ruiz', avatar: 'https://picsum.photos/102/102', lastActivity: 'Hace 5h', compliance: 82, status: 'ACTIVE' },
  { id: '3', name: 'María López', avatar: 'https://picsum.photos/103/103', lastActivity: 'Hace 1d', compliance: 45, status: 'ALERT' },
  { id: '4', name: 'Jorge Diaz', avatar: 'https://picsum.photos/104/104', lastActivity: 'Hace 4h', compliance: 88, status: 'ACTIVE' },
  { id: '5', name: 'Laura M.', avatar: 'https://picsum.photos/105/105', lastActivity: 'Hace 3d', compliance: 20, status: 'ALERT' },
];

const complianceData = [
  { name: 'Sem 1', completed: 40, scheduled: 45 },
  { name: 'Sem 2', completed: 38, scheduled: 42 },
  { name: 'Sem 3', completed: 45, scheduled: 45 },
  { name: 'Sem 4', completed: 30, scheduled: 48 },
];

const CoachDashboard: React.FC = () => {
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
          {[
            { label: 'Total Atletas', value: '24', icon: Users, trend: '+2 esta semana' },
            { label: 'Adherencia Media', value: '87%', icon: TrendingUp, trend: 'Top 5% sector' },
            { label: 'Entrenos Hoy', value: '18', icon: Calendar, trend: '12 completados' },
            { label: 'Mensajes', value: '5', icon: MessageSquare, badge: true },
          ].map((item, i) => (
            <Card key={i} delay={i} className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${item.badge ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-sustraia-accent'}`}>
                  <item.icon size={24} />
                </div>
                {item.badge && <Badge variant="warning">Acción requerida</Badge>}
              </div>
              <div>
                <span className="font-display font-bold text-4xl text-sustraia-text block">{item.value}</span>
                <span className="text-sm text-sustraia-gray font-medium">{item.label}</span>
              </div>
            </Card>
          ))}
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
                    {athletes.map((athlete, idx) => (
                      <motion.tr
                        key={athlete.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={athlete.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                            <span className="font-bold text-sustraia-text text-sm">{athlete.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-sustraia-gray">{athlete.lastActivity}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 w-32">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${athlete.compliance > 80 ? 'bg-green-500' : athlete.compliance > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${athlete.compliance}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold">{athlete.compliance}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={athlete.status === 'ACTIVE' ? 'success' : 'warning'}>
                            {athlete.status === 'ACTIVE' ? 'Activo' : 'Alerta'}
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
                    ))}
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
            <section>
              <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                <AlertCircle className="text-red-500" />
                Alertas
              </h3>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                   <Card key={i} delay={6} className="bg-red-50/50 border-red-100 relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
                      <div className="flex gap-4">
                        <div className="min-w-[40px] h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                          <AlertCircle size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">María López saltó 2 entrenamientos seguidos</p>
                          <p className="text-xs text-gray-500 mt-1">Hace 4 horas • Plan Maratón</p>
                          <button className="mt-3 text-xs font-bold bg-white px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                            Contactar
                          </button>
                        </div>
                      </div>
                   </Card>
                ))}
              </div>
            </section>

             {/* General Compliance Chart */}
            <Card delay={7} className="flex-1 flex flex-col">
              <h3 className="font-display font-bold text-xl mb-6">Cumplimiento Global</h3>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complianceData} barGap={0} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666666', fontSize: 12}} dy={10} />
                    <Tooltip
                      cursor={{fill: '#F5F5F7'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="scheduled" name="Programado" fill="#E5E5E5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completado" fill="#0033FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoachDashboard;
