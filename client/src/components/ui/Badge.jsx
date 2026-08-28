import React from 'react';

const variantClasses = {
  primary: 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800/50',
  success: 'bg-success-50 dark:bg-success-950/60 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800/50',
  warning: 'bg-warning-50 dark:bg-warning-950/60 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-800/50',
  danger: 'bg-danger-50 dark:bg-danger-950/60 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800/50',
  info: 'bg-info-50 dark:bg-info-950/60 text-info-700 dark:text-info-300 border-info-200 dark:border-info-800/50',
  neutral: 'bg-accent-100 dark:bg-accent-800/70 text-accent-700 dark:text-accent-300 border-accent-200 dark:border-accent-700/60',
  secondary: 'bg-secondary-50 dark:bg-secondary-950/60 text-secondary-700 dark:text-secondary-300 border-secondary-200 dark:border-secondary-800/50',
};

const dotColors = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-info-500',
  neutral: 'bg-accent-400 dark:bg-accent-500',
  secondary: 'bg-secondary-500',
};

export function Badge({ variant = 'neutral', size = 'sm', children, icon, dot, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors ${
        variantClasses[variant] || variantClasses.neutral
      } ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.neutral}`} />}
      {icon}
      {children}
    </span>
  );
}

export function RiskBadge({ level }) {
  const variant = level === 'Low' ? 'success' : level === 'Medium' ? 'warning' : 'danger';
  return (
    <Badge variant={variant} dot>
      {level} Risk
    </Badge>
  );
}

export function StatusBadge({ status }) {
  const map = {
    'Active': 'success',
    'ACTIVE': 'success',
    'Completed': 'success',
    'Published': 'success',
    'Trial': 'info',
    'TRIAL': 'info',
    'Invited': 'info',
    'Scheduled': 'info',
    'In Progress': 'warning',
    'Draft': 'neutral',
    'Review Required': 'warning',
    'Flagged': 'danger',
    'Suspended': 'danger',
    'SUSPENDED': 'danger',
    'Pending': 'warning',
  };
  const variant = map[status] || 'neutral';
  return <Badge variant={variant} dot>{status}</Badge>;
}

export function SecurityBadge({ level }) {
  const variant = level === 'Standard' ? 'neutral' : level === 'Monitored' ? 'warning' : 'success';
  return (
    <Badge variant={variant} icon={<span className="text-xs">{level === 'Secure' ? '🔒' : level === 'Monitored' ? '👁' : '○'}</span>}>
      {level}
    </Badge>
  );
}

export default Badge;
