import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  Shield,
} from 'lucide-react';
import { api } from '../lib/api/client';

interface AdminStats {
  totalUsers: number;
  totalAthletes: number;
  totalCoaches: number;
  totalWorkouts: number;
  totalCompleted: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  coachId?: string;
  coach?: { id: string; name: string; email: string };
  birthDate?: string;
  maxHeartRate?: number;
  restingHR?: number;
  _count: { athletes: number };
}

interface Coach {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  _count: { athletes: number };
}

const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateCoachForm, setShowCreateCoachForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Create athlete form state
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    coachId: '',
    birthDate: '',
    maxHeartRate: '',
    restingHR: '',
  });

  // Create coach form state
  const [createCoachForm, setCreateCoachForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Edit user form state
  const [editForm, setEditForm] = useState({
    name: '',
    coachId: '',
    birthDate: '',
    maxHeartRate: '',
    restingHR: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, coachesData] = await Promise.all([
        api.admin.getStats(),
        api.admin.getAllUsers(),
        api.admin.getAllCoaches(),
      ]);

      setStats(statsData.stats);
      setUsers(usersData.users);
      setCoaches(coachesData.coaches);
      setError(null);
    } catch (err: any) {
      console.error('Admin panel error:', err);
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createAthlete({
        ...createForm,
        birthDate: createForm.birthDate || undefined,
        maxHeartRate: createForm.maxHeartRate ? parseInt(createForm.maxHeartRate) : undefined,
        restingHR: createForm.restingHR ? parseInt(createForm.restingHR) : undefined,
      });
      setShowCreateForm(false);
      setCreateForm({ name: '', email: '', password: '', coachId: '', birthDate: '', maxHeartRate: '', restingHR: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create athlete');
    }
  };

  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createCoach(createCoachForm);
      setShowCreateCoachForm(false);
      setCreateCoachForm({ name: '', email: '', password: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create coach');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await api.admin.updateUser(editingUser.id, {
        name: editForm.name,
        coachId: editForm.coachId || null,
        birthDate: editForm.birthDate || undefined,
        maxHeartRate: editForm.maxHeartRate ? parseInt(editForm.maxHeartRate) : undefined,
        restingHR: editForm.restingHR ? parseInt(editForm.restingHR) : undefined,
      });
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await api.admin.deleteUser(userId);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-sustraia-base flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-sustraia-accent animate-spin mx-auto mb-4" />
          <p className="text-sustraia-gray font-medium">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sustraia-base flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-medium mb-4">Error: {error}</p>
          <p className="text-sustraia-gray mb-6">Es posible que no tengas permisos de administrador.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-sustraia-accent text-white rounded-full font-bold hover:bg-sustraia-accent-hover"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sustraia-base p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-sustraia-accent" />
            <h1 className="font-display font-black text-4xl text-sustraia-text tracking-tighter">
              Panel de Administración
            </h1>
          </div>
          <p className="text-sustraia-gray font-medium">
            Gestión completa de usuarios y sistema
          </p>
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
            <StatCard icon={Users} label="Total Usuarios" value={stats.totalUsers} delay={0} />
            <StatCard
              icon={Users}
              label="Atletas"
              value={stats.totalAthletes}
              delay={1}
              color="blue"
            />
            <StatCard
              icon={Users}
              label="Coaches"
              value={stats.totalCoaches}
              delay={2}
              color="green"
            />
            <StatCard
              icon={Calendar}
              label="Entrenamientos"
              value={stats.totalWorkouts}
              delay={3}
              color="purple"
            />
            <StatCard
              icon={CheckCircle2}
              label="Completados"
              value={stats.totalCompleted}
              delay={4}
              color="green"
            />
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full bg-white border border-sustraia-light-gray text-sm focus:ring-2 focus:ring-sustraia-accent outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-sustraia-accent text-white rounded-full font-bold hover:bg-sustraia-accent-hover shadow-lg shadow-blue-500/30"
            >
              <UserPlus size={20} />
              Crear Atleta
            </button>
            <button
              onClick={() => setShowCreateCoachForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 shadow-lg shadow-green-500/30"
            >
              <UserPlus size={20} />
              Crear Coach
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-sustraia-light-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs uppercase text-sustraia-gray font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Usuario</th>
                  <th className="px-6 py-4 text-left">Rol</th>
                  <th className="px-6 py-4 text-left">Coach</th>
                  <th className="px-6 py-4 text-left">Atletas</th>
                  <th className="px-6 py-4 text-left">Creado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, idx) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-sustraia-text">{user.name}</div>
                          <div className="text-sm text-sustraia-gray">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'COACH'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                            }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.coach ? (
                          <div className="text-sm">
                            <div className="font-medium text-sustraia-text">{user.coach.name}</div>
                            <div className="text-xs text-sustraia-gray">{user.coach.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'COACH' ? (
                          <span className="font-bold text-sustraia-text">{user._count.athletes}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-sustraia-gray">
                          {new Date(user.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setEditForm({
                                name: user.name,
                                coachId: user.coachId || '',
                                birthDate: (user as any).birthDate ? new Date((user as any).birthDate).toISOString().split('T')[0] : '',
                                maxHeartRate: (user as any).maxHeartRate?.toString() || '',
                                restingHR: (user as any).restingHR?.toString() || '',
                              });
                            }}
                            className="p-2 hover:bg-blue-50 rounded-full transition-colors text-sustraia-accent"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sustraia-gray">
                      {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Athlete Modal */}
      {showCreateForm && (
        <Modal onClose={() => setShowCreateForm(false)}>
          <h2 className="font-display font-bold text-2xl mb-6">Crear Nuevo Atleta</h2>
          <form onSubmit={handleCreateAthlete} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-2">Nombre</label>
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-2">Email</label>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-2">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-2">
                Coach (opcional)
              </label>
              <select
                value={createForm.coachId}
                onChange={(e) => setCreateForm({ ...createForm, coachId: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
              >
                <option value="">Sin coach asignado</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name} ({coach._count.athletes} atletas)
                  </option>
                ))}
              </select>
            </div>
            {/* Physiological Profile */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-sm font-bold text-sustraia-text mb-3">Perfil Fisiológico (opcional)</p>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sustraia-gray mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={createForm.birthDate}
                    onChange={(e) => setCreateForm({ ...createForm, birthDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-sustraia-gray mb-1">FC Máxima</label>
                    <input
                      type="number"
                      placeholder="Ej: 185"
                      min="100"
                      max="250"
                      value={createForm.maxHeartRate}
                      onChange={(e) => setCreateForm({ ...createForm, maxHeartRate: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sustraia-gray mb-1">FC Reposo</label>
                    <input
                      type="number"
                      placeholder="Ej: 50"
                      min="30"
                      max="120"
                      value={createForm.restingHR}
                      onChange={(e) => setCreateForm({ ...createForm, restingHR: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-6 py-3 rounded-full border border-sustraia-light-gray font-bold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-full bg-sustraia-accent text-white font-bold hover:bg-sustraia-accent-hover"
              >
                Crear Atleta
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Coach Modal */}
      {showCreateCoachForm && (
        <Modal onClose={() => setShowCreateCoachForm(false)}>
          <h2 className="font-display font-bold text-2xl mb-6">Crear Nuevo Coach</h2>
          <form onSubmit={handleCreateCoach} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-2">Nombre</label>
              <input
                type="text"
                required
                value={createCoachForm.name}
                onChange={(e) => setCreateCoachForm({ ...createCoachForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-2">Email</label>
              <input
                type="email"
                required
                value={createCoachForm.email}
                onChange={(e) => setCreateCoachForm({ ...createCoachForm, email: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-2">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={createCoachForm.password}
                onChange={(e) => setCreateCoachForm({ ...createCoachForm, password: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateCoachForm(false)}
                className="flex-1 px-6 py-3 rounded-full border border-sustraia-light-gray font-bold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-full bg-green-600 text-white font-bold hover:bg-green-700"
              >
                Crear Coach
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Modal onClose={() => setEditingUser(null)}>
          <h2 className="font-display font-bold text-2xl mb-6">Editar Usuario</h2>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-sustraia-text mb-2">Nombre</label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
              />
            </div>
            {editingUser.role === 'ATLETA' && (
              <div>
                <label className="block text-sm font-bold text-sustraia-text mb-2">Coach</label>
                <select
                  value={editForm.coachId}
                  onChange={(e) => setEditForm({ ...editForm, coachId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
                >
                  <option value="">Sin coach asignado</option>
                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.name} ({coach._count.athletes} atletas)
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Physiological Profile */}
            {editingUser.role === 'ATLETA' && (
              <div className="border-t border-gray-100 pt-4 mt-2">
                <p className="text-sm font-bold text-sustraia-text mb-3">Perfil Fisiológico</p>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sustraia-gray mb-1">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      value={editForm.birthDate}
                      onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-sustraia-gray mb-1">FC Máxima</label>
                      <input
                        type="number"
                        placeholder="220 - edad"
                        min="100"
                        max="250"
                        value={editForm.maxHeartRate}
                        onChange={(e) => setEditForm({ ...editForm, maxHeartRate: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sustraia-gray mb-1">FC Reposo</label>
                      <input
                        type="number"
                        placeholder="Karvonen"
                        min="30"
                        max="120"
                        value={editForm.restingHR}
                        onChange={(e) => setEditForm({ ...editForm, restingHR: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-sustraia-light-gray focus:ring-2 focus:ring-sustraia-accent outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 px-6 py-3 rounded-full border border-sustraia-light-gray font-bold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-full bg-sustraia-accent text-white font-bold hover:bg-sustraia-accent-hover"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: any;
  label: string;
  value: number;
  delay: number;
  color?: string;
}> = ({ icon: Icon, label, value, delay, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="bg-white rounded-3xl shadow-sm border border-sustraia-light-gray p-6 hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 rounded-2xl ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      <div className="font-display font-black text-4xl text-sustraia-text mb-1">{value}</div>
      <div className="text-sm text-sustraia-gray font-medium">{label}</div>
    </motion.div>
  );
};

// Modal Component
const Modal: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({
  onClose,
  children,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-sustraia-gray hover:text-sustraia-text"
        >
          <X size={24} />
        </button>
        {children}
      </motion.div>
    </div>
  );
};

export default AdminPanel;
