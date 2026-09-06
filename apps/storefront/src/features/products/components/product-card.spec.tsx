import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './product-card';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import { useAddWishlistItemMutation, useRemoveWishlistItemMutation, useWishlistQuery } from '@/features/wishlist/api';
import type { Product } from '../types';

jest.mock('@/lib/auth/auth-context', () => ({
  useCustomerAuth: jest.fn(),
}));

jest.mock('@/features/wishlist/api', () => ({
  useWishlistQuery: jest.fn(),
  useAddWishlistItemMutation: jest.fn(),
  useRemoveWishlistItemMutation: jest.fn(),
}));

const useCustomerAuthMock = useCustomerAuth as jest.Mock;
const useWishlistQueryMock = useWishlistQuery as jest.Mock;
const useAddWishlistItemMutationMock = useAddWishlistItemMutation as jest.Mock;
const useRemoveWishlistItemMutationMock = useRemoveWishlistItemMutation as jest.Mock;

const product: Product = {
  id: 'product-1',
  name: 'Classic Scrub Top',
  slug: 'classic-scrub-top',
  sku: 'SKU-1',
  shortDescription: null,
  description: null,
  status: 'ACTIVE',
  price: '39.99',
  discountPrice: null,
  currency: 'USD',
  categoryId: 'cat-1',
  brandId: null,
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  isGiftBox: false,
  isVisibleInCatalog: true,
  metaTitle: null,
  metaDescription: null,
  ogImageUrl: null,
};

describe('ProductCard', () => {
  const addMutate = jest.fn();
  const removeMutate = jest.fn();

  beforeEach(() => {
    addMutate.mockClear();
    removeMutate.mockClear();
    useAddWishlistItemMutationMock.mockReturnValue({ mutate: addMutate });
    useRemoveWishlistItemMutationMock.mockReturnValue({ mutate: removeMutate });
  });

  it('renders the product name and price', () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: false });
    useWishlistQueryMock.mockReturnValue({ data: undefined });

    render(<ProductCard product={product} />);

    expect(screen.getByText('Classic Scrub Top')).toBeInTheDocument();
    expect(screen.getByText('USD 39.99')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/classic-scrub-top');
  });

  it('shows both prices when the product is discounted', () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: false });
    useWishlistQueryMock.mockReturnValue({ data: undefined });

    render(<ProductCard product={{ ...product, discountPrice: '29.99' }} />);

    expect(screen.getByText('USD 29.99')).toBeInTheDocument();
    expect(screen.getByText('USD 39.99')).toBeInTheDocument();
    expect(screen.getByText('Sale')).toBeInTheDocument();
  });

  it('redirects signed-out shoppers to login instead of toggling the wishlist', async () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: false });
    useWishlistQueryMock.mockReturnValue({ data: [] });
    const user = userEvent.setup();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...originalLocation, href: '' } });

    render(<ProductCard product={product} />);
    await user.click(screen.getByRole('button', { name: 'Add Classic Scrub Top to wishlist' }));

    expect(window.location.href).toContain('/login?redirect=');
    expect(addMutate).not.toHaveBeenCalled();
    expect(removeMutate).not.toHaveBeenCalled();

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('adds the product to the wishlist when signed in and not yet wishlisted', async () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: true });
    useWishlistQueryMock.mockReturnValue({ data: [] });
    const user = userEvent.setup();

    render(<ProductCard product={product} />);
    await user.click(screen.getByRole('button', { name: 'Add Classic Scrub Top to wishlist' }));

    expect(addMutate).toHaveBeenCalledWith('product-1');
  });

  it('removes the product from the wishlist when already wishlisted', async () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: true });
    useWishlistQueryMock.mockReturnValue({ data: [{ productId: 'product-1' }] });
    const user = userEvent.setup();

    render(<ProductCard product={product} />);
    await user.click(screen.getByRole('button', { name: 'Remove Classic Scrub Top from wishlist' }));

    expect(removeMutate).toHaveBeenCalledWith('product-1');
  });
});
