export type AchievementCategory = 'Todos' | 'Racha' | 'Distancia' | 'Entreno' | 'Comunidad' | 'Especial';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  category: AchievementCategory;
  currentValue: number;
  targetValue: number;
  isUnlocked: boolean;
  xpReward: number;
  dateUnlocked?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserStats {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  streakDays: number;
  totalKm: number;
  totalWorkouts: number;
}
