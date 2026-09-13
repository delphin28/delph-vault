import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the login page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /delph vault/i })).toBeInTheDocument();
});
