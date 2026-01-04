import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const FloatingCTA = () => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
    >
      <Link to="/contacto">
        <button className="group bg-rax-darkText text-white px-8 py-4 rounded-full font-display font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-3 border border-gray-700">
          <span>EMPEZAR AHORA</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </Link>
    </motion.div>
  );
};
