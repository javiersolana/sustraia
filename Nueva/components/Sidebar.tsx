import React from 'react';
import { 
  Home, 
  CalendarDays, 
  Activity, 
  TrendingUp, 
  Trophy, 
  Users, 
  MessageSquare 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed top-0 left-0 w-64 h-full bg-white border-r border-gray-100 hidden md:flex flex-col z-20">
      {/* Logo */}
      <div className="p-8">
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold tracking-tight text-gray-900">SUSTRAIN</span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 mb-4 ml-1"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        <NavItem icon={<Home size={20} />} label="Inicio" />
        <NavItem icon={<CalendarDays size={20} />} label="Entrenamientos" />
        <NavItem icon={<Activity size={20} />} label="Actividades" />
        <NavItem icon={<TrendingUp size={20} />} label="Progreso" />
        <NavItem icon={<Trophy size={20} />} label="Logros" active />
        <NavItem icon={<Users size={20} />} label="Cuadrilla" />
        <NavItem icon={<MessageSquare size={20} />} label="Mensajes" />
      </nav>

      {/* Sync Button */}
      <div className="p-6">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.387 17.944l-2.089-.726-.541-2.453 2.528-4.256h1.564l-2.269 4.887 2.269.83zm-11.887-5.904l3.771 1.488.19.866-1.558 3.197-2.327-.863 1.089-2.332-.716-1.429zm18.336 2.062h2.164l-3.327 6.915-2.223-.741 1.157-3.132 1.954-1.284.275-1.758zm-7.619 9.898l-3.125-10.741 1.764-4.259 3.018 10.938-1.657 4.062zm-6.236-12.721l-.229-.636 4.394-1.571 1.341 3.259-1.341 4.512-3.831-5.118-.334-.446zm14.869-3.21l-3.375 5.679-3.551-5.594 1.83-2.619 3.28 1.196 1.816 1.338zm-11.234-5.327l1.378-2.742 4.042 1.258-1.396 2.662-4.024-1.178z"/></svg>
            Sincronizar Strava
        </button>
      </div>
    </aside>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active }) => {
  return (
    <a
      href="#"
      className={`
        flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200
        ${active 
          ? 'text-brand-600 bg-brand-50' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
};
