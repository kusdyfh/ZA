# ZA Store — UI Design System

A token-level design system spec — shared by `apps/web` (full brand
expression) and `apps/admin` (same primitives, quieter/denser theme).
This document defines **tokens and component anatomy**, not implementation
— actual component code is built during the relevant roadmap phase, not
now. All tokens are CSS custom properties so both apps and both color
schemes (light/dark) read from the same variable names with different
values, and so a future client's re-theme is a token swap, not a rewrite.

## 1. Brand Direction

Soft, luxury, cute, minimal, modern. Warm pink as the identity color, but
used with restraint — generous white space, soft shadows, rounded
geometry, editorial photography doing the emotional work rather than busy
UI. Admin theme uses the same shapes/radii/type but a neutral palette, so
staff tooling feels calm, not playful.

## 2. Color

Base palette expressed as a scale (50 lightest → 900 darkest), per the
`dataviz`/design-token convention of a full ramp rather than single named
colors, so hover/active/surface states are derivable rather than invented
ad hoc.

| Token | Light value | Usage |
|---|---|---|
| `--za-pink-50` … `--za-pink-900` | `#FDF3F6` → `#7A1F3D` | Primary brand ramp — 500 (`#E8567F`-ish blush-rose) is the primary action color, 50/100 for soft surface tints (badges, hover backgrounds), 800/900 for text-on-pink or dark-mode accents |
| `--za-neutral-50` … `--za-neutral-900` | `#FAFAF9` → `#1C1917` | Warm-tinted (not pure) gray ramp for text/borders/surfaces — pure gray reads cold against the pink brand |
| `--za-success-500` | `#3D9A5C` | Confirmed/Delivered/in-stock states |
| `--za-warning-500` | `#D68B2A` | Low stock, pending, expiring coupon |
| `--za-danger-500` | `#C0425A` | Cancelled/Returned, destructive actions, out-of-stock |
| `--za-info-500` | `#4A7FB5` | Informational banners, neutral notifications |

**Semantic tokens** (what components actually consume — never raw palette
values directly):

```
--surface-page       --surface-raised      --surface-sunken
--surface-brand       (pink-tinted section backgrounds, e.g. gift box promo)
--text-primary       --text-secondary      --text-on-brand
--border-default     --border-focus
--action-primary     --action-primary-hover --action-primary-active
--action-destructive
```

Dark mode redefines every `--surface-*`/`--text-*`/`--border-*` token;
`--za-pink-*` itself does not change (brand identity stays the brand),
only *how* it's applied (e.g. `--action-primary` shifts from `pink-500` on
light to `pink-400` on dark for contrast against a dark surface).

## 3. Typography

- **Display/Headline**: a soft, slightly editorial serif (e.g. Fraunces or
  equivalent) — used for H1/H2 and hero moments only, reinforcing "premium"
  without becoming a full serif body (which would read dated, not modern).
- **Body/UI**: a clean geometric sans (e.g. Inter or General Sans) for
  everything else — body copy, forms, admin tables, navigation.

| Token | Size | Line height | Usage |
|---|---|---|---|
| `--text-xs` | 12px | 16px | Meta text, badges, table captions |
| `--text-sm` | 14px | 20px | Secondary body, form labels |
| `--text-base` | 16px | 24px | Default body |
| `--text-lg` | 18px | 28px | Emphasized body, card titles |
| `--text-xl` | 20px | 28px | Section subheads |
| `--text-2xl` | 24px | 32px | H3 |
| `--text-3xl` | 30px | 38px | H2 |
| `--text-4xl` | 36px | 44px | H1 (page) |
| `--text-5xl` | 48px | 56px | Hero headline (storefront only — admin never needs this scale) |

Weights: `400` body, `500` emphasis/labels, `600` headings/buttons — avoid
`700+` except a rare hero moment; the brand reads "soft," not bold.

## 4. Spacing

4px base unit, consistent across both apps:

```
--space-0: 0     --space-1: 4px   --space-2: 8px    --space-3: 12px
--space-4: 16px  --space-5: 20px  --space-6: 24px    --space-8: 32px
--space-10: 40px --space-12: 48px --space-16: 64px   --space-20: 80px
--space-24: 96px
```

Storefront leans on the larger end (`--space-16`/`--space-24`) between
homepage sections for the "breathing room" luxury feel; admin uses the
smaller end almost exclusively (`--space-2`–`--space-6`) for information
density.

## 5. Border Radius

Generous, soft rounding is a core brand signal — sharp corners read
clinical/cold, which is the opposite of the target feel.

```
--radius-sm: 8px     (inputs, small badges)
--radius-md: 12px     (buttons, cards)
--radius-lg: 16px      (modals, large cards, product images)
--radius-xl: 24px       (hero panels, gift-box promo blocks)
--radius-full: 9999px    (pills, avatar, icon buttons)
```

## 6. Shadows

Soft, warm-tinted (never pure black) — low opacity, larger blur than a
typical harsh UI shadow, reinforcing "soft luxury."

```
--shadow-sm:  0 1px 2px rgba(122, 31, 61, 0.06)
--shadow-md:  0 4px 12px rgba(122, 31, 61, 0.08)
--shadow-lg:  0 12px 32px rgba(122, 31, 61, 0.12)
--shadow-focus: 0 0 0 3px var(--za-pink-200)   /* focus ring, not a shadow per se, but token-adjacent */
```

Admin dashboard uses `--shadow-sm`/`--shadow-md` almost exclusively (dense
UI, subtle elevation); storefront uses `--shadow-lg` for hero cards and
hover-lift product cards.

## 7. Component Anatomy

### Buttons
- Variants: `primary` (solid pink), `secondary` (pink-100 fill, pink-800
  text), `outline` (border, transparent fill), `ghost` (no border/fill,
  hover surface only), `destructive` (danger-500 solid), `link` (text-only,
  underline on hover).
- Sizes: `sm` (32px height), `md` (40px, default), `lg` (48px, storefront
  primary CTAs).
- States: default, hover (darken 1 step + `--shadow-sm` lift), active
  (darken 2 steps, no lift), disabled (neutral-200 fill, neutral-400 text,
  no pointer events), loading (spinner replaces label, button width
  locked to prevent layout shift).

### Cards
- **Product card** (storefront): image (1:1 or 4:5 ratio), hover swaps to
  secondary product photo, name, price (+ strikethrough original if
  discounted), color swatches, wishlist-heart overlay top-right, subtle
  `--shadow-sm` → `--shadow-md` on hover with a 1.02 scale (Framer Motion).
- **Content card** (blog/CMS): image, category tag, title, excerpt, date.
- **Stat card** (admin dashboard): label, large metric value, delta vs.
  previous period (colored up/down), optional sparkline.

### Forms & Inputs
- Field anatomy, top to bottom: label (`--text-sm`, `500` weight) → input
  → helper text or error text (`--text-xs`).
- States: default (`--border-default`), focus (`--border-focus` +
  `--shadow-focus`), error (danger border + error text, `aria-invalid`),
  disabled (neutral-100 background).
- Input types covered: text, email, phone, textarea (auto-grow for review
  body/product description), select, multi-select (tags/sizes), checkbox,
  radio, switch (toggle — used for `isActive`/`isFeatured` flags in admin),
  date picker (coupon expiry, banner scheduling).

### Tables (admin)
- Sticky header, sortable columns (click header, arrow indicator), row
  hover highlight, row-selection checkbox column (enables bulk actions),
  right-aligned numeric columns, status column always rendered as a Badge
  (never raw enum text), empty state (illustration + short copy + primary
  action), loading state (skeleton rows, not a spinner overlay — avoids
  layout jump), pagination footer (page numbers + `Rows per page` select).

### Badges
Status-to-color mapping, applied consistently everywhere a status renders
(admin tables, storefront order tracking):

| Status family | Value | Badge color |
|---|---|---|
| Order | `PENDING` | neutral |
| Order | `CONFIRMED`, `PREPARING`, `PACKED` | info |
| Order | `SHIPPED` | warning (in-transit, not yet done) |
| Order | `DELIVERED` | success |
| Order | `CANCELLED`, `RETURNED` | danger |
| Product | `DRAFT` | neutral |
| Product | `ACTIVE` | success |
| Product | `ARCHIVED` | neutral (muted) |
| Review | `PENDING` | warning |
| Review | `APPROVED` | success |
| Review | `REJECTED` | danger |

### Dialogs
- **Modal** — admin confirmations (delete, bulk action, publish), and any
  storefront/admin form that shouldn't lose the underlying page context
  (quick-edit).
- **Drawer** (slide from right on desktop, from bottom on mobile) —
  storefront cart, storefront filter panel on mobile, admin "create new"
  forms that benefit from more vertical space than a modal comfortably
  gives.
- Rule of thumb: **modal for a decision, drawer for a task** — a modal
  interrupts ("are you sure?"), a drawer extends ("keep browsing while you
  fill this in").

### Navigation
- **Storefront header**: logo (left), primary nav (center, category-driven
  — Scrubs, Gift Boxes, Accessories, Sale), search + account + wishlist +
  cart icons (right). Collapses to logo + hamburger + cart on mobile,
  full-screen nav drawer on open.
- **Admin top bar**: current section title (left), notification bell +
  admin user menu (right) — no search-everything bar in v1, deferred until
  a module (products/orders) actually needs cross-entity search.

### Sidebar (admin)
- Grouped by context, matching the DDD module boundaries so the nav
  structure never drifts from the actual backend organization: Catalog
  (Products, Categories, Collections), Operations (Orders, Inventory),
  Marketing (Coupons, Reviews), Content (Homepage, Pages, Blog),
  System (Notifications, Users, Settings, Audit Log).
- **Role-aware**: a nav item is simply absent (not just disabled) if the
  logged-in role has zero permissions in that module — a Warehouse
  account never sees "Coupons" in the sidebar at all.
- Collapsible to icon-only rail on smaller admin viewports; active item
  gets a `--za-pink-50` background + `--za-pink-800` text + left accent
  bar, consistent with the brand ramp even in the otherwise-neutral admin
  theme.

## 8. Animation Principles

Framer Motion, used with restraint:

- **Entrance**: fade + 8px rise, 200–300ms, `ease-out` — homepage sections
  on scroll-into-view, PDP gallery on load.
- **Hover micro-interaction**: 1.02 scale + shadow step-up, 150ms — product
  cards, buttons.
- **Page/route transition**: a brief 150ms cross-fade, not a heavy slide —
  keep it fast enough that it never feels like it's blocking navigation.
- **Drawer/modal**: slide/scale + backdrop fade, 200ms open, 150ms close
  (close is always slightly faster than open — reads as more responsive).
- **`prefers-reduced-motion: reduce`**: every animation above collapses to
  an instant opacity/state change — no exceptions, checked as part of the
  accessibility review per component.

## 9. Responsive Breakpoints

Mobile-first, Tailwind's default scale (kept as-is rather than inventing a
custom one — no reason to diverge from a well-known scale):

```
sm: 640px   md: 768px   lg: 1024px   xl: 1280px   2xl: 1536px
```

Storefront: mobile is the primary design target (majority of DTC medical-
apparel traffic is mobile) — every section designed mobile-first, then
enhanced at `md`/`lg`. Admin: designed `lg`-first (staff use it on desktop
almost exclusively) with a functional-but-secondary mobile fallback
(read-only views prioritized over dense bulk-editing tables on small
screens).

## 10. Dark Mode Strategy

- **Storefront**: light is the brand's primary identity (pink-on-white),
  but dark mode is supported as a respectful default for OS-level
  preference — implemented via `prefers-color-scheme` plus a manual
  toggle (persisted in `localStorage`), following the same token-swap
  approach used across this platform's artifacts: semantic tokens
  (`--surface-*`, `--text-*`) get dark values, `--za-pink-*` ramp values
  are re-selected for contrast (lighter pink accents on dark surfaces)
  rather than left unchanged.
- **Admin**: dark mode is a first-class, commonly-expected dashboard
  feature — same token mechanism, toggle in the admin user menu, default
  follows OS preference on first login.
- Both apps implement the toggle by setting a `data-theme="dark"|"light"`
  attribute on `<html>`, never by shipping two separate stylesheets.

## 11. Accessibility

Target: **WCAG 2.1 AA**.

- Color contrast: every `--text-*`/`--surface-*` pairing verified at
  4.5:1 minimum for body text, 3:1 for large text/UI components — checked
  against both light and dark token sets, not just light.
- Focus visibility: `--shadow-focus` ring on every interactive element,
  never `outline: none` without a replacement.
- Keyboard navigation: full keyboard operability for nav menus, dialogs
  (focus trap while open, restore focus on close), carousels (arrow keys +
  visible focus on active slide control), and the admin data table (row
  actions reachable via keyboard, not hover-only).
- Screen reader support: icon-only buttons (wishlist heart, cart icon)
  always carry an `aria-label`; form errors are announced via
  `aria-live="polite"` regions, not color alone.
- Images: `alt` text is a required field on `ProductMedia` at the schema
  level (see [03-DATABASE-SCHEMA.md](03-DATABASE-SCHEMA.md)) — this is a
  content/data requirement, not just a frontend convention, so it can't be
  skipped by whoever's authoring products in admin.
- Motion: `prefers-reduced-motion` respected everywhere per §8.
