/**
 * The menu glyph: three soft, round-capped strokes with a shorter middle
 * line, drawn lighter than a stock hamburger so it sits with the script and
 * serif type instead of reading as app chrome.
 */
export function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h11" />
      <path d="M4 17h16" />
    </svg>
  );
}
