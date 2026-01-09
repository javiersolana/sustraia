import React from 'react';
import { Sparkles } from 'lucide-react';

interface LevelProgressProps {
  level: number;
  currentXp: number;
  nextLevelXp: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ level, currentXp, nextLevelXp }) => {
  const percentage = Math.min((currentXp / nextLevelXp) * 100, 100);

  return (
    <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden mb-8">
      {/* Decorative background circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-2xl font-bold shadow-inner">
            {level}
          </div>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Corredor de Élite
              <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
            </h2>
            <p className="text-brand-100">Sigue empujando, ¡estás a punto de subir!</p>
          </div>
        </div>

        <div className="flex-1 max-w-xl">
           <div className="flex justify-between text-xs font-medium mb-2 uppercase tracking-wider text-brand-100">
             <span>Experiencia</span>
             <span>{currentXp} / {nextLevelXp} XP</span>
           </div>
           <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
             <div 
                className="h-full bg-gradient-to-r from-yellow-300 to-amber-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
             ></div>
           </div>
        </div>
      </div>
    </div>
  );
};
