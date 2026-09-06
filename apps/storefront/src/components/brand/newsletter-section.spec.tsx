import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewsletterSection } from './newsletter-section';

describe('NewsletterSection', () => {
  it('does not show the confirmation until a valid email is subscribed', () => {
    render(<NewsletterSection />);
    expect(screen.queryByText('Thank you! See you soon.')).not.toBeInTheDocument();
  });

  it('shows a confirmation and hides the form after subscribing with a valid email', async () => {
    const user = userEvent.setup();
    render(<NewsletterSection />);

    await user.type(screen.getByLabelText('Email address'), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(await screen.findByText('Thank you! See you soon.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument();
  });

  it('does not subscribe when the email is invalid', async () => {
    const user = userEvent.setup();
    render(<NewsletterSection />);

    await user.type(screen.getByLabelText('Email address'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(screen.queryByText('Thank you! See you soon.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveValue('not-an-email');
  });

  it('does not navigate away when Enter is pressed inside the email field', async () => {
    const user = userEvent.setup();
    render(<NewsletterSection />);

    const input = screen.getByLabelText('Email address');
    await user.type(input, 'jane@example.com{Enter}');

    expect(screen.queryByText('Thank you! See you soon.')).not.toBeInTheDocument();
    expect(input).toHaveValue('jane@example.com');
  });
});
