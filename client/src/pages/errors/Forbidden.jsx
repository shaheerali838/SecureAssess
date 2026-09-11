import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ORGANIZATION_ROLES } from '@/constants/roles';

export const Forbidden = () => {
  const navigate = useNavigate();
  const { isPlatformStaff, isAuthenticated } = useAuth();
  const { userRole } = useOrganization();

  const handleReturn = () => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    } else if (isPlatformStaff) {
      navigate('/platform/dashboard', { replace: true });
    } else if (userRole === ORGANIZATION_ROLES.CANDIDATE) {
      navigate('/candidate/dashboard', { replace: true });
    } else {
      navigate('/organization/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-rose-600/10 blur-[140px] rounded-full" />
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

          <Link
            to="/login"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            Switch Account
          </Link>
        </div>
      </header>

      {/* Main Forbidden Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto shadow-2xl shadow-rose-500/10 backdrop-blur-xl">
            <ShieldAlert className="w-10 h-10 text-rose-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-slate-900 border border-rose-500/40 text-[11px] font-mono font-bold text-rose-300">
            403 DENIED
          </div>
        </div>

        <h1 className="text-3xl font-extrabold font-display text-white mb-2">
          Access Restricted
        </h1>
        <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
          Your current account role does not hold the required tenant or platform permissions to access this view.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={handleReturn}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-glow flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Workspace</span>
          </button>
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Public Home</span>
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

export default Forbidden;
