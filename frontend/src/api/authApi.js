import apiClient from './apiClient';

export async function logout() {
  await apiClient.post('/auth/logout');
}

export async function login(email, password) {
  const response = await apiClient.post(
    '/auth/login',
    new URLSearchParams({ username: email, password }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

export async function register(username, email, password) {
  const response = await apiClient.post('/users', {
    username,
    email,
    password,
  });

  return response.data;
}