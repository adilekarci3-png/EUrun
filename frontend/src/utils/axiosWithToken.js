// utils/api.js
import axios from 'axios';

// Token gerektiren API'ler
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token'); // ya da 'token'
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token gerekmeyen istekler için
export const plainApi = axios.create({
  baseURL: 'http://localhost:8000',
});

export default api;
