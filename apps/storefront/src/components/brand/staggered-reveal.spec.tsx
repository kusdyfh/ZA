import { act, render, screen } from '@testing-library/react';
import {
  StaggeredReveal,
  scrollProgress,
  stripProgress,
} from './staggered-reveal';

function mockMatchMedia(reduced: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

function mockBox(top: number, height = 200) {
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top,
    height,
    left: 0,
    right: 500,
    bottom: top + height,
    width: 500,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
}

function renderReveal() {
  return render(
    <StaggeredReveal
      src="/brand/tagline.png"
      alt="Arabic tagline"
      width={1000}
      height={400}
      crop={{ x: 100, y: 50, width: 800, height: 300 }}
    />,
  );
}

const strips = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-reveal-strip]'));

/** Runs the rAF the scroll handler schedules. */
function flushFrame() {
  act(() => {
    jest.runOnlyPendingTimers();
  });
}

describe('scrollProgress', () => {
  it('is 0 while the element is below the viewport and 1 once it is centered', () => {
    expect(scrollProgress({ top: 800, height: 200 }, 800)).toBe(0);
    expect(scrollProgress({ top: 1200, height: 200 }, 800)).toBe(0);
    expect(scrollProgress({ top: 300, height: 200 }, 800)).toBe(1);
    expect(scrollProgress({ top: 0, height: 200 }, 800)).toBe(1);
  });

  it('is in between while it scrolls up', () => {
    const progress = scrollProgress({ top: 550, height: 200 }, 800);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(1);
  });
});

describe('stripProgress', () => {
  it('has every strip hidden at the start and in place at the end', () => {
    for (let index = 0; index < 9; index += 1) {
      expect(stripProgress(0, index, 9)).toBe(0);
      expect(stripProgress(1, index, 9)).toBe(1);
    }
  });

  it('brings the middle strip in before the outer ones', () => {
    const middle = stripProgress(0.4, 4, 9);
    const nearer = stripProgress(0.4, 2, 9);
    const edge = stripProgress(0.4, 0, 9);
    expect(middle).toBeGreaterThan(nearer);
    expect(nearer).toBeGreaterThan(edge);
  });

  it('treats both sides alike', () => {
    expect(stripProgress(0.5, 1, 9)).toBeCloseTo(stripProgress(0.5, 7, 9));
  });
});

describe('StaggeredReveal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockMatchMedia(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('names the artwork once, for screen readers', () => {
    const { container } = renderReveal();

    expect(
      screen.getByRole('img', { name: 'Arabic tagline' }),
    ).toBeInTheDocument();
    // The strip copies are decorative.
    const layer = container.querySelector('[aria-hidden="true"]');
    expect(layer).not.toBeNull();
    expect(strips(container)).toHaveLength(9);
  });

  it('starts hidden strips when the artwork is below the viewport', () => {
    mockBox(2000);
    const { container } = renderReveal();

    expect(strips(container).every((el) => el.style.opacity === '0')).toBe(
      true,
    );
  });

  it('reveals the middle strips first as the page scrolls', () => {
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });
    mockBox(800);
    const { container } = renderReveal();

    mockBox(560);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    flushFrame();

    const opacity = strips(container).map((el) => Number(el.style.opacity));
    expect(opacity[4]!).toBeGreaterThan(opacity[0]!);
    expect(opacity[4]!).toBeGreaterThan(0);
  });

  it('runs back as the page scrolls up again', () => {
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });
    mockBox(300);
    const { container } = renderReveal();
    expect(strips(container).every((el) => el.style.opacity === '1')).toBe(
      true,
    );

    mockBox(900);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    flushFrame();

    expect(strips(container).every((el) => el.style.opacity === '0')).toBe(
      true,
    );
  });

  it('shows the whole artwork, not the strips, once settled', () => {
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });
    mockBox(300);
    const { container } = renderReveal();

    const whole = container.firstElementChild!.firstElementChild as HTMLElement;
    expect(whole.style.opacity).toBe('1');
  });

  it('is just the artwork, with no strips, under reduced motion', () => {
    mockMatchMedia(true);
    const { container } = renderReveal();

    expect(strips(container)).toHaveLength(0);
    expect(
      screen.getByRole('img', { name: 'Arabic tagline' }),
    ).toBeInTheDocument();
  });
});
