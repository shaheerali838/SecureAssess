import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import authService from '@/services/auth.service';
import { Shield, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PLATFORM_ROLES } from '@/constants/roles';

import { AuthHeroBanner } from '../components/AuthHeroBanner';
import { LoginForm } from '../components/LoginForm';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { AccountSetupForm } from '../components/AccountSetupForm';

export const LoginPage = () => {
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
  const isSetupMode = Boolean(setupToken);

  // View mode: 'login' | 'forgot' | 'setup'
  const [view, setView] = useState(isSetupMode ? 'setup' : 'login');

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
    if (setupToken) setView('setup');
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
        'This activation link is invalid or has already been used.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full bg-gradient-to-br from-accent-950 via-accent-900 to-primary-950 flex flex-col justify-between py-2 sm:py-3 px-4 text-white relative overflow-hidden font-sans select-none">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Back Link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between z-10 pt-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[11px] text-accent-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Platform Overview
        </Link>
        <span className="text-[10px] text-accent-500 font-mono tracking-widest uppercase">
          Enterprise Access
        </span>
      </div>

      {/* Main Center Auth Container */}
      <div className="max-w-md w-full mx-auto z-10">
        <div className="bg-accent-900/80 backdrop-blur-xl border border-accent-700/60 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          {view === 'setup' && (
            <AuthHeroBanner
              title="Set Up Account Credentials"
              subtitle="Establish a secure password to activate your workspace access."
              badgeText="Invitation"
            />
          )}

          {view === 'forgot' && (
            <AuthHeroBanner
              title="Reset Password"
              subtitle="Enter your email address to receive password reset instructions."
            />
          )}

          {view === 'login' && (
            <AuthHeroBanner
              title="Sign in to SecureAssess"
              subtitle="Access your examination, proctoring & evaluation portal"
              badgeText="Enterprise"
            />
          )}

          {/* Feedback Alerts */}
          {error && (
            <div className="mt-2.5 p-2 rounded-lg bg-danger-500/10 border border-danger-500/30 text-danger-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-danger-400" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Dynamic Form View */}
          <div className="mt-3">
            {view === 'setup' && (
              <AccountSetupForm
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                loading={loading}
                onSubmit={handleSetupSubmit}
              />
            )}

            {view === 'forgot' && (
              <ForgotPasswordForm
                forgotEmail={forgotEmail}
                setForgotEmail={setForgotEmail}
                loading={loading}
                onSubmit={handleForgotPasswordSubmit}
                onBackToLogin={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setView('login');
                }}
              />
            )}

            {view === 'login' && (
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                loading={loading}
                onSubmit={handleLoginSubmit}
                onForgotPassword={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setView('forgot');
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer info */}
      <div className="max-w-md w-full mx-auto text-center z-10 pb-1">
        <p className="text-[10px] text-accent-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> 256-Bit SSL Encrypted & SOC-2 Compliant
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
