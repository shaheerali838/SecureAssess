import React from 'react';

const variantClasses = {
  primary: 'bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white shadow-soft font-semibold',
  secondary: 'bg-accent-900 hover:bg-accent-800 dark:bg-accent-800 dark:hover:bg-accent-700 text-white shadow-soft font-semibold',
  outline: 'border border-accent-200 dark:border-accent-700 text-accent-700 dark:text-accent-200 hover:bg-accent-50 dark:hover:bg-accent-800 bg-white dark:bg-accent-900',
  ghost: 'text-accent-600 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-800 hover:text-accent-900 dark:hover:text-white',
  danger: 'bg-danger-600 hover:bg-danger-500 active:bg-danger-700 text-white shadow-soft font-semibold',
  success: 'bg-success-600 hover:bg-success-500 active:bg-success-700 text-white shadow-soft font-semibold',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-xs gap-2',
  lg: 'h-11 px-5 text-sm gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  fullWidth,
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus-ring disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}

export default Button;
