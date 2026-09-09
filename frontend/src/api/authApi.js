import apiClient from './apiClient';

export function logout() {
  localStorage.removeItem('access_token');
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