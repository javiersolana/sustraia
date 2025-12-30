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
import { Role } from '../../lib/types/dashboard';
import { motion } from 'framer-motion';
import { api } from '../../lib/api/client';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  role: Role;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const menuItems = role === Role.ATHLETE
    ? [
      { icon: House, label: 'Inicio', href: '/dashboard/atleta' },
      { icon: Calendar, label: 'Entrenamientos', href: '/dashboard/atleta' },
      { icon: Activity, label: 'Actividades', href: '/dashboard/atleta/actividades' },
      { icon: TrendingUp, label: 'Progreso', href: '/dashboard/atleta/progreso' },
      { icon: MessageSquare, label: 'Mensajes', href: '/dashboard/atleta' },
      { icon: User, label: 'Perfil', href: '/dashboard/atleta' },
    ]
    : [
      { icon: LayoutDashboard, label: 'Vista general', href: '/dashboard/coach' },
      { icon: Users, label: 'Mis atletas', href: '/dashboard/coach' },
      { icon: Calendar, label: 'Calendario', href: '/dashboard/coach' },
      { icon: MessageSquare, label: 'Mensajes', href: '/dashboard/coach' },
      { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/coach' },
    ];

  const handleStravaConnect = async () => {
    try {
      const { authUrl } = await api.strava.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting Strava auth URL:', error);
      alert('Error al conectar con Strava. Verifica la configuración.');
    }
  };

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
            <NavLink
              key={index}
              to={item.href}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200
                ${isActive
                  ? 'bg-sustraia-accent text-white shadow-lg shadow-blue-500/20'
                  : 'text-sustraia-gray hover:bg-blue-50 hover:text-sustraia-accent'
                }
              `}
            >
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 w-full"
                >
                  <item.icon size={22} className={isActive ? 'text-white' : ''} />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Button */}
      <div className="px-2">
        {role === Role.ATHLETE ? (
          <button
            onClick={handleStravaConnect}
            className="w-full py-3 px-4 rounded-full border-2 border-sustraia-light-gray text-sustraia-gray font-bold text-sm hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
          >
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
