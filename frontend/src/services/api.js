import axios from 'axios';

export const getBaseUrl = () => {
  // 1. Custom override if user configured one
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('custom_api_url');
    if (customUrl && typeof customUrl === 'string' && customUrl.trim() !== '' && !customUrl.includes('trycloudflare.com')) {
      return customUrl.trim().replace(/\/+$/, '');
    }

    const hostname = window.location.hostname;

    // 2. Localhost development always points to local backend on port 8001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8001';
    }

    // 3. Mobile access on local Wi-Fi (e.g. 192.168.x.x)
    const isPrivateIp = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname);
    if (isPrivateIp) {
      return `http://${hostname}:8001`;
    }

    // 4. Production deployment on Vercel/Pages: use relative path for CDN proxying
    if (hostname.endsWith('vercel.app') || hostname.includes('vercel.app') || hostname.includes('pages.dev')) {
      return '';
    }
  }

  // 5. Environment variable VITE_API_URL for explicitly configured production or build targets
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && !envUrl.includes('trycloudflare.com')) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return 'https://website-backend-d8t5.onrender.com';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and ensure every request is prefixed with /api
api.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseUrl();

    // Ensure the request path always starts with /api/...
    if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
      const cleanPath = config.url.startsWith('/') ? config.url : `/${config.url}`;
      config.url = `/api${cleanPath}`;
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for cold-start retry & automatic refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry once on network error (handling Render cold boot)
    if (!error.response && !originalRequest._networkRetry) {
      originalRequest._networkRetry = true;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return api(originalRequest);
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register') &&
      !originalRequest.url.includes('/auth/logout')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await api.post('/auth/refresh', {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefresh } = res.data;
          localStorage.setItem('access_token', access_token);
          if (newRefresh) {
            localStorage.setItem('refresh_token', newRefresh);
          }
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
          window.location.href = '/';
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
