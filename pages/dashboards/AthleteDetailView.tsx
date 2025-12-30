import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboards/Sidebar';
import Calendar from '../../components/dashboards/Calendar';
import TrainingPlanBuilder from '../../components/dashboards/TrainingPlanBuilder';
import ActivityDetailModal from '../../components/dashboards/ActivityDetailModal';
import Card from '../../components/dashboards/ui/Card';
import { Role } from '../../lib/types/dashboard';
import { api, type TrainingPlan, type CompletedWorkout } from '../../lib/api/client';
import {
    ArrowLeft,
    Plus,
    Loader2,
    User,
    Mail,
    Calendar as CalendarIcon,
    Activity,
    X,
    TrendingUp,
    StickyNote,
    Send,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Athlete {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    stats: Record<string, number>;
}

interface CalendarEvent {
    id: string;
    date: Date;
    type: 'plan' | 'completed';
    title: string;
    data: TrainingPlan | (CompletedWorkout & { title?: string });
}

interface WeeklyStats {
    weekNumber: number;
    startDate: Date;
    endDate: Date;
    totalKm: number;
    totalWorkouts: number;
}

export default function AthleteDetailView() {
    const { athleteId } = useParams<{ athleteId: string }>();
    const navigate = useNavigate();

    const [athlete, setAthlete] = useState<Athlete | null>(null);
    const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
    const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showPlanBuilder, setShowPlanBuilder] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null);

    // Notes state
    const [notes, setNotes] = useState<Array<{ id: string; content: string; createdAt: string }>>([]);
    const [newNote, setNewNote] = useState('');
    const [loadingNotes, setLoadingNotes] = useState(false);

    // Calculate weekly km breakdown for current month
    const weeklyStats = useMemo((): WeeklyStats[] => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        // Get first day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Find Monday of first week that includes the 1st of the month
        const firstMonday = new Date(firstDay);
        const dayOfWeek = firstMonday.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        firstMonday.setDate(firstMonday.getDate() + mondayOffset);

        const weeks: WeeklyStats[] = [];
        let weekStart = new Date(firstMonday);
        let weekNumber = 1;

        while (weekStart <= lastDay) {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            // Calculate km for this week
            const weekWorkouts = completedWorkouts.filter(w => {
                const date = new Date(w.completedAt);
                return date >= weekStart && date <= weekEnd;
            });

            const totalKm = weekWorkouts.reduce((sum, w) =>
                sum + ((w.actualDistance || 0) / 1000), 0);

            weeks.push({
                weekNumber,
                startDate: new Date(weekStart),
                endDate: new Date(weekEnd),
                totalKm,
                totalWorkouts: weekWorkouts.length,
            });

            weekStart.setDate(weekStart.getDate() + 7);
            weekNumber++;

            // Stop if we've gone past 5 weeks (safety)
            if (weekNumber > 5) break;
        }

        return weeks;
    }, [completedWorkouts]);

    useEffect(() => {
        if (!athleteId) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // Get coach dashboard to find athlete info
                const dashboardData = await api.stats.getCoachDashboard();
                const foundAthlete = dashboardData.athletes.find(a => a.id === athleteId);

                if (!foundAthlete) {
                    setError('Atleta no encontrado');
                    return;
                }

                setAthlete(foundAthlete);

                // Get training plans for this athlete
                const plans = await api.trainingPlans.getAll({ athleteId });
                setTrainingPlans(plans);

                // Get completed workouts for this athlete (last 60 days)
                try {
                    const workoutsData = await api.stats.getAthleteWorkouts(athleteId);
                    setCompletedWorkouts(workoutsData.workouts);
                } catch (err) {
                    console.log('No completed workouts found:', err);
                }

                setError(null);

                // Fetch notes for this athlete
                try {
                    const notesData = await api.notes.getAthleteNotes(athleteId);
                    setNotes(notesData.notes);
                } catch (err) {
                    console.log('Could not fetch notes:', err);
                }
            } catch (err: any) {
                console.error('Error fetching athlete data:', err);
                setError(err.message || 'Error al cargar datos del atleta');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [athleteId]);

    // Add a new note
    const handleAddNote = async () => {
        if (!newNote.trim() || !athleteId) return;

        try {
            setLoadingNotes(true);
            const result = await api.notes.addAthleteNote(athleteId, newNote);
            setNotes(prev => [result.note, ...prev]);
            setNewNote('');
        } catch (err) {
            console.error('Error adding note:', err);
        } finally {
            setLoadingNotes(false);
        }
    };

    // Delete a note
    const handleDeleteNote = async (noteId: string) => {
        try {
            await api.notes.deleteNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    // Convert data to calendar events
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
        setSelectedDate(date);
        setEditingPlan(null);
        setShowPlanBuilder(true);
    };

    const handlePlanSaved = async (plan: TrainingPlan) => {
        // Refresh training plans
        if (athleteId) {
            const plans = await api.trainingPlans.getAll({ athleteId });
            setTrainingPlans(plans);
        }
        setShowPlanBuilder(false);
        setEditingPlan(null);
    };

    const handleEditPlan = (plan: TrainingPlan) => {
        setEditingPlan(plan);
        setSelectedDate(new Date(plan.date));
        setShowPlanBuilder(true);
        setSelectedEvent(null);
    };

    const handleDeletePlan = async (planId: string) => {
        try {
            await api.trainingPlans.delete(planId);
            setTrainingPlans(plans => plans.filter(p => p.id !== planId));
            setSelectedEvent(null);
        } catch (err) {
            console.error('Error deleting plan:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-sustraia-base min-h-screen">
                <Sidebar role={Role.COACH} />
                <main className="flex-1 md:ml-72 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-sustraia-accent animate-spin mx-auto mb-4" />
                        <p className="text-sustraia-gray font-medium">Cargando datos del atleta...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !athlete) {
        return (
            <div className="flex bg-sustraia-base min-h-screen">
                <Sidebar role={Role.COACH} />
                <main className="flex-1 md:ml-72 p-6 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 font-medium mb-4">{error || 'Atleta no encontrado'}</p>
                        <button
                            onClick={() => navigate('/dashboard/coach')}
                            className="px-6 py-3 bg-sustraia-accent text-white rounded-full font-bold hover:bg-sustraia-accent-hover"
                        >
                            Volver al dashboard
                        </button>
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
                <header className="mb-8">
                    <button
                        onClick={() => navigate('/dashboard/coach')}
                        className="flex items-center gap-2 text-sustraia-gray hover:text-sustraia-accent transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Volver al dashboard</span>
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-sustraia-accent text-white flex items-center justify-center font-bold text-2xl">
                                {athlete.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="font-display font-black text-3xl text-sustraia-text tracking-tight">
                                    {athlete.name}
                                </h1>
                                <p className="text-sustraia-gray flex items-center gap-2">
                                    <Mail size={14} />
                                    {athlete.email}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setSelectedDate(new Date());
                                setEditingPlan(null);
                                setShowPlanBuilder(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-sustraia-accent text-white rounded-full font-bold shadow-lg shadow-blue-500/30 hover:bg-sustraia-accent-hover transition-all"
                        >
                            <Plus size={18} />
                            Crear Plan
                        </button>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card delay={0} className="text-center">
                        <Activity className="w-8 h-8 text-sustraia-accent mx-auto mb-2" />
                        <span className="font-display font-bold text-2xl block">
                            {athlete.stats.weeklyWorkouts || 0}
                        </span>
                        <span className="text-xs text-sustraia-gray">Entrenos/semana</span>
                    </Card>
                    <Card delay={1} className="text-center">
                        <Activity className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <span className="font-display font-bold text-2xl block">
                            {((athlete.stats.weeklyDistance || 0) / 1000).toFixed(1)}
                        </span>
                        <span className="text-xs text-sustraia-gray">Km/semana</span>
                    </Card>

                    {/* Notes Section */}
                    <Card delay={2} className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                            <StickyNote className="w-5 h-5 text-yellow-500" />
                            <h3 className="font-display font-bold text-sm">Notas del atleta</h3>
                        </div>

                        {/* Add note input */}
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Ej: Trabaja por la noche, cuidado fatiga..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-sustraia-accent focus:border-transparent outline-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddNote();
                                }}
                            />
                            <button
                                onClick={handleAddNote}
                                disabled={loadingNotes || !newNote.trim()}
                                className="p-2 bg-sustraia-accent text-white rounded-xl hover:bg-sustraia-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>

                        {/* Notes list */}
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {notes.length > 0 ? (
                                notes.slice(0, 5).map((note) => (
                                    <div
                                        key={note.id}
                                        className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg text-sm group"
                                    >
                                        <span className="flex-1 text-gray-700">{note.content}</span>
                                        <button
                                            onClick={() => handleDeleteNote(note.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-2">
                                    Sin notas. Añade observaciones sobre el atleta.
                                </p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Weekly Km Breakdown */}
                {weeklyStats.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8"
                    >
                        <Card className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-sustraia-accent" />
                                <h3 className="font-display font-bold text-sm">
                                    Km por semana - {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {weeklyStats.map((week) => {
                                    const maxKm = Math.max(...weeklyStats.map(w => w.totalKm), 1);
                                    const progress = (week.totalKm / maxKm) * 100;
                                    const weekLabel = `${week.startDate.getDate()}/${week.startDate.getMonth() + 1} - ${week.endDate.getDate()}/${week.endDate.getMonth() + 1}`;

                                    return (
                                        <div key={week.weekNumber} className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 w-20 shrink-0">
                                                Sem {week.weekNumber}
                                            </span>
                                            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.max(progress, 5)}%` }}
                                                    transition={{ delay: week.weekNumber * 0.1, duration: 0.5 }}
                                                    className="h-full bg-sustraia-accent rounded-full"
                                                />
                                            </div>
                                            <span className="font-mono text-sm font-medium w-16 text-right">
                                                {week.totalKm.toFixed(1)} km
                                            </span>
                                            <span className="text-xs text-gray-400 w-16">
                                                ({week.totalWorkouts} ent.)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                Total mes: {weeklyStats.reduce((sum, w) => sum + w.totalKm, 0).toFixed(1)} km
                            </p>
                        </Card>
                    </motion.div>
                )}

                {/* Calendar */}
                <Calendar
                    events={calendarEvents}
                    onEventClick={handleEventClick}
                    onDayClick={handleDayClick}
                    className="mb-8"
                />

                {/* Training Plan Builder Modal */}
                <AnimatePresence>
                    {showPlanBuilder && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                            onClick={() => setShowPlanBuilder(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            >
                                <TrainingPlanBuilder
                                    athleteId={athleteId!}
                                    initialDate={selectedDate || new Date()}
                                    existingPlan={editingPlan || undefined}
                                    onSave={handlePlanSaved}
                                    onCancel={() => setShowPlanBuilder(false)}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

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

                                        <h4 className="font-bold text-sm uppercase text-gray-500 mb-3">Bloques</h4>
                                        <div className="space-y-2 mb-6">
                                            {(selectedEvent.data as TrainingPlan).blocks.map((block, i) => (
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

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleEditPlan(selectedEvent.data as TrainingPlan)}
                                                className="flex-1 py-3 bg-sustraia-accent text-white rounded-full font-bold hover:bg-sustraia-accent-hover"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlan((selectedEvent.data as TrainingPlan).id)}
                                                className="px-6 py-3 border border-red-200 text-red-600 rounded-full font-bold hover:bg-red-50"
                                            >
                                                Eliminar
                                            </button>
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
            </main>
        </div>
    );
}
