import React from 'react';

export function Card({ children, className = '', hover, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-accent-900 rounded-2xl border border-accent-200 dark:border-accent-800 shadow-soft transition-colors duration-200 ${
        hover ? 'card-hover cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between p-5 border-b border-accent-100 dark:border-accent-800/80 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 shadow-soft">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-bold text-accent-900 dark:text-white text-base leading-snug">{title}</h3>
          {subtitle && <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

const colorClasses = {
  primary: {
    bg: 'bg-primary-50 dark:bg-primary-950/60',
    text: 'text-primary-600 dark:text-primary-400',
    ring: 'ring-primary-100 dark:ring-primary-900/40',
  },
  success: {
    bg: 'bg-success-50 dark:bg-success-950/60',
    text: 'text-success-600 dark:text-success-400',
    ring: 'ring-success-100 dark:ring-success-900/40',
  },
  warning: {
    bg: 'bg-warning-50 dark:bg-warning-950/60',
    text: 'text-warning-600 dark:text-warning-400',
    ring: 'ring-warning-100 dark:ring-warning-900/40',
  },
  danger: {
    bg: 'bg-danger-50 dark:bg-danger-950/60',
    text: 'text-danger-600 dark:text-danger-400',
    ring: 'ring-danger-100 dark:ring-danger-900/40',
  },
  info: {
    bg: 'bg-info-50 dark:bg-info-950/60',
    text: 'text-info-600 dark:text-info-400',
    ring: 'ring-info-100 dark:ring-info-900/40',
  },
  secondary: {
    bg: 'bg-secondary-50 dark:bg-secondary-950/60',
    text: 'text-secondary-600 dark:text-secondary-400',
    ring: 'ring-secondary-100 dark:ring-secondary-900/40',
  },
};

export function MetricCard({ label, value, icon, trend, color = 'primary' }) {
  const c = colorClasses[color] || colorClasses.primary;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        {icon && (
          <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} flex items-center justify-center ring-4 ${c.ring} shadow-soft`}>
            {icon}
          </div>
        )}
        {trend && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              trend.up
                ? 'bg-success-50 dark:bg-success-950/60 text-success-600 dark:text-success-400 border border-success-200 dark:border-success-800/40'
                : 'bg-danger-50 dark:bg-danger-950/60 text-danger-600 dark:text-danger-400 border border-danger-200 dark:border-danger-800/40'
            }`}
          >
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold font-display text-accent-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 font-medium">{label}</p>
      </div>
    </Card>
  );
}

export default Card;
