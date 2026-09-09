import axios from 'axios';

const authApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

export async function login(email, password) {
  const response = await authApi.post(
    '/auth/login',
    new URLSearchParams({ username: email, password })
  );

  return response.data;
}