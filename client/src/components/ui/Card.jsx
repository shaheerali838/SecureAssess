








export function Card({ children, className = '', hover, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-accent-200 shadow-soft ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}









export function CardHeader({ title, subtitle, icon, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between p-5 border-b border-accent-100 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">{icon}</div>}
        <div>
          <h3 className="font-semibold text-accent-900">{title}</h3>
          {subtitle && <p className="text-sm text-accent-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}






export function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}









const colorClasses = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-600', ring: 'ring-primary-100' },
  success: { bg: 'bg-success-50', text: 'text-success-600', ring: 'ring-success-100' },
  warning: { bg: 'bg-warning-50', text: 'text-warning-600', ring: 'ring-warning-100' },
  danger: { bg: 'bg-danger-50', text: 'text-danger-600', ring: 'ring-danger-100' },
  info: { bg: 'bg-info-50', text: 'text-info-600', ring: 'ring-info-100' },
  secondary: { bg: 'bg-secondary-50', text: 'text-secondary-600', ring: 'ring-secondary-100' },
};

export function MetricCard({ label, value, icon, trend, color = 'primary' }) {
  const c = colorClasses[color];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        {icon && (
          <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.text} flex items-center justify-center ring-4 ${c.ring}`}>
            {icon}
          </div>
        )}
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.up ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold font-display text-accent-900">{value}</p>
        <p className="text-sm text-accent-500 mt-1">{label}</p>
      </div>
    </Card>
  );
}
