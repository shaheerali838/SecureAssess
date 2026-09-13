import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

export const AuthHeroBanner = ({ title, subtitle, icon: Icon = Shield, badgeText }) => {
  return (
    <div className="text-center space-y-1">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/25 mb-1 ring-1 ring-white/20">
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex items-center justify-center gap-1.5">
        <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white font-display">
          {title}
        </h1>
        {badgeText && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30">
            <Sparkles className="w-2.5 h-2.5" /> {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] sm:text-xs text-accent-300/90 max-w-xs mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
};
