import React from 'react';

export function Input({ label, hint, error, icon, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1.5">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400 dark:text-accent-500">{icon}</div>}
        <input
          className={`w-full h-10 ${icon ? 'pl-9' : 'pl-3.5'} pr-3.5 text-xs rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white placeholder:text-accent-400 dark:placeholder:text-accent-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
            error ? 'border-danger-400 focus:ring-danger-500' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {hint && !error && <p className="text-[11px] text-accent-400 dark:text-accent-500 mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-danger-500 dark:text-danger-400 mt-1">{error}</p>}
    </div>
  );
}

export function Select({ label, hint, options = [], className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1.5">{label}</label>}
      <select
        className={`w-full h-10 px-3.5 text-xs rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-accent-800 text-accent-900 dark:text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-[11px] text-accent-400 dark:text-accent-500 mt-1">{hint}</p>}
    </div>
  );
}

export function Textarea({ label, hint, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1.5">{label}</label>}
      <textarea
        className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white placeholder:text-accent-400 dark:placeholder:text-accent-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-y ${className}`}
        {...props}
      />
      {hint && <p className="text-[11px] text-accent-400 dark:text-accent-500 mt-1">{hint}</p>}
    </div>
  );
}

export default Input;
