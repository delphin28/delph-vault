import apiClient from './apiClient';

export async function getPasswords() {
	const response = await apiClient.get('/passwords');
	return response.data;
}

export async function createPassword(entry) {
	const response = await apiClient.post('/passwords', entry);
	return response.data;
}

export async function deletePassword(passwordId) {
	await apiClient.delete(`/passwords/${passwordId}`);
}

export async function revealPassword(passwordId) {
	const response = await apiClient.get(`/passwords/${passwordId}/reveal`);
	return response.data.password;
}

export async function exportPasswords(password) {
	const response = await apiClient.post('/passwords/export', new URLSearchParams({ password }), {
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
	});
	return response.data;
}
