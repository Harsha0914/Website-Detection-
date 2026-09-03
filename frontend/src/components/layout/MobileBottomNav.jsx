import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Store,
  LayoutDashboard,
  Search,
  User,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

/**
 * MobileBottomNav – fixed bottom navigation bar visible only on small screens.
 * Hidden on md+ (Tailwind `md:hidden`).
 */
export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const items = isAuthenticated
    ? [
        { path: '/',          icon: Home,            label: 'Home' },
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/shops',     icon: Search,          label: 'Shops' },
        { path: '/shop',      icon: Store,           label: 'Browse', hideActive: true },
      ]
    : [
        { path: '/',          icon: Home,            label: 'Home' },
        { path: '/login',     icon: User,            label: 'Sign In' },
        { path: '/register',  icon: Store,           label: 'Register' },
      ];

  return (
    <nav className="mobile-bottom-nav md:hidden" aria-label="Mobile navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`mobile-bottom-nav-item no-min-tap ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              style={{
                width: 22,
                height: 22,
                strokeWidth: active ? 2.5 : 1.8,
              }}
            />
            <span>{item.label}</span>
            {active && <span className="mobile-bottom-nav-dot" />}
          </button>
        );
      })}
    </nav>
  );
}
