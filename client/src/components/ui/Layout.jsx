import React from 'react';
import { ChevronRight, Search } from 'lucide-react';

export function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={13} className="text-accent-300 dark:text-accent-600" />}
          {item.onClick ? (
            <button onClick={item.onClick} className="text-accent-500 hover:text-accent-800 dark:hover:text-accent-200 transition-colors">
              {item.label}
            </button>
          ) : (
            <span className="text-accent-800 dark:text-accent-200 font-semibold">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

export function PageHeader({ title, subtitle, icon, actions, breadcrumbs }) {
  return (
    <div className="mb-5 sm:mb-6">
      {breadcrumbs && <div className="mb-2 overflow-x-auto no-scrollbar"><Breadcrumbs items={breadcrumbs} /></div>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          {icon && (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-100 dark:border-primary-900/40 shadow-soft">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-accent-900 dark:text-white tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-accent-500 dark:text-accent-400 mt-0.5 sm:mt-1 leading-relaxed">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400 dark:text-accent-500" size={15} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-3.5 text-xs rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-accent-100 placeholder:text-accent-400 dark:placeholder:text-accent-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
      />
    </div>
  );
}

export default PageHeader;
