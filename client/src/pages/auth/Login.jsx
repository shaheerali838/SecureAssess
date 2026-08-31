import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';
import { PLATFORM_ROLES } from '../../constants/roles';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const authResponse = await login(email, password);
      const user = authResponse.user || authResponse;
      const memberships = authResponse.memberships || [];

      // Route immediately according to role
      if (
        user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
        user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN
      ) {
        navigate('/platform/dashboard', { replace: true });
      } else {
        const isCandidate = memberships.some(
          (m) => (m.roleId?.name || m.roleName) === 'CANDIDATE'
        );
        if (isCandidate) {
          navigate('/candidate/portal', { replace: true });
        } else {
          navigate('/organization/dashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (type) => {
    const defaultPass = 'Password123!';
    setPassword(defaultPass);

    if (type === 'platform') {
      setEmail('shaheer838838@gmail.com');
    } else if (type === 'owner') {
      setEmail('owner@secureassess.io');
    } else if (type === 'org_admin') {
      setEmail('admin@alpha.edu');
    } else if (type === 'examiner') {
      setEmail('examiner@alpha.edu');
    } else if (type === 'proctor') {
      setEmail('proctor@alpha.edu');
    } else if (type === 'candidate') {
      setEmail('candidate@alpha.edu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-950 via-accent-900 to-primary-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-400 shadow-glow mb-4 hover:scale-105 transition-transform">
          <Shield className="w-8 h-8 text-white" />
        </Link>
        <h2 className="text-3xl font-extrabold tracking-tight font-display">
          Secure<span className="text-primary-400">Assess</span>
        </h2>
        <p className="mt-2 text-sm text-accent-400">
          Enterprise Multi-Tenant Assessment & Examination Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-accent-900/80 backdrop-blur-xl py-8 px-6 shadow-strong rounded-2xl border border-white/10 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-xl bg-danger-950/60 border border-danger-800/80 text-danger-300 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-danger-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-accent-300 uppercase tracking-wider mb-2">
                Account Email
              </label>
              <div className="relative rounded-xl shadow-inner-soft">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-accent-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-accent-800/60 border border-white/10 rounded-xl text-sm placeholder-accent-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-accent-300 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/verify" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                  Verify Certificate?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-inner-soft">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-accent-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-accent-800/60 border border-white/10 rounded-xl text-sm placeholder-accent-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-glow focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-accent-900 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Persona Buttons */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              <p className="text-[11px] font-bold text-accent-300 uppercase tracking-wider">
                1-Click Persona Sign In
              </p>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('platform')}
                className="w-full py-2 px-3 rounded-xl bg-accent-800/50 hover:bg-accent-700/60 border border-indigo-500/20 text-xs text-accent-200 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🛡️</span>
                  <span className="font-semibold text-white group-hover:text-primary-300 transition-colors">Platform Super Admin</span>
                </div>
                <span className="text-[10px] text-primary-400 font-mono">shaheer838838@gmail.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('org_admin')}
                className="w-full py-2 px-3 rounded-xl bg-accent-800/50 hover:bg-accent-700/60 border border-sky-500/20 text-xs text-accent-200 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🏢</span>
                  <span className="font-semibold text-white group-hover:text-sky-300 transition-colors">Organization Admin</span>
                </div>
                <span className="text-[10px] text-sky-400 font-mono">admin@alpha.edu</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('examiner')}
                className="w-full py-2 px-3 rounded-xl bg-accent-800/50 hover:bg-accent-700/60 border border-amber-500/20 text-xs text-accent-200 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎓</span>
                  <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">Examiner / Faculty</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono">examiner@alpha.edu</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('proctor')}
                className="w-full py-2 px-3 rounded-xl bg-accent-800/50 hover:bg-accent-700/60 border border-purple-500/20 text-xs text-accent-200 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">👁️</span>
                  <span className="font-semibold text-white group-hover:text-purple-300 transition-colors">Proctor / Invigilator</span>
                </div>
                <span className="text-[10px] text-purple-400 font-mono">proctor@alpha.edu</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('candidate')}
                className="w-full py-2 px-3 rounded-xl bg-accent-800/50 hover:bg-accent-700/60 border border-emerald-500/20 text-xs text-accent-200 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">📝</span>
                  <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors">Candidate / Student</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">candidate@alpha.edu</span>
              </button>
            </div>
            <p className="text-[10px] text-accent-500 text-center mt-2.5">
              Password for all seeded accounts: <span className="text-accent-300 font-mono font-semibold">Password123!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
