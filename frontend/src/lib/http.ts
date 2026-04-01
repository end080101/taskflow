import axios from 'axios';
import { getApiBasePath } from './runtime';

const http = axios.create({
  timeout: 15000,
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  config.baseURL = getApiBasePath();
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  },
);

export default http;
