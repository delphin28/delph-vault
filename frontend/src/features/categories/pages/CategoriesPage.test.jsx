import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CategoriesPage from './CategoriesPage';
import { getCategories, updateCategory } from '../../../api/categoryApi';

jest.mock('../../../api/categoryApi', () => ({
  createCategory: jest.fn(),
  getCategories: jest.fn(),
  updateCategory: jest.fn(),
}));

test('edits a category and refreshes its displayed name', async () => {
  getCategories.mockResolvedValue([{ id: 3, name: 'Personal' }]);
  updateCategory.mockResolvedValue({ id: 3, name: 'Private' });

  render(<CategoriesPage />);

  expect(await screen.findByText('Personal')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

  const input = screen.getByRole('textbox', { name: 'Category name' });
  fireEvent.change(input, { target: { value: 'Private' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update category' }));

  await waitFor(() => expect(updateCategory).toHaveBeenCalledWith(3, 'Private'));
  expect(await screen.findByText('Private')).toBeInTheDocument();
});