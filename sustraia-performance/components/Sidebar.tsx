import React from 'react';
import { 
  House, 
  Calendar, 
  TrendingUp, 
  MessageSquare, 
  User, 
  Activity, 
  LayoutDashboard, 
  Users, 
  BarChart3,
  Settings
} from 'lucide-react';
import { Role } from '../types';
import { motion } from 'framer-motion';

interface SidebarProps {
  role: Role;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const menuItems = role === Role.ATHLETE 
    ? [
        { icon: House, label: 'Inicio', active: true },
        { icon: Calendar, label: 'Entrenamientos', active: false },
        { icon: TrendingUp, label: 'Progreso', active: false },
        { icon: MessageSquare, label: 'Mensajes', active: false },
        { icon: User, label: 'Perfil', active: false },
      ]
    : [
        { icon: LayoutDashboard, label: 'Vista general', active: true },
        { icon: Users, label: 'Mis atletas', active: false },
        { icon: Calendar, label: 'Calendario', active: false },
        { icon: MessageSquare, label: 'Mensajes', active: false },
        { icon: BarChart3, label: 'Estadísticas', active: false },
      ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-sustraia-paper border-r border-sustraia-light-gray flex flex-col justify-between p-6 z-40 hidden md:flex">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-8 h-8 bg-sustraia-accent rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-sustraia-text">SUSTRAIA</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.a
              key={index}
              href="#"
              whileHover={{ x: 4 }}
              className={`
                flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200
                ${item.active 
                  ? 'bg-sustraia-accent text-white shadow-lg shadow-blue-500/20' 
                  : 'text-sustraia-gray hover:bg-blue-50 hover:text-sustraia-accent'
                }
              `}
            >
              <item.icon size={22} className={item.active ? 'text-white' : ''} />
              <span className="font-medium">{item.label}</span>
            </motion.a>
          ))}
        </nav>
      </div>

      {/* Footer Button */}
      <div className="px-2">
        {role === Role.ATHLETE ? (
          <button className="w-full py-3 px-4 rounded-full border-2 border-sustraia-light-gray text-sustraia-gray font-bold text-sm hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2">
             Sincronizar Strava
          </button>
        ) : (
          <button className="w-full py-4 px-4 rounded-full bg-sustraia-accent text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-sustraia-accent-hover hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            Crear nuevo plan
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;