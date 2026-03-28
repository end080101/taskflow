import axios from 'axios';

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn('Unauthorized request');
    }
    return Promise.reject(err);
  },
);

export default http;
