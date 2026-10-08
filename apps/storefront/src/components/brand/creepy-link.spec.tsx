import { act, fireEvent, render, screen } from '@testing-library/react';
import '@/test-utils/pointer-event';
import { CreepyLink } from './creepy-link';

function mockReducedMotion(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

function renderLink() {
  render(<CreepyLink href="/shop">Shop now</CreepyLink>);
  return screen.getByRole('link', { name: 'Shop now' });
}

function pupils(link: HTMLElement): string[] {
  return [...link.querySelectorAll<HTMLElement>('[data-pupil]')].map(
    (pupil) => pupil.style.transform,
  );
}

const CENTERED = 'translate(calc(-50% + 0%), calc(-50% + 0%))';

describe('CreepyLink', () => {
  beforeEach(() => mockReducedMotion(false));

  it('is a real link to its href, named once by its label', () => {
    const link = renderLink();
    expect(link).toHaveAttribute('href', '/shop');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('opens on mouse hover, tracks the pointer with the pupils and closes on leave', () => {
    const link = renderLink();
    expect(link).toHaveAttribute('data-open', 'false');
    expect(pupils(link)).toEqual([CENTERED, CENTERED]);

    fireEvent.pointerEnter(link, { pointerType: 'mouse' });
    expect(link).toHaveAttribute('data-open', 'true');

    fireEvent.pointerMove(link, {
      pointerType: 'mouse',
      clientX: 400,
      clientY: 300,
    });
    expect(pupils(link)[0]).not.toBe(CENTERED);

    fireEvent.pointerLeave(link, { pointerType: 'mouse' });
    expect(link).toHaveAttribute('data-open', 'false');
    expect(pupils(link)).toEqual([CENTERED, CENTERED]);
  });

  it('ignores touch: no hover opening and no pupil tracking', () => {
    const link = renderLink();

    fireEvent.pointerEnter(link, { pointerType: 'touch' });
    fireEvent.pointerMove(link, {
      pointerType: 'touch',
      clientX: 400,
      clientY: 300,
    });

    expect(link).toHaveAttribute('data-open', 'false');
    expect(pupils(link)).toEqual([CENTERED, CENTERED]);
  });

  it('opens on keyboard focus with the pupils centered, and closes on blur', () => {
    const link = renderLink();

    act(() => link.focus());
    expect(link).toHaveAttribute('data-open', 'true');
    expect(pupils(link)).toEqual([CENTERED, CENTERED]);

    act(() => link.blur());
    expect(link).toHaveAttribute('data-open', 'false');
  });

  it('stays still for visitors who prefer reduced motion', () => {
    mockReducedMotion(true);
    const link = renderLink();

    fireEvent.pointerEnter(link, { pointerType: 'mouse' });
    fireEvent.pointerMove(link, {
      pointerType: 'mouse',
      clientX: 400,
      clientY: 300,
    });

    expect(link).toHaveAttribute('data-open', 'false');
    expect(pupils(link)).toEqual([CENTERED, CENTERED]);
    // The blink and the tilt are also switched off in CSS.
    expect(link.querySelector('[data-eye]')?.className).toContain(
      'motion-reduce:animate-none',
    );
  });

  it('hides the eyes and the sizing copy from assistive technology', () => {
    const link = renderLink();
    const hidden = link.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBe(2);
  });
});
