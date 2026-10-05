import { fireEvent, render, screen } from '@testing-library/react';
import '@/test-utils/pointer-event';
import userEvent from '@testing-library/user-event';
import { GraduationCap, Moon, Stethoscope } from 'lucide-react';
import { DressShowcase } from './dress-showcase';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import {
  useAddWishlistItemMutation,
  useRemoveWishlistItemMutation,
  useWishlistQuery,
} from '@/features/wishlist/api';
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
const useRemoveWishlistItemMutationMock =
  useRemoveWishlistItemMutation as jest.Mock;

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
  {
    id: 'student',
    label: 'Medical Student',
    icon: GraduationCap,
    products: [
      makeProduct({ id: 'p1', name: 'Study Scrub', slug: 'study-scrub' }),
    ],
  },
  {
    id: 'doctor',
    label: 'Doctor',
    icon: Stethoscope,
    products: [makeProduct({ id: 'p2', name: 'Ward Coat', slug: 'ward-coat' })],
  },
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

  function swipe(target: HTMLElement, fromX: number, toX: number) {
    fireEvent.pointerDown(target, { clientX: fromX, clientY: 100 });
    fireEvent.pointerMove(target, { clientX: (fromX + toX) / 2, clientY: 100 });
    fireEvent.pointerMove(target, { clientX: toX, clientY: 100 });
    fireEvent.pointerUp(target, { clientX: toX, clientY: 100 });
  }

  it('has no buttons for changing the look', () => {
    render(<DressShowcase slides={slides} />);
    expect(
      screen.queryByRole('button', { name: /look|preview/i }),
    ).not.toBeInTheDocument();
  });

  it('advances to the next slide on a left swipe', () => {
    render(<DressShowcase slides={slides} />);

    swipe(screen.getByRole('group', { name: 'Looks' }), 300, 150);

    expect(screen.getByText('Doctor')).toBeInTheDocument();
    expect(screen.getByText('Ward Coat')).toBeInTheDocument();
    expect(screen.queryByText('Study Scrub')).not.toBeInTheDocument();
  });

  it('wraps around to the last slide on a right swipe from the first slide', () => {
    render(<DressShowcase slides={slides} />);

    swipe(screen.getByRole('group', { name: 'Looks' }), 150, 300);

    expect(screen.getByText('Night Shift')).toBeInTheDocument();
  });

  it('ignores a drag shorter than the commit distance', () => {
    render(<DressShowcase slides={slides} />);

    swipe(screen.getByRole('group', { name: 'Looks' }), 300, 275);

    expect(screen.getByText('Medical Student')).toBeInTheDocument();
  });

  it('changes look with the left and right arrow keys', async () => {
    const user = userEvent.setup();
    render(<DressShowcase slides={slides} />);

    screen.getByRole('group', { name: 'Looks' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Doctor')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByText('Night Shift')).toBeInTheDocument();
  });

  it('renders no product grid for a slide with no linked products', () => {
    render(<DressShowcase slides={slides} />);

    swipe(screen.getByRole('group', { name: 'Looks' }), 150, 300);

    expect(screen.getByText('Night Shift')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
