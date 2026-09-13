import React from 'react';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export const ForgotPasswordForm = ({
  forgotEmail,
  setForgotEmail,
  loading,
  onSubmit,
  onBackToLogin,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-[11px] font-semibold text-accent-200 mb-1">
          Registered Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400" />
          <input
            type="email"
            required
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="your-email@institution.edu"
            className="w-full pl-9 pr-3 py-1.5 bg-accent-950/60 border border-accent-700/80 rounded-lg text-xs text-white placeholder-accent-500 focus:outline-none focus:ring-1.5 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-md shadow-primary-500/20 text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-block animate-spin">⏳</span>
        ) : (
          <>
            <span>Send Reset Instructions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="w-full text-center text-[11px] text-accent-400 hover:text-white transition-colors flex items-center justify-center gap-1 mt-1"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Sign In
      </button>
    </form>
  );
};
