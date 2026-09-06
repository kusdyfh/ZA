import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentResultPage from './page';
import { useRouter, useSearchParams } from 'next/navigation';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const useRouterMock = useRouter as jest.Mock;
const useSearchParamsMock = useSearchParams as jest.Mock;

describe('PaymentResultPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    useRouterMock.mockReturnValue({ push: pushMock });
  });

  it('shows the cancelled branch and returns to checkout', async () => {
    useSearchParamsMock.mockReturnValue({ get: (key: string) => (key === 'status' ? 'cancelled' : null) });
    const user = userEvent.setup();
    render(<PaymentResultPage />);

    expect(screen.getByRole('heading', { name: 'Payment cancelled' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Return to checkout' }));
    expect(pushMock).toHaveBeenCalledWith('/checkout');
  });

  it('shows the success branch with both follow-up actions', async () => {
    useSearchParamsMock.mockReturnValue({ get: (key: string) => (key === 'status' ? 'success' : null) });
    const user = userEvent.setup();
    render(<PaymentResultPage />);

    expect(screen.getByRole('heading', { name: 'Payment received' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue shopping' }));
    expect(pushMock).toHaveBeenCalledWith('/shop');

    await user.click(screen.getByRole('button', { name: 'View my orders' }));
    expect(pushMock).toHaveBeenCalledWith('/account/orders');
  });
});
