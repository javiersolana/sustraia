import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, User } from '../lib/api/client';
// Using Sidebar from components/dashboards/Sidebar if available, or layout
import Sidebar from '../components/dashboards/Sidebar';
import { Role } from '../lib/types/dashboard'; // Assuming Role enum is here
import { Bell, Save, User as UserIcon, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [weeklyGoal, setWeeklyGoal] = useState<string>('20');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await api.auth.getProfile();
            setUser(response.user);
            if (response.user.weeklyGoalKm) {
                setWeeklyGoal(response.user.weeklyGoalKm.toString());
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            setMessage({ type: 'error', text: 'Error al cargar perfil' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setSaving(true);
            setMessage(null);

            const goal = parseFloat(weeklyGoal);
            if (isNaN(goal) || goal <= 0) {
                setMessage({ type: 'error', text: 'Por favor introduce una distancia válida' });
                return;
            }

            const response = await api.user.updateWeeklyGoal(goal);
            setUser(response.user);
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' });

            // Update local storage or context if needed, but dashboard calls API on load so it should be fine
        } catch (error) {
            console.error('Failed to update settings:', error);
            setMessage({ type: 'error', text: 'Error al guardar configuración' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-sustraia-base min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 text-sustraia-accent animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex bg-sustraia-base min-h-screen">
            <Sidebar role={user?.role === 'COACH' ? Role.COACH : Role.ATHLETE} />

            <main className="flex-1 md:ml-72 p-6 md:p-10 lg:p-12 max-w-4xl mx-auto">
                {/* Header */}
                <header className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h2 className="font-display font-black text-3xl text-sustraia-text tracking-tighter">
                                Configuración
                            </h2>
                            <p className="text-sustraia-gray font-medium mt-1">Gestiona tus preferencias</p>
                        </div>
                    </div>
                </header>

                <div className="grid gap-8">
                    {/* Profile Section */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-sustraia-light-gray">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-sustraia-accent/10 rounded-full flex items-center justify-center text-sustraia-accent">
                                <UserIcon size={24} />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-xl">Perfil de Atleta</h3>
                                <p className="text-sm text-sustraia-gray">Tus datos personales</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-sustraia-gray mb-2">Nombre</label>
                                <input
                                    type="text"
                                    value={user?.name || ''}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent text-gray-500 font-medium cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-sustraia-gray mb-2">Email</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent text-gray-500 font-medium cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Goals Section */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-sustraia-light-gray">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                                <UserIcon size={24} />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-xl">Objetivos</h3>
                                <p className="text-sm text-sustraia-gray">Define tus metas semanales</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="mb-6">
                                <label htmlFor="weeklyGoal" className="block text-sm font-bold text-sustraia-text mb-2">
                                    Objetivo Semanal (km)
                                </label>
                                <div className="relative max-w-xs">
                                    <input
                                        id="weeklyGoal"
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={weeklyGoal}
                                        onChange={(e) => setWeeklyGoal(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sustraia-text font-bold focus:border-sustraia-accent focus:ring-2 focus:ring-sustraia-accent/20 transition-all outline-none"
                                        placeholder="Ej: 30"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">km</span>
                                </div>
                                <p className="text-xs text-sustraia-gray mt-2">
                                    Este valor se usará para calcular tu progreso en el dashboard.
                                </p>
                            </div>

                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl mb-6 font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                                >
                                    {message.text}
                                </motion.div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`
                                flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white transition-all
                                ${saving ? 'bg-gray-400 cursor-wait' : 'bg-sustraia-accent hover:bg-sustraia-accent-hover shadow-lg shadow-sustraia-accent/20'}
                            `}
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Settings;
