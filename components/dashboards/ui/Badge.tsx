import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'neutral' | 'accent';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: 'bg-gray-100 text-sustraia-text',
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    neutral: 'bg-gray-50 text-sustraia-gray border border-gray-100',
    accent: 'bg-blue-50 text-sustraia-accent border border-blue-100',
  };

  return (
    <span className={`
      inline-flex items-center justify-center px-3 py-1
      rounded-full text-xs font-bold uppercase tracking-wider
      ${styles[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
};

export default Badge;
