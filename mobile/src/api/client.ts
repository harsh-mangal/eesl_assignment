import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
if (!configuredApiUrl && !__DEV__) {
  throw new Error('EXPO_PUBLIC_API_URL must be configured for production builds.');
}

export const api = axios.create({
  baseURL: configuredApiUrl || 'http://10.0.2.2:4001/api',
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) useAuthStore.getState().clearSession();
    return Promise.reject(error);
  },
);

export function getApiError(error: unknown, fallback = 'Something went wrong.') {
  if (axios.isAxiosError(error)) return error.response?.data?.message || error.message || fallback;
  return error instanceof Error ? error.message : fallback;
}
