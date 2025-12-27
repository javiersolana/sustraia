import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
  noPadding?: boolean;
  delay?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  highlight = false,
  noPadding = false,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`
        rounded-3xl border
        ${highlight
          ? 'bg-sustraia-accent border-sustraia-accent text-white shadow-xl shadow-blue-900/20'
          : 'bg-sustraia-paper border-sustraia-light-gray text-sustraia-text shadow-sm hover:shadow-xl hover:shadow-gray-200/50'
        }
        transition-shadow duration-300
        ${noPadding ? '' : 'p-6 lg:p-8'}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default Card;
