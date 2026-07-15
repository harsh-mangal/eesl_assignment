import axios from 'axios';

export const TOKEN_KEY = 'member_services_admin_token';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
if (!configuredApiUrl && !import.meta.env.DEV) {
  throw new Error('VITE_API_URL must be configured for a production Admin build.');
}

export const api = axios.create({
  baseURL: configuredApiUrl || 'http://localhost:4001/api',
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

export function getApiError(error: unknown, fallback = 'Something went wrong.') {
  if (axios.isAxiosError(error)) return error.response?.data?.message || error.message || fallback;
  return error instanceof Error ? error.message : fallback;
}
