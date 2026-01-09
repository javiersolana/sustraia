import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function StravaCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'connecting' | 'importing' | 'success' | 'error'>('connecting');
    const [message, setMessage] = useState('Conectando con Strava...');
    const [importResult, setImportResult] = useState<{ imported: number; activities: { title: string; label: string }[] } | null>(null);
    const hasProcessed = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            // Prevent duplicate calls (React StrictMode)
            if (hasProcessed.current) return;
            hasProcessed.current = true;

            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const error = searchParams.get('error');

            console.log('📋 Strava callback params:', { code: !!code, state: !!state, error });

            if (error) {
                setStatus('error');
                setMessage('Conexión cancelada o denegada');
                setTimeout(() => navigate('/dashboard/atleta'), 3000);
                return;
            }

            if (!code) {
                setStatus('error');
                setMessage('No se recibió código de autorización');
                setTimeout(() => navigate('/dashboard/atleta'), 3000);
                return;
            }

            try {
                // Step 1: Connect Strava (pass state if available)
                console.log('🔗 Calling handleCallback with:', { code: code.substring(0, 10) + '...', hasState: !!state });
                await api.strava.handleCallback(code, state);

                // Step 2: Import activities
                setStatus('importing');
                setMessage('Importando entrenamientos de las últimas 4 semanas...');

                const result = await api.strava.importActivities(4);

                setImportResult({
                    imported: result.imported,
                    activities: result.activities.slice(0, 5), // Show first 5
                });

                setStatus('success');
                setMessage(`¡Conectado! ${result.imported} entrenamientos importados`);

                setTimeout(() => navigate('/dashboard/atleta'), 3000);
            } catch (err: any) {
                console.error('Strava callback error:', err);
                setStatus('error');
                setMessage(err.message || 'Error al conectar con Strava');
                setTimeout(() => navigate('/dashboard/atleta'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-sustraia-base flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-3xl shadow-lg max-w-md w-full">
                {(status === 'connecting' || status === 'importing') && (
                    <>
                        <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
                        <p className="text-sustraia-gray font-medium">{message}</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-green-600 font-bold text-lg mb-4">{message}</p>
                        {importResult && importResult.activities.length > 0 && (
                            <div className="text-left bg-gray-50 rounded-2xl p-4 mb-4">
                                <p className="text-sm font-bold text-sustraia-text mb-2">Entrenamientos importados:</p>
                                <ul className="space-y-1">
                                    {importResult.activities.map((activity, idx) => (
                                        <li key={idx} className="text-sm text-sustraia-gray flex justify-between">
                                            <span className="truncate flex-1">{activity.title}</span>
                                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                {activity.label}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                {importResult.imported > 5 && (
                                    <p className="text-xs text-sustraia-gray mt-2">
                                        ... y {importResult.imported - 5} más
                                    </p>
                                )}
                            </div>
                        )}
                        <p className="text-sustraia-gray text-sm">Redirigiendo...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 font-bold text-lg">{message}</p>
                        <p className="text-sustraia-gray text-sm mt-2">Redirigiendo...</p>
                    </>
                )}
            </div>
        </div>
    );
}
