import React from 'react';
import { Scissors, User, Calendar, Shield, Sparkles, LogOut, Menu, X, ChevronRight, CheckCircle, Crown, Upload, MessageCircle } from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, className = "" }) => {
  const icons: Record<string, React.ElementType> = {
    scissors: Scissors,
    user: User,
    calendar: Calendar,
    shield: Shield,
    sparkles: Sparkles,
    logout: LogOut,
    menu: Menu,
    close: X,
    chevronRight: ChevronRight,
    check: CheckCircle,
    crown: Crown,
    upload: Upload,
    whatsapp: MessageCircle
  };

  const IconComponent = icons[name];
  return IconComponent ? <IconComponent size={size} className={className} /> : null;
};
