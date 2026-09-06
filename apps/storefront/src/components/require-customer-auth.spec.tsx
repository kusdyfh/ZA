import { render, screen } from '@testing-library/react';
import { RequireCustomerAuth } from './require-customer-auth';
import { useCustomerAuth } from '@/lib/auth/auth-context';

const replaceMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => '/account/orders',
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useCustomerAuth: jest.fn(),
}));

const useCustomerAuthMock = useCustomerAuth as jest.Mock;

describe('RequireCustomerAuth', () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  it('shows a spinner and redirects to login while signed out', () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: false, isInitializing: false });
    render(
      <RequireCustomerAuth>
        <p>Protected content</p>
      </RequireCustomerAuth>,
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(replaceMock).toHaveBeenCalledWith('/login?redirect=%2Faccount%2Forders');
  });

  it('shows a spinner without redirecting while auth is still initializing', () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: false, isInitializing: true });
    render(
      <RequireCustomerAuth>
        <p>Protected content</p>
      </RequireCustomerAuth>,
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('renders children once authenticated', () => {
    useCustomerAuthMock.mockReturnValue({ isAuthenticated: true, isInitializing: false });
    render(
      <RequireCustomerAuth>
        <p>Protected content</p>
      </RequireCustomerAuth>,
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
