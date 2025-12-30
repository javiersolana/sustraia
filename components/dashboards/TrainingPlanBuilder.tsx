import React, { useState, useEffect } from 'react';
import { api, type TrainingPlan, type TrainingBlock, BlockType } from '../../lib/api/client';
import {
    Trash2,
    GripVertical,
    Flame,
    Zap,
    Coffee,
    Snowflake,
    Play,
    X,
    Loader2,
    RotateCcw
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'WARMUP', label: 'Calentamiento', icon: <Flame size={16} />, color: 'bg-yellow-400' },
    { type: 'RUN', label: 'Carrera', icon: <Play size={16} />, color: 'bg-green-500' },
    { type: 'INTERVALS', label: 'Series', icon: <Zap size={16} />, color: 'bg-red-500' },
    { type: 'COOLDOWN', label: 'Enfriamiento', icon: <Snowflake size={16} />, color: 'bg-blue-400' },
];

interface TrainingBlockWithId extends TrainingBlock {
    tempId: string;
}

interface TrainingPlanBuilderProps {
    athleteId: string;
    initialDate: Date;
    existingPlan?: TrainingPlan;
    onSave: (plan: TrainingPlan) => void;
    onCancel: () => void;
}

// Generate title from blocks
function generateTitle(blocks: TrainingBlockWithId[]): string {
    const parts: string[] = [];

    for (const block of blocks) {
        switch (block.type) {
            case 'WARMUP':
                if (block.durationSeconds) {
                    parts.push(`Cal. ${Math.round(block.durationSeconds / 60)}'`);
                } else if (block.distanceMeters) {
                    parts.push(`Cal. ${(block.distanceMeters / 1000).toFixed(1)}km`);
                }
                break;
            case 'RUN':
                let runPart = '';
                if (block.durationSeconds) {
                    runPart = `${Math.round(block.durationSeconds / 60)}'`;
                } else if (block.distanceMeters) {
                    runPart = `${(block.distanceMeters / 1000).toFixed(1)}km`;
                }
                if (block.paceMin) {
                    const paceMin = Math.floor(block.paceMin / 60);
                    const paceSec = Math.round(block.paceMin % 60);
                    runPart += ` @${paceMin}:${paceSec.toString().padStart(2, '0')}`;
                }
                if (runPart) parts.push(runPart);
                break;
            case 'INTERVALS':
                let intPart = '';
                const reps = block.repetitions || 1;
                if (block.distanceMeters) {
                    intPart = `${reps}x${block.distanceMeters}m`;
                } else if (block.durationSeconds) {
                    intPart = `${reps}x${Math.round(block.durationSeconds / 60)}'`;
                }
                if (block.paceMin) {
                    const paceMin = Math.floor(block.paceMin / 60);
                    const paceSec = Math.round(block.paceMin % 60);
                    intPart += ` @${paceMin}:${paceSec.toString().padStart(2, '0')}`;
                }
                if (block.restSeconds) {
                    if (block.restSeconds < 60) {
                        intPart += ` R${block.restSeconds}s`;
                    } else {
                        intPart += ` R${Math.round(block.restSeconds / 60)}'`;
                    }
                }
                if (intPart) parts.push(intPart);
                break;
            case 'COOLDOWN':
                if (block.durationSeconds) {
                    parts.push(`Enf. ${Math.round(block.durationSeconds / 60)}'`);
                } else if (block.distanceMeters) {
                    parts.push(`Enf. ${(block.distanceMeters / 1000).toFixed(1)}km`);
                }
                break;
        }
    }

    return parts.join(' + ') || 'Entrenamiento';
}

export default function TrainingPlanBuilder({
    athleteId,
    initialDate,
    existingPlan,
    onSave,
    onCancel,
}: TrainingPlanBuilderProps) {
    const [title, setTitle] = useState(existingPlan?.title || '');
    const [autoTitle, setAutoTitle] = useState(!existingPlan);
    const [description, setDescription] = useState(existingPlan?.description || '');
    const [date, setDate] = useState(
        existingPlan?.date
            ? new Date(existingPlan.date).toISOString().split('T')[0]
            : initialDate.toISOString().split('T')[0]
    );
    const [blocks, setBlocks] = useState<TrainingBlockWithId[]>(
        existingPlan?.blocks?.map((b, i) => ({ ...b, tempId: `block-${i}` })) || []
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-generate title when blocks change
    useEffect(() => {
        if (autoTitle && blocks.length > 0) {
            setTitle(generateTitle(blocks));
        }
    }, [blocks, autoTitle]);

    const addBlock = (type: BlockType) => {
        const newBlock: TrainingBlockWithId = {
            tempId: `block-${Date.now()}`,
            order: blocks.length,
            type,
            durationSeconds: type === 'WARMUP' || type === 'COOLDOWN' ? 600 : undefined,
            distanceMeters: type === 'INTERVALS' ? 400 : undefined,
            repetitions: type === 'INTERVALS' ? 10 : undefined,
            restSeconds: type === 'INTERVALS' ? 60 : undefined,
        };
        setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (tempId: string, updates: Partial<TrainingBlockWithId>) => {
        setBlocks(blocks.map(b =>
            b.tempId === tempId ? { ...b, ...updates } : b
        ));
    };

    const removeBlock = (tempId: string) => {
        setBlocks(blocks.filter(b => b.tempId !== tempId));
    };

    const handleReorder = (newBlocks: TrainingBlockWithId[]) => {
        setBlocks(newBlocks.map((b, i) => ({ ...b, order: i })));
    };

    const handleSave = async () => {
        const finalTitle = title.trim() || generateTitle(blocks);
        if (!finalTitle) {
            setError('Añade al menos un bloque');
            return;
        }
        if (blocks.length === 0) {
            setError('Añade al menos un bloque');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const planData = {
                athleteId,
                date,
                title: finalTitle,
                description: description.trim() || undefined,
                blocks: blocks.map(({ tempId, ...block }) => block),
            };

            let savedPlan: TrainingPlan;

            if (existingPlan) {
                savedPlan = await api.trainingPlans.update(existingPlan.id, planData);
            } else {
                savedPlan = await api.trainingPlans.create(planData);
            }

            onSave(savedPlan);
        } catch (err: any) {
            console.error('Error saving plan:', err);
            setError(err.message || 'Error al guardar el plan');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-display font-bold text-xl">
                    {existingPlan ? 'Editar Plan' : 'Nuevo Plan de Entrenamiento'}
                </h2>
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
                    <X size={20} />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Basic info */}
            <div className="space-y-4 mb-6">
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">Título</label>
                        <button
                            onClick={() => {
                                setAutoTitle(!autoTitle);
                                if (!autoTitle) setTitle(generateTitle(blocks));
                            }}
                            className={`text-xs font-medium px-2 py-1 rounded-full ${autoTitle ? 'bg-sustraia-accent text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            <RotateCcw size={12} className="inline mr-1" />
                            Auto
                        </button>
                    </div>
                    <input
                        type="text"
                        value={title}
                        onChange={e => {
                            setTitle(e.target.value);
                            setAutoTitle(false);
                        }}
                        placeholder="Se genera automáticamente..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sustraia-accent focus:border-transparent outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sustraia-accent focus:border-transparent outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Indicaciones para el atleta..."
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sustraia-accent focus:border-transparent outline-none resize-none"
                    />
                </div>
            </div>

            {/* Block type buttons */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Añadir bloque</label>
                <div className="flex flex-wrap gap-2">
                    {BLOCK_TYPES.map(({ type, label, icon, color }) => (
                        <button
                            key={type}
                            onClick={() => addBlock(type)}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            <span className={`w-3 h-3 rounded-full ${color}`} />
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Blocks list */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bloques ({blocks.length})
                </label>

                {blocks.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-500">
                        Añade bloques usando los botones de arriba
                    </div>
                ) : (
                    <Reorder.Group
                        axis="y"
                        values={blocks}
                        onReorder={handleReorder}
                        className="space-y-2"
                    >
                        {blocks.map((block) => (
                            <BlockEditor
                                block={block}
                                onUpdate={(updates) => updateBlock(block.tempId, updates)}
                                onRemove={() => removeBlock(block.tempId)}
                            />
                        ))}
                    </Reorder.Group>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 border border-gray-200 rounded-full font-bold text-gray-700 hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 bg-sustraia-accent text-white rounded-full font-bold hover:bg-sustraia-accent-hover disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        existingPlan ? 'Guardar cambios' : 'Crear plan'
                    )}
                </button>
            </div>
        </div>
    );
}

interface BlockEditorProps {
    block: TrainingBlockWithId;
    onUpdate: (updates: Partial<TrainingBlockWithId>) => void;
    onRemove: () => void;
}

function BlockEditor({ block, onUpdate, onRemove }: BlockEditorProps) {
    const blockType = BLOCK_TYPES.find(t => t.type === block.type)!;
    const isIntervals = block.type === 'INTERVALS';

    // Parse pace from seconds to mm:ss display
    const formatPace = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const parsePace = (str: string): number => {
        const parts = str.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');
        }
        return 0;
    };

    return (
        <Reorder.Item
            value={block}
            className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
        >
            <div className="flex items-start gap-3">
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing pt-1">
                    <GripVertical size={18} className="text-gray-400" />
                </div>

                {/* Block indicator */}
                <div className={`w-8 h-8 rounded-lg ${blockType.color} flex items-center justify-center text-white shrink-0`}>
                    {blockType.icon}
                </div>

                {/* Block content */}
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{blockType.label}</span>
                        <button
                            onClick={onRemove}
                            className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    {/* Intervals-specific: repetitions */}
                    {isIntervals && (
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 w-16">Series:</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={block.repetitions || 10}
                                onChange={e => onUpdate({ repetitions: parseInt(e.target.value) || 1 })}
                                className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                            />
                            <span className="text-xs text-gray-500">x</span>
                        </div>
                    )}

                    {/* Distance/Duration */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {isIntervals ? (
                            <>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={block.distanceMeters || 400}
                                    onChange={e => onUpdate({ distanceMeters: parseInt(e.target.value) || 0, durationSeconds: undefined })}
                                    className="w-20 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                                />
                                <span className="text-xs text-gray-500">metros</span>
                            </>
                        ) : (
                            <>
                                <input
                                    type="number"
                                    min="0"
                                    max="180"
                                    value={Math.round((block.durationSeconds || 0) / 60)}
                                    onChange={e => onUpdate({ durationSeconds: parseInt(e.target.value || '0') * 60, distanceMeters: undefined })}
                                    className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                                />
                                <span className="text-xs text-gray-500">min</span>
                            </>
                        )}
                    </div>

                    {/* Intervals-specific: rest */}
                    {isIntervals && (
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 w-16">Recup:</label>
                            <input
                                type="number"
                                min="0"
                                max="600"
                                value={block.restSeconds || 60}
                                onChange={e => onUpdate({ restSeconds: parseInt(e.target.value) || 0 })}
                                className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                            />
                            <span className="text-xs text-gray-500">seg</span>
                        </div>
                    )}

                    {/* Pace target (all blocks) */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <label className="text-xs text-gray-500 w-16">Ritmo:</label>
                        <input
                            type="text"
                            placeholder="4:30"
                            value={block.paceMin ? formatPace(block.paceMin) : ''}
                            onChange={e => onUpdate({ paceMin: parsePace(e.target.value) })}
                            className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                        />
                        <span className="text-xs text-gray-500">-</span>
                        <input
                            type="text"
                            placeholder="5:00"
                            value={block.paceMax ? formatPace(block.paceMax) : ''}
                            onChange={e => onUpdate({ paceMax: parsePace(e.target.value) })}
                            className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                        />
                        <span className="text-xs text-gray-500">/km</span>
                    </div>

                    {/* HR target (all blocks) */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <label className="text-xs text-gray-500 w-16">Pulso:</label>
                        <input
                            type="number"
                            placeholder="140"
                            min="60"
                            max="220"
                            value={block.hrMin || ''}
                            onChange={e => onUpdate({ hrMin: parseInt(e.target.value) || undefined })}
                            className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                        />
                        <span className="text-xs text-gray-500">-</span>
                        <input
                            type="number"
                            placeholder="160"
                            min="60"
                            max="220"
                            value={block.hrMax || ''}
                            onChange={e => onUpdate({ hrMax: parseInt(e.target.value) || undefined })}
                            className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                        />
                        <span className="text-xs text-gray-500">bpm</span>
                    </div>

                    {/* Notes */}
                    <input
                        type="text"
                        placeholder="Notas..."
                        value={block.notes || ''}
                        onChange={e => onUpdate({ notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
            </div>
        </Reorder.Item>
    );
}
