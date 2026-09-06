import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './login-form';
import { useCustomerAuth } from '@/lib/auth/auth-context';
import { ApiError } from '@/lib/api/client';

const pushMock = jest.fn();
const getMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({ get: getMock }),
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useCustomerAuth: jest.fn(),
}));

const useCustomerAuthMock = useCustomerAuth as jest.Mock;

describe('LoginForm', () => {
  beforeEach(() => {
    pushMock.mockClear();
    getMock.mockReset().mockReturnValue(null);
  });

  it('shows validation errors and does not log in when submitted empty', async () => {
    const login = jest.fn();
    useCustomerAuthMock.mockReturnValue({ login });
    const user = userEvent.setup();

    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('logs in and redirects to the account page by default', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    useCustomerAuthMock.mockReturnValue({ login });
    const user = userEvent.setup();

    render(<LoginForm />);
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.tab();
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    await waitFor(() => expect(login).toHaveBeenCalledWith('jane@example.com', 'correct-password'));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/account'));
  });

  it('redirects to the requested path when present in the query string', async () => {
    getMock.mockReturnValue('/checkout');
    const login = jest.fn().mockResolvedValue(undefined);
    useCustomerAuthMock.mockReturnValue({ login });
    const user = userEvent.setup();

    render(<LoginForm />);
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.tab();
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/checkout'));
  });

  it('shows the API error message when login fails', async () => {
    const login = jest.fn().mockRejectedValue(new ApiError('INVALID_CREDENTIALS', 'Invalid email or password.', 401));
    useCustomerAuthMock.mockReturnValue({ login });
    const user = userEvent.setup();

    render(<LoginForm />);
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.tab();
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
