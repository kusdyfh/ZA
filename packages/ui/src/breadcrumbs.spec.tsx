import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from './breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders every item', () => {
    render(
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: 'Scrubs' }]}
      />,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Shop')).toBeInTheDocument();
    expect(screen.getByText('Scrubs')).toBeInTheDocument();
  });

  it('renders the last item as the current page, not a link', () => {
    render(<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Scrubs' }]} />);
    expect(screen.getByText('Scrubs')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Scrubs' })).not.toBeInTheDocument();
  });

  it('renders non-final items as links', () => {
    render(<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Scrubs' }]} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });
});
