import { render, screen } from '@testing-library/react';
import { EmptyState, ErrorState } from './states';

describe('EmptyState', () => {
  it('renders the title and description', () => {
    render(
      <EmptyState
        title="No products found"
        description="Try adjusting your search or filters."
      />,
    );
    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(
      screen.getByText('Try adjusting your search or filters.'),
    ).toBeInTheDocument();
  });

  it('merges className/iconClassName with the defaults instead of replacing them', () => {
    const { container } = render(
      <EmptyState
        title="No products found"
        className="bg-brand-blush/40"
        iconClassName="text-brand-dusty"
      />,
    );
    expect(container.firstChild).toHaveClass(
      'bg-brand-blush/40',
      'border-dashed',
    );
    expect(container.querySelector('svg')).toHaveClass(
      'text-brand-dusty',
      'h-8',
    );
  });
});

describe('ErrorState', () => {
  it('renders default copy when none is given', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
