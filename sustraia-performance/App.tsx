import React, { useState } from 'react';
import { Role } from './types';
import AthleteDashboard from './views/AthleteDashboard';
import CoachDashboard from './views/CoachDashboard';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>(Role.ATHLETE);

  return (
    <div className="min-h-screen bg-sustraia-base font-sans selection:bg-sustraia-accent selection:text-white">
      {/* Role Switcher for Demo Purposes */}
      <div className="fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-sustraia-light-gray flex gap-2">
        <button
          onClick={() => setCurrentRole(Role.ATHLETE)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
            currentRole === Role.ATHLETE 
              ? 'bg-sustraia-text text-white shadow-md' 
              : 'text-sustraia-gray hover:bg-gray-100'
          }`}
        >
          Vista Atleta
        </button>
        <button
          onClick={() => setCurrentRole(Role.COACH)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
            currentRole === Role.COACH 
              ? 'bg-sustraia-text text-white shadow-md' 
              : 'text-sustraia-gray hover:bg-gray-100'
          }`}
        >
          Vista Coach
        </button>
      </div>

      <AnimatePresence mode="wait">
        {currentRole === Role.ATHLETE ? (
          <motion.div
            key="athlete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AthleteDashboard />
          </motion.div>
        ) : (
          <motion.div
            key="coach"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CoachDashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}