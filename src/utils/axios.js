import axios from 'axios';
import { Auth } from '@aws-amplify/auth';

import { HOST_API } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: HOST_API });

const authTokenInterceptor = (config) => {
  if (config.thirdParty === true) {
    return config;
  }
  return Auth.currentAuthenticatedUser().then((user) => {
    if (user) {
      const token = user.signInUserSession.idToken.jwtToken;
      config.headers.Authorization = `Bearer ${token}`;
      return Promise.resolve(config);
    }
    return config;
  });
};

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong')
);

axiosInstance.interceptors.request.use(authTokenInterceptor, (error) => Promise.reject(error));

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.get(url, { ...config });

  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  calendar: '/calendar',
  paymentRequests: '/payment_requests',
  users: '/users',
};
