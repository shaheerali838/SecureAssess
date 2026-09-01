import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Check } from 'lucide-react';
import { Card, CardHeader, CardBody } from './Card';

export function Modal({ open, isOpen, onClose, title, subtitle, children, footer, size = 'md' }) {
  const isModalOpen = open !== undefined ? open : (isOpen !== undefined ? isOpen : false);
  if (!isModalOpen) return null;
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-accent-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white dark:bg-accent-900 rounded-2xl border border-accent-200 dark:border-accent-800 shadow-strong overflow-hidden animate-scale-in`}>
        {(title || subtitle) && (
          <div className="flex items-start justify-between p-6 border-b border-accent-100 dark:border-accent-800">
            <div>
              {title && <h3 className="text-base font-bold text-accent-900 dark:text-white">{title}</h3>}
              {subtitle && <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5 leading-relaxed">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 text-accent-400 hover:text-accent-700 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 rounded-xl transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-950/50">{footer}</div>}
      </div>
    </div>
  );
}

export function Tabs({ tabs, active, onChange, size = 'md' }) {
  return (
    <div className="flex border-b border-accent-200 dark:border-accent-800 gap-6">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              isActive
                ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-accent-500 dark:text-accent-400 hover:text-accent-800 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'bg-accent-100 text-accent-600 dark:bg-accent-800 dark:text-accent-400'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressRing({ progress = 0, size = 60, strokeWidth = 5, color = '#2563eb', trackColor = 'currentColor', label, showPercent = true }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-accent-100 dark:text-accent-800"
            stroke={trackColor}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            stroke={color}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {showPercent && (
          <span className="absolute text-xs font-bold font-mono text-accent-900 dark:text-white">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      {label && <span className="text-[11px] text-accent-500 dark:text-accent-400 mt-1 font-medium">{label}</span>}
    </div>
  );
}

export function ProgressBar({ value = 0, max = 100, color = 'primary', size = 'md', showLabel = false }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
  };
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-accent-600 dark:text-accent-400 mb-1">
          <span>Progress</span>
          <span className="font-mono">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-accent-100 dark:bg-accent-800 rounded-full overflow-hidden ${heights[size] || heights.md}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors[color] || colors.primary}`}
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
    warning: <AlertCircle size={16} className="text-warning-500" />,
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
        className="text-accent-400 hover:text-accent-700 dark:hover:text-white ml-2 cursor-pointer"
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

/* =========================================================================
   Universal Enterprise Skeleton Loaders Suite
   ========================================================================= */

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="bg-white dark:bg-accent-900 rounded-2xl border border-accent-200 dark:border-accent-800 overflow-hidden">
      <div className="p-4 border-b border-accent-100 dark:border-accent-800 flex gap-4 bg-accent-50/50 dark:bg-accent-900/50">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1 rounded-md" />
        ))}
      </div>
      <div className="divide-y divide-accent-100 dark:divide-accent-800 p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
            {Array.from({ length: cols - 1 }).map((_, j) => (
              <Skeleton key={j} className={`h-4 flex-1 rounded-md ${j === cols - 2 ? 'w-16' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="w-20 h-6 rounded-lg" />
            </div>
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-accent-100 dark:border-accent-800">
              <Skeleton className="h-8 rounded-lg" />
              <Skeleton className="h-8 rounded-lg" />
              <Skeleton className="h-8 rounded-lg" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SkeletonMetrics({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-12 h-5 rounded-full" />
          </div>
          <Skeleton className="h-7 w-24 mb-1 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </Card>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5 flex-1">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-md">
                <Skeleton className="h-4 w-48 rounded-md" />
                <Skeleton className="h-3 w-64 rounded-md" />
              </div>
            </div>
            <Skeleton className="w-24 h-7 rounded-xl shrink-0" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <SkeletonMetrics count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <Skeleton className="h-6 w-48 mb-4 rounded-lg" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-6 w-36 mb-4 rounded-lg" />
          <div className="flex justify-center py-6">
            <Skeleton className="w-36 h-36 rounded-full" />
          </div>
        </Card>
      </div>
      <SkeletonTable rows={4} cols={5} />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
          <Skeleton className="w-28 h-9 rounded-xl shrink-0" />
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 space-y-4">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </Card>
        <Card className="lg:col-span-2 p-5 space-y-4">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <SkeletonTable rows={4} cols={4} />
        </Card>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Unhandled UI exception caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-accent-50 dark:bg-accent-950">
          <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-strong text-center">
            <div className="w-12 h-12 rounded-2xl bg-danger-50 dark:bg-danger-950/60 text-danger-600 dark:text-danger-400 flex items-center justify-center mx-auto mb-4 shadow-soft">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-base font-bold text-accent-900 dark:text-white mb-2">
              View Encountered an Error
            </h2>
            <p className="text-xs text-accent-500 dark:text-accent-400 mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred. Click reload to refresh this workspace view.'}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all cursor-pointer shadow-soft"
              >
                Reload Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default Avatar;
