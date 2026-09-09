import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  withCredentials: true,
});

let csrfToken = null;

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;

  const response = await axios.get(`${process.env.REACT_APP_API_URL || '/api'}/auth/csrf`, {
    withCredentials: true,
  });
  csrfToken = response.data.csrf_token;
  return csrfToken;
}

apiClient.interceptors.request.use(async (config) => {
  if (!['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
    config.headers['X-CSRF-Token'] = await ensureCsrfToken();
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.assign('/');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
