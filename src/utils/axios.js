import axios from 'axios';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

// Backend errors arrive as { detail: string | Array<{ msg }> }. Older call sites read
// `err.detail` or `err.response.data.detail` directly, so both stay populated on the
// rejected value — but it's now a real Error, so `err.message` also works everywhere.
function rejectWithError(error) {
  const data = error.response && error.response.data;
  const detail = data && data.detail;
  const message =
    (typeof detail === 'string' && detail) ||
    (Array.isArray(detail) && detail.map((d) => d.msg).join(', ')) ||
    (typeof data === 'string' && data) ||
    error.message ||
    'Something went wrong!';

  const rejected = new Error(message);
  rejected.status = error.response && error.response.status;
  rejected.response = error.response;
  rejected.detail = detail;
  return Promise.reject(rejected);
}

const axiosInstance = axios.create({ baseURL: CONFIG.site.serverUrl });

axiosInstance.interceptors.response.use((response) => response, rejectWithError);

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

publicAxiosInstance.interceptors.response.use((response) => response, rejectWithError);

export const publicFetcher = async (args) => {
  try {
    const [url, params] = Array.isArray(args) ? args : [args];
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
  paymentRequests: '/payment_requests',
  files: '/files',
  tours: '/tours',
  workspaces: '/workspaces',
  memberships: '/memberships',
  products: '/products',
  orders: '/orders',
  tournaments: '/tournaments',
  notifications: '/notifications',
  votations: '/votations',
  donations: '/donations',
};
