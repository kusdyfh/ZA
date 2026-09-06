import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from './contact-form';

describe('ContactForm', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: '' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('shows validation errors when required fields are missing', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Message is required')).toBeInTheDocument();
    expect(window.location.href).toBe('');
  });

  it('opens a pre-filled mailto link with the visitor mail client on submit', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Message'), 'Do you ship to Erbil?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => expect(window.location.href).toContain('mailto:support@za-store.example'));
    expect(window.location.href).toContain('subject=Message%20from%20Jane%20Doe');
    expect(window.location.href).toContain('Do%20you%20ship%20to%20Erbil');
  });
});
