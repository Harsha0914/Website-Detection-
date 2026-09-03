import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Store,
  User,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Key,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPage() {
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get('role') === 'admin' ? 'ADMIN' : 'USER';
  const [role, setRole] = useState(initialRole);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    admin_code: '',
  });

  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (searchParams.get('role') === 'admin') {
      setRole('ADMIN');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setValidationError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setValidationError('Password must contain at least one number');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setValidationError('Passwords do not match');
      return;
    }

    if (role === 'ADMIN' && !formData.admin_code.trim()) {
      setValidationError('Admin Secret Code is required for administrator registration.');
      return;
    }

    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: role,
        admin_code: formData.admin_code,
      });

      setSuccessMessage(
        role === 'ADMIN'
          ? 'Admin account created successfully! Redirecting to login...'
          : 'Registration successful! Redirecting to login...'
      );

      setTimeout(() => {
        navigate('/login');
      }, 1800);
    } catch (err) {
      // Handled by store error state
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
          Create your account
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
          Discover local grocery stores, evaluate websites, and improve digital presence
        </p>
      </div>

      {/* Main Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-xl shadow-blue-500/5 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5">
          
          {/* Account Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setRole('USER');
                setValidationError('');
              }}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                role === 'USER'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>User Register</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('ADMIN');
                setValidationError('');
              }}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                role === 'ADMIN'
                  ? 'bg-slate-900 text-amber-400 dark:bg-amber-950/80 dark:text-amber-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Register</span>
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {(validationError || error) && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{typeof (validationError || error) === 'string' ? (validationError || error) : JSON.stringify(validationError || error)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-3.5 py-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className="w-full pl-10 pr-3.5 py-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98490 12345"
                  className="w-full pl-10 pr-3.5 py-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Admin Secret Code (Only if Admin selected) */}
            {role === 'ADMIN' && (
              <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-2">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                  <span>Admin Secret Authorization Code</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-normal">Default: ADMIN2026</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-amber-600 dark:text-amber-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    name="admin_code"
                    required
                    value={formData.admin_code}
                    onChange={handleChange}
                    placeholder="Enter admin secret passcode"
                    className="w-full pl-10 pr-3.5 py-3 text-xs bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars, 1 uppercase & 1 number"
                  className="w-full pl-10 pr-3.5 py-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  name="confirm_password"
                  required
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-3.5 py-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 ${
                role === 'ADMIN'
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 shadow-slate-900/20'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
              }`}
            >
              <span>{loading ? 'Creating account...' : `Register as ${role === 'ADMIN' ? 'Administrator' : 'User'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Login prompt */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Sign In to Your Account
            </Link>
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
    </div>
  );
}
