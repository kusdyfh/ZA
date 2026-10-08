import { act, render } from '@testing-library/react';
import { FluidMorphBg } from './fluid-morph-bg';
import { FLUID_MORPH_PATHS } from './fluid-morph-paths';

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

let observers: {
  callback: ObserverCallback;
  observe: jest.Mock;
  disconnect: jest.Mock;
}[] = [];

function mockIntersectionObserver() {
  observers = [];
  window.IntersectionObserver = jest
    .fn()
    .mockImplementation((callback: ObserverCallback) => {
      const observer = { callback, observe: jest.fn(), disconnect: jest.fn() };
      observers.push(observer);
      return observer;
    });
}

function mockReducedMotion(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

/** The command letters of a path, e.g. "MCCCZ": what must match for two outlines to morph. */
function commandLetters(d: string): string {
  return d.replace(/[^A-Za-z]/g, '');
}

describe('FLUID_MORPH_PATHS', () => {
  it('has seven shapes', () => {
    expect(FLUID_MORPH_PATHS).toHaveLength(7);
  });

  it.each(FLUID_MORPH_PATHS.map((pair, index) => [index, pair] as const))(
    'shape %i has two outlines with the same command structure, so it can morph',
    (_index, [from, to]) => {
      expect(commandLetters(from)).toBe(commandLetters(to));
      expect(from).not.toBe(to);
    },
  );
});

describe('FluidMorphBg', () => {
  const originalIntersectionObserver = window.IntersectionObserver;

  beforeEach(() => {
    mockIntersectionObserver();
    mockReducedMotion(false);
  });

  afterAll(() => {
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('is decorative: hidden from assistive technology and never takes the pointer', () => {
    const { container } = render(<FluidMorphBg />);
    const root = container.firstElementChild as HTMLElement;

    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveClass('pointer-events-none');
  });

  it('draws the seven shapes in the ZA colours over the lavender surface', () => {
    const { container } = render(<FluidMorphBg />);
    const root = container.firstElementChild as HTMLElement;
    const paths = container.querySelectorAll('path');

    expect(paths).toHaveLength(7);
    expect(root.style.backgroundColor).toBe('rgb(231, 219, 248)');
    expect(paths[0]).toHaveAttribute('fill', '#F9D6E1');
  });

  it('morphs each shape between its two outlines and back, slowly and with easing', () => {
    const { container } = render(<FluidMorphBg duration={9} />);
    const animations = container.querySelectorAll('animate');

    expect(animations).toHaveLength(7);
    const [from, to] = FLUID_MORPH_PATHS[0]!;
    const first = animations[0]!;
    expect(first).toHaveAttribute('attributeName', 'd');
    expect(first.getAttribute('values')).toBe(`${from};${to};${from}`);
    expect(first).toHaveAttribute('dur', '18s');
    expect(first).toHaveAttribute('repeatCount', 'indefinite');
    expect(first).toHaveAttribute('calcMode', 'spline');
  });

  it('is a still picture for visitors who prefer reduced motion', () => {
    mockReducedMotion(true);
    const { container } = render(<FluidMorphBg />);

    expect(container.querySelectorAll('animate')).toHaveLength(0);
    expect(container.firstElementChild).toHaveAttribute('data-motion', 'still');
  });

  it('accepts its own colours and opacities', () => {
    const { container } = render(
      <FluidMorphBg colors={['#111111']} opacities={[0.5]} />,
    );
    const first = container.querySelector('path')!;

    expect(first).toHaveAttribute('fill', '#111111');
    expect(first).toHaveAttribute('fill-opacity', '0.5');
  });

  it('pauses the animation while it is off screen and resumes when it is visible', () => {
    const { container } = render(<FluidMorphBg />);
    const svg = container.querySelector('svg')!;
    const pause = jest.fn();
    const unpause = jest.fn();
    // jsdom has no SVG animation clock.
    Object.assign(svg, { pauseAnimations: pause, unpauseAnimations: unpause });

    act(() => observers[0]!.callback([{ isIntersecting: false }]));
    expect(pause).toHaveBeenCalledTimes(1);

    act(() => observers[0]!.callback([{ isIntersecting: true }]));
    expect(unpause).toHaveBeenCalledTimes(1);
  });

  it('stops observing when it unmounts', () => {
    const { unmount } = render(<FluidMorphBg />);
    unmount();

    expect(observers.length).toBeGreaterThan(0);
    expect(
      observers.every((observer) => observer.disconnect.mock.calls.length > 0),
    ).toBe(true);
  });

  it('does not break where IntersectionObserver is unavailable', () => {
    // @ts-expect-error — simulating an engine without IntersectionObserver
    delete window.IntersectionObserver;
    const { container } = render(<FluidMorphBg />);

    expect(container.querySelectorAll('path')).toHaveLength(7);
  });
});
