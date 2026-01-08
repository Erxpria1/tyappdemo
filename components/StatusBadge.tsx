import React from 'react';
import { Icon } from './Icon';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Beklemede',
    labelShort: 'Beklemede',
    classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    icon: 'clock' as const
  },
  confirmed: {
    label: 'Onaylı',
    labelShort: 'Onaylandı',
    classes: 'bg-green-500/10 text-green-400 border-green-500/30',
    icon: 'check' as const
  },
  completed: {
    label: 'Bitti',
    labelShort: 'Tamamlandı',
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    icon: 'check' as const
  },
  cancelled: {
    label: 'İptal',
    labelShort: 'İptal Edildi',
    classes: 'bg-red-500/10 text-red-400 border-red-500/30',
    icon: 'close' as const
  }
};

/**
 * Reusable status badge component for appointments
 * Eliminates duplicate status badge logic across components
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status];

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${config.classes} ${className}`}>
      {config.label}
    </span>
  );
};

/**
 * Inline status badge variant (smaller, no background)
 */
interface StatusBadgeInlineProps {
  status: AppointmentStatus;
  className?: string;
}

export const StatusBadgeInline: React.FC<StatusBadgeInlineProps> = ({ status, className = '' }) => {
  const config = statusConfig[status];

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${config.classes} ${className}`}>
      {config.labelShort}
    </span>
  );
};

/**
 * Status badge with icon
 */
interface StatusBadgeWithIconProps {
  status: AppointmentStatus;
  className?: string;
}

export const StatusBadgeWithIcon: React.FC<StatusBadgeWithIconProps> = ({ status, className = '' }) => {
  const config = statusConfig[status];

  return (
    <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${config.classes} ${className}`}>
      <Icon name={config.icon} size={10} />
      {config.label}
    </span>
  );
};

/**
 * Get status config for custom rendering
 */
export const getStatusConfig = (status: AppointmentStatus) => statusConfig[status];
