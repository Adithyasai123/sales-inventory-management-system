import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authStorage } from './cookies';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let activeRequestCount = 0;
let activeMutationCount = 0;

const broadcastApiState = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sims:api-active', {
        detail: {
          activeRequestCount,
          activeMutationCount,
        },
      })
    );
  }
};

// Request interceptor: attach access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    activeRequestCount++;
    const method = (config.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      activeMutationCount++;
    }
    broadcastApiState();

    const token = authStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    broadcastApiState();
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401 & silent refresh
apiClient.interceptors.response.use(
  (response) => {
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    const method = (response.config?.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      activeMutationCount = Math.max(0, activeMutationCount - 1);
    }
    broadcastApiState();
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    const method = (originalRequest?.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      activeMutationCount = Math.max(0, activeMutationCount - 1);
    }
    broadcastApiState();

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/logout')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = authStorage.getRefreshToken();

      try {
        const { data } = await axios.post(
          `${API_BASE}/api/v1/auth/refresh`,
          refreshToken ? { refresh_token: refreshToken } : {},
          { withCredentials: true }
        );

        const newAccessToken = data?.access_token;

        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        authStorage.clearTokens();

        // Avoid hard page reloads (window.location.href) which cause infinite flickering loops!
        // Instead, broadcast session expiration to AuthContext so React Router handles navigation cleanly.
        if (
          !originalRequest.url?.includes('/auth/me') &&
          typeof window !== 'undefined' &&
          window.location.pathname !== '/login'
        ) {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
