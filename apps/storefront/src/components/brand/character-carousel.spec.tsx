import { fireEvent, render, screen } from '@testing-library/react';
import '@/test-utils/pointer-event';
import { GraduationCap, Stethoscope } from 'lucide-react';
import { CharacterCarousel } from './character-carousel';

const characters = [
  {
    name: 'Medical Student',
    tagline: 'Lecture halls and late nights',
    icon: GraduationCap,
    href: '/shop?isNewArrival=true',
  },
  {
    name: 'Doctor',
    tagline: 'On the ward, ready for anything',
    icon: Stethoscope,
    href: '/shop?isBestSeller=true',
  },
];

function getScroller(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

describe('CharacterCarousel', () => {
  it('renders every character as a link into a real shop route', () => {
    render(<CharacterCarousel characters={characters} />);

    const studentLink = screen.getByRole('link', { name: /Medical Student/ });
    expect(studentLink).toHaveAttribute('href', '/shop?isNewArrival=true');
    const doctorLink = screen.getByRole('link', { name: /Doctor/ });
    expect(doctorLink).toHaveAttribute('href', '/shop?isBestSeller=true');
  });

  it('has no scroll buttons', () => {
    render(<CharacterCarousel characters={characters} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('scrolls with a mouse drag, and turns snapping off while it does', () => {
    const { container } = render(<CharacterCarousel characters={characters} />);
    const scroller = getScroller(container);
    scroller.scrollLeft = 100;

    fireEvent.pointerDown(scroller, {
      clientX: 300,
      clientY: 50,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(scroller, {
      clientX: 250,
      clientY: 50,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(scroller, {
      clientX: 200,
      clientY: 50,
      pointerType: 'mouse',
    });

    expect(scroller.scrollLeft).toBe(200);
    expect(scroller).toHaveClass('snap-none');

    fireEvent.pointerUp(scroller, {
      clientX: 200,
      clientY: 50,
      pointerType: 'mouse',
    });
    expect(scroller).toHaveClass('snap-mandatory');
  });

  it('leaves touch to the browser: a touch pointer does not drag-scroll', () => {
    const { container } = render(<CharacterCarousel characters={characters} />);
    const scroller = getScroller(container);
    scroller.scrollLeft = 100;

    fireEvent.pointerDown(scroller, {
      clientX: 300,
      clientY: 50,
      pointerType: 'touch',
    });
    fireEvent.pointerMove(scroller, {
      clientX: 200,
      clientY: 50,
      pointerType: 'touch',
    });

    expect(scroller.scrollLeft).toBe(100);
  });

  it('does not open a card after a drag that started on it', () => {
    render(<CharacterCarousel characters={characters} />);
    const link = screen.getByRole('link', { name: /Medical Student/ });
    const onClick = jest.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', onClick);

    fireEvent.pointerDown(link, {
      clientX: 300,
      clientY: 50,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(link, {
      clientX: 200,
      clientY: 50,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(link, {
      clientX: 200,
      clientY: 50,
      pointerType: 'mouse',
    });
    fireEvent.click(link);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('still opens a card on a plain click', () => {
    render(<CharacterCarousel characters={characters} />);
    const link = screen.getByRole('link', { name: /Doctor/ });
    const onClick = jest.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', onClick);

    fireEvent.pointerDown(link, {
      clientX: 300,
      clientY: 50,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(link, {
      clientX: 300,
      clientY: 50,
      pointerType: 'mouse',
    });
    fireEvent.click(link);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
