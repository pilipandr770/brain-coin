import axios from 'axios';
import { getItem } from './storage';
import API_URL from './config';

const api = axios.create({ baseURL: API_URL });

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await getItem('bc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
