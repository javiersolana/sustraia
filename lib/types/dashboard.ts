import { LucideIcon } from 'lucide-react';

export enum Role {
  ATHLETE = 'ATHLETE',
  COACH = 'COACH'
}

export interface SidebarItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
}

export interface WeeklyActivity {
  day: string;
  date: string;
  type?: 'RUN' | 'STRENGTH' | 'REST';
  status: 'COMPLETED' | 'PENDING' | 'MISSED';
  isToday?: boolean;
}

export interface AthleteRow {
  id: string;
  name: string;
  avatar: string;
  lastActivity: string;
  compliance: number;
  status: 'ACTIVE' | 'ALERT' | 'INACTIVE';
}
