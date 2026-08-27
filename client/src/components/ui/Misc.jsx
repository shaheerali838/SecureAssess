import { useState } from 'react';
import { X } from 'lucide-react';











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
      <div className="absolute inset-0 bg-accent-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-strong max-h-[90vh] flex flex-col animate-scale-in`}>
        {(title || subtitle) && (
          <div className="flex items-start justify-between p-5 border-b border-accent-100">
            <div>
              {title && <h2 className="text-lg font-semibold text-accent-900">{title}</h2>}
              {subtitle && <p className="text-sm text-accent-500 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="text-accent-400 hover:text-accent-700 hover:bg-accent-100 rounded-lg p-1.5 transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 p-5 border-t border-accent-100">{footer}</div>}
      </div>
    </div>
  );
}








export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1 border-b border-accent-200 overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            active === tab.key
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-accent-500 hover:text-accent-700 hover:border-accent-300'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
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
        {label && <span className="text-xl font-bold font-display text-accent-900">{label}</span>}
        {sublabel && <span className="text-xs text-accent-500">{sublabel}</span>}
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
          <span className="text-xs text-accent-600">{label || `${value} / ${max}`}</span>
          <span className="text-xs font-medium text-accent-700">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full ${size === 'sm' ? 'h-1.5' : 'h-2'} bg-accent-200 rounded-full overflow-hidden`}>
        <div className={`h-full ${colorClasses[color]} rounded-full transition-all duration-700 ease-out`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}








export function Avatar({ name, color = '#2563eb', size = 'md', className = '' }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('');
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${className}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}







export function Toast({ message, type = 'success', onClose }) {
  const [visible] = useState(true);
  if (!visible) return null;
  const colors = {
    success: 'bg-success-600',
    error: 'bg-danger-600',
    info: 'bg-primary-600',
    warning: 'bg-warning-600',
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${colors[type]} text-white px-4 py-3 rounded-xl shadow-strong animate-slide-in-right flex items-center gap-3`}>
      <span className="text-sm font-medium">{message}</span>
      {onClose && <button onClick={onClose} className="text-white/80 hover:text-white"><X size={16} /></button>}
    </div>
  );
}








export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="w-16 h-16 rounded-2xl bg-accent-100 text-accent-400 flex items-center justify-center mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-accent-800 mb-1">{title}</h3>
      <p className="text-sm text-accent-500 max-w-sm mb-5">{description}</p>
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
            <Skeleton key={j} className="h-4 flex-1" />
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
            <Skeleton className="w-11 h-11 rounded-xl mb-3" />
            <Skeleton className="h-6 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </Card>
      ))}
    </div>
  );
}

import { Card } from './Card';
