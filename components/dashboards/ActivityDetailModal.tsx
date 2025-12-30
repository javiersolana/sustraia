import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Heart, Zap, Activity, Loader2 } from 'lucide-react';
import { api, type CompletedWorkout, type StravaLap } from '../../lib/api/client';

interface ActivityDetailModalProps {
    activity: CompletedWorkout & { title?: string };
    onClose: () => void;
}

export default function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
    const [laps, setLaps] = useState<StravaLap[]>([]);
    const [loadingLaps, setLoadingLaps] = useState(false);

    useEffect(() => {
        const fetchLaps = async () => {
            if (!activity.stravaId) return;

            setLoadingLaps(true);
            try {
                const result = await api.strava.getActivityLaps(parseInt(activity.stravaId));
                setLaps(result.laps);
            } catch (err) {
                console.error('Error fetching laps:', err);
            } finally {
                setLoadingLaps(false);
            }
        };

        fetchLaps();
    }, [activity.stravaId]);

    // Format duration
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Format pace (seconds per km to min:sec/km)
    const formatPace = (metersPerSecond: number) => {
        if (!metersPerSecond) return '--:--';
        const paceSecondsPerKm = 1000 / metersPerSecond;
        const mins = Math.floor(paceSecondsPerKm / 60);
        const secs = Math.round(paceSecondsPerKm % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const pace = activity.actualDistance && activity.actualDuration
        ? (activity.actualDuration / (activity.actualDistance / 1000))
        : 0;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-display font-bold text-xl">{activity.title || 'Actividad'}</h3>
                    <p className="text-sustraia-gray text-sm">
                        {new Date(activity.completedAt).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                    <X size={20} />
                </button>
            </div>

            {/* Main stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {activity.actualDuration && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-sustraia-gray text-xs font-medium mb-1">
                            <Clock size={14} />
                            TIEMPO
                        </div>
                        <span className="font-display font-bold text-xl">
                            {formatDuration(activity.actualDuration)}
                        </span>
                    </div>
                )}

                {activity.actualDistance && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-sustraia-gray text-xs font-medium mb-1">
                            <MapPin size={14} />
                            DISTANCIA
                        </div>
                        <span className="font-display font-bold text-xl">
                            {(activity.actualDistance / 1000).toFixed(2)} km
                        </span>
                    </div>
                )}

                {pace > 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-sustraia-gray text-xs font-medium mb-1">
                            <Zap size={14} />
                            RITMO MEDIO
                        </div>
                        <span className="font-display font-bold text-xl">
                            {Math.floor(pace / 60)}:{Math.floor(pace % 60).toString().padStart(2, '0')} /km
                        </span>
                    </div>
                )}

                {activity.avgHeartRate && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-sustraia-gray text-xs font-medium mb-1">
                            <Heart size={14} />
                            FC MEDIA
                        </div>
                        <span className="font-display font-bold text-xl">
                            {activity.avgHeartRate} <span className="text-sm font-normal">bpm</span>
                        </span>
                    </div>
                )}

                {activity.maxHeartRate && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-sustraia-gray text-xs font-medium mb-1">
                            <Heart size={14} className="text-red-500" />
                            FC MÁXIMA
                        </div>
                        <span className="font-display font-bold text-xl">
                            {activity.maxHeartRate} <span className="text-sm font-normal">bpm</span>
                        </span>
                    </div>
                )}

                {activity.calories && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-sustraia-gray text-xs font-medium mb-1">
                            <Activity size={14} />
                            CALORÍAS
                        </div>
                        <span className="font-display font-bold text-xl">
                            {activity.calories} <span className="text-sm font-normal">kcal</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Laps section */}
            {activity.stravaId && (
                <div>
                    <h4 className="font-bold text-sm uppercase text-gray-500 mb-3 flex items-center gap-2">
                        <Zap size={14} />
                        Series / Vueltas
                    </h4>

                    {loadingLaps ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-sustraia-accent" />
                        </div>
                    ) : laps.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-3 py-2 text-left">#</th>
                                        <th className="px-3 py-2 text-right">Dist.</th>
                                        <th className="px-3 py-2 text-right">Tiempo</th>
                                        <th className="px-3 py-2 text-right">Ritmo</th>
                                        <th className="px-3 py-2 text-right">FC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {laps.map((lap, i) => (
                                        <tr key={lap.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 font-medium">{i + 1}</td>
                                            <td className="px-3 py-2 text-right">
                                                {(lap.distance / 1000).toFixed(2)} km
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {formatDuration(lap.moving_time)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium">
                                                {formatPace(lap.average_speed)} /km
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {lap.average_heartrate ? `${Math.round(lap.average_heartrate)}` : '--'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-500 text-sm">
                            No hay datos de series disponibles
                        </div>
                    )}
                </div>
            )}

            {/* Notes */}
            {activity.notes && (
                <div className="mt-6">
                    <h4 className="font-bold text-sm uppercase text-gray-500 mb-2">Notas</h4>
                    <p className="text-gray-600 text-sm">{activity.notes}</p>
                </div>
            )}
        </div>
    );
}
