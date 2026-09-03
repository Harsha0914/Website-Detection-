import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Store,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Moon,
  Sun,
  LogIn,
  User,
  Search,
  ChevronDown,
  MapPin,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const menuRef = useRef(null);
  const loginDropdownRef = useRef(null);

  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target)) {
        setLoginDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    setMenuOpen(false);
    setLoginDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleNavigate = (path) => {
    setMenuOpen(false);
    setLoginDropdownOpen(false);
    if (path.startsWith('#')) {
      if (location.pathname !== '/') {
        navigate('/' + path);
      } else {
        const el = document.querySelector(path);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo: Website Presence Detection */}
          <Link
            to="/"
            className="group flex items-center gap-1.5 sm:gap-2 text-blue-600 dark:text-blue-400 font-black tracking-tight transition-transform duration-200 active:scale-95 shrink min-w-0 pr-1"
          >
            <div className="p-1.5 sm:p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            {/* Clean Brand Name with no overlapping icons */}
            <span className="text-slate-900 dark:text-white font-black text-xs xs:text-sm sm:text-base md:text-lg tracking-tight truncate">
              Website <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Presence</span> Detection
            </span>
          </Link>

          {/* Center Pill Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
            <button
              onClick={() => handleNavigate('/')}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                location.pathname === '/' && !location.hash
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavigate('#search')}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full transition-all"
            >
              Search
            </button>
            <button
              onClick={() => handleNavigate('/#categories')}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full transition-all"
            >
              Categories
            </button>
            <button
              onClick={() => handleNavigate('#services')}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full transition-all"
            >
              Services
            </button>
            <button
              onClick={() => handleNavigate('#about')}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full transition-all"
            >
              About
            </button>
            <button
              onClick={() => handleNavigate('#contact')}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full transition-all"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Utilities Section */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
            {/* Theme Toggle Button (Desktop & Tablet) */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="hidden sm:inline-flex p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-slate-600" />
              )}
            </button>

            {/* Authentication Buttons & Profile Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => handleNavigate('/dashboard')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-full transition-all border border-blue-200 dark:border-blue-900/60"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                <div className="relative" ref={loginDropdownRef}>
                  <button
                    onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="hidden xs:inline">{user?.full_name?.split(' ')[0] || 'Account'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {loginDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-dropdown">
                      <div className="space-y-1">
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.full_name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{user?.email}</p>
                        </div>
                        <button
                          onClick={() => handleNavigate('/dashboard')}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all text-left"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                          <span>User Dashboard</span>
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleNavigate('/admin/dashboard')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-all text-left"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>Admin Portal</span>
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => handleNavigate('/login')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => handleNavigate('/register')}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full shadow-sm shadow-blue-500/25 transition-all active:scale-95 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <div className="lg:hidden relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle Menu"
                className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                {menuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 space-y-2">
                  <div className="space-y-1">
                    <button
                      onClick={() => handleNavigate('/')}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      Home
                    </button>
                    <button
                      onClick={() => handleNavigate('#search')}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      Search Shops
                    </button>
                    <button
                      onClick={() => handleNavigate('#categories')}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      Categories
                    </button>
                    <button
                      onClick={() => handleNavigate('#services')}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      Services
                    </button>
                    <button
                      onClick={() => handleNavigate('#about')}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      About
                    </button>
                    <button
                      onClick={() => handleNavigate('#contact')}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      Contact
                    </button>

                    {/* Mobile Dark/Light Mode Switch Row */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-3 py-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Theme</span>
                      <button
                        onClick={toggleTheme}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        {theme === 'dark' ? (
                          <>
                            <Sun className="w-3.5 h-3.5 text-amber-400" />
                            <span>Light Mode</span>
                          </>
                        ) : (
                          <>
                            <Moon className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Dark Mode</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isAuthenticated ? (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                        <button
                          onClick={() => handleNavigate('/dashboard')}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Dashboard</span>
                        </button>
                        {user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleNavigate('/admin/dashboard')}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Admin Portal</span>
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <button
                          onClick={() => handleNavigate('/login')}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                        >
                          <LogIn className="w-3.5 h-3.5 text-blue-600" />
                          <span>Sign In</span>
                        </button>
                        <button
                          onClick={() => handleNavigate('/register')}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Create Account / Register</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
