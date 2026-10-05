/**
 * jsdom has no `PointerEvent`; this stand-in (a `MouseEvent` carrying
 * `pointerId`/`pointerType`) lets specs drive swipe and drag gestures with
 * `fireEvent.pointerDown/Move/Up`. Import it for its side effect.
 */
if (typeof window !== 'undefined' && !('PointerEvent' in window)) {
  class TestPointerEvent extends MouseEvent {
    pointerId: number;
    pointerType: string;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  (
    window as unknown as { PointerEvent: typeof TestPointerEvent }
  ).PointerEvent = TestPointerEvent;
}

export {};
