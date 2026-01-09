import { Achievement, UserStats } from './types';

export const USER_STATS: UserStats = {
  level: 12,
  currentXp: 2450,
  nextLevelXp: 3000,
  streakDays: 14,
  totalKm: 127.5,
  totalWorkouts: 16
};

export const ACHIEVEMENTS_DATA: Achievement[] = [
  {
    id: '1',
    title: 'Primeros Pasos',
    description: 'Completa tu primer entrenamiento de carrera.',
    icon: 'Footprints',
    category: 'Entreno',
    currentValue: 1,
    targetValue: 1,
    isUnlocked: true,
    xpReward: 100,
    dateUnlocked: '12 Ene 2024',
    rarity: 'common'
  },
  {
    id: '2',
    title: 'Fuego Interior',
    description: 'Mantén una racha de entrenamiento de 7 días.',
    icon: 'Flame',
    category: 'Racha',
    currentValue: 14,
    targetValue: 7,
    isUnlocked: true,
    xpReward: 300,
    dateUnlocked: '20 Ene 2024',
    rarity: 'rare'
  },
  {
    id: '3',
    title: 'Maratonista Junior',
    description: 'Acumula 42km totales corriendo.',
    icon: 'MapPin',
    category: 'Distancia',
    currentValue: 127.5,
    targetValue: 42,
    isUnlocked: true,
    xpReward: 500,
    dateUnlocked: '05 Feb 2024',
    rarity: 'epic'
  },
  {
    id: '4',
    title: 'Madrugador',
    description: 'Entrena antes de las 7:00 AM 5 veces.',
    icon: 'Sunrise',
    category: 'Especial',
    currentValue: 3,
    targetValue: 5,
    isUnlocked: false,
    xpReward: 400,
    rarity: 'rare'
  },
  {
    id: '5',
    title: 'Centurión',
    description: 'Alcanza los 100km totales.',
    icon: 'Trophy',
    category: 'Distancia',
    currentValue: 127.5,
    targetValue: 100,
    isUnlocked: true,
    xpReward: 1000,
    dateUnlocked: '15 Feb 2024',
    rarity: 'legendary'
  },
  {
    id: '6',
    title: 'Social Butterfly',
    description: 'Comparte 10 entrenamientos con tu cuadrilla.',
    icon: 'Users',
    category: 'Comunidad',
    currentValue: 2,
    targetValue: 10,
    isUnlocked: false,
    xpReward: 200,
    rarity: 'common'
  },
  {
    id: '7',
    title: 'Bestia del Domingo',
    description: 'Completa una tirada larga (>15km) un domingo.',
    icon: 'CalendarCheck',
    category: 'Entreno',
    currentValue: 0,
    targetValue: 1,
    isUnlocked: false,
    xpReward: 600,
    rarity: 'epic'
  },
  {
    id: '8',
    title: 'Imparable',
    description: 'Mantén una racha de 30 días seguidos.',
    icon: 'Zap',
    category: 'Racha',
    currentValue: 14,
    targetValue: 30,
    isUnlocked: false,
    xpReward: 2000,
    rarity: 'legendary'
  }
];
