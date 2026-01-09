import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { LevelProgress } from './components/LevelProgress';
import { AchievementCard } from './components/AchievementCard';
import { USER_STATS, ACHIEVEMENTS_DATA } from './data';
import { AchievementCategory } from './types';
import { Flame, Target, Trophy, ChevronRight, Bell } from 'lucide-react';

const CATEGORIES: AchievementCategory[] = ['Todos', 'Racha', 'Distancia', 'Entreno', 'Comunidad', 'Especial'];

function App() {
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>('Todos');

  const filteredAchievements = ACHIEVEMENTS_DATA.filter(
    (a) => activeCategory === 'Todos' || a.category === activeCategory
  );

  const unlockedCount = ACHIEVEMENTS_DATA.filter(a => a.isUnlocked).length;
  const totalCount = ACHIEVEMENTS_DATA.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-gray-900 font-sans">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 lg:px-12 max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <header className="flex justify-between items-start mb-8 md:mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              Mis Logros
            </h1>
            <p className="text-gray-500">
              Has desbloqueado <span className="font-semibold text-gray-900">{unlockedCount}</span> de <span className="font-semibold text-gray-900">{totalCount}</span> logros disponibles
            </p>
          </div>
          <button className="p-3 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-brand-600 hover:border-brand-200 transition-colors shadow-sm">
            <Bell size={20} />
          </button>
        </header>

        {/* Level & XP Bar - Dopamine Hit #1 */}
        <LevelProgress 
            level={USER_STATS.level} 
            currentXp={USER_STATS.currentXp} 
            nextLevelXp={USER_STATS.nextLevelXp} 
        />

        {/* Stats Grid - Visual Reinforcement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          <StatCard 
            title="Racha Actual" 
            value={`${USER_STATS.streakDays} días`}
            subtitle="¡Estás que ardes!"
            icon={Flame}
            colorClass="text-orange-500"
            iconBgClass="bg-orange-50"
          />
          <StatCard 
            title="Distancia Total" 
            value={`${USER_STATS.totalKm} km`}
            subtitle="Equivalente a 3 maratones"
            icon={Target}
            colorClass="text-blue-500"
            iconBgClass="bg-blue-50"
          />
          <StatCard 
            title="Entrenos" 
            value={`${USER_STATS.totalWorkouts}`}
            subtitle="Sesiones completadas"
            icon={Trophy}
            colorClass="text-emerald-500"
            iconBgClass="bg-emerald-50"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border
                ${activeCategory === cat 
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
        
        {/* Footer Motivation */}
        <div className="mt-12 text-center pb-8">
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                Ver historial completo de actividades <ChevronRight size={16} />
            </button>
        </div>

      </main>
    </div>
  );
}

export default App;
