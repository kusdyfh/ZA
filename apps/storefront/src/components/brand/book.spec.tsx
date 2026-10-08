import { fireEvent, render, screen, within } from '@testing-library/react';
import '@/test-utils/pointer-event';
import userEvent from '@testing-library/user-event';
import { Book } from './book';

const frontAAction = jest.fn();

function renderBook() {
  return render(
    <Book
      label="Test book"
      cover={<span>COVER</span>}
      insideCover={<span>INSIDE</span>}
      sheets={[
        {
          front: (
            <div>
              <span>A-front</span>
              <button type="button" onClick={frontAAction}>
                A-action
              </button>
            </div>
          ),
          back: <span>A-back</span>,
        },
        { front: <span>B-front</span>, back: <span>B-back</span> },
      ]}
      endPage={({ restart }) => (
        <button type="button" onClick={restart}>
          READ AGAIN
        </button>
      )}
    />,
  );
}

const HINT = 'Tap or swipe the cover to open';
const group = () => screen.getByRole('group', { name: 'Test book' });
const spread = () => within(group()).queryByText(/^\d \/ \d$/)?.textContent;
/** The element the pointer gestures land on (the book's sized stage). */
const stage = () => group().querySelector<HTMLElement>('.touch-pan-y')!;

/** Whether a face is hidden from the tab order and assistive technology. */
function isHidden(text: string): boolean {
  return (
    screen.getByText(text, { selector: 'span, button' }).closest('[inert]') !==
    null
  );
}

function openBook() {
  fireEvent.click(screen.getByRole('button', { name: /open the book/i }));
}

/** A tap at x on the open spread (the stage is mocked 0 to 520 wide, spine at 260). */
function tap(x: number, target: Element = stage()) {
  fireEvent.pointerDown(target, {
    clientX: x,
    clientY: 100,
    pointerType: 'touch',
  });
  fireEvent.pointerUp(target, {
    clientX: x,
    clientY: 100,
    pointerType: 'touch',
  });
}

function drag(fromX: number, toX: number, target: Element = stage()) {
  fireEvent.pointerDown(target, {
    clientX: fromX,
    clientY: 100,
    pointerType: 'touch',
  });
  fireEvent.pointerMove(target, {
    clientX: (fromX + toX) / 2,
    clientY: 100,
    pointerType: 'touch',
  });
  fireEvent.pointerMove(target, {
    clientX: toX,
    clientY: 100,
    pointerType: 'touch',
  });
  fireEvent.pointerUp(target, {
    clientX: toX,
    clientY: 100,
    pointerType: 'touch',
  });
}

describe('Book', () => {
  beforeEach(() => {
    frontAAction.mockClear();
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 520,
      bottom: 380,
      width: 520,
      height: 380,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('closed', () => {
    it('shows the cover and a hint, and has no page buttons', () => {
      renderBook();

      expect(
        screen.getByRole('button', { name: /open the book/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(HINT)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Next page' }),
      ).not.toBeInTheDocument();
      expect(spread()).toBeUndefined();
    });

    it('exposes only the cover', () => {
      renderBook();

      expect(isHidden('COVER')).toBe(false);
      expect(isHidden('INSIDE')).toBe(true);
      expect(isHidden('A-front')).toBe(true);
      expect(isHidden('B-front')).toBe(true);
      expect(isHidden('READ AGAIN')).toBe(true);
    });

    it('nudges the cover so it looks openable', () => {
      const { container } = renderBook();
      expect(
        container.querySelector('.animate-book-lift-right'),
      ).not.toBeNull();
    });

    it('opens with a swipe on the cover', () => {
      renderBook();
      drag(300, 20, screen.getByRole('button', { name: /open the book/i }));
      expect(spread()).toBe('1 / 3');
    });
  });

  describe('open', () => {
    it('shows the inside cover and first page, with the hints', () => {
      const { container } = renderBook();
      openBook();

      expect(spread()).toBe('1 / 3');
      expect(isHidden('INSIDE')).toBe(false);
      expect(isHidden('A-front')).toBe(false);
      expect(isHidden('B-front')).toBe(true);
      expect(isHidden('COVER')).toBe(true);
      // A lifted page edge on each side, each throwing a shadow.
      expect(
        container.querySelector('.animate-book-lift-right'),
      ).not.toBeNull();
      expect(container.querySelector('.animate-book-lift-left')).not.toBeNull();
      expect(
        container.querySelector('[data-book-lift-shadow="right"]'),
      ).not.toBeNull();
      expect(
        container.querySelector('[data-book-lift-shadow="left"]'),
      ).not.toBeNull();
    });

    it('has no visible page buttons', () => {
      renderBook();
      openBook();

      // They exist for the keyboard only, in a container that is screen-reader-only until focused.
      const next = screen.getByRole('button', { name: 'Next page' });
      expect(next.parentElement).toHaveClass('sr-only');
    });
  });

  describe('tapping a page', () => {
    it('turns forward on the right page and back on the left page', () => {
      renderBook();
      openBook();

      tap(400);
      expect(spread()).toBe('2 / 3');
      expect(isHidden('A-back')).toBe(false);
      expect(isHidden('B-front')).toBe(false);

      tap(400);
      expect(spread()).toBe('3 / 3');
      expect(isHidden('READ AGAIN')).toBe(false);

      tap(100);
      expect(spread()).toBe('2 / 3');
    });

    it('closes the book from the left page of the first spread', () => {
      renderBook();
      openBook();

      tap(100);

      expect(screen.getByText(HINT)).toBeInTheDocument();
    });

    it('does nothing on the right page of the last spread', () => {
      renderBook();
      openBook();
      tap(400);
      tap(400);

      tap(400);

      expect(spread()).toBe('3 / 3');
    });

    it('does not turn when the tap lands on a button inside the page', () => {
      renderBook();
      openBook();

      tap(400, screen.getByRole('button', { name: 'A-action' }));

      expect(spread()).toBe('1 / 3');
    });

    it('stops the hints once the visitor has turned a page', () => {
      const { container } = renderBook();
      openBook();
      expect(
        container.querySelector('.animate-book-lift-right'),
      ).not.toBeNull();

      tap(400);

      expect(container.querySelector('[class*="animate-book-"]')).toBeNull();
    });
  });

  describe('dragging a page', () => {
    it('turns forward when the right page is dragged left far enough', () => {
      renderBook();
      openBook();

      drag(450, 150);

      expect(spread()).toBe('2 / 3');
    });

    it('turns back when the left page is dragged right far enough', () => {
      renderBook();
      openBook();
      tap(400);

      drag(100, 400);

      expect(spread()).toBe('1 / 3');
    });

    it('springs back when let go before it has turned far enough', () => {
      renderBook();
      openBook();

      drag(450, 420);

      expect(spread()).toBe('1 / 3');
    });

    it('holds the page in hand while the pointer is down, then lets go', () => {
      const { container } = renderBook();
      openBook();
      expect(container.querySelector('[data-book-lift-shadow]')).not.toBeNull();

      fireEvent.pointerDown(stage(), {
        clientX: 450,
        clientY: 100,
        pointerType: 'touch',
      });
      fireEvent.pointerMove(stage(), {
        clientX: 400,
        clientY: 100,
        pointerType: 'touch',
      });
      fireEvent.pointerMove(stage(), {
        clientX: 330,
        clientY: 100,
        pointerType: 'touch',
      });

      // The page is being carried: a grabbing cursor, and the lift shadows step aside.
      expect(stage()).toHaveClass('cursor-grabbing');
      expect(container.querySelector('[data-book-lift-shadow]')).toBeNull();

      fireEvent.pointerUp(stage(), {
        clientX: 330,
        clientY: 100,
        pointerType: 'touch',
      });
      expect(stage()).not.toHaveClass('cursor-grabbing');
      expect(spread()).toBe('2 / 3');
    });

    it('ignores a drag in a direction with no page to turn', () => {
      renderBook();
      openBook();
      tap(400);
      tap(400);

      // Last spread: nothing further right to turn.
      drag(450, 150);

      expect(spread()).toBe('3 / 3');
    });

    it('does not press a button under a drag that began on it', () => {
      renderBook();
      openBook();
      const action = screen.getByRole('button', { name: 'A-action' });

      drag(450, 150, action);
      fireEvent.click(action);

      expect(frontAAction).not.toHaveBeenCalled();
      expect(spread()).toBe('2 / 3');
    });

    it('still presses a button on a plain tap', () => {
      renderBook();
      openBook();
      const action = screen.getByRole('button', { name: 'A-action' });

      tap(450, action);
      fireEvent.click(action);

      expect(frontAAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('without a pointer', () => {
    it('turns pages with the arrow keys and closes with Escape', () => {
      renderBook();
      openBook();

      fireEvent.keyDown(group(), { key: 'ArrowRight' });
      expect(spread()).toBe('2 / 3');
      fireEvent.keyDown(group(), { key: 'ArrowLeft' });
      expect(spread()).toBe('1 / 3');
      fireEvent.keyDown(group(), { key: 'Escape' });
      expect(screen.getByText(HINT)).toBeInTheDocument();
    });

    it('ignores the arrow keys while closed', () => {
      renderBook();
      fireEvent.keyDown(group(), { key: 'ArrowRight' });
      expect(screen.getByText(HINT)).toBeInTheDocument();
    });

    it('offers previous and next buttons to keyboard users', async () => {
      const user = userEvent.setup();
      renderBook();
      openBook();

      await user.click(screen.getByRole('button', { name: 'Next page' }));
      expect(spread()).toBe('2 / 3');
      await user.click(screen.getByRole('button', { name: 'Previous page' }));
      expect(spread()).toBe('1 / 3');
    });

    it('is focusable as a group', () => {
      renderBook();
      expect(group()).toHaveAttribute('tabindex', '0');
    });
  });

  it('lets the end page restart the book', () => {
    renderBook();
    openBook();
    tap(400);
    tap(400);

    fireEvent.click(screen.getByRole('button', { name: 'READ AGAIN' }));

    expect(screen.getByText(HINT)).toBeInTheDocument();
  });

  describe('prefers-reduced-motion', () => {
    beforeEach(() => {
      window.matchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));
    });

    it('turns instantly, with no transitions and no nudging', () => {
      const { container } = renderBook();
      openBook();
      tap(400);

      expect(spread()).toBe('2 / 3');
      expect(container.querySelector('[class*="animate-book-"]')).toBeNull();
      const turning = [
        ...container.querySelectorAll<HTMLElement>('[style*="transform"]'),
      ];
      expect(
        turning.some((el) => el.style.transition.includes('transform')),
      ).toBe(false);
    });
  });

  it('animates its turns by default', () => {
    const { container } = renderBook();
    const turning = [
      ...container.querySelectorAll<HTMLElement>('[style*="transform"]'),
    ];
    expect(
      turning.some((el) => el.style.transition.includes('transform')),
    ).toBe(true);
  });
});
