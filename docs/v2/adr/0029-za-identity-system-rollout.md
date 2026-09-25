# ADR 0029: ZA Identity System Rollout

**Status**: Accepted
**Supersedes**: [ADR 0028](0028-brand-experience-design-system.md)'s specific color
palette, logo treatment, and body-font choice — ADR 0028's _architecture_
(storefront-only `brand-*` token namespace, never touching the shared
Tailwind preset or `packages/ui` internals, the fixed-light-palette rule for
full-redesign pages) is kept unchanged and extended.
**Extends**: [ADR 0022](0022-storefront-frontend-architecture.md),
[ADR 0028](0028-brand-experience-design-system.md).
**Raised during**: a follow-up request to implement a client-supplied,
much more detailed brand identity document (the "ZA Identity System", 16
chapters — brand concept, logo, logo rules, color, typography, illustration,
decorative elements, UI language, motion, photography, packaging, social
media, pattern, art direction, do/don't) on top of the Epic 13 groundwork.

## Context

The client supplied a full brand identity book — not a redesign brief like
Epic 13's two reference images, but an exact, production-ready specification:
named colors with hex/RGB/CMYK values and WCAG contrast tables, a real
constructed logo (built from Fraunces type, not a hand-drawn mark), exact
motion durations/curves/distances, and explicit "never do this" rules. The
request was to implement it "with maximum effort, professionally," with
three things called out specifically: the colors must read as vivid (not
washed out), the motion must be deliberate and precise, and the logo must be
clear and correctly placed.

The identity book is itself written Arabic-first (RTL primary, English
secondary) — a genuine, large scope question, since the storefront has no
i18n infrastructure and product/CMS content in the database has no
translated fields at all. Per the explicit direction given when this rollout
was scoped, this ADR implements the **visual system** (palette, logo,
typography, decorative language, UI polish, motion) on the existing
English/LTR storefront; the Arabic text in the identity book is used as
source documentation for the design decisions, not as content to render.
Full bilingual/RTL localization — a real i18n library, translated UI
strings, and a database schema change for translated product/CMS content —
remains explicitly out of scope, a future epic's own decision to make.

Packaging (§12), social media templates (§13), and photography direction
(§11) are print/marketing collateral, not something a website renders;
they're read as reference for a future asset-production epic, not
implemented in code here. The brand pattern (§14) is implemented narrowly —
low-density only, as an optional section-background utility — per its own
stated rule that it never sits behind text or a call-to-action.

## Decision

### 1. Architecture unchanged from ADR 0028

New tokens still live only in `apps/storefront/tailwind.config.ts`'s own
`theme.extend`, still namespaced `brand-*`. `packages/config/tailwind-preset.js`
and every `packages/ui` file are still frozen, with the same one narrow,
disclosed exception already established in ADR 0028 (`Accordion`'s
`buttonClassName`/`panelClassName`, `Input`/`Textarea`'s `labelClassName` —
untouched further by this rollout). `apps/admin` is unaffected — confirmed by
running its full lint/type-check/test/build after every batch of edits here.

### 2. Color palette — replaced wholesale, not layered

ADR 0028's palette (`brand-blush-50…900`, `brand-cream-50…600`,
`brand-butter-*`, `brand-sky-*`, a second unrelated `brand-plum-*`, `brand-glow`)
is retired outright and replaced with the identity book's exact named colors:

| Token                                | Hex                               | Role                                                                           |
| ------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------ |
| `brand-cream`                        | `#FFF4E6`                         | Page background                                                                |
| `brand-paper`                        | `#FFFCFD`                         | Card/surface                                                                   |
| `brand-ink`                          | `#241F23`                         | Body text                                                                      |
| `brand-plum`                         | `#7B4D6D`                         | Primary — headings, logo "A", primary buttons                                  |
| `brand-berry`                        | `#704060`                         | Primary, compact/dark — hover/pressed states                                   |
| `brand-rose`                         | `#E58FA7`                         | Brand pink — decorative/fill only (fails AA for white-on-fill; never a button) |
| `brand-petal-100` / `-300`           | `#F9D6E1` / `#F6B7C8`             | Secondary tints                                                                |
| `brand-blush`                        | `#FBEAF0`                         | Surface tint                                                                   |
| `brand-dusty`                        | `#D88AAD`                         | Decorative                                                                     |
| `brand-mauve`                        | `#C09098`                         | Muted text/borders                                                             |
| `brand-lavender`                     | `#CDB8F0`                         | Rare accent, ≤10%                                                              |
| `brand-gold`                         | `#F8D98A`                         | Rare accent, ≤10%, never with lavender in one composition                      |
| `brand-success` / `-solid` / `-text` | `#8FA888` / `#5F7A57` / `#4F6E48` | Success states                                                                 |
| `brand-error` / `-tint`              | `#B5495B` / `#F5DADD`             | Error states                                                                   |

Plus three tints this implementation had to interpolate itself (the book
only swatches the saturated step of Plum/Gold/Lavender, not a light tint for
card surfaces): `brand-plum-tint` (`#D7CAD3`), `brand-gold-tint` (`#FBEBC4`),
`brand-lavender-tint` (`#E7DBF8`) — deliberately kept strong enough to read
as a distinct colored surface, not washed out to near-white. A first pass
used much paler tints (~15% color mix) that rendered as functionally
invisible pale blobs on the Character Showcase cards — caught via live
visual verification and corrected to a ~30–45% mix, directly addressing the
"colors must be vivid" requirement.

**Accessibility-driven correctness fix**: the identity book's own WCAG table
states Rose fails AA for white text (2.4:1) — Plum/Berry are the only
button/CTA colors. ADR 0028's implementation had used a Rose-family shade
(`brand-blush-600`) for the Newsletter and Contact-form submit buttons; both
are corrected here to `brand-plum` (hover `brand-berry`), matching the
book's own stated rule instead of perpetuating the exact bug it calls out.

### 3. Typography — Nunito Sans replaces Inter

Fraunces (display) and Caveat (script accent) are unchanged. Inter is
replaced with Nunito Sans as `--font-sans` — the identity book explicitly
rejects Inter ("the default choice for every SaaS product on Earth"). This
only touches `apps/storefront/src/app/layout.tsx`'s own font loading, so
`apps/admin` (which loads its own fonts independently) is unaffected.

**Build-breaking issue found and fixed**: `next/font/google`'s automatic
fallback-metric-override lookup has no entry for "Nunito Sans" in the
Next.js version this repo pins, and production build (`next build`) fails
outright with `Failed to find font override values for font 'Nunito Sans'`
without a workaround. Fixed with `adjustFontFallback: false` on the font
loader call — a documented `next/font` escape hatch for exactly this case,
verified via a full production build afterward.

The book's Arabic type pairing (El Messiri/Cairo) is documented here for
completeness but not wired into the app, per §"Context" above — no Arabic
copy exists anywhere in the storefront to set them on.

### 4. The logo — a real, constructed wordmark

Replaces every plain "ZA Store" text logo (header, footer) with a new
`Logo` component (`apps/storefront/src/components/brand/logo.tsx`) built
exactly as the book specifies: real Fraunces type, not a hand-drawn
logotype — "Z" in Fraunces 900 italic (Rose), "A" in Fraunces 600 upright
(Plum), so it renders identically anywhere Fraunces loads. Three variants
implement a practical web subset of the book's 10-variant system:

- `primary` — the full lockup (Z+A, the bow/ribbon mark at the letter
  junction, the stethoscope-that-becomes-a-heart mark near the A) — used as
  the homepage hero's visual anchor, replacing the previous generic
  decorative-blob centerpiece.
- `wordmark` — Z+A only, used in the header and footer.
- `compact` — a circular Petal-100 monogram badge, for tight spaces.

A `tone` prop covers `auto` (theme-aware — `dark:` overrides to the book's
own "Dark variant" Petal-300/Paper combo, for the header/footer's
theme-aware chrome), `fixed-light` (always Rose/Plum, for the hero and other
ADR 0028 §7 fixed-light surfaces), and `on-rose` (Paper/Plum, for placements
on a Rose-colored background). Two new decorative primitives back it:
`Heart` (solid/outline, per the book's own core-motif list alongside
Sparkle) and the bow/stethoscope marks defined inline in `logo.tsx` itself
(reserved for the logo, never a general-purpose UI icon, per the book's own
red line on the bow specifically).

**Placement fix found via live verification**: an early pass positioned the
stethoscope mark with small fixed-pixel offsets, which read as a
disconnected, floating icon at the hero's large size instead of sitting
against the "A" as the book's own percentage-based anatomy intends. Fixed by
switching to percentage-based offsets that scale with the lockup's own size,
directly addressing the "logo must be clear and correctly placed"
requirement.

### 5. Tone discipline: rose/plum freely, gold/lavender ≤10% and never together

Every component with a repeating "tone" prop (`PortraitBlob`, `Sticker`,
`CharacterCard`, `CharacterCarousel`, `StorySection`, `LifestyleSection`,
`DressShowcase`, `PaperTape`) had its old 4-hue enum (`blush`/`butter`/
`sky`/`plum` — an arbitrary Epic 13 invention) replaced with the book's own
tone family: `rose` | `plum` | `gold` | `lavender`. Rose and Plum are the
book's ~30% mid-tier family and are used freely; Gold and Lavender are its
≤10% rare-accent family, reserved for at most one touch per composition,
never both together in the same scene (the book's own explicit rule). Every
array of repeating items on the homepage/PDP (`CHARACTERS`,
`LIFESTYLE_MOMENTS`, `INSTAGRAM_TILE_TONES`, `DressShowcase` slides) was
re-curated by hand against this rule — each array is read as its own
"composition," so different sections may each carry their own single rare
accent without violating the "never together" rule, which is about one
scene, not the whole page.

### 6. Motion — the book's exact spec, replacing Epic 13's approximations

Every named motion pattern now uses the book's literal timing:

| Pattern           | Before (Epic 13)                | Now                                                                                                                                                                                  |
| ----------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ambient float     | 6s / 8s ease-in-out, ±10px/±6px | 2.6s ease-in-out, ±10px (both float and float-slow use the book's one float spec)                                                                                                    |
| Scroll fade-up    | 600ms ease-out, 16px            | 400ms `cubic-bezier(.22,1,.36,1)`, 12px                                                                                                                                              |
| Carousel/slide    | (none named)                    | 350ms same curve, full-width — `brand-slide-x` utility added                                                                                                                         |
| Like/wishlist pop | (none)                          | 250ms back-ease, 1→1.18→1 — `brand-pop-once` utility added                                                                                                                           |
| Hero reveal       | (none)                          | 600ms `cubic-bezier(.22,1,.36,1)` fade+scale, once on first load — the book's single reserved "big moment," applied to the hero's Logo rather than a stroke-drawn ribbon (see below) |

`prefers-reduced-motion` disables every loop/entrance animation, unchanged
as a hard requirement (now covering the new `brand-slide-x`/`brand-pop`/
`brand-hero-reveal` utilities too).

**Scope adjustment, disclosed**: the book calls for the bow/ribbon mark to
"draw itself" via SVG `stroke-dashoffset` on first load. The bow icon as
implemented is mostly filled shapes (matching its silhouette in the book's
own SVG defs), not a single continuous stroke path, so a literal
stroke-draw animation would not produce a visible line-drawing effect on it.
Implemented instead as a fade+scale "reveal" on the whole hero logo — same
intent (one deliberate, non-repeating moment on first load), different
mechanism, chosen over investing in redrawing the bow as a stroke-only path
for a first pass.

### 7. Brand pattern — low density only

The book's repeating tile motif (monogram + sparkle + heart + ribbon dot) is
implemented as `.brand-pattern-low` in `globals.css` — background-only,
4%-opacity, explicitly for section backgrounds per the book's own rule that
it never sits behind body text or a CTA. Mid/full density are packaging-only
(tissue paper, box lining) and not implemented.

## Consequences

- Every homepage/PDP/editorial-page component was touched (22 files) to
  migrate off the retired Epic 13 palette — verified file-by-file via grep
  that no `brand-blush-*`/`brand-cream-NN`/`brand-butter-*`/`brand-sky-*`/
  old `brand-plum-NNN`/`brand-glow*`/`brand-ink-muted` class remains
  anywhere in `apps/storefront/src`.
- The same disclosed Epic 13 trade-off still applies: shared components
  rendered inside an "always light" section (e.g. `ProductCard`) still
  respond to the site-wide dark-mode toggle, since a descendant can't
  locally override the ancestor `[data-theme="dark"]` selector. Unchanged
  by this rollout.
- Full quality gates re-run after this rollout: lint/type-check/test/build
  clean across all 9 packages (storefront 45/45 tests, admin 15/15,
  confirming zero admin impact), including a real production build (which
  is what caught the Nunito Sans build failure — a type-check-clean app can
  still fail `next build` specifically, so this was run explicitly rather
  than assumed from type-check alone).

## Alternatives Considered

- **Layer the new palette as additional tokens alongside ADR 0028's, rather
  than replacing it.** Rejected — the two palettes share role names (both
  have "a pink," "a purple") with different actual hues; keeping both would
  mean every component call site needs updating anyway to pick the _new_
  one, with no benefit to leaving the old, now-unused tokens defined.
- **Build the full bilingual Arabic/RTL site as part of this rollout.**
  Rejected for this pass — a real i18n library, RTL layout audit across
  every existing page, and a database schema change for translated
  product/CMS content is a substantially different, larger scope than a
  visual identity rollout; left as an explicit, disclosed future epic rather
  than silently expanded into.
- **Implement packaging/social-media templates as code.** Rejected — these
  are print/marketing deliverables (a shopping bag, an Instagram template),
  not something a website renders; kept as documentation reference only.
