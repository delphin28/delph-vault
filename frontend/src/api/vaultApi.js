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

export async function exportPasswords() {
	const response = await apiClient.get('/passwords/export');
	return response.data;
}
