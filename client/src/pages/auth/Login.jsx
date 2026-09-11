import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/auth.service';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { PLATFORM_ROLES } from '../../constants/roles';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, acceptInvitation } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const setupToken =
    searchParams.get('token') ||
    searchParams.get('setupToken') ||
    searchParams.get('inviteToken') ||
    searchParams.get('resetToken') ||
    '';
  const emailParam = searchParams.get('email') || '';
  const modeParam = searchParams.get('mode') || '';
  const isSetupMode = Boolean(setupToken);

  // View mode: 'login' | 'forgot' | 'setup'
  const [view, setView] = useState(isSetupMode ? 'setup' : 'login');

  // Sign-in & activation state
  const [email, setEmail] = useState(emailParam);
  const [forgotEmail, setForgotEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (setupToken) {
      setView('setup');
    }
    if (emailParam) {
      setEmail(emailParam);
      setForgotEmail(emailParam);
    }
  }, [setupToken, emailParam]);

  const handleRouteAfterAuth = (authResponse) => {
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
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const authResponse = await login(email, password);
      handleRouteAfterAuth(authResponse);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '';
      setError(msg || 'Invalid email or password. Please verify your credentials or use Forgot Password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      setError('Please enter your account email address.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await authService.forgotPassword(forgotEmail.trim());
      setSuccessMessage(
        res.message || `Password reset link sent to ${forgotEmail.trim()}. Please check your inbox.`
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No account found with this email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!setupToken) {
      setError('Activation token is missing. Please click the link from your email.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      let authResponse;
      try {
        authResponse = await acceptInvitation({
          token: setupToken,
          password,
        });
      } catch (acceptErr) {
        // Fallback to resetPassword if token is in password-reset store
        try {
          await authService.resetPassword(setupToken, password);
          authResponse = await login(email || emailParam, password);
        } catch {
          throw acceptErr;
        }
      }

      setSuccessMessage('Password configured successfully! Launching your workspace...');
      setTimeout(() => {
        handleRouteAfterAuth(authResponse);
      }, 1000);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'This activation link is invalid or has already been used. Please sign in or request a new link.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full bg-gradient-to-br from-accent-950 via-accent-900 to-primary-950 flex flex-col justify-between py-2 sm:py-3 px-4 text-white relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Back Link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between z-10 pt-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-accent-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
        <Link
          to="/verify"
          className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors"
        >
          <ShieldCheck size={13} />
          <span>Verify Credential</span>
        </Link>
      </div>

      {/* Center Group (Brand + Card) */}
      <div className="my-auto w-full max-w-md mx-auto z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-3.5">
          <Link to="/" className="inline-block group cursor-pointer">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-400 shadow-glow mb-2 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
              Secure<span className="text-primary-400">Assess</span>
            </h2>
          </Link>
          <p className="mt-0.5 text-xs sm:text-sm text-accent-300">
            {view === 'setup'
              ? 'Complete Workspace Onboarding & Password Configuration'
              : view === 'forgot'
              ? 'Account Recovery & Password Reset'
              : 'Enterprise Multi-Tenant Assessment & AI Proctoring Platform'}
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full bg-accent-900/85 backdrop-blur-xl py-6 px-6 sm:px-8 shadow-strong rounded-3xl border border-white/10">
          {view === 'setup' && (
            /* ======================================================== */
            /* SET UP NEW PASSWORD / ACCEPT INVITATION VIEW            */
            /* ======================================================== */
            <form className="space-y-3.5" onSubmit={handleSetupSubmit}>
              <div className="text-center pb-2 border-b border-white/10">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  <Sparkles size={12} /> {modeParam === 'reset' ? 'Password Reset' : 'Workspace Activation'}
                </span>
                <p className="text-xs text-accent-300 mt-1.5">
                  Setting up credentials for <strong className="text-white">{email || 'your account'}</strong>
                </p>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-danger-950/60 border border-danger-800/80 text-danger-300 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-accent-300 uppercase tracking-wider">
                    Create Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-accent-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
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
                    placeholder="Minimum 6 characters"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-accent-800/60 border border-white/10 rounded-xl text-sm placeholder-accent-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-accent-300 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-xs text-accent-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative rounded-xl shadow-inner-soft">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-accent-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-accent-800/60 border border-white/10 rounded-xl text-sm placeholder-accent-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-glow focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all duration-200 disabled:opacity-50 cursor-pointer mt-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Save Password & Launch Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-accent-400 hover:text-white transition-colors cursor-pointer"
                >
                  Already configured? Sign In
                </button>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            /* ======================================================== */
            /* FORGOT PASSWORD VIEW                                     */
            /* ======================================================== */
            <form className="space-y-3.5" onSubmit={handleForgotPasswordSubmit}>
              <div className="text-center pb-2 border-b border-white/10">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <KeyRound size={12} /> Password Recovery
                </span>
                <p className="text-xs text-accent-300 mt-1.5">
                  Enter your registered institutional email to receive a password reset link.
                </p>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-danger-950/60 border border-danger-800/80 text-danger-300 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-accent-300 uppercase tracking-wider mb-1.5">
                  Institutional Account Email
                </label>
                <div className="relative rounded-xl shadow-inner-soft">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-accent-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@institution.edu"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-accent-800/60 border border-white/10 rounded-xl text-sm placeholder-accent-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-glow focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Password Reset Link</span>
                    <RotateCcw className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-accent-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {view === 'login' && (
            /* ======================================================== */
            /* STANDARD SIGN-IN VIEW                                    */
            /* ======================================================== */
            <form className="space-y-3.5" onSubmit={handleLoginSubmit}>
              {error && (
                <div className="p-2.5 rounded-xl bg-danger-950/60 border border-danger-800/80 text-danger-300 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger-400" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-accent-300 uppercase tracking-wider mb-1.5">
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
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-accent-800/60 border border-white/10 rounded-xl text-sm placeholder-accent-500 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-accent-300 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot');
                        setError(null);
                        setSuccessMessage(null);
                        setForgotEmail(email);
                      }}
                      className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-accent-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff size={12} /> <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye size={12} /> <span>Show</span>
                        </>
                      )}
                    </button>
                  </div>
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
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-glow focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-accent-900 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <p className="text-xs text-accent-400">
              Interested in onboarding your university or company?{' '}
              <Link to="/request-demo" className="text-primary-400 hover:text-primary-300 font-semibold underline">
                Request a Demo
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-accent-500 py-1 z-10">
        <p>© {new Date().getFullYear()} SecureAssess Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
