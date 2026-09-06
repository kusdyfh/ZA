import { render, screen } from '@testing-library/react';
import { Rating } from './rating';

describe('Rating', () => {
  it('renders an accessible label with the numeric value', () => {
    render(<Rating value={4} />);
    expect(screen.getByLabelText('Rated 4 out of 5')).toBeInTheDocument();
  });

  it('shows the review count when provided', () => {
    render(<Rating value={3.5} count={12} />);
    expect(screen.getByText('(12)')).toBeInTheDocument();
  });

  it('omits the count when not provided', () => {
    render(<Rating value={3.5} />);
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });
});
