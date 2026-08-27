
import { ChevronRight } from 'lucide-react';










export function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={14} className="text-accent-300" />}
          {item.onClick ? (
            <button onClick={item.onClick} className="text-accent-500 hover:text-accent-800 transition-colors">
              {item.label}
            </button>
          ) : (
            <span className="text-accent-800 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}









export function PageHeader({ title, subtitle, icon, actions, breadcrumbs }) {
  return (
    <div className="mb-6">
      {breadcrumbs && <div className="mb-3"><Breadcrumbs items={breadcrumbs} /></div>}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          {icon && <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">{icon}</div>}
          <div>
            <h1 className="text-2xl font-bold font-display text-accent-900">{title}</h1>
            {subtitle && <p className="text-sm text-accent-500 mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}








export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-10 pr-3.5 text-sm rounded-lg border border-accent-300 bg-white text-accent-800 placeholder:text-accent-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      />
    </div>
  );
}
