import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddToCartForm } from './add-to-cart-form';
import { useCartToken } from '@/lib/cart/use-cart-token';
import { useCartDrawer } from '@/lib/cart/cart-drawer-context';
import { useAddCartItemMutation } from '@/features/cart/api';
import { useToast } from '@za/ui';
import type * as ZaUi from '@za/ui';
import type { ProductVariant } from '../types';

jest.mock('@/lib/cart/use-cart-token', () => ({
  useCartToken: jest.fn(),
}));

jest.mock('@/lib/cart/cart-drawer-context', () => ({
  useCartDrawer: jest.fn(),
}));

jest.mock('@/features/cart/api', () => ({
  useAddCartItemMutation: jest.fn(),
}));

jest.mock('@za/ui', () => ({
  ...jest.requireActual<typeof ZaUi>('@za/ui'),
  useToast: jest.fn(),
}));

jest.mock('./variant-picker', () => ({
  VariantPicker: ({
    onSelectColor,
    onSelectSize,
  }: {
    onSelectColor: (id: string) => void;
    onSelectSize: (id: string) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onSelectColor('color-1')}>
        Pick red
      </button>
      <button type="button" onClick={() => onSelectColor('color-2')}>
        Pick blue
      </button>
      <button type="button" onClick={() => onSelectSize('size-1')}>
        Pick M
      </button>
    </div>
  ),
}));

const useCartTokenMock = useCartToken as jest.Mock;
const useCartDrawerMock = useCartDrawer as jest.Mock;
const useAddCartItemMutationMock = useAddCartItemMutation as jest.Mock;
const useToastMock = useToast as jest.Mock;

const variants: ProductVariant[] = [
  { id: 'variant-1', productId: 'product-1', sku: 'SKU-1-RED-M', barcode: null, colorId: 'color-1', sizeId: 'size-1', priceOverride: null },
  { id: 'variant-2', productId: 'product-1', sku: 'SKU-1-BLUE-L', barcode: null, colorId: 'color-2', sizeId: 'size-2', priceOverride: null },
];

describe('AddToCartForm', () => {
  const mutateAsync = jest.fn();
  const open = jest.fn();
  const showToast = jest.fn();

  beforeEach(() => {
    mutateAsync.mockClear();
    open.mockClear();
    showToast.mockClear();
    useCartTokenMock.mockReturnValue('guest-token-123');
    useCartDrawerMock.mockReturnValue({ open });
    useAddCartItemMutationMock.mockReturnValue({ mutateAsync, isPending: false });
    useToastMock.mockReturnValue({ showToast });
  });

  it('shows an unavailable message when there are no variants', () => {
    render(<AddToCartForm variants={[]} />);
    expect(screen.getByText("This product isn't available for purchase right now.")).toBeInTheDocument();
  });

  it('pre-selects the first variant so add to cart starts enabled', () => {
    render(<AddToCartForm variants={variants} />);
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
  });

  it('disables add to cart once the chosen color/size combination has no matching variant', async () => {
    const user = userEvent.setup();
    render(<AddToCartForm variants={variants} />);

    await user.click(screen.getByText('Pick blue'));

    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
  });

  it('adds the pre-selected variant and quantity to the cart, then opens the drawer', async () => {
    mutateAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AddToCartForm variants={variants} />);

    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(mutateAsync).toHaveBeenCalledWith({ variantId: 'variant-1', quantity: 1 });
    expect(showToast).toHaveBeenCalledWith({ tone: 'success', title: 'Added to cart' });
    expect(open).toHaveBeenCalled();
  });

  it('shows a danger toast when adding to the cart fails', async () => {
    mutateAsync.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<AddToCartForm variants={variants} />);

    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(await screen.findByRole('button', { name: 'Add to cart' })).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: 'danger', title: 'Could not add to cart' }),
    );
    expect(open).not.toHaveBeenCalled();
  });
});
