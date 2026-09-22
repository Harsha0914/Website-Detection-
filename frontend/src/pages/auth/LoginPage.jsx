import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Store, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, HelpCircle, Eye, EyeOff, CheckCircle, KeyRound } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import MobileBottomNav from '../../components/layout/MobileBottomNav';

export default function LoginPage() {
  const { login, resetPassword, loading, error, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Forgot password form state
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [loginTimeSeconds, setLoginTimeSeconds] = useState(0);

  useEffect(() => {
    // Ping backend on login page load to wake up free tier container immediately
    api.get('/health').catch(() => {});
  }, []);

  useEffect(() => {
    let interval = null;
    if (loading) {
      setLoginTimeSeconds(0);
      interval = setInterval(() => {
        setLoginTimeSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setLoginTimeSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) {
      setEmail(qEmail);
      setResetEmail(qEmail);
    }
    if (searchParams.get('forgot') === '1') {
      setShowForgotModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      const userInfo = await login(email, password);
      // Redirect based on role
      if (userInfo.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Error handled by store
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (resetNewPass.length < 8) {
      setResetError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(resetNewPass)) {
      setResetError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[0-9]/.test(resetNewPass)) {
      setResetError('Password must contain at least one number.');
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword({
        email: resetEmail,
        new_password: resetNewPass,
        confirm_password: resetConfirmPass,
      });
      setResetSuccess('Password reset successfully! You can now log in.');
      setEmail(resetEmail);
      setPassword(resetNewPass);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSuccess('');
      }, 2000);
    } catch (err) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setResetLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Store className="w-6 h-6" />
          </div>
          <span className="text-slate-900 dark:text-white font-black text-2xl tracking-tight">
            Website <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Presence</span> Detection
          </span>
        </Link>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight pt-2">
          Sign in to your account
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
          Access your dashboard to discover shops and check online website presence
        </p>
      </div>

      {/* Main Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-xl shadow-blue-500/5 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5">
          
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
              </div>
              {typeof error === 'string' && error.toLowerCase().includes('not found') && (
                <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60">
                  <Link
                    to={`/register?email=${encodeURIComponent(email)}`}
                    className="block w-full py-2 px-3 text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                  >
                    Register This Email Now →
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full pl-10 pr-3.5 py-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span>
                    {loginTimeSeconds > 3
                      ? `Waking up server (${loginTimeSeconds}s)...`
                      : 'Signing in...'}
                  </span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            {loading && loginTimeSeconds > 4 && (
              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 animate-pulse">
                Render free tier wakes up in ~15-30s. Please hold on...
              </p>
            )}
          </form>

          {/* Registration Links */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Don't have an account yet?</p>
            <div className="flex items-center justify-center gap-2.5">
              <Link
                to="/register?role=user"
                className="flex-1 py-2 px-3 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl border border-blue-200 dark:border-blue-900/60 transition-colors text-center"
              >
                User Register
              </Link>
              <Link
                to="/register?role=admin"
                className="flex-1 py-2 px-3 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl border border-amber-200 dark:border-amber-900/60 transition-colors text-center"
              >
                Admin Register
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-full transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <span>Reset Password</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetError('');
                  setResetSuccess('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Enter your registered email address and choose a new password.
            </p>

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase & 1 number"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={resetConfirmPass}
                  onChange={(e) => setResetConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {resetLoading ? 'Resetting...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <MobileBottomNav />
    </div>
  );
}

