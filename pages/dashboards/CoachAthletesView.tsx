import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import Sidebar from '../../components/dashboards/Sidebar';
import Card from '../../components/dashboards/ui/Card';
import Badge from '../../components/dashboards/ui/Badge';
import { Role } from '../../lib/types/dashboard';
import { api } from '../../lib/api/client';

interface Athlete {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  stats: Record<string, number>;
}

export default function CoachAthletesView() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter athletes by search query
  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex bg-sustraia-base min-h-screen">
        <Sidebar role={Role.COACH} />
        <main className="flex-1 md:ml-72 p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-sustraia-accent animate-spin mx-auto mb-4" />
            <p className="text-sustraia-gray font-medium">Cargando atletas...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-sustraia-base min-h-screen">
      <Sidebar role={Role.COACH} />

      <main className="flex-1 md:ml-72 p-6 md:p-10 lg:p-12 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display font-black text-3xl text-sustraia-text tracking-tight">Mis Atletas</h1>
            <p className="text-sustraia-gray">Gestiona el rendimiento de tu equipo</p>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 bg-sustraia-accent text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-sustraia-accent-hover transition-all">
            <Plus size={18} />
            Nuevo Atleta
          </button>
        </header>

        {/* Athletes Table */}
        <Card noPadding className="overflow-hidden">
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
                    const compliance = Math.min((weeklyWorkouts / 4) * 100, 100);
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
        </Card>
      </main>
    </div>
  );
}
