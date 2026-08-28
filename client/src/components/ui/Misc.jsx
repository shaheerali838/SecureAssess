import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Card } from './Card';

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-accent-950/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md} bg-white dark:bg-accent-900 rounded-2xl shadow-strong border border-accent-200 dark:border-accent-800 max-h-[90vh] flex flex-col animate-scale-in text-accent-900 dark:text-white`}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between p-5 border-b border-accent-100 dark:border-accent-800">
            <div>
              {title && <h2 className="text-base font-bold text-accent-900 dark:text-white">{title}</h2>}
              {subtitle && <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-accent-400 hover:text-accent-700 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 rounded-lg p-1.5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-accent-100 dark:border-accent-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Tabs({ tabs = [], active, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1 border-b border-accent-200 dark:border-accent-800 overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-accent-500 hover:text-accent-800 dark:hover:text-accent-200 hover:border-accent-300 dark:hover:border-accent-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ProgressRing({ value, max = 100, size = 120, strokeWidth = 8, color = '#2563eb', label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / max) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-accent-100 dark:text-accent-800" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-xl font-bold font-display text-accent-900 dark:text-white">{label}</span>}
        {sublabel && <span className="text-[11px] text-accent-500 dark:text-accent-400 font-medium">{sublabel}</span>}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'primary', size = 'md', showLabel, label, className = '' }) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    secondary: 'bg-secondary-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-accent-600 dark:text-accent-400 font-medium">{label || `${value} / ${max}`}</span>
          <span className="text-xs font-bold text-accent-800 dark:text-accent-200">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full ${size === 'sm' ? 'h-1.5' : 'h-2'} bg-accent-100 dark:bg-accent-800 rounded-full overflow-hidden`}>
        <div
          className={`h-full ${colorClasses[color] || colorClasses.primary} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function Avatar({ name = '', color = '#2563eb', size = 'md', className = '' }) {
  const safeName = typeof name === 'string' && name.trim() ? name.trim() : (name?.name || 'SA');
  const initials = safeName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SA';
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  return (
    <div
      className={`${sizes[size] || sizes.md} rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-soft ${className}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

export function Toast({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const icons = {
    success: <CheckCircle size={16} className="text-success-500" />,
    danger: <AlertCircle size={16} className="text-danger-500" />,
    info: <Info size={16} className="text-info-500" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-strong text-xs font-semibold text-accent-900 dark:text-white animate-slide-in-right">
      {icons[type] || icons.info}
      <span>{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        className="text-accent-400 hover:text-accent-700 dark:hover:text-white ml-2"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-accent-100 dark:bg-accent-800 text-accent-400 dark:text-accent-500 flex items-center justify-center mb-4 shadow-soft">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-accent-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-accent-500 dark:text-accent-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <div className="p-5">
            <Skeleton className="w-10 h-10 rounded-xl mb-3" />
            <Skeleton className="h-6 w-20 mb-2 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default Avatar;
