import apiClient from './apiClient';

export async function getCategories() {
	const response = await apiClient.get('/categories');
	return response.data;
}

export async function createCategory(name) {
	const response = await apiClient.post('/categories', { name });
	return response.data;
}

export async function updateCategory(categoryId, name) {
	const response = await apiClient.put(`/categories/${categoryId}`, { name });
	return response.data;
}
