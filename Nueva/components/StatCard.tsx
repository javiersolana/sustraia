import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  colorClass: string;
  iconBgClass: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, colorClass, iconBgClass }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
      <div className={`p-4 rounded-xl ${iconBgClass} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <p className="text-gray-400 text-sm">{subtitle}</p>
      </div>
    </div>
  );
};
