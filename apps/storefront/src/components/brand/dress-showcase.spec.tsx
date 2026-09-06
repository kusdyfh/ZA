import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraduationCap, Moon, Stethoscope } from 'lucide-react';
import { DressShowcase } from './dress-showcase';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import { useAddWishlistItemMutation, useRemoveWishlistItemMutation, useWishlistQuery } from '@/features/wishlist/api';
import type { Product } from '@/features/products/types';

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

function makeProduct(overrides: Partial<Product>): Product {
  return {
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
    ...overrides,
  };
}

const slides = [
  { id: 'student', label: 'Medical Student', icon: GraduationCap, products: [makeProduct({ id: 'p1', name: 'Study Scrub', slug: 'study-scrub' })] },
  { id: 'doctor', label: 'Doctor', icon: Stethoscope, products: [makeProduct({ id: 'p2', name: 'Ward Coat', slug: 'ward-coat' })] },
  { id: 'night', label: 'Night Shift', icon: Moon, products: [] },
];

describe('DressShowcase', () => {
  beforeEach(() => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: false });
    useWishlistQueryMock.mockReturnValue({ data: undefined });
    useAddWishlistItemMutationMock.mockReturnValue({ mutate: jest.fn() });
    useRemoveWishlistItemMutationMock.mockReturnValue({ mutate: jest.fn() });
  });

  it('renders nothing when there are no slides', () => {
    const { container } = render(<DressShowcase slides={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('starts on the first slide and shows its products', () => {
    render(<DressShowcase slides={slides} />);
    expect(screen.getByText('Medical Student')).toBeInTheDocument();
    expect(screen.getByText('Study Scrub')).toBeInTheDocument();
  });

  it('advances to the next slide when the next arrow is clicked', async () => {
    const user = userEvent.setup();
    render(<DressShowcase slides={slides} />);

    await user.click(screen.getByRole('button', { name: 'Next look' }));

    expect(screen.getByText('Doctor')).toBeInTheDocument();
    expect(screen.getByText('Ward Coat')).toBeInTheDocument();
    expect(screen.queryByText('Study Scrub')).not.toBeInTheDocument();
  });

  it('wraps around to the last slide when the previous arrow is clicked from the first slide', async () => {
    const user = userEvent.setup();
    render(<DressShowcase slides={slides} />);

    await user.click(screen.getByRole('button', { name: 'Previous look' }));

    expect(screen.getByText('Night Shift')).toBeInTheDocument();
  });

  it('renders no product grid for a slide with no linked products', async () => {
    const user = userEvent.setup();
    render(<DressShowcase slides={slides} />);

    await user.click(screen.getByRole('button', { name: 'Previous look' }));

    expect(screen.getByText('Night Shift')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
