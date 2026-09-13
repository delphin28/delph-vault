import apiClient from './apiClient';
import { updateCategory } from './categoryApi';

jest.mock('./apiClient');

test('updates a category through the category endpoint', async () => {
  apiClient.put.mockResolvedValue({ data: { id: 3, name: 'Renamed' } });

  await expect(updateCategory(3, 'Renamed')).resolves.toEqual({ id: 3, name: 'Renamed' });
  expect(apiClient.put).toHaveBeenCalledWith('/categories/3', { name: 'Renamed' });
});