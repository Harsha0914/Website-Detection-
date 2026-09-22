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
      const cleanEmail = (email || '').trim().toLowerCase();
      const res = await api.post('/auth/login', { email: cleanEmail, password });
      const data = res.data;

      const { access_token, refresh_token, role, full_name, user_id } = data;
      const userInfo = { id: user_id, email: cleanEmail, full_name, role };

      try {
        localStorage.setItem('access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }
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
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          msg = err.response.data.detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          msg = err.response.data.detail;
        } else {
          msg = JSON.stringify(err.response.data.detail);
        }
      } else if (err.response?.status === 401) {
        msg = 'Invalid email or password. Please verify your credentials or register a new account.';
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Connection timed out. Please check your internet connection and try again.';
      } else if (err.message === 'Network Error' || (err.isAxiosError && !err.response)) {
        msg = 'Network Error: Cannot connect to server. Please check your internet connection.';
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
      const cleanEmail = (email || '').trim().toLowerCase();
      const res = await api.post('/auth/register', {
        full_name,
        email: cleanEmail,
        phone,
        password,
        confirm_password,
        role,
        admin_code,
      });
      set({ loading: false, error: null });
      return res.data;
    } catch (err) {
      let msg = 'Registration failed. Please check your details and try again.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          msg = err.response.data.detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          msg = err.response.data.detail;
        } else {
          msg = JSON.stringify(err.response.data.detail);
        }
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Connection timed out. Please check your internet connection and try again.';
      } else if (err.message === 'Network Error' || (err.isAxiosError && !err.response)) {
        msg = 'Network Error: Cannot connect to server. Please check your internet connection.';
      } else if (err.message) {
        msg = err.message;
      }
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  resetPassword: async ({ email, new_password, confirm_password }) => {
    set({ loading: true, error: null });
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const res = await api.post('/auth/reset-password', {
        email: cleanEmail,
        new_password,
        confirm_password,
      });
      set({ loading: false, error: null });
      return res.data;
    } catch (err) {
      let msg = 'Failed to reset password. Please verify the email address.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          msg = err.response.data.detail.map((d) => d.msg || d.message || JSON.stringify(d)).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          msg = err.response.data.detail;
        } else {
          msg = JSON.stringify(err.response.data.detail);
        }
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
