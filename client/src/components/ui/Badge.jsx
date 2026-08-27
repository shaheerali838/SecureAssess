













const variantClasses = {
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
  info: 'bg-info-50 text-info-700 border-info-200',
  neutral: 'bg-accent-100 text-accent-700 border-accent-200',
  secondary: 'bg-secondary-50 text-secondary-700 border-secondary-200',
};

const dotColors = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-info-500',
  neutral: 'bg-accent-400',
  secondary: 'bg-secondary-500',
};

export function Badge({ variant = 'neutral', size = 'sm', children, icon, dot, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantClasses[variant]} ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
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
    'Completed': 'success',
    'Published': 'success',
    'Published ': 'success',
    'Trial': 'info',
    'Invited': 'info',
    'Scheduled': 'info',
    'In Progress': 'warning',
    'Draft': 'neutral',
    'Review Required': 'warning',
    'Flagged': 'danger',
    'Flagged for Review': 'danger',
    'Suspended': 'danger',
    'Pending': 'warning',
    'No Show': 'neutral',
    'Expired': 'neutral',
    'Archived': 'neutral',
    'Results Available': 'success',
    'Evaluation Complete': 'success',
    'Assessment Active': 'warning',
    'Awaiting Start': 'info',
    'Session Expired': 'neutral',
  };
  const variant = map[status] || 'neutral';
  return <Badge variant={variant} dot>{status}</Badge>;
}

export function SecurityBadge({ level }) {
  const variant = level === 'Standard' ? 'neutral' : level === 'Monitored' ? 'warning' : 'success';
  return <Badge variant={variant} icon={<span className="text-xs">{level === 'Secure' ? '🔒' : level === 'Monitored' ? '👁' : '○'}</span>}>{level}</Badge>;
}
