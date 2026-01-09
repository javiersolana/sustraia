import React from 'react';
import { Achievement } from '../types';
import * as Icons from 'lucide-react';

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const LucideIcon = (Icons as any)[achievement.icon] || Icons.Trophy;
  const progress = Math.min((achievement.currentValue / achievement.targetValue) * 100, 100);
  
  // Rarity Colors
  const rarityConfig = {
    common: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
    rare: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    epic: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    legendary: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  };

  const style = rarityConfig[achievement.rarity];
  const opacityClass = achievement.isUnlocked ? 'opacity-100' : 'opacity-60 grayscale-[0.8] hover:grayscale-0 hover:opacity-100 transition-all duration-300';

  return (
    <div className={`group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden ${opacityClass}`}>
      {achievement.isUnlocked && (
        <div className="absolute top-0 right-0 p-3">
           <Icons.CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Header with Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${style.bg} ${style.text} group-hover:scale-110 transition-transform duration-300`}>
            <LucideIcon size={24} strokeWidth={2.5} />
          </div>
          {achievement.isUnlocked && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  {achievement.dateUnlocked}
              </span>
          )}
        </div>

        {/* Content */}
        <div className="mb-4 flex-1">
          <h3 className="font-bold text-gray-900 mb-1 leading-tight">{achievement.title}</h3>
          <p className="text-xs text-gray-500 leading-relaxed">{achievement.description}</p>
        </div>

        {/* Footer / Progress */}
        <div className="mt-auto">
            {!achievement.isUnlocked ? (
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-semibold text-gray-400 uppercase">
                        <span>Progreso</span>
                        <span>{Math.floor(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-brand-500 rounded-full" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="text-right text-[10px] text-gray-400 pt-1">
                        +{achievement.xpReward} XP
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-lg w-fit">
                    <span>Desbloqueado</span>
                    <span className="text-emerald-400">•</span>
                    <span>+{achievement.xpReward} XP</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
