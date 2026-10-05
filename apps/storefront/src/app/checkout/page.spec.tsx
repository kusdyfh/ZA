import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutPage from './page';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import { useCartToken } from '@/lib/cart/use-cart-token';
import { useCartQuery } from '@/features/cart/api';
import { useAddressesQuery } from '@/features/addresses/api';
import {
  useInitiateCardCheckoutMutation,
  usePlaceOrderMutation,
} from '@/features/orders/api';
import { useAutoShippingMethod } from '@/features/shipping/api';
import { useToast } from '@za/ui';
import type * as ZaUi from '@za/ui';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useCustomerAuth: jest.fn(),
}));

jest.mock('@/lib/cart/use-cart-token', () => ({
  useCartToken: jest.fn(),
}));

jest.mock('@/features/cart/api', () => ({
  useCartQuery: jest.fn(),
}));

jest.mock('@/features/addresses/api', () => ({
  useAddressesQuery: jest.fn(),
}));

jest.mock('@/features/orders/api', () => ({
  usePlaceOrderMutation: jest.fn(),
  useInitiateCardCheckoutMutation: jest.fn(),
}));

jest.mock('@/features/shipping/api', () => ({
  useAutoShippingMethod: jest.fn(),
}));

jest.mock('@za/ui', () => ({
  ...jest.requireActual<typeof ZaUi>('@za/ui'),
  useToast: jest.fn(),
}));

const useRouterMock = useRouter as jest.Mock;
const useCustomerAuthMock = useCustomerAuth as jest.Mock;
const useCartTokenMock = useCartToken as jest.Mock;
const useCartQueryMock = useCartQuery as jest.Mock;
const useAddressesQueryMock = useAddressesQuery as jest.Mock;
const usePlaceOrderMutationMock = usePlaceOrderMutation as jest.Mock;
const useInitiateCardCheckoutMutationMock =
  useInitiateCardCheckoutMutation as jest.Mock;
const useAutoShippingMethodMock = useAutoShippingMethod as jest.Mock;
const useToastMock = useToast as jest.Mock;

const standardDelivery = {
  id: 'method-1',
  name: 'Standard Delivery',
  minDays: 2,
  maxDays: 4,
};
const deliverableChoice = {
  method: standardDelivery,
  quote: { fee: 5000, estimatedDays: { min: 2, max: 4 } },
  isChecking: false,
  isUnavailable: false,
};

const cart = {
  guestToken: 'guest-token-123',
  currencyCode: 'IQD',
  items: [
    {
      variantId: 'variant-1',
      productName: 'Classic Scrub Top',
      sku: 'SKU-1',
      unitPrice: 10000,
      quantity: 1,
      lineTotal: 10000,
    },
  ],
  subtotal: 10000,
};

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  const fullNameInputs = screen.getAllByLabelText('Full name');
  await user.type(fullNameInputs[0]!, 'Jane Guest');
  await user.type(screen.getByLabelText('Email'), 'jane.guest@example.com');
  const phoneInputs = screen.getAllByLabelText('Phone');
  await user.type(phoneInputs[0]!, '07701234567');
  await user.type(fullNameInputs[1]!, 'Jane Guest');
  await user.type(phoneInputs[1]!, '07701234567');
  await user.type(
    screen.getByLabelText('Address line 1'),
    '123 Karrada Street',
  );
  await user.type(screen.getByLabelText('City'), 'Baghdad');
  await user.type(screen.getByLabelText('Governorate'), 'Baghdad');
}

describe('CheckoutPage', () => {
  const placeOrderMutateAsync = jest.fn();
  const initiateCardCheckoutMutateAsync = jest.fn<
    Promise<{ checkoutUrl: string | null; paymentSessionId: string }>,
    [
      {
        guestToken: string;
        customerEmail: string;
        shippingMethodId: string;
        successUrl: string;
        cancelUrl: string;
      },
    ]
  >();
  const showToast = jest.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    pushMock.mockClear();
    placeOrderMutateAsync.mockClear();
    initiateCardCheckoutMutateAsync.mockClear();
    showToast.mockClear();

    useRouterMock.mockReturnValue({ push: pushMock });
    useCustomerAuthMock.mockReturnValue({ customer: null });
    useCartTokenMock.mockReturnValue('guest-token-123');
    useCartQueryMock.mockReturnValue({ data: cart, isLoading: false });
    useAddressesQueryMock.mockReturnValue({ data: undefined });
    useAutoShippingMethodMock.mockReturnValue(deliverableChoice);
    usePlaceOrderMutationMock.mockReturnValue({
      mutateAsync: placeOrderMutateAsync,
      isPending: false,
    });
    useInitiateCardCheckoutMutationMock.mockReturnValue({
      mutateAsync: initiateCardCheckoutMutateAsync,
      isPending: false,
    });
    useToastMock.mockReturnValue({ showToast });

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, origin: originalLocation.origin, href: '' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('has no delivery method field, and quotes the governorate it is given', async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);

    expect(screen.queryByLabelText('Delivery method')).not.toBeInTheDocument();
    expect(screen.queryByText('Delivery method')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Governorate'), 'Baghdad');
    await waitFor(() =>
      expect(useAutoShippingMethodMock).toHaveBeenLastCalledWith(
        'Baghdad',
        10000,
      ),
    );
  });

  it('shows the quoted shipping fee in the order summary', () => {
    render(<CheckoutPage />);
    expect(screen.getByText('Shipping').parentElement).toHaveTextContent(
      '5,000',
    );
  });

  it('says so under Governorate when no method delivers there', () => {
    useAutoShippingMethodMock.mockReturnValue({
      method: null,
      quote: null,
      isChecking: false,
      isUnavailable: true,
    });
    render(<CheckoutPage />);

    expect(
      screen.getByText("We don't currently deliver to that governorate."),
    ).toBeInTheDocument();
  });

  it('does not place the order while no delivery method is confirmed', async () => {
    useAutoShippingMethodMock.mockReturnValue({
      method: null,
      quote: null,
      isChecking: false,
      isUnavailable: true,
    });
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Place order' }));

    expect(placeOrderMutateAsync).not.toHaveBeenCalled();
  });

  it('defaults to Cash on Delivery with a "Place order" submit button', () => {
    render(<CheckoutPage />);

    expect(screen.getByLabelText('Cash on Delivery')).toBeChecked();
    expect(
      screen.getByRole('button', { name: 'Place order' }),
    ).toBeInTheDocument();
  });

  it('switches to "Continue to payment" and shows the Stripe helper text once CARD is selected', async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await user.click(screen.getByLabelText('Pay by card (Stripe)'));

    expect(
      screen.getByRole('button', { name: 'Continue to payment' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/redirected to a secure Stripe Checkout page/),
    ).toBeInTheDocument();
  });

  it('submits with COD and navigates to the confirmation page', async () => {
    placeOrderMutateAsync.mockResolvedValue({ id: 'order-123' });
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Place order' }));

    await waitFor(() =>
      expect(placeOrderMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'COD',
          guestToken: 'guest-token-123',
          customerEmail: 'jane.guest@example.com',
          shippingMethodId: 'method-1',
        }),
      ),
    );
    expect(pushMock).toHaveBeenCalledWith('/checkout/confirmation/order-123');
  });

  it('submits with CARD, calls the card-session mutation, and redirects to the Stripe checkout URL', async () => {
    initiateCardCheckoutMutateAsync.mockResolvedValue({
      checkoutUrl: 'https://stripe.example.com/session/123',
      paymentSessionId: 'session-1',
    });
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await fillRequiredFields(user);
    await user.click(screen.getByLabelText('Pay by card (Stripe)'));
    await user.click(
      screen.getByRole('button', { name: 'Continue to payment' }),
    );

    await waitFor(() =>
      expect(initiateCardCheckoutMutateAsync).toHaveBeenCalledTimes(1),
    );
    const callArgs = initiateCardCheckoutMutateAsync.mock.calls[0]![0];
    expect(callArgs.guestToken).toBe('guest-token-123');
    expect(callArgs.customerEmail).toBe('jane.guest@example.com');
    expect(callArgs.shippingMethodId).toBe('method-1');
    expect(callArgs.successUrl).toContain(
      '/checkout/payment-result?status=success',
    );
    expect(callArgs.cancelUrl).toContain('/checkout?status=cancelled');

    expect(placeOrderMutateAsync).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(window.location.href).toBe(
        'https://stripe.example.com/session/123',
      ),
    );
  });
});
