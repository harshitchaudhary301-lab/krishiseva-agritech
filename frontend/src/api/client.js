import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

/**
 * Returns normalized API base URL ending with /api
 */
export const getApiBaseUrl = () => {
  const url = (rawBaseUrl || '').trim().replace(/\/+$/, '');
  if (!url) return 'http://127.0.0.1:8000/api';
  return url.endsWith('/api') ? url : `${url}/api`;
};

/**
 * Returns root backend server URL (without /api)
 */
export const getServerBaseUrl = () => {
  return getApiBaseUrl().replace(/\/api$/, '');
};

/**
 * Returns Django Admin Panel URL
 */
export const getAdminUrl = () => {
  return `${getServerBaseUrl()}/admin/`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('krishi_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid
      if (window.location.pathname.startsWith('/farmer') || 
          window.location.pathname.startsWith('/worker') || 
          window.location.pathname.startsWith('/provider')) {
        localStorage.removeItem('krishi_token');
        localStorage.removeItem('krishi_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
