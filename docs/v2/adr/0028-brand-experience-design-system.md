# ADR 0028: Brand Experience Design System

**Status**: Accepted
**Extends**: [ADR 0022](0022-storefront-frontend-architecture.md) (the storefront's
existing frontend architecture — data-fetching, SEO, component conventions — all
unchanged and respected here), [09-DESIGN-SYSTEM.md](../../09-DESIGN-SYSTEM.md) (the
v1 design system this ADR deliberately does **not** touch — see §1 of Decision).
**Raised during**: Epic 13 (Brand Experience & Theme Transformation), per the
governance rule in [ADR 0010](0010-developer-experience-governance.md#decision).

## Context

Epic 13's brief supplied two reference images and asked for a Design Language to be
extracted from them — not copied — before any implementation:

1. **A storybook-style illustration** ("Medical School"): a young woman in a pink
   cardigan/pleated-skirt school uniform standing before a glowing white doctor's coat
   and stethoscope, framed by a hand-lettered arch-top signboard, sparkle/star
   accents, tiny fairy sprites, and warm golden light rays, against a two-tone
   magenta-to-coral pink background with a warm wood-plank floor.
2. **A phone screenshot of a "dress-up" character customizer**, captioned "make
   websites fun again" in a pink bubble-letter font with cute doodle flourishes. The
   tool itself shows a centered illustrated character against a pale
   cream/butter-yellow backdrop, flanked by two dimmed alternate-outfit previews with
   arrow navigation — a fashion-game carousel pattern.

Read together (not individually — the brief is explicit that no single image should
be imitated), these establish a consistent visual language: pink as the dominant
unifying hue (ranging from saturated magenta to soft dusty rose), warm cream/butter
neutrals standing in for "paper," powder blue and plum as secondary accent hues, warm
gold as a "spotlight/glow" accent rather than a base color, hand-lettered/whimsical
display typography paired with clean body text, generous rounded shapes throughout,
sparkles/stars as the primary decorative micro-motif, and a playful, nostalgic,
premium-but-fun brand voice.

**Constraint that shapes every decision below**: `apps/storefront` and `apps/admin`
share one Tailwind preset (`packages/config/tailwind-preset.js`, itself implementing
the frozen v1 design system in `09-DESIGN-SYSTEM.md`) and one component library
(`packages/ui`). Epic 13 is explicit that admin's appearance and every piece of
backend/business logic must stay unchanged. Touching either shared file would reskin
admin too. This ADR's first decision (§1) resolves that conflict.

## Decision

### 1. New tokens live only in `apps/storefront`'s own Tailwind config — the shared preset and `packages/ui` are untouched

`packages/config/tailwind-preset.js` and every file in `packages/ui` are **frozen for
this epic**, exactly like the backend. All new color, radius, shadow, and font tokens
below are added to `apps/storefront/tailwind.config.ts`'s own `theme.extend` (which
today only carries `presets: [sharedPreset]` — see current file), additively,
alongside the preset rather than inside it. Every new token is namespaced `brand-*`
(e.g. `brand-blush-500`, `brand-radius-lg`, `brand-shadow-glow`) so it can never
collide with or be confused for the existing `pink`/`neutral` preset scale that
`packages/ui` primitives and `apps/admin` still render with, unchanged.

New illustrated/decorative components (BrandHero, StorySection, CharacterCard, etc. —
see §6) are new files under `apps/storefront/src/components/brand/`, built directly
against these `brand-*` tokens. They are **storefront-local**, not added to
`packages/ui` — there is no scenario this epic where admin needs a `<Sparkle />`.

Existing storefront pages that render real interactive state through shared
`packages/ui` primitives (`AddToCartForm`'s `Button`, `VariantPicker`, cart/checkout
`Input`/`Select`, the header's search `Input`) keep using those exact components,
completely unmodified internally — this preserves every bit of accessible, tested
behavior Epic 10 built. Where a primitive's default preset styling doesn't fit the
new pastel aesthetic, the storefront passes a `className` override at the call site
(every `packages/ui` primitive already merges `className` via `cn()`), never edits
the component file. This is a visual skin at the usage site, not a shared-component
change — admin's own usage of the same primitive is provably unaffected because the
component's own source and default classes never change.

One narrow, disclosed exception: `Accordion` (FAQ), `Input`, and `Textarea` (Contact
form) had internal `label`/button/panel text hardcoded to
`text-neutral-800 dark:text-neutral-200`-style classes with no prop reaching them —
the top-level `className` only ever reached the outer wrapper or the `<input>`
element, not these inner text nodes. Under §7's fixed-light editorial pages this
produced real, near-invisible text in dark mode (light-gray-on-cream), not just a
stylistic mismatch — the same failure class as the homepage heading bug, just
surfaced in a shared component instead of a storefront-local one. Rather than either
forking these three primitives (rejected, same reasoning as always) or leaving
illegible text as a disclosed trade-off (rejected — a trade-off is an accepted visual
seam, not broken text), each got one new optional prop (`buttonClassName`/
`panelClassName` on `Accordion`, `labelClassName` on `Input`/`Textarea`), merged via
the same `cn()` pattern already used for every other prop these components accept.
Defaults are byte-identical to before, so every existing caller — including every
`apps/admin` form and the storefront's own untouched PDP specifications accordion —
is provably unaffected; only the new FAQ/Contact call sites pass the override.

### 2. Color palette

Extracted as a semantic, non-numeric-only token set (flat names, not just a 50–900
ramp) because the reference art uses each hue for a *specific role* (background wash,
paper surface, spotlight glow, uniform accent) rather than as an interchangeable
scale:

| Token | Hex | Role | Extracted from |
|---|---|---|---|
| `brand-blush-50` … `-900` | `#FFF6FA` → `#5E1B38` (500 = `#E85FA0`) | Primary hue — the dominant pink family for hero backgrounds, primary CTAs, headline accents | The magenta-to-rose background wash in image 1 |
| `brand-cream-50` … `-600` | `#FFFEFB` → `#E8D0A8` (500 = `#F5E6D3`) | "Paper" surface — card backgrounds, the signboard plaque, body backgrounds where pink would be too loud | The signboard, coat, and warm-white passages in image 1 |
| `brand-butter-100/300/500/700` | `#FFF9E8` → `#E0A82E` (500 = `#FFD966`) | Secondary background wash + warm accent | The dress-up tool's pale yellow backdrop in image 2, and the golden light rays in image 1 |
| `brand-sky-100/300/500/700` | `#EAF4FA` → `#4E93BD` (500 = `#8FC4E3`) | Cool accent — used sparingly, for contrast against the pink-dominant palette | The character's powder-blue pleated skirt in image 1 |
| `brand-plum-100/300/500/700` | `#F1E9F7` → `#7A4F9C` (500 = `#A87BC9`) | Secondary accent — badges, the newsletter section, alternate CTA states | The character's plum tank top in image 2 |
| `brand-glow` / `brand-glow-strong` | `#FFE9A8` / `#FFC94D` | Spotlight/glow effect only — never a fill color, only glows, gradients, and shadow tints | The god-ray light effect around the coat in image 1 |
| `brand-ink` / `brand-ink-muted` | `#3A2A2E` / `#7A6368` | Text and linework — warm near-black, never pure `#000`, matching the warm brown outline work in both images | Character/object outlines in image 1 |

This is a distinct namespace from the existing `pink`/`neutral`/`success`/`warning`/
`danger`/`info` scale in `packages/config/tailwind-preset.js`, which remains the only
palette `apps/admin` ever renders with.

### 3. Typography

`apps/storefront` already loads Fraunces as `--font-display` and Inter as
`--font-sans` (`apps/storefront/src/app/layout.tsx`) — a soft, high-contrast serif
already well-suited to the "elegant editorial" voice this ADR wants for section
headlines, the Brand Philosophy quote, and product-page story intros, so it is kept
completely unchanged, not replaced. Body copy keeps `--font-sans`/Inter exactly as
Epic 10 built it (readability and accessibility for real UI text — cart totals, form
labels, error messages — must never be sacrificed for atmosphere).

One new font is added, loaded via `next/font/google` in the storefront's own
`layout.tsx` only, on a new CSS variable (`--font-script`, additive — the existing
`--font-display`/`--font-sans` wiring `packages/ui` and admin depend on is untouched):

- **`--font-script` (Caveat)** — a genuine hand-written script, standing in for the
  artwork's custom hand lettering (the "Medical School" signboard, the "make websites
  fun again" bubble caption). Used sparingly and only for short accents: signage-style
  eyebrow labels, sticker text, pull-quotes — never for body copy or anything that
  must stay easily legible at small sizes.

### 4. Border radius, shadow, and gradient tokens

Both reference images are built almost entirely from soft, rounded forms (the arch
signboard, the pleated skirt's curves, the bubble lettering) — so the radius scale is
deliberately more generous than the existing preset's:

- `brand-radius-sm` `12px`, `brand-radius-md` `20px`, `brand-radius-lg` `28px`,
  `brand-radius-xl` `40px`, `brand-radius-pill` `999px` (buttons, badges, stickers),
  `brand-radius-blob` `63% 37% 54% 46% / 43% 45% 55% 57%` (one fixed organic shape,
  for decorative blobs behind hero illustrations — not meant to vary per instance).
- Shadows are warm-tinted, never neutral gray, echoing the warm palette:
  `brand-shadow-soft` `0 8px 24px rgba(232,95,160,0.12)`, `brand-shadow-card`
  `0 12px 32px rgba(58,42,46,0.08)`, `brand-shadow-glow`
  `0 0 40px rgba(255,201,77,0.35)` (for the golden "spotlight" moments — hero art,
  featured-product highlight, the Dress Showcase's active slide).
- Gradients (defined as Tailwind `backgroundImage` utilities, e.g.
  `bg-brand-gradient-hero`): **hero** — a radial/linear blend from `brand-blush-500`
  through `brand-butter-300`, echoing image 1's magenta-to-coral sky; **section** — a
  subtle `brand-cream-100` → `brand-blush-50` wash, low-contrast, for alternating
  section backgrounds; **newsletter** — a diagonal `brand-blush-500` →
  `brand-plum-500` blend with a `brand-shadow-glow` accent; **spotlight** — a radial
  `brand-glow` burst, used behind the "magical reveal" moments the brief's Character
  Showcase and Dress Showcase call for.

### 5. Spacing system

The base 4px Tailwind scale is unchanged (no new spacing primitives needed), but a
semantic `section-y` rhythm is established for the new marketing sections — noticeably
more generous than the existing dense product-grid spacing, matching the "premium
spacing" and "magazine style layouts" the brief asks for: `clamp(4rem, 8vw, 9rem)`
vertical padding between homepage/story sections, vs. the existing tighter spacing
still used inside functional areas (product grid, cart, checkout, forms), which is
untouched.

### 6. Component language & reusable decorative primitives

New storefront-local components (`apps/storefront/src/components/brand/`), each a
thin, reusable building block rather than a one-off section:

- **Structural**: `BrandHero`, `StorySection`, `IllustrationBanner`, `CharacterCard`,
  `CharacterCarousel`, `DressShowcase` (the center-focused, dimmed-side-preview,
  arrow-nav carousel pattern extracted directly from image 2's dress-up tool),
  `LifestyleSection`, `QuoteSection`, `BrandFooter` (a storefront-only illustrated
  footer treatment — the existing functional `site-footer.tsx` links/structure are
  preserved, only the surrounding visual chrome changes).
- **Decorative** (§8 below has the full list): `DecorativeDivider`,
  `FloatingDecoration` (a wrapper applying the float animation from §7 to any child),
  `IllustratedBackground`, `Sticker`.
- **Surfaces**: cards use `brand-cream` surfaces, `brand-radius-lg`/`xl`, and
  `brand-shadow-card`; an optional `PaperTape` decorative corner accent (§8) is
  available for a "pinned to a corkboard" feel on story/character cards.
- **Buttons**: pill-shaped (`brand-radius-pill`), primary fill uses the
  `brand-blush-500` → `brand-blush-600` gradient with a `brand-shadow-glow` on hover;
  this is achieved via `className` overrides on the existing `@za/ui` `Button` (per
  §1), not a new button component — its click handling, loading state, and
  accessibility are all reused as-is.
- **Signage/plaque**: a reusable arch-top plaque shape (matching image 1's
  "Medical School" sign) for section eyebrows and story-block headers, set in
  `--font-brand-script`.

### 7. Motion principles

- **Entrance**: fade + float-up (8–16px translate, 400–600ms ease-out), staggered
  per section as it scrolls into view.
- **Hover**: gentle scale (1.02–1.04) plus a soft shadow bloom — never a sharp or
  fast transition; nothing in this theme snaps.
- **Ambient float**: decorative elements (sparkles, clouds, fairy-sprite accents) use
  a slow continuous loop — 4–8s ease-in-out, ±6–10px vertical bob, slight rotation
  drift — to echo the "floating" quality of the sparkles and sprites in image 1.
- **Parallax**: very subtle only (10–20px max shift) on hero illustration layers.
- **`prefers-reduced-motion`**: every float, parallax, and entrance transform is
  disabled; only opacity fades (capped at 200ms) remain. This is a hard requirement,
  not a nice-to-have, per the brief.

### 8. Decorative element library

Each is a small, reusable SVG-based component, not a one-off inline graphic, and each
maps to a specific motif observed across the two references:

| Component | Extracted from |
|---|---|
| `Sparkle` (4-point star) | The white sparkle accents scattered around the signboard in image 1 |
| `TwinkleStar` (soft 5-point star) | Secondary star variant, same source |
| `Cloud` | Soft rounded shapes, general "dreamy" atmosphere |
| `Flower` (simple doodle) | General storybook motif consistent with the brief's illustration guidelines |
| `DoodleUnderline` (hand-drawn accent line) | The loose, hand-drawn quality of the signboard lettering |
| `MedicalDoodle` (stethoscope/cross, line-art) | The white coat + stethoscope centerpiece of image 1, generalized into a small reusable line-art accent rather than a one-off illustration |
| `Sticker` (circular/scalloped badge, slight rotation) | The brief's explicit "small stickers" ask; also matches the badge-like quality of the arch signboard |
| `PaperTape` | The brief's explicit "paper tape" ask — a washi-tape-style strip for card corners |
| `IllustratedDivider` (wavy/scalloped SVG) | Replaces hard straight `<hr>`-style section breaks, matching "illustrated separators" from the brief |
| `FloatingDecoration` | Not a shape itself — a wrapper applying §7's ambient-float animation to any of the above |

All are local assets/inline SVG for this epic (per the brief: no CMS, no upload
pipeline, no management UI — a future epic converts this into a real content system).

### 9. Illustration and icon guidelines (for asset production)

Local placeholder illustrations for this epic follow: a warm, painterly/gouache
texture; visible linework in `brand-ink` (never pure black); a consistent warm light
source (matching the golden-glow quality of image 1); soft blush-cheeked character
faces; medical-fashion crossover subject matter (lab coats, stethoscopes, and
scrub-adjacent silhouettes styled as covetable fashion, not clinical wear); a
consistent two-tone gradient backdrop per scene (`brand-blush` → `brand-butter`, or
`brand-cream` → `brand-butter`). Icons follow the same warm, rounded, hand-drawn-feel
line style (2px `brand-ink` stroke, rounded caps/joins) rather than sharp geometric
icons, for the small utility icons this epic introduces (star, heart, sparkle, cloud).

### 10. Brand personality & UI principles

**Personality**: Elegant, Cute, Premium, Soft, Warm, Dreamy, Medical Fashion,
Illustrated, Modern — the brief's own list, directly corroborated by both references
(image 1's storybook aspiration-to-become-a-doctor narrative; image 2's explicit
"make websites fun again" mission statement, which validates that *playful* and
*premium* are meant to coexist, not trade off against each other).

**UI principles**:
1. Illustration-first for marketing/atmosphere moments; real product photography
   stays real photography everywhere it already is — this epic never replaces actual
   garment photos with illustrations.
2. Generous whitespace and editorial pacing over dense grids, in the new marketing
   sections specifically (§5) — functional areas (product grid, cart, checkout) keep
   their existing, already-usable density.
3. Shared `packages/ui` primitives keep 100% of their existing accessible behavior;
   only `className`-level visual skinning is allowed at storefront call sites (§1).
4. Motion is a seasoning, not a requirement, and fully respects
   `prefers-reduced-motion` (§7).
5. Decoration never obscures real information — no illustrated element may overlap a
   price, form field, error message, or call-to-action.
6. Strict namespace discipline: every new token, class, and component is additive and
   scoped to `apps/storefront`; nothing shared or backend-owned is touched.
7. Every page this epic gives a full redesign — the Homepage, the Product Detail
   Page's new decorative wrapper (not its functional core), and About/Contact/FAQ —
   renders in the fixed warm-pastel palette throughout, regardless of the site's
   light/dark toggle, like a printed page rather than a themeable surface. Every
   section root in these pages sets an explicit `bg-brand-*` background rather than
   relying on inherited `body` styles, and text uses `brand-ink`/`brand-cream` tokens
   directly rather than the existing `--surface-page`/`--text-primary` variables —
   a section with no explicit background silently inherits the dark-mode `body`
   background and renders `brand-ink` text as functionally invisible against it, a
   real bug this ADR's implementation caught via live visual verification and fixed
   by auditing every new section for an explicit background, not just the ones that
   happened to need one for other reasons. Areas outside this epic's redesign scope
   (header/footer chrome — restyled but still theme-aware, product/category/
   collection listing pages, cart, checkout, account, forms) keep their full existing
   dark-mode support, completely unchanged. A brand identity this specifically
   "soft pastel storybook" has no coherent inverted variant without a second,
   from-scratch dark illustration set — out of scope, and not worth the
   `ThemeToggle` producing a broken half-dark homepage in the meantime.

## Consequences

- The storefront gains a fully distinct visual identity from the admin dashboard for
  the first time — previously both apps rendered from one shared palette. This is the
  intended outcome, not a regression: they are different products for different
  audiences (staff tool vs. brand storefront) and always will be.
- One new Google Font (Caveat) adds to the storefront's font payload; mitigated by
  `next/font`'s automatic self-hosting/subsetting and by using it only for short
  accent text, never body copy.
- A second, storefront-only token layer now exists alongside the shared preset.
  Future epics touching the storefront must know to extend `brand-*` tokens in
  `apps/storefront/tailwind.config.ts`, not the shared preset — documented here and
  in the epic's completion notes to avoid confusion.
- Reused shared components (`ProductCard` and anything else with its own `dark:`
  variants, per §1's rule that they stay internally unmodified) still respond to the
  site-wide dark-mode toggle when rendered inside an "always light" §7 section,
  because Tailwind's `dark:` variant is driven by an ancestor `[data-theme="dark"]`
  attribute on `<html>` — a descendant can't locally opt back into light mode for
  itself under this selector strategy. In dark mode, product cards on the homepage
  render with their own dark surface colors against the fixed-light section around
  them. Disclosed and accepted rather than silently patched: fixing it would require
  either forking `ProductCard` (rejected in Alternatives Considered, for the same
  reason as forking `packages/ui`) or a real dark-mode-scoping mechanism, which is
  future work if this visual seam turns out to matter in practice.
- All decorative/illustration assets are local placeholders for this epic (per the
  brief). A future CMS/asset-management epic is expected to replace them without
  needing to touch any component's structure — every brand component takes its
  imagery as props/data, never hardcodes a specific asset path inline beyond a
  documented placeholder.

## Alternatives Considered

- **Extend the shared preset directly with the new palette.** Rejected outright — it
  would reskin `apps/admin` along with the storefront, directly violating the epic's
  explicit "Admin Dashboard functionality MUST remain unchanged" constraint. Even
  though the request only mentions "functionality," a silent visual reskin of a staff
  tool nobody asked to change is exactly the kind of surprise this project's
  frozen-module discipline exists to prevent.
- **Fork `packages/ui` into a storefront-specific copy.** Rejected as unnecessary
  churn — every interactive primitive the storefront needs (Button, Input, Select,
  Dialog, Toast, etc.) already works correctly and accessibly; only its visual skin
  needs to change, which `className` overrides already solve without duplicating
  components, their tests, or their behavior.
- **Literally reproduce the reference illustrations as hero assets.** Rejected per
  the brief's own explicit instruction not to copy the artwork — this ADR extracts a
  reusable visual *language* (palette, type, shapes, motifs) instead, which is what
  makes it a design system rather than a one-time skin.
