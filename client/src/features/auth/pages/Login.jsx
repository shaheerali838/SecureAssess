import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PLATFORM_ROLES } from '../../../constants/roles';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const authResponse = await login(email, password);
      const user = authResponse.user || authResponse;
      const memberships = authResponse.memberships || [];

      const roleStr = (
        user.platformRole ||
        memberships[0]?.roleId?.name ||
        memberships[0]?.role?.name ||
        memberships[0]?.roleName ||
        user.role ||
        ''
      ).toUpperCase();

      // Route immediately according to verified role
      if (
        user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
        user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN ||
        roleStr === 'PLATFORM_OWNER' ||
        roleStr === 'PLATFORM_ADMIN'
      ) {
        navigate('/platform/dashboard', { replace: true });
      } else if (roleStr === 'CANDIDATE') {
        navigate('/candidate/dashboard', { replace: true });
      } else if (roleStr === 'PROCTOR') {
        navigate('/organization/integrity', { replace: true });
      } else {
        navigate('/organization/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-950 via-accent-900 to-primary-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-400 shadow-glow mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight font-display">
          Secure<span className="text-primary-400">Assess</span>
        </h2>
        <p className="mt-2 text-sm text-accent-400">
          Enterprise Multi-Tenant Assessment & AI Proctoring Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-accent-900/80 backdrop-blur-xl py-8 px-6 shadow-strong rounded-2xl border border-white/10 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-danger-950/60 border border-danger-800/80 text-danger-300 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-danger-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-accent-300 uppercase tracking-wider mb-2">
                Universal Account Email
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-accent-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <>
                      <EyeOff size={13} /> <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye size={13} /> <span>Show</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative rounded-xl shadow-inner-soft">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-accent-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-accent-800/60 border border-white/10 rounded-xl text-sm placeholder-accent-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
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
        </div>
      </div>
    </div>
  );
};

export default Login;
