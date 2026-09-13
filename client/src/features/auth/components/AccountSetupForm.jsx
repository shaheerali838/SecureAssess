import React from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

export const AccountSetupForm = ({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-2.5">
      <div>
        <label className="block text-[11px] font-semibold text-accent-200 mb-1">
          Create New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full pl-9 pr-9 py-1.5 bg-accent-950/60 border border-accent-700/80 rounded-lg text-xs text-white placeholder-accent-500 focus:outline-none focus:ring-1.5 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-400 hover:text-accent-200"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-accent-200 mb-1">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className="w-full pl-9 pr-9 py-1.5 bg-accent-950/60 border border-accent-700/80 rounded-lg text-xs text-white placeholder-accent-500 focus:outline-none focus:ring-1.5 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-400 hover:text-accent-200"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-1.5 py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg shadow-md shadow-emerald-500/20 text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-block animate-spin">⏳</span>
        ) : (
          <>
            <span>Activate Account & Enter</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  );
};
