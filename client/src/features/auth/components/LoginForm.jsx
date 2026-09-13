import React from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
  onForgotPassword,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-2.5">
      <div>
        <label className="block text-[11px] font-semibold text-accent-200 mb-1">
          Work Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@institution.edu"
            className="w-full pl-9 pr-3 py-1.5 bg-accent-950/60 border border-accent-700/80 rounded-lg text-xs text-white placeholder-accent-500 focus:outline-none focus:ring-1.5 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-semibold text-accent-200">
            Password
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full pl-9 pr-9 py-1.5 bg-accent-950/60 border border-accent-700/80 rounded-lg text-xs text-white placeholder-accent-500 focus:outline-none focus:ring-1.5 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-400 hover:text-accent-200 focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-1.5 py-2 px-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-md shadow-primary-500/20 text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-block animate-spin">⏳</span>
        ) : (
          <>
            <span>Sign In to Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  );
};
