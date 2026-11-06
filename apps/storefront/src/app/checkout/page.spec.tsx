import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as ZaUi from '@za/ui';
import CheckoutPage from './page';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import { useCartToken } from '@/lib/cart/use-cart-token';
import { useCartQuery } from '@/features/cart/api';
import { useAddressesQuery } from '@/features/addresses/api';
import {
  useConfirmPhoneVerificationMutation,
  useInitiateCardCheckoutMutation,
  usePlaceOrderMutation,
  useRequestPhoneVerificationMutation,
} from '@/features/orders/api';
import { useAutoShippingMethod } from '@/features/shipping/api';

const pushMock = jest.fn();
const showToastMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@za/ui', () => {
  const actual = jest.requireActual<typeof ZaUi>('@za/ui');
  return {
    ...actual,
    useToast: () => ({ showToast: showToastMock }),
  };
});

jest.mock('@/lib/auth/auth-context', () => ({ useCustomerAuth: jest.fn() }));
jest.mock('@/lib/cart/use-cart-token', () => ({ useCartToken: jest.fn() }));
jest.mock('@/features/cart/api', () => ({ useCartQuery: jest.fn() }));
jest.mock('@/features/addresses/api', () => ({ useAddressesQuery: jest.fn() }));
jest.mock('@/features/orders/api', () => ({
  usePlaceOrderMutation: jest.fn(),
  useInitiateCardCheckoutMutation: jest.fn(),
  useRequestPhoneVerificationMutation: jest.fn(),
  useConfirmPhoneVerificationMutation: jest.fn(),
}));
jest.mock('@/features/shipping/api', () => ({
  useAutoShippingMethod: jest.fn(),
}));

const useCustomerAuthMock = useCustomerAuth as jest.Mock;
const useCartTokenMock = useCartToken as jest.Mock;
const useCartQueryMock = useCartQuery as jest.Mock;
const useAddressesQueryMock = useAddressesQuery as jest.Mock;
const usePlaceOrderMutationMock = usePlaceOrderMutation as jest.Mock;
const useInitiateCardCheckoutMutationMock =
  useInitiateCardCheckoutMutation as jest.Mock;
const useRequestPhoneVerificationMutationMock =
  useRequestPhoneVerificationMutation as jest.Mock;
const useConfirmPhoneVerificationMutationMock =
  useConfirmPhoneVerificationMutation as jest.Mock;
const useAutoShippingMethodMock = useAutoShippingMethod as jest.Mock;

const CART = {
  items: [
    {
      variantId: 'v1',
      productName: 'Scrub Top',
      quantity: 1,
      lineTotal: 45000,
    },
  ],
  subtotal: 45000,
  currencyCode: 'IQD',
};

describe('CheckoutPage', () => {
  let placeOrder: jest.Mock;
  let requestCode: jest.Mock;
  let confirmCode: jest.Mock;

  beforeEach(() => {
    pushMock.mockClear();
    showToastMock.mockClear();
    useCustomerAuthMock.mockReturnValue({ customer: null });
    useCartTokenMock.mockReturnValue('guest-token-1');
    useCartQueryMock.mockReturnValue({ data: CART, isLoading: false });
    useAddressesQueryMock.mockReturnValue({ data: [] });
    useAutoShippingMethodMock.mockReturnValue({
      method: { id: 'method-1' },
      quote: { fee: 5000 },
      isChecking: false,
      isUnavailable: false,
    });

    placeOrder = jest.fn().mockResolvedValue({ id: 'order-1' });
    requestCode = jest
      .fn()
      .mockResolvedValue({ phone: '+9647700000000', expiresInSeconds: 600 });
    confirmCode = jest
      .fn()
      .mockResolvedValue({ phone: '+9647700000000', verified: true });

    usePlaceOrderMutationMock.mockReturnValue({
      mutateAsync: placeOrder,
      isPending: false,
    });
    useInitiateCardCheckoutMutationMock.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
    useRequestPhoneVerificationMutationMock.mockReturnValue({
      mutateAsync: requestCode,
      isPending: false,
    });
    useConfirmPhoneVerificationMutationMock.mockReturnValue({
      mutateAsync: confirmCode,
      isPending: false,
    });
  });

  async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
    const [customerName, shippingFullName] =
      screen.getAllByLabelText('Full name');
    await user.type(customerName!, 'Dana Ali');
    await user.type(shippingFullName!, 'Dana Ali');
    const [customerPhone, shippingPhone] = screen.getAllByLabelText('Phone');
    await user.type(customerPhone!, '07700000000');
    await user.type(shippingPhone!, '07711111111');
    await user.type(
      screen.getByLabelText('Address line 1'),
      '123 Al-Rasheed Street',
    );
    await user.selectOptions(screen.getByLabelText('Governorate'), 'Baghdad');
    await user.selectOptions(screen.getByLabelText('City'), 'Baghdad');
  }

  it('blocks placing the order until the phone is verified, and succeeds once it is', async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Place order' }));

    expect(placeOrder).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Verify your phone number' }),
    );

    await user.click(screen.getByRole('button', { name: 'Send code' }));
    expect(requestCode).toHaveBeenCalledWith('07700000000');

    await user.type(await screen.findByLabelText('WhatsApp code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(confirmCode).toHaveBeenCalledWith({
      phone: '07700000000',
      code: '123456',
    });

    await screen.findByText('✓ Verified');
    await user.click(screen.getByRole('button', { name: 'Place order' }));

    await waitFor(() => expect(placeOrder).toHaveBeenCalledTimes(1));
    const [submitted] = placeOrder.mock.calls[0] as [Record<string, unknown>];
    expect(submitted.customerEmail).toBeUndefined();
    expect(submitted.shippingCountry).toBe('Iraq');
    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/checkout/confirmation/order-1'),
    );
  });

  it('resets the selected city when the governorate changes', async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await user.selectOptions(screen.getByLabelText('Governorate'), 'Baghdad');
    await user.selectOptions(screen.getByLabelText('City'), 'Baghdad');
    expect(screen.getByLabelText<HTMLSelectElement>('City').value).toBe(
      'Baghdad',
    );

    await user.selectOptions(screen.getByLabelText('Governorate'), 'Basra');
    expect(screen.getByLabelText<HTMLSelectElement>('City').value).toBe('');
  });

  it('never selects CARD — the radio is disabled and labeled "Coming soon"', () => {
    render(<CheckoutPage />);

    const cardRadio = screen.getByRole('radio', { name: /Pay by card/ });
    expect(cardRadio).toBeDisabled();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Place order' }),
    ).toBeInTheDocument();
  });
});
