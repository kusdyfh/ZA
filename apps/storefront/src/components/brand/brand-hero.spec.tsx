import { act, fireEvent, render, screen } from '@testing-library/react';
import { BrandHero } from './brand-hero';

// jsdom has no PointerEvent; a MouseEvent subclass carries clientX/clientY.
class TestPointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'mouse';
  }
}

function mockReducedMotion(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

function activeLook(container: HTMLElement): string {
  const dots = [...container.querySelectorAll('[data-active]')];
  return String(
    dots.findIndex((dot) => dot.getAttribute('data-active') === 'true'),
  );
}

function renderHero() {
  return render(
    <BrandHero
      title="Find your fit."
      subtitle="Scrubs"
      ctaLabel="Shop now"
      ctaHref="/shop"
    />,
  );
}

function swipe(target: HTMLElement, fromX: number, toX: number) {
  fireEvent.pointerDown(target, { clientX: fromX, clientY: 100 });
  fireEvent.pointerMove(target, { clientX: (fromX + toX) / 2, clientY: 100 });
  fireEvent.pointerMove(target, { clientX: toX, clientY: 100 });
  fireEvent.pointerUp(target, { clientX: toX, clientY: 100 });
}

describe('BrandHero looks', () => {
  beforeAll(() => {
    (
      window as unknown as { PointerEvent: typeof TestPointerEvent }
    ).PointerEvent = TestPointerEvent;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    mockReducedMotion(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('has no arrow buttons for changing the look', () => {
    renderHero();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('advances to the next look every 3 seconds and wraps around', () => {
    const { container } = renderHero();
    expect(activeLook(container)).toBe('0');

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(activeLook(container)).toBe('1');

    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(activeLook(container)).toBe('0');
  });

  it('does not auto-advance for visitors who prefer reduced motion', () => {
    mockReducedMotion(true);
    const { container } = renderHero();

    act(() => {
      jest.advanceTimersByTime(9000);
    });
    expect(activeLook(container)).toBe('0');
  });

  it('swipes to the next look on a left drag and the previous on a right drag', () => {
    const { container } = renderHero();
    const section = container.querySelector('section') as HTMLElement;

    swipe(section, 300, 150);
    expect(activeLook(container)).toBe('1');

    swipe(section, 150, 300);
    expect(activeLook(container)).toBe('0');
  });

  it('ignores a drag shorter than the commit distance', () => {
    const { container } = renderHero();
    const section = container.querySelector('section') as HTMLElement;

    swipe(section, 300, 275);
    expect(activeLook(container)).toBe('0');
  });

  it('restarts the 3 second countdown after a swipe', () => {
    const { container } = renderHero();
    const section = container.querySelector('section') as HTMLElement;

    act(() => {
      jest.advanceTimersByTime(2500);
    });
    swipe(section, 300, 150);
    expect(activeLook(container)).toBe('1');

    act(() => {
      jest.advanceTimersByTime(2500);
    });
    expect(activeLook(container)).toBe('1');
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(activeLook(container)).toBe('2');
  });

  it('does not follow a link after a drag that started on it', () => {
    renderHero();
    const link = screen.getByRole('link', { name: /Shop now/ });
    const onClick = jest.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', onClick);

    swipe(link, 300, 150);
    fireEvent.click(link);

    expect(onClick).not.toHaveBeenCalled();
  });
});
