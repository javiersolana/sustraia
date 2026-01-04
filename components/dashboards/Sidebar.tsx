import React from 'react';
import {
  House,
  Calendar,
  TrendingUp,
  MessageSquare,
  User,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Activity
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
      { icon: Calendar, label: 'Entrenamientos', href: '/dashboard/atleta/calendario' },
      { icon: Activity, label: 'Actividades', href: '/dashboard/atleta/actividades' },
      { icon: TrendingUp, label: 'Progreso', href: '/dashboard/atleta/progreso' },
      { icon: MessageSquare, label: 'Mensajes', href: '/dashboard/atleta' },
      { icon: User, label: 'Perfil', href: '/dashboard/atleta' },
    ]
    : [
      { icon: LayoutDashboard, label: 'Vista general', href: '/dashboard/coach' },
      { icon: Users, label: 'Mis atletas', href: '/dashboard/coach/atletas' },
      { icon: Calendar, label: 'Calendario', href: '/dashboard/coach/calendario' },
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
        <div className="flex items-center justify-center mb-12">
          <img
            src="/images/logo.png"
            alt="SUSTRAIN Logo"
            className="h-12 w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.href}
              end={item.href === '/dashboard/atleta' || item.href === '/dashboard/coach'}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sustraia-text bg-transparent transition-all duration-300"
            >
              {() => (
                <motion.div
                  whileHover={{ x: 6, backgroundColor: 'rgba(0, 0, 0, 0.03)' }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex items-center gap-4 w-full px-2 py-1 -mx-2 rounded-xl"
                >
                  <item.icon size={22} className="text-sustraia-gray" />
                  <span className="font-medium text-sustraia-text">{item.label}</span>
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
