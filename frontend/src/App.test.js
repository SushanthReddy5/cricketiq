import { render, screen } from '@testing-library/react';
import App from './App';

test('renders CricketIQ branding on home page', () => {
  render(<App />);
  const branding = screen.getAllByText(/Cricket/i)[0];
  expect(branding).toBeInTheDocument();
});
