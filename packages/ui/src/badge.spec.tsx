import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge tone="success">DELIVERED</Badge>);
    expect(screen.getByText('DELIVERED')).toBeInTheDocument();
  });

  it('defaults to the neutral tone', () => {
    render(<Badge data-testid="badge">PENDING</Badge>);
    expect(screen.getByTestId('badge').className).toContain('bg-neutral-100');
  });
});
