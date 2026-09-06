const THEME_INIT_JS = `
(function () {
  try {
    var stored = window.localStorage.getItem('za-theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (_) {}
})();
`;

/**
 * Runs before hydration to set the persisted theme on <html>, avoiding
 * a flash of the wrong theme — see ThemeToggle and
 * docs/09-DESIGN-SYSTEM.md §10. Shared by both apps/storefront and
 * apps/admin's root layouts so the two copies can never drift.
 *
 * The <html> element in each root layout must also carry
 * `suppressHydrationWarning`, since this script intentionally sets an
 * attribute the server-rendered markup doesn't have — that's expected,
 * not a bug, and is the same pattern libraries like next-themes use.
 */
export function ThemeInitScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_JS }} />;
}
