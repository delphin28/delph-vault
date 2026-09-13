import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const csrfMatch = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  if (csrfMatch) {
    config.headers['X-CSRF-Token'] = decodeURIComponent(csrfMatch[1]);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.detail !== 'MFA_REQUIRED') {
      window.location.assign('/');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
