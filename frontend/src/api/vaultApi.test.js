import apiClient from './apiClient';
import { updatePassword } from './vaultApi';

jest.mock('./apiClient');

test('updates a vault entry through the password endpoint', async () => {
  apiClient.put.mockResolvedValue({ data: { id: 7, name: 'Updated' } });

  await expect(updatePassword(7, { name: 'Updated' })).resolves.toEqual({ id: 7, name: 'Updated' });
  expect(apiClient.put).toHaveBeenCalledWith('/passwords/7', { name: 'Updated' });
});