import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, LayoutList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrainingPlan, CompletedWorkout } from '../../lib/api/client';

interface CalendarEvent {
    id: string;
    date: Date;
    type: 'plan' | 'completed' | 'race';
    title: string;
    data: TrainingPlan | (CompletedWorkout & { title?: string }) | any;
}

interface CalendarProps {
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
    onDayClick?: (date: Date) => void;
    className?: string;
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Calendar({ events, onEventClick, onDayClick, className = '' }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and number of days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // Get events for a specific date
    const getEventsForDate = (date: Date) => {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return (
                eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear()
            );
        });
    };

    // Navigate
    const goToPrevious = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(year, month - 1, 1));
        } else {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() - 7);
            setCurrentDate(newDate);
        }
    };

    const goToNext = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(year, month + 1, 1));
        } else {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + 7);
            setCurrentDate(newDate);
        }
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Generate week days for week view
    const getWeekDays = () => {
        const startOfWeek = new Date(currentDate);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        return days;
    };

    // Generate month grid
    const generateMonthGrid = () => {
        const grid: (Date | null)[][] = [];
        let currentWeek: (Date | null)[] = [];

        // Add empty days before first day of month
        for (let i = 0; i < firstDayWeekday; i++) {
            currentWeek.push(null);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            currentWeek.push(new Date(year, month, day));
            if (currentWeek.length === 7) {
                grid.push(currentWeek);
                currentWeek = [];
            }
        }

        // Add empty days after last day of month
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null);
            }
            grid.push(currentWeek);
        }

        return grid;
    };

    const isToday = (date: Date) => {
        return date.toDateString() === today.toDateString();
    };

    const renderDayCell = (date: Date | null, index: number) => {
        if (!date) {
            return <div key={index} className="p-2 min-h-[100px] bg-gray-50/50" />;
        }

        const dayEvents = getEventsForDate(date);
        const isTodayDate = isToday(date);

        // Helper to format event summary
        const formatEventSummary = (event: CalendarEvent) => {
            if (event.type === 'completed') {
                const workout = event.data as CompletedWorkout;
                const km = workout.actualDistance ? `${(workout.actualDistance / 1000).toFixed(1)}km` : '';
                const time = workout.actualDuration ? `${Math.round(workout.actualDuration / 60)}'` : '';
                return km && time ? `${km} - ${time}` : km || time || '';
            }
            return '';
        };

        return (
            <motion.div
                key={date.toISOString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`
          p-2 min-h-[100px] border-b border-r border-gray-100 cursor-pointer transition-colors
          ${isTodayDate ? 'bg-blue-50/50 ring-1 ring-inset ring-sustraia-accent' : 'hover:bg-gray-50'}
        `}
                onClick={() => onDayClick?.(date)}
            >
                <div className="flex justify-between items-start">
                    <span className={`
            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
            ${isTodayDate ? 'bg-sustraia-accent text-white' : 'text-gray-700'}
          `}>
                        {date.getDate()}
                    </span>
                </div>

                <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => {
                        const summary = formatEventSummary(event);
                        return (
                            <button
                                key={event.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEventClick?.(event);
                                }}
                                className={`
                w-full text-left text-xs px-2 py-1 rounded transition-colors
                ${event.type === 'plan'
                                        ? 'bg-sustraia-accent/10 text-sustraia-accent hover:bg-sustraia-accent/20'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }
              `}
                            >
                                <span className="block truncate font-medium">{event.title}</span>
                                {summary && <span className="block text-[10px] opacity-75">{summary}</span>}
                            </button>
                        );
                    })}
                    {dayEvents.length > 3 && (
                        <span className="text-xs text-gray-500 px-2">
                            +{dayEvents.length - 3} más
                        </span>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="font-display font-bold text-xl">
                        {viewMode === 'month'
                            ? `${MONTHS_ES[month]} ${year}`
                            : `Semana del ${getWeekDays()[0].getDate()} ${MONTHS_ES[getWeekDays()[0].getMonth()]}`
                        }
                    </h3>
                    <button
                        onClick={goToToday}
                        className="text-sm font-medium text-sustraia-accent hover:underline"
                    >
                        Hoy
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex bg-gray-100 rounded-full p-1">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`p-2 rounded-full transition-colors ${viewMode === 'month' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                }`}
                        >
                            <CalendarDays size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`p-2 rounded-full transition-colors ${viewMode === 'week' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                }`}
                        >
                            <LayoutList size={16} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <button
                        onClick={goToPrevious}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={goToNext}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS_ES.map((day) => (
                    <div key={day} className="p-2 text-center text-xs font-bold text-gray-500 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <AnimatePresence mode="wait">
                {viewMode === 'month' ? (
                    <motion.div
                        key="month"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-7"
                    >
                        {generateMonthGrid().flat().map((date, index) => renderDayCell(date, index))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="week"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-7"
                    >
                        {getWeekDays().map((date, index) => {
                            const dayEvents = getEventsForDate(date);
                            const isTodayDate = isToday(date);

                            return (
                                <div
                                    key={date.toISOString()}
                                    className={`
                    p-3 min-h-[300px] border-r border-gray-100 cursor-pointer
                    ${isTodayDate ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
                  `}
                                    onClick={() => onDayClick?.(date)}
                                >
                                    <div className="text-center mb-3">
                                        <span className="text-xs text-gray-500 uppercase">{DAYS_ES[index]}</span>
                                        <span className={`
                      block text-lg font-bold mt-1 w-10 h-10 mx-auto flex items-center justify-center rounded-full
                      ${isTodayDate ? 'bg-sustraia-accent text-white' : 'text-gray-700'}
                    `}>
                                            {date.getDate()}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {dayEvents.map((event) => (
                                            <button
                                                key={event.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick?.(event);
                                                }}
                                                className={`
                          w-full text-left text-sm p-2 rounded-lg transition-colors
                          ${event.type === 'plan'
                                                        ? 'bg-sustraia-accent/10 text-sustraia-accent hover:bg-sustraia-accent/20'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }
                        `}
                                            >
                                                <span className="font-medium block truncate">{event.title}</span>
                                                <span className="text-xs opacity-70">
                                                    {event.type === 'plan' ? 'Planificado' : 'Completado'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
