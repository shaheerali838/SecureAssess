













const variantClasses = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft',
  secondary: 'bg-accent-900 text-white hover:bg-accent-800 active:bg-accent-950 shadow-soft',
  outline: 'border border-accent-300 text-accent-700 hover:bg-accent-50 hover:border-accent-400 bg-white',
  ghost: 'text-accent-600 hover:bg-accent-100 hover:text-accent-900',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 shadow-soft',
  success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 shadow-soft',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
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
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  );
}
