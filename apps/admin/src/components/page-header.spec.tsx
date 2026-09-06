import { render, screen } from '@testing-library/react';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Products" />);
    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<PageHeader title="Products" description="Everything sold in the store." />);
    expect(screen.getByText('Everything sold in the store.')).toBeInTheDocument();
  });

  it('omits the description when not provided', () => {
    render(<PageHeader title="Products" />);
    expect(screen.queryByText('Everything sold in the store.')).not.toBeInTheDocument();
  });

  it('renders the action slot', () => {
    render(<PageHeader title="Products" action={<button type="button">Add product</button>} />);
    expect(screen.getByRole('button', { name: 'Add product' })).toBeInTheDocument();
  });
});
