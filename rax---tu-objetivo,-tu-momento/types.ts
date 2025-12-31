import { LucideIcon } from 'lucide-react';

export enum ProgramType {
  RUNNING = 'RUNNING',
  HEALTH = 'HEALTH',
  OPOSICIONES = 'OPOSICIONES'
}

export interface Program {
  id: string;
  type: ProgramType;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  color: string;
  iconName: string; // Used to map to Lucide icons
}

export interface Expert {
  id: string;
  name: string;
  role: string;
  quote: string;
  image: string;
}

export interface MotivationResponse {
  quote: string;
  author: string;
}