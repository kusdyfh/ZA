import { act, fireEvent, render, screen } from '@testing-library/react';
import '@/test-utils/pointer-event';
import { RotatingArtwork } from './rotating-artwork';

function mockReducedMotion(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

function activeScene(container: HTMLElement): number {
  const dots = [...container.querySelectorAll('[data-active]')];
  return dots.findIndex((dot) => dot.getAttribute('data-active') === 'true');
}

function swipe(target: HTMLElement, fromX: number, toX: number) {
  fireEvent.pointerDown(target, { clientX: fromX, clientY: 100 });
  fireEvent.pointerMove(target, { clientX: (fromX + toX) / 2, clientY: 100 });
  fireEvent.pointerMove(target, { clientX: toX, clientY: 100 });
  fireEvent.pointerUp(target, { clientX: toX, clientY: 100 });
}

describe('RotatingArtwork', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReducedMotion(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('has no buttons', () => {
    render(<RotatingArtwork />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('swipes to the next scene on a left drag and the previous on a right drag', () => {
    const { container } = render(<RotatingArtwork />);
    const panel = screen.getByRole('group', { name: 'Artwork scenes' });

    swipe(panel, 300, 150);
    expect(activeScene(container)).toBe(1);

    swipe(panel, 150, 300);
    expect(activeScene(container)).toBe(0);

    swipe(panel, 150, 300);
    expect(activeScene(container)).toBe(3);
  });

  it('changes scene with the arrow keys', () => {
    const { container } = render(<RotatingArtwork />);
    const panel = screen.getByRole('group', { name: 'Artwork scenes' });

    fireEvent.keyDown(panel, { key: 'ArrowRight' });
    expect(activeScene(container)).toBe(1);
    fireEvent.keyDown(panel, { key: 'ArrowLeft' });
    expect(activeScene(container)).toBe(0);
  });

  it('keeps auto-rotating, and restarts the countdown after a swipe', () => {
    const { container } = render(<RotatingArtwork />);
    const panel = screen.getByRole('group', { name: 'Artwork scenes' });

    act(() => {
      jest.advanceTimersByTime(4500);
    });
    expect(activeScene(container)).toBe(1);

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    swipe(panel, 300, 150);
    expect(activeScene(container)).toBe(2);

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(activeScene(container)).toBe(2);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(activeScene(container)).toBe(3);
  });

  it('does not auto-rotate for visitors who prefer reduced motion', () => {
    mockReducedMotion(true);
    const { container } = render(<RotatingArtwork />);

    act(() => {
      jest.advanceTimersByTime(20000);
    });
    expect(activeScene(container)).toBe(0);
  });
});
