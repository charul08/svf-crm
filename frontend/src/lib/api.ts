import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach Bearer token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 by refreshing token
let refreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (refreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(api(original)));
        });
      }

      refreshing = true;
      try {
        const { data } = await axios.post(`${apiBase}/auth/refresh`, {}, { withCredentials: true });
        const token = data.data?.accessToken;
        if (token) {
          localStorage.setItem('accessToken', token);
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          queue.forEach((cb) => cb());
          queue = [];
          return api(original);
        }
      } catch {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
