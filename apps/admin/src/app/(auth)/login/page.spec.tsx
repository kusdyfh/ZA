import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';
import { useAuth } from '@/lib/auth/auth-context';
import { ApiError } from '@/lib/api/client';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

const useAuthMock = useAuth as jest.Mock;

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('shows validation errors and does not submit when the form is invalid', async () => {
    const login = jest.fn();
    useAuthMock.mockReturnValue({ login });
    const user = userEvent.setup();

    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('logs in and redirects to the dashboard on success', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    useAuthMock.mockReturnValue({ login });
    const user = userEvent.setup();

    render(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'manager@za-store.test');
    await user.type(screen.getByLabelText('Password'), 'correct-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('manager@za-store.test', 'correct-password'));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));
  });

  it('shows the API error message when login fails', async () => {
    const login = jest.fn().mockRejectedValue(new ApiError('INVALID_CREDENTIALS', 'Invalid email or password.', 401));
    useAuthMock.mockReturnValue({ login });
    const user = userEvent.setup();

    render(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'manager@za-store.test');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
