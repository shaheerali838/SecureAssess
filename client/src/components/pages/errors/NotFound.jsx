import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Home,
  LayoutDashboard,
  ShieldCheck,
  Search,
  KeyRound,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTheme } from '@/contexts/ThemeContext';

export const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isPlatformAdmin, isPlatformStaff } = useAuth();
  const { userRole } = useOrganization();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = '404 — Page Not Found | SecureAssess';
  }, []);

  const getDashboardPath = () => {
    if (!isAuthenticated) return '/login';
    const isPlatform =
      typeof isPlatformAdmin === 'function'
        ? isPlatformAdmin()
        : isPlatformStaff || user?.platformRole === 'PLATFORM_ADMIN';
    if (isPlatform) return '/platform/dashboard';
    const normalizedRole = (userRole || user?.role || '').toUpperCase();
    if (normalizedRole === 'CANDIDATE') return '/candidate/dashboard';
    return '/organization/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-primary-500 selection:text-white font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary-600/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-secondary-600/10 blur-[130px] rounded-full" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
              <Shield size={18} />
            </div>
            <span className="font-bold text-lg font-display tracking-tight text-white">
              Secure<span className="text-primary-400">Assess</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>
            <Link
              to={isAuthenticated ? getDashboardPath() : '/login'}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition-colors shadow-soft"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Sign In'}
            </Link>
          </div>
        </div>
      </header>

      {/* Main 404 Hero */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto shadow-2xl shadow-amber-500/10 backdrop-blur-xl animate-bounce-subtle">
            <AlertTriangle className="w-12 h-12 text-amber-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-slate-900 border border-amber-500/40 text-[11px] font-mono font-bold text-amber-300">
            404 ERROR
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-white mb-3">
          Page Not Found
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-lg mb-8 leading-relaxed">
          The requested path or endpoint doesn’t exist or may have been moved within the SecureAssess cluster.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to={getDashboardPath()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-glow flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{isAuthenticated ? 'Go to Dashboard' : 'Sign In'}</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>

        {/* Quick Nav Directory */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <Link
            to="/verify"
            className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-primary-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verify Certificate</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Check authenticity of credentials</p>
          </Link>

          <Link
            to="/login"
            className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-primary-400">
              <KeyRound className="w-4 h-4 text-primary-400" />
              <span>Portal Sign In</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Access your tenant workspace</p>
          </Link>

          <Link
            to="/request-demo"
            className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-primary-400">
              <Search className="w-4 h-4 text-sky-400" />
              <span>Request a Demo</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Schedule an institution tour</p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SecureAssess Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default NotFound;
