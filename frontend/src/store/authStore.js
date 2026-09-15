import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user_info') || 'null'),
  accessToken: localStorage.getItem('access_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      let data;
      try {
        const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password }, { timeout: 30000 });
        data = res.data;
      } catch (axiosErr) {
        console.warn('Axios login attempt failed, attempting fallback fetch...', axiosErr);
        const baseUrl = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'http://localhost:8001';
        const fetchUrl = `${baseUrl.replace(/\/+$/, '')}/api/auth/login`;
        const fetchRes = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        if (!fetchRes.ok) {
          const errBody = await fetchRes.json().catch(() => ({}));
          const errorMsg = errBody.detail || `Server responded with status ${fetchRes.status}`;
          throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        }
        data = await fetchRes.json();
      }

      const { access_token, refresh_token, role, full_name, user_id } = data;
      const userInfo = { id: user_id, email: email.trim().toLowerCase(), full_name, role };

      try {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user_info', JSON.stringify(userInfo));
      } catch (storageErr) {
        console.warn('LocalStorage write warning:', storageErr);
      }

      set({
        user: userInfo,
        accessToken: access_token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return userInfo;
    } catch (err) {
      let msg = 'Failed to login. Please check your credentials.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Connection timed out. Please check that your FastAPI backend is running and reachable.';
      } else if (err.message === 'Network Error' || !err.response) {
        msg = 'Network Error: Backend server unreachable. Check that your FastAPI server/tunnel is active.';
      } else if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          msg = err.response.data.detail.map((d) => d.msg || d.message).join(', ');
        } else {
          msg = err.response.data.detail;
        }
      } else if (err.response?.status === 405 || err.response?.status === 502) {
        msg = 'Backend server endpoint not reachable. Please make sure FastAPI backend is running on port 8001.';
      } else if (err.message) {
        msg = err.message;
      }
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  register: async ({ full_name, email, phone, password, confirm_password, role = 'USER', admin_code = '' }) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/register', {
        full_name,
        email,
        phone,
        password,
        confirm_password,
        role,
        admin_code,
      });
      set({ loading: false, error: null });
    } catch (err) {
      let msg = 'Registration failed. Please check your connection and try again.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          msg = err.response.data.detail.map((d) => d.msg || d.message).join(', ');
        } else {
          msg = err.response.data.detail;
        }
      } else if (err.response?.status === 405) {
        msg = 'Backend server endpoint not reachable. Please make sure FastAPI backend is running on port 8000.';
      } else if (err.message) {
        msg = err.message;
      }
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  logout: () => {
    try {
      api.post('/auth/logout').catch(() => {});
    } catch (_) {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/auth/me');
      const userInfo = {
        id: res.data.id,
        email: res.data.email,
        full_name: res.data.full_name,
        role: res.data.role,
        phone: res.data.phone,
      };
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      set({ user: userInfo, isAuthenticated: true });
    } catch (err) {
      get().logout();
    }
  },
}));
