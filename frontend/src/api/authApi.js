import apiClient from './apiClient';

export async function logout() {
  await apiClient.post('/auth/logout');
}

async function ensureCsrfToken() {
  await apiClient.get('/auth/csrf');
}

export async function login(email, password, otp, backupCode) {
  await ensureCsrfToken();
  const response = await apiClient.post(
    '/auth/login',
    new URLSearchParams({ username: email, password, ...(otp ? { otp } : {}), ...(backupCode ? { backup_code: backupCode } : {}) }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data;
}

export async function setupMfa(password) {
  const response = await apiClient.post('/auth/mfa/setup', new URLSearchParams({ password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

export async function verifyMfa(secret, code) {
  const response = await apiClient.post(
    '/auth/mfa/verify',
    new URLSearchParams({ secret, code }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return response.data;
}

export async function disableMfa(password, otp) {
  const response = await apiClient.post('/auth/mfa/disable', new URLSearchParams({ password, otp }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

export async function register(username, email, password) {
  await ensureCsrfToken();
  const response = await apiClient.post('/users', {
    username,
    email,
    password,
  });

  return response.data;
}

export async function regenerateBackupCodes(password, otp) {
  const response = await apiClient.post('/auth/mfa/backup-codes', new URLSearchParams({ password, otp }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

export async function checkMfa(email) {
  const response = await apiClient.post(
    '/auth/check-mfa',
    new URLSearchParams({ email }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );
  return response.data;
}

export async function resetPassword(email, newPassword, otp, backupCode) {
  const response = await apiClient.post(
    '/auth/reset-password',
    new URLSearchParams({
      email,
      new_password: newPassword,
      ...(otp ? { otp } : {}),
      ...(backupCode ? { backup_code: backupCode } : {}),
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );
  return response.data;
}