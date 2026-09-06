import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GraduationCap, Stethoscope } from 'lucide-react';
import { CharacterCarousel } from './character-carousel';

const characters = [
  { name: 'Medical Student', tagline: 'Lecture halls and late nights', icon: GraduationCap, href: '/shop?isNewArrival=true' },
  { name: 'Doctor', tagline: 'On the ward, ready for anything', icon: Stethoscope, href: '/shop?isBestSeller=true' },
];

describe('CharacterCarousel', () => {
  beforeAll(() => {
    // jsdom doesn't implement scrollBy; the component calls it as a
    // best-effort convenience for pointer users, not something to assert on.
    Element.prototype.scrollBy = jest.fn();
  });

  it('renders every character as a link into a real shop route', () => {
    render(<CharacterCarousel characters={characters} />);

    const studentLink = screen.getByRole('link', { name: /Medical Student/ });
    expect(studentLink).toHaveAttribute('href', '/shop?isNewArrival=true');
    const doctorLink = screen.getByRole('link', { name: /Doctor/ });
    expect(doctorLink).toHaveAttribute('href', '/shop?isBestSeller=true');
  });

  it('scroll arrows do not throw when clicked', async () => {
    const user = userEvent.setup();
    render(<CharacterCarousel characters={characters} />);

    await user.click(screen.getByRole('button', { name: 'Scroll characters right' }));
    await user.click(screen.getByRole('button', { name: 'Scroll characters left' }));
  });
});
