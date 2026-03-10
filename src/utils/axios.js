import axios from 'axios';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.site.serverUrl });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export const publicAxiosInstance = axios.create({ baseURL: CONFIG.site.serverUrl });

publicAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

export const publicFetcher = async ([url, params]) => {
  try {
    const res = await publicAxiosInstance.get(url, { params });
    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  users: '/users',
  calendar: '/calendar',
  paymentRquests: '/payment_requests',
  files: '/files',
  tours: '/tours',
  workspaces: '/workspaces',
  products: '/products',
  orders: '/orders',
  tournaments: '/tournaments',
  notifications: '/notifications',
};
