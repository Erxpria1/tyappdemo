import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 shadow-2xl border-t border-l border-white/20 transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-white/5 hover:scale-[1.01]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
