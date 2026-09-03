import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Public pages
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/auth/LoginPage';

// User pages
import UserDashboard from './pages/dashboard/UserDashboard';
import ShopsPage from './pages/shops/ShopsPage';
import WebsiteShopsPage from './pages/shops/WebsiteShopsPage';
import NoWebsiteShopsPage from './pages/shops/NoWebsiteShopsPage';
import GoodWebsitesPage from './pages/shops/GoodWebsitesPage';
import NeedsImprovementPage from './pages/shops/NeedsImprovementPage';
import ShopDetailPage from './pages/shops/ShopDetailPage';
import ChatPage from './pages/chat/ChatPage';

// Admin pages
import { AdminLayout } from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBusinesses from './pages/admin/AdminBusinesses';
import AdminWebsiteRequests from './pages/admin/AdminWebsiteRequests';
import AdminReports from './pages/admin/AdminReports';

import { ProtectedRoute } from './components/common/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Normal User Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops"
        element={
          <ProtectedRoute>
            <ShopsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops/websites"
        element={
          <ProtectedRoute>
            <WebsiteShopsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops/no-websites"
        element={
          <ProtectedRoute>
            <NoWebsiteShopsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops/good-websites"
        element={
          <ProtectedRoute>
            <GoodWebsitesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops/needs-improvement"
        element={
          <ProtectedRoute>
            <NeedsImprovementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop/:id"
        element={
          <ProtectedRoute>
            <ShopDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop/:id/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="businesses" element={<AdminBusinesses />} />
        <Route path="website-requests" element={<AdminWebsiteRequests />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

