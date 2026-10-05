# Changelog

All notable changes to this project are documented in this file, one
entry per epic. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project
has no public releases yet, so entries are grouped by epic under
**Unreleased** rather than by version number.

## [Unreleased]

### Epic 14.11 — Hero Looks: Swipe and Auto-Advance (2026-10-05)

The hero's three looks are no longer changed with arrow buttons.

- **Swipe/drag:** a horizontal drag anywhere on the hero (mouse or touch)
  moves the character with the pointer and commits to the next/previous
  look past 50px, wrapping around; shorter drags spring back. Vertical
  scrolling is untouched (`touch-action: pan-y`), and a drag that starts
  on the Shop-now link does not also follow it.
- **Auto-advance every 3 seconds.** The countdown restarts after each
  swipe, and holds still during a drag, in a background tab, and for
  visitors with `prefers-reduced-motion` (ADR 0029 §10) — those visitors
  can still swipe.
- **Arrow buttons removed.** Three small dots above her head show which
  look is showing; they are decorative, not controls. Because the looks
  are decorative images (empty alt text) and the only way to change them
  is now a pointer gesture, keyboard-only users cannot switch looks; the
  rotation continues on its own.
- Spec: `brand-hero.spec.tsx` (autoplay, wrap-around, reduced motion,
  swipe both ways, short drag, countdown restart, link suppression).

### Epic 14.10 — Header: Light-Only, Three Controls (2026-10-05)

Header/navigation only; the hero, artwork, typography and the rest of the
homepage are untouched.

- **No more black bar.** The black bar the client saw was the dark theme
  (picked up from the OS or the stored toggle). The header now uses the
  hero's own `brand-pattern-low` cream surface with a dashed petal
  hairline, so it reads as the top edge of the illustrated page.
- **Dark mode removed from the storefront.** The toggle is gone from the
  header and the root layout no longer runs `ThemeInitScript`; `<html>`
  is fixed to `data-theme="light"`, so a stored `za-theme` or an OS dark
  preference has no effect. The inert `dark:` utility classes elsewhere
  in the storefront were left alone (they cannot apply). `ThemeToggle`
  and `ThemeInitScript` remain in `@za/ui` because the admin app uses
  them.
- **Wishlist button removed from the header** and its component
  (`wishlist-icon-button.tsx`) deleted. The wishlist itself is unchanged
  and still reachable from the account page, the footer and the product
  cards' heart button.
- **Three controls:** menu (left), the existing `Logo` wordmark (centre,
  `fixed-light`), and account + bag (right) at every screen size. The
  inline nav links and the header search field were folded into the menu,
  which already carried search and the same links. Cart count shows only
  when the bag is not empty.
- **Menu:** a lighter three-stroke glyph (`menu-icon.tsx`); the drawer now
  opens from the left via a new `side="start"` option on `Drawer` and
  marks the current page.
- **Not done:** the logo is still the Fraunces-type wordmark from
  ADR 0029 (there is no logo image asset in the repo); it was reused, not
  redrawn.

### Epic 14.9 — Calligraphy Tagline Card on the Homepage (2026-10-05)

The client supplied a hand-lettered Arabic tagline (يليق بكِ الطب، فجمالكِ
وحده يُداوي) as a JPG on a grey gradient and asked for it to be placed in
the site as a card that matches the brand.

- **Artwork:** background removed with Canva (`remove-background`), then
  exported at full size as a transparent PNG through a scratch Canva design
  ("Blank image container"), saved as
  `apps/storefront/public/brand/calligraphy-tagline.png` (1290x555, RGBA).
  The Canva design is left in the account and can be deleted.
- **`CalligraphyCard`** (`components/brand/calligraphy-card.tsx`): paper
  card with a dashed inner frame, a blush wash, corner sparkles and a
  doodle underline, matching the hero/arch-plaque family. The artwork is
  trimmed to the lettering with a CSS `crop` (the PNG keeps its margins),
  and the Arabic wording is the image `alt`.
- **Placement:** homepage, directly after the hero (which hands off to
  cream through its wave), above Character Showcase.

### Epic 14.8 — Per-Color Product Photos and a Better Gallery (2026-10-05)

Picking a color on a product page now shows only that color's photos and
sizes, and the gallery is easier to move through.

- **Schema:** `ProductMedia.colorId` (nullable FK to `Color`, `ON DELETE
  SET NULL`, indexed) via migration `20261005130000_product_media_color`.
  Null means "shared by every color". **The migration must be applied
  wherever the API is deployed** (`prisma migrate deploy`).
- **API:** the media PUT accepts an optional `colorId` per entry and
  rejects an unknown one with `ColorNotFoundError` before writing; the
  public media/detail responses return it. Specs cover both paths.
- **Storefront gallery:** shows the chosen color's photos plus shared
  (untagged) ones; a color without any photos, or a product with no
  tagged media, falls back to the full set (cover first, as before).
  Previous/next arrows (wrap around), an "n / N" counter, swipe on touch,
  arrow-key navigation, and a thumbnail strip that follows the active
  image. Switching color resets to that color's first photo.
- **Variant picker:** offers only the selected color's sizes (previously
  other sizes were greyed out) and shows the color name next to the
  swatches. Changing color keeps the size if that color has it, otherwise
  selects its first size. The PDP owns the color state and shares it
  with the gallery and the add-to-cart form.
- **Admin media tab:** each media row has a Color select ("All colors
  (shared)" by default) and saves round-trip `colorId`. Before this, a
  save from an older admin build would drop the color links.
- **Zayra Scrub data (SQL, local DB only):** the 16 photos were linked to
  their colors. Black has no solo photos, so the two grey-and-black duo
  photos are tagged Black. `baby-pink-3.jpg` shows a baby-pink and a
  fuchsia scrub side by side (fuchsia is not one of the six colors); it
  stays under Baby Pink.

### Epic 14.7 — Zayra Scrub: First Real Product (2026-10-05)

The client supplied 16 product photos, six colors and Arabic marketing
copy for one product and asked for it to be added to the store.

- **Created through the admin API, not the repo:** product `zayra-scrub`
  (87,000 IQD, Scrubs, ZA Originals, new arrival), 6 colors x 5 sizes =
  30 variants with 10 units of placeholder stock each, 16 gallery photos
  (baby pink cover first), the 5 marketing bullets in `highlights`, the
  full text in `description`. The product exists only in the database it
  was created in; it is not part of `prisma/seed.ts`.
- **Photos live in `apps/storefront/public/products/zayra-scrub/`** and
  are stored as *relative* paths (`/products/zayra-scrub/x.jpg`), so they
  work on any host that serves the storefront. `ProductMedia.url` is
  validated as an absolute URL (`@IsUrl`), so these rows were written
  with a direct SQL update; **re-saving the product's media from the
  admin API/panel will be rejected** until it is migrated to absolute
  URLs (CDN/Cloudinary) once hosting is decided. Product-card images use
  `ogImageUrl`, which is also relative; social-share cards would resolve
  it against `metadataBase` (unset), so set that before relying on them.
- **`dir="auto"` on the product short description:** the Arabic copy was
  laid out left-to-right and its sentence runs displayed shuffled.
- Product pages deliberately render only `shortDescription` (earlier
  decision); the long description and highlights are stored but not
  shown. The gallery does not switch with the selected color (media has
  no color link in the schema).
- A Next dev server keeps API responses in an in-memory cache that
  deleting `.next/cache/fetch-cache` does not clear; after changing
  catalog data under a running dev server, restart it.

### Epic 14.6 — Netlify Build Fix: No More Silent Localhost Fallback (2026-10-04)

Netlify's build compiled and type-checked, then failed in static
generation with `TypeError: fetch failed / ECONNREFUSED` on `/about`,
`/faq`, `/privacy-policy`, `/terms-of-service` and `/sitemap.xml`.

- **Root cause (reproduced locally, same error):** `lib/api/client.ts`
  read `process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1'`,
  and nothing in the repo supplies that variable to Netlify (`.env.local`
  is gitignored; there is no `netlify.toml`; no API deployment config
  exists). Those five routes prerender at build from the live API and
  rethrow on failure; `/shop`, `/categories`, `/collections` and `/`
  use `prefetchQuery` (swallows errors) and `/contact` catches, which is
  why only five failed. Also found: with a foreign server on
  `localhost:4000`, `/about` would have silently prerendered as a 404.
- `lib/config.ts` (new) is now the only place API/site URLs are
  resolved. The localhost defaults apply to dev/test only; a production
  build without `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL` fails at
  build time naming the variable. On Netlify a localhost or non-https
  API URL is rejected (browsers would block mixed content). Unit-tested.
- `scripts/check-api.mjs` runs before `next build`: probes
  `/catalog/storefront/collections` (DB-backed, same dependency as the
  sitemap), retries up to 90s for cold-starting APIs, and fails with the
  URL, the cause and a checklist. No `try/catch` was added to pages, no
  page was removed, prerendering is unchanged.
- CMS pages and the sitemap now `revalidate` (300s / 3600s). Previously
  admin CMS edits could never appear without a redeploy.
- `turbo.json`: `NETLIFY` passed through (turbo's strict env mode hid
  it), `scripts/**` added to build inputs. Storefront lint ignores
  `scripts/**` like `jest.setup.js`.
- Homepage JSON-LD used its own copy of the localhost fallback; it now
  uses `SITE_URL`.
- **Verified** against the real API (Postgres + API running):
  `turbo run build --filter=@za/storefront`, `type-check` and `lint`
  pass; 13 suites / 55 tests pass; prerendered `/about` contains real CMS
  content; manifest shows the new revalidate values. Failure paths
  checked: no env (fails in ~2s with a clear message), Netlify+localhost,
  and direct `next build` without the preflight.
- **Not changed:** the API is not deployed by anything in this repo
  (Netlify needs a public https API, with its `CORS_ORIGIN` including the
  storefront origin); CI's `build` and `type-check` jobs still need a
  reachable API (`type-check` depends on `build`) and will now fail
  clearly instead of cryptically. `/`, `/shop`, `/categories`,
  `/collections` still bake `prefetchQuery` results in at build time.
- Local-only: this Windows machine's `node_modules` had dozens of
  `name(1)` duplicate links and `packages/ui/src/states.tsx` had been
  renamed `states-Copy20260929142537.tsx` by something outside git
  (identical content, restored). Clean reinstall + `prisma generate`
  fixed it; Netlify is unaffected.

### Epic 14.5 — Multi-Character Hero Carousel (2026-09-28)

The client asked for more than one hero character with different
styles, and a way to slide between them, rather than one static image.

- Generated two more outfit-styling variants of the same character via
  Canva `generate-image` image-to-image, using the existing
  background-removed character as the reference so the face/identity
  stays recognizable across all three: **rose** (soft rose scrubs,
  hair down instead of the ponytail) and **lab coat** (cream lab coat
  over plum scrubs, hair in a bun, a small stethoscope accessory —
  reading as a more senior/professional look). Only outfit, hairstyle,
  and accessories differ between the three; the face is the same
  reference throughout.
- **Hit the same fake-transparency defect as Epic 14.3 on both new
  generations** — confirmed again at the byte level (`xxd` on the raw
  generated PNGs), not assumed — and fixed the same way: `remove-
  background` on each before compositing. Both final exports verified
  RGBA (color type `06`) at their native 1024×1536.
- `BrandHero` is now a Client Component (`'use client'`, matching its
  sibling `DressShowcase` in the same already-client `home-content.tsx`
  tree) holding a `HERO_CHARACTERS` array and an `activeIndex` state,
  following the exact carousel pattern already established by
  `DressShowcase` — wraparound `goTo()`, `key={active.id}` on the
  animated wrapper to retrigger `animate-brand-fade-up` on every slide
  change, and the same circular `ChevronLeft`/`ChevronRight` buttons
  (`bg-brand-paper text-brand-plum shadow-brand-tight`). No new pattern
  invented — reused what the codebase already had for this exact
  interaction.
- Positioned the arrow buttons at the character's shoulder height
  (`top-[18%]` of her wrapper) specifically to clear the product tag
  (`top-[46%]`) and the CTA pill (bottom) rather than colliding with
  either — checked by eye against all three character variants, not
  just the default one.
- **Verified**: `eslint` and `tsc --noEmit` clean; clicked through all
  three slides (including the wraparound back to slide 1) in the
  running preview at both mobile (375px) and desktop widths — no
  horizontal overflow at either size, no console errors beyond the
  pre-existing unrelated Docker/Postgres-down API gap, transitions
  play correctly on every slide.

### Epic 14.4 — Hero Background, Take Three: The Site's Own Pattern (2026-09-28)

Direct client feedback again: no gradient, and the background should be
"integrated with the site" and read as an official/structured design
element (`مدمج بالموقع`, `خلفية رسمية`) rather than a standalone
generated picture — after two image-generation passes (Epic 14.2's sky
scene, tuned once already for being too busy), a third generated image
was clearly the wrong direction entirely regardless of prompt.

- Found `.brand-pattern-low` already sitting unused in `globals.css`
  (ADR 0029 §14): a repeating tile of the ZA monogram, a sparkle, a
  heart, and a ribbon-dot at 4.5% opacity on `brand-cream`, explicitly
  documented as "for site section backgrounds" — defined for exactly
  this purpose during the ADR 0029 identity-system pass but never
  actually applied anywhere in the codebase until now.
- Removed the Canva-generated background `Image` and its scrim overlay
  entirely; the hero section now uses `brand-pattern-low` directly. No
  external asset, no AI generation, no gradient — a real piece of the
  coded design system instead, which is what "integrated with the site"
  concretely means here.
- Deleted the now-unreferenced `hero-background.png` (confirmed no
  remaining references first).
- Respected the ADR's explicit constraint ("never behind body text or a
  CTA") in spirit: the CTA already sits in its own opaque `brand-plum`
  pill, so the pattern never shows through it regardless of z-order;
  the headline sits directly on the 4.5%-opacity tile, which at that
  density reads as paper texture rather than a competing visual — kept
  well inside the rule's intent (preventing decoration from hurting
  legibility), not a literal loophole.
- **Verified**: `eslint` clean; checked in the running preview at
  mobile (375px) and desktop — no horizontal overflow
  (`scrollWidth === clientWidth` at both), headline/CTA fully legible,
  pattern reads as a deliberate structured backdrop rather than empty
  space or a random image.

### Epic 14.3 — Character Revision: Middle Eastern Features (2026-09-28)

Direct client feedback: the hero character's face read as generic/
"traditional" (stock anime-adjacent). Asked which direction to take it
— confirmed the face/features specifically, and the target: clearer
Middle Eastern features to match the brand's actual regional audience.

- Regenerated via Canva `generate-image` in image-to-image mode, using
  the existing background-removed character (`MAHWbYJ5ir8`) as the
  reference so the pose, plum/berry scrub uniform, sneakers, and
  painted-illustration rendering style stayed identical — only the
  face and coloring changed: warmer olive-tan skin, dark almond eyes
  with defined dark brows, a more defined nose bridge, fuller lips,
  dark wavy hair, reading distinctly Middle Eastern rather than the
  previous ambiguous/East-Asian-adjacent look.
- **A real generation defect caught before shipping**: the model's
  output had a *fake checkerboard pattern painted into the pixels*
  where it should have been transparent (the prompt's "same transparent
  background" instruction got misread as "draw a checkerboard," not
  "use real alpha") — confirmed by inspecting the exported PNG's color
  type byte directly (`xxd`: color type `02`, RGB with no alpha
  channel, despite `export-design`'s `transparent_background: true`).
  Not a rendering assumption — verified at the byte level before
  shipping it. Fixed by running the dedicated `remove-background` tool
  on the generated image before compositing, which produces real alpha
  (confirmed after: color type `06`, true RGBA).
- Composited onto the same full-res 1024×1536 Canva design page used
  for the original character (`update_fill` on the existing element,
  reusing the page rather than rebuilding), then exported directly —
  same full-resolution workaround as Epic 13.10/14.2.
- **Verified**: downloaded PNG confirmed 1024×1536 RGBA; cleared the
  same Next.js image-optimizer cache gotcha hit in Epic 14.2; checked
  live in the running preview at mobile and desktop widths — clean
  edges, no checkerboard artifact, no layout shift, character reads
  clearly against the calm background from Epic 14.2.

### Epic 14.2 — Hero Recomposition: Real Painted Background (2026-09-28)

The client asked directly whether Canva/Figma were used in Epic 14.1
(they weren't — that pass was pure `brand-*` token consistency work,
correctly done in code since it created no new visual asset) and asked
for something genuinely new: recompose the homepage hero, replacing the
flat CSS gradient (`bg-brand-gradient-hero`, a radial/linear gradient
recipe) behind the character with a real painted background.

- Generated a new background image via Canva's `generate-image`
  (text-to-image, no reference needed for pure atmosphere): a dreamy
  painted sky scene, warm cream-to-rose gradient, glowing pink/blush
  clouds at layered depth, drifting petals and light sparkle, brand
  palette only (cream/rose/dusty-rose/plum/blush, one faint gold glow
  as the rare accent per ADR 0029's tone-frequency rule) — no text, no
  characters, no product, so it reads as pure atmosphere behind
  everything else in the scene.
- Exported at its true native 1680×944 (not a thumbnail) using the same
  workaround solved in Epic 13.10: place the generated `MEDIA` asset
  onto a Canva design page sized to match, then `export-design` on the
  *design* rather than the raw asset (`get-assets` still caps at a
  133×200 thumbnail for raw media; `export-design` has no such cap).
- Swapped `BrandHero`'s section background from the CSS gradient class
  to this image (`next/image`, `fill`, `priority`, `object-cover`),
  with a soft cream-to-transparent scrim layered on top so the
  headline and CTA stay readable without flattening the art underneath.
  Every other piece of the scene — the character, the decorative
  primitives (clouds, stars, hearts, flowers, the ribbon bow),
  `SectionWave`, the CTA, the product tag — is unchanged; only the base
  layer changed from a flat gradient to real painted depth.
- **Verified**: `eslint` clean; checked in the running preview at both
  mobile (375px) and desktop widths — no horizontal overflow
  (`scrollWidth === clientWidth` at both), headline/CTA read clearly
  against the new background, no layout shift (explicit `min-h`
  unchanged, image uses `fill` + `priority`).
- **Client feedback, same session**: the first background (dramatic
  swirling clouds at every depth) read as too busy/crowded. Regenerated
  with a deliberately restrained prompt — smooth cream-to-rose gradient
  wash, only a whisper of texture at the very top corners, no visible
  cloud shapes, maximum negative space — and swapped it in via Canva's
  `update_fill` on the same already-sized design page rather than
  rebuilding from scratch. Re-verified at both breakpoints. Also hit and
  fixed a real dev-environment gotcha while iterating: Next.js's
  `/_next/image` optimizer cache in `.next/cache/images` kept serving
  the old (busy) background after the source PNG was overwritten at the
  same path — confirmed via network requests returning `304 Not
  Modified` for the stale optimized copy while the raw static file was
  already correct on disk. Clearing that one cache directory (not a
  full `.next` wipe) resolved it.

### Epic 14.1 — Site-Wide Brand Rollout: Generic-Page Cleanup (2026-09-28)

The client asked for a full site redesign now that real design tooling
(Figma, Canva image generation) is available. An audit first (per this
session's redesign-preserve discipline): of 25+ routes, only Home/About/
Contact/FAQ/PDP-wrapper got ADR 0028/0029's full illustrated treatment;
Header/Footer/Shop/Category/Collections/CartDrawer/Checkout got a
lighter theme-aware `brand-*` skin; but Cart (full page), all of
Account (profile/orders/order-detail/addresses/wishlist), Login,
Register, Track Order, Checkout confirmation, Checkout payment-result,
Privacy Policy, Terms of Service, 404, the global error boundary, and
the mobile nav drawer were **fully generic** — plain `neutral-*`
Tailwind with stray `pink-700`/`pink-300` link accents left over from
before the brand system existed (not `brand-*` tokens). This was the
most jarring inconsistency in the whole site: a customer could go from
a fully-branded homepage to a completely unbranded cart in one click.

This pass (Phase 1 of the wider redesign) closed that gap:

- Every one of those 16 pages/components now uses the same theme-aware
  `brand-*` skin already established by Checkout and CartDrawer (`bg-
  brand-cream`/`dark:bg-transparent` page backgrounds, `rounded-brand-lg
  border-brand-petal-100 bg-brand-paper shadow-brand-tight` cards,
  `rounded-brand-pill bg-brand-plum text-brand-paper hover:bg-brand-berry`
  primary buttons, `text-brand-ink`/`text-brand-mauve` text) — no new
  tokens, patterns, or components invented, purely applying the
  existing identity system where it was missing.
- Fixed every stray legacy `text-pink-700` light-mode link accent to
  `text-brand-plum`, matching the deliberate `dark:text-pink-300`
  pairing Header/Footer already use for the same purpose.
- Full-page Cart brought in line with `CartDrawer`, which shares the
  same cart data but had drifted to a fully generic treatment.
- `MobileNav`'s drawer content (menu links) was unstyled even though
  `SiteHeader` itself, its direct parent, was already brand-skinned —
  fixed to match.
- Semantic/functional colors (success checkmarks, danger icons, Badge
  tones) were deliberately left untouched — those are cross-cutting
  status indicators, not part of the visual identity, and already work
  correctly in both themes.
- Fixed an unrelated but blocking local-dev issue hit while verifying:
  a corrupted `strip-ansi` package extraction in the pnpm store (an
  empty directory where the package's files should have been — the
  same Windows extraction-corruption pattern seen earlier this session)
  was crashing the API dev server on startup. Removed the two empty
  dirs and reran `pnpm install` to re-extract them cleanly.
- **Verified**: `eslint` and `tsc --noEmit` clean on all 16 touched
  files (two pre-existing, unrelated failures remain elsewhere: a
  handful of `.spec.tsx` files missing Jest ambient types — present
  before this change, not touched by it). Checked in the running
  preview in both light and dark mode: Cart (empty state), Login,
  Register, 404, and the mobile nav drawer all render correctly on the
  warm-pastel palette in light mode and the existing neutral dark
  palette in dark mode, matching Checkout's established look exactly.
  Account/Orders/Addresses/Wishlist's populated states were not
  visually checked against real data — the local Postgres (Docker)
  wasn't running to seed products/orders, an environment gap unrelated
  to this change — but they reuse the identical token patterns already
  confirmed correct on Cart/Checkout, so the risk is low.
- **Phase 2 (same session)**: confirmed with the client that "reorganize"
  means visual only — no nav/IA/URL changes. Added a light `DoodleUnderline`
  brand accent under the page heading on Shop, Categories (index and
  detail), and Collections (index and detail) — the one remaining
  visual gap between these already-token-skinned listing pages and the
  fully-illustrated pages (Home/About/Contact/FAQ): matching color
  tokens but no illustrated personality at all. Deliberately restrained
  (a single underline, no floating sparkles/characters) so it doesn't
  compete with the functional grid, filters, or pagination controls
  right below it. Also fixed the Collections index loading skeleton,
  which was still on a generic `rounded-lg` radius with no themed
  background, to match the `rounded-brand-md`/`bg-brand-blush` pattern
  used by every other skeleton in this pass.
- **Caught in mobile verification**: the Shop page's heading row (title
  + Sort-by select + Filters button) genuinely overflowed the viewport
  at 375px (confirmed via `scrollWidth` 483px vs `clientWidth` 375px) —
  pre-existing, not caused by the `DoodleUnderline` addition, but found
  while checking this page's mobile layout. Fixed by letting the header
  row wrap (`flex-wrap`) and trimming the sort select's fixed width on
  small screens (`w-36 sm:w-44`); confirmed `scrollWidth === clientWidth`
  at 375px afterward.
- **Scope note**: the PDP's functional core (gallery/variant picker),
  and any information-architecture changes (nav structure, page order),
  remain deferred to later phases — see PROJECT_STATUS.md.

### Epic 13.10 — AI-Generated Hero Character (2026-09-28)

The client sent a reference image in a painted, semi-realistic fashion-
illustration style and asked for the hero character redrawn to match it.
Assessed honestly first: this level of rendering (detailed hair strands,
airbrushed shading, realistic proportions) is beyond both hand-coded SVG
and Figma's vector tools — both produce flat/vector art, not painted
illustration. Real image generation was needed, and this pass got there.

- **Figma's Weave (AI model runner) was tried first** — discovered via
  `weave_find_model`/`weave_run_model`, gated behind two real
  account-level blockers in sequence: an unlinked Weave↔Figma account
  (user linked it, confirmed via `weave_list_tools`), then a paid-plan
  requirement surfaced only once an actual asset upload was attempted.
  Neither was something this session could resolve or pay for itself —
  both disclosed to the user rather than silently retried or guessed
  around.
- **Canva's `generate-image` connector tool worked.** Uploaded the
  user's reference image (`create-upload-url`), ran it through "Nano
  Banana 2 Lite" (image-to-image, ~3 Weave-equivalent-tier credits, the
  cheapest of four tiers offered — user chose it explicitly) with a
  prompt describing a ZA-branded medical scrub set in the brand's
  existing `brand-plum` color and a small "ZA" wordmark on the pocket,
  keeping the reference's exact rendering style. Ran `remove-background`
  on the result for a clean cutout to composite into the hero scene.
- **A real tooling ceiling hit, then resolved**: the only asset-download
  path exposed by the available Canva tools (`get-assets`) returns a
  fixed 133×200 thumbnail — there is no `export-design`-equivalent for a
  raw generated MEDIA asset (that tool takes a `design_id`, not a
  `MEDIA` id) in this toolset. Confirmed by testing, not assumed: a
  same-signature URL with tampered width/height parameters returned
  `"Signature invalid"` rather than a larger image, so the underlying
  asset (1024×1536, per its own metadata) was not fetchable at full
  resolution directly. Worked around it: created a throwaway Canva
  design, added a page sized exactly 1024×1536 (`edit-design`'s
  `add_page`), placed the same background-removed MEDIA asset onto it
  full-bleed (`insert_fill`), committed, then `export-design` on that
  *design* (not the raw asset) — which has no thumbnail cap. The hero
  now renders the true 1024×1536 illustration.
- **Replaced `ZaGirl` in the hero** with this generated illustration
  (`apps/storefront/public/brand/za-girl-plum.png`) via a real
  `next/image`, `alt=""` (decorative, matching the prior SVG's
  `aria-hidden` treatment) — the hand-built SVG component itself is
  untouched and still exported from the brand barrel, just no longer
  used in the hero.
- **Verified**: no horizontal overflow at 375px/1440px; `tsc --noEmit`
  and `eslint` clean; storefront unit suite 12/12 (45/45); full
  `brand-experience.spec.ts` E2E 8/8 passing live. A stray console error
  referencing `gradientCounter is not defined` observed mid-verification
  was confirmed stale (Next.js dev-overlay history from a bug already
  fixed in Epic 13.9, in a component no longer even imported by the
  hero) via a fresh network-request check, not dismissed on assumption.

### Epic 13.9 — Figma-Designed Character Redesign (2026-09-27)

The client's brief asked for a full visual-concept reinvention across
Home/Product/Characters/Artwork/Collections/Cart/Checkout, a real
`Character → Product → Variant → CharacterOutfitAssignment` backend data
model, and a from-scratch 10-character illustrated system — with Figma
now actually connected (confirmed via `session_connectors_status`,
`needs_auth` → `connected`) and explicitly available to use. Scoped
honestly: this pass delivers one concrete, high-quality piece built with
a real Figma workflow — the `ZaGirl` character redesign — rather than a
shallow pass across every surface named in the brief. The homepage
restructure, per-product illustrated scenes, a real 10-character system,
and the character/product/variant data architecture remain a substantial,
disclosed follow-up scope (see Known Gaps).

- **`ZaGirl` designed in Figma, not hand-guessed as raw SVG.** Created a
  new Figma file ("ZA Pink Cartoon World"), a color-variable collection
  matching the existing `brand-*` tokens exactly, and built the character
  in layers (hair-back → body → garment → face → collar → stethoscope)
  with live screenshot verification at every step. This caught real
  problems immediately that blind SVG-authoring couldn't: a first
  hand-typed hair path rendered as an asymmetric, angular shape (fixed by
  rebuilding hair-back as a boolean union of three ellipses — reads as
  actual hair, not a guess); a stray default black stroke on the dress
  and collar (removed); a hair-bow accessory that read as a messy dark
  cluster at scale (removed rather than shipped once seen clearly).
- **Exported the verified vector paths directly** (`download_assets`,
  SVG format) rather than re-transcribing coordinates by eye, so the
  shipped component matches the Figma-verified design exactly — same
  discipline as reading a screenshot pixel-for-pixel instead of
  eyeballing it.
- She now has simple elegant eyes, thin eyebrows, a quiet smile, blush,
  an open lab-coat collar, and a stethoscope — first Figma render caught
  that the face color matched the frame background exactly (invisible
  head), fixed before it ever reached code.
- **A real gradient this time**: the `plum` tone's dress uses a
  Figma-verified two-stop gradient (`brand-plum` → `brand-berry`) for
  actual dimension. The other three tones intentionally keep a flat
  `currentColor` fill rather than extending the gradient treatment to
  tone pairs that were never visually verified in Figma — same
  "don't guess" discipline applied to the choice of what *not* to add.
- **A real bug caught before shipping**: the gradient's `<linearGradient
  id>` was first generated from a module-level mutable counter
  (`gradientCounter++`), which would drift between server and client
  renders and increment on every re-render — an SSR/hydration hazard.
  Replaced with React's `useId()` for a stable, SSR-safe id per instance.
- Figma connection reconfirmed working end-to-end this pass: file
  creation, variable collections, layered vector construction, inline
  `screenshot()` verification, and SVG export all functioned correctly
  against the now-`connected` Figma MCP server.
- **Verified**: no horizontal overflow at 375px/1440px; `tsc --noEmit`
  and `eslint` clean; storefront unit suite 12/12 (45/45); full
  `brand-experience.spec.ts` E2E 8/8 passing live on both breakpoints.

### Epic 13.8 — Hero Ground-Transition Fix & Character Detail Pass (2026-09-27)

Two client-reported issues, addressed as a designer would: a real visual
bug at the seam between the hero and the section below it, and a
character redesign pass for more warmth and a stronger medical identity.

- **The bug**: the "Shop now" tag was visibly sliced in half right at
  the hero/Character-Showcase boundary. Root cause confirmed via
  `getComputedStyle`/`getBoundingClientRect`, not guessed: the tag was
  positioned `-bottom-2` (intentionally hanging slightly past the
  character's feet, like a tag on a garment), and the hero section's
  `overflow-hidden` clipped the ~12px of it that fell outside the
  section's box.
- **The fix, not a patch**: moved the tag to a small positive `bottom`
  offset (fully inside the section, confirmed via the same
  `getBoundingClientRect` check — now 8px of clearance instead of 12px
  of overflow), and separately added `SectionWave` (new decorative
  primitive, `components/brand/decorative/section-wave.tsx`) — a soft
  two-hump ground line that turns the hero's hard pink-to-cream color
  cut into an intentional "sky meets ground" transition, `z-[5]` so the
  character always stands in front of it.
- **Character redesign**: `ZaGirl` gained simple elegant eyes, thin
  eyebrows, and a quiet smile (kept minimal and downturned rather than
  round/cartoon, to stay editorial rather than cute), plus an open
  lab-coat collar layered over the dress — the clearest medical-identity
  cue on her yet, alongside the stethoscope. Figma/Canva were checked
  (`session_connectors_status`) and confirmed still `needs_auth` in this
  session — not usable despite being added to the account, since adding
  a connector isn't the same as signing into it (the user needs to open
  `/mcp` and authenticate). Disclosed directly rather than silently
  working around it; this pass was hand-built in SVG/CSS, same as
  `ZaGirl`'s first version.
- **Verified**: the clipping fix confirmed numerically (not just by
  eye) before and after; no horizontal overflow at 375px/1440px;
  `tsc --noEmit` and `eslint` clean; storefront unit suite 12/12
  (45/45); full `brand-experience.spec.ts` E2E 8/8 passing live.

### Epic 13.7 — ZA Pink Cartoon World (2026-09-25)

Explicit reset: not a hero refinement, but a new visual direction — the
site should feel like a coherent illustrated pink fashion world, not a
normal ecommerce site with pink accents. Delivered this pass: the
homepage hero rebuilt around a real illustrated character, plus a
pink/cream/lavender color rhythm across the existing homepage sections.
Product/Category/Collection pages, Cart, and Checkout are explicitly
**not** touched this pass — see the deferred-scope note below.

- **`ZaGirl`** (new, `components/brand/za-girl.tsx`): the first of the
  eventual 10 ZA characters, hand-built as an editorial fashion-croquis
  silhouette (confident flat shapes, no literal facial features) rather
  than a cartoon-cute face — chosen deliberately, since a detailed
  cartoon face was assessed as high-risk of reading as cheap clip-art
  without a real illustration pipeline (still disclosed as Known Gap 34).
  Her dress takes the same rose/plum/gold/lavender tone system as every
  other brand component. A first pass rendered her face as a stark white
  oval against near-black hair — a real, ugly "ghost mask" effect caught
  via live visual verification; fixed by warming the hair to
  `brand-berry`, the face to `brand-blush`, narrowing the hairline into a
  center part instead of a solid hood shape, and adding two small
  low-opacity blush dots for warmth.
- **`Bow`** (new decorative primitive, `components/brand/decorative/
  bow.tsx`): a ribbon-bow accent for general scene-dressing. Deliberately
  a *separate* asset from the `Logo`'s own bow mark, which ADR 0029
  reserves for the logo/packaging/section-dividers only — reusing the
  reserved one for casual decoration would have violated the identity
  system's own documented rule.
- **Hero rebuilt again**: she now stands grounded directly in a
  full-bleed pink gradient scene (`bg-brand-gradient-hero`, an existing
  token) — no card, no frame, no cream negative-space column. A real
  product photo tags onto her hand when available; "Shop now" tags onto
  her base like a garment label; the headline floats above her as a
  short rotated phrase; flowers/hearts/stars/clouds/sparkles/the new bow
  scatter through the space.
- **A systemic bug found and fixed**: `animate-brand-fade-up`'s keyframe
  sets a literal `transform: translateY(...)`, which silently overrides
  any static `rotate-*`/`translate-x-*` utility placed on the *same*
  element. A first pass had the whole character wrapper losing its
  `-translate-x-1/2` centering entirely (rendered flush against the
  right edge, confirmed via `getComputedStyle` showing an identity
  transform matrix) and the headline/CTA/product-tag losing their
  rotation. Fixed by splitting every rotated/centered piece into an
  outer wrapper that owns the static transform and an inner element that
  owns the animation — never both on one node. Did not touch the shared
  `tailwind.config.ts` keyframe itself (used extensively elsewhere in
  the codebase); documented the pattern in a code comment so it isn't
  rediscovered the hard way again.
- **Homepage color rhythm**: Art/Story Wall and Rotating Artwork moved
  from plain cream to `bg-brand-blush` (soft pink), Doll Dress-Up moved
  from blush to `bg-brand-lavender-tint` (the sequence's one rare
  accent, per ADR 0029 §4) — Character Showcase/10 Products Showcase/
  Medical Lifestyle/Instagram stay cream so the rhythm reads as
  intentional alternation, not uniform color. Newsletter's existing plum
  gradient is unchanged. All existing tokens, no new colors.
- **Deferred, explicitly**: the brief asked for this visual language
  across Product/Characters/Artwork/Collections/Cart/Checkout too. Not
  attempted this pass — Cart and Checkout are real commerce flows this
  session is instructed not to break, and a good-faith site-wide rollout
  (10 product mini-scenes, a Characters page, Collections restyle) is
  realistically its own multi-epic scope, not something to do shallowly
  in the same pass as inventing the first character asset. Flagged as
  the next epic's natural scope rather than attempted piecemeal.
- Figma-based design/handoff/motion skills were not available (no
  Figma connection authorized this session, same disclosed gap as every
  prior brand epic); `design-critique`/`design-system` were applied
  directly rather than re-invoked a third time on the same generic
  template output.
- **Verified**: no horizontal overflow at 375px/1440px (confirmed via
  `scrollWidth`/`clientWidth`, not just visual inspection, given the
  transform bug above); the centering/rotation fixes confirmed via
  `getComputedStyle` transform matrices, not just screenshots; zero
  console errors on the corrected build; `tsc --noEmit` and `eslint`
  clean on every changed file; storefront unit suite 12/12 (45/45); the
  full `brand-experience.spec.ts` E2E file 8/8 passing live, unchanged
  since the headline text and CTA label/href didn't change this pass.

### Epic 13.6 — Hero Concept Reinvention (2026-09-25)

Explicit direction after Epic 13.5: stop refining the same concept —
the full-bleed poster hero was still, structurally, a headline-left/
artwork-right (then headline-over-artwork) hero. Rebuilt from a
different compositional idea entirely: a single pinned "moodboard"
cluster, not a text column plus an image zone.

- **One cluster, not two zones**: the character card, the real product
  photo, and the "Shop now" action are pinned to the same tilted card
  like tags on a garment (product on one corner, CTA on the other),
  with the headline overlapping its top edge on a deliberately
  different rotation/alignment so the two never line up into a tidy
  stack. There is no left column and no right column.
- **Typography as texture, not copy to read**: the existing script
  tagline ("wear your story") now runs behind the whole scene at
  oversized scale, cropped by both viewport edges, `aria-hidden` since
  it's decorative rather than content. The actual `<h1>` was shortened
  from a marketing sentence to a short editorial phrase ("Find your
  fit."); the previous descriptive subtitle paragraph was removed from
  visual display entirely (kept `sr-only` for SEO/accessibility) per
  explicit "no paragraph" direction.
- **Desktop reworked, not just scaled**: an initial pass that scaled
  the same compact mobile cluster up for desktop left large empty
  margins on a wide viewport — a real instance of the "huge empty
  areas" anti-pattern. Fixed by growing the cluster substantially
  (character 260px → 340px, cluster 440px → 520px), shifting it
  off-center rather than mirror-centered, and adding a second
  decorative anchor (`Flower`, desktop-only) to use the freed width
  intentionally instead of leaving it blank.
- **Depth via layering, not scroll-linked JS**: real-time-motion depth
  comes from z-index stacking (background texture → ambient decorations
  → character card → pinned tags → logo) plus the existing differential
  float speeds (`animate-brand-float-slow` on the character vs. the
  faster default on small ambient pieces), not from
  `window.addEventListener('scroll')` parallax — deliberately avoided,
  same reasoning as Epic 13.4/13.5 (hero is above the fold by
  definition; no scroll-driven-animation pattern exists anywhere else
  in this codebase).
- Figma-based design/handoff/motion skills were not available (no
  Figma connection authorized this session, same disclosed gap as
  every prior brand epic) — `design-critique` and `design-system` were
  used to diagnose the structural problem before implementing directly
  in code.
- **A real bug caught mid-build**: a stale `min-h-[90dvh]` section
  height, left over from the previous full-bleed concept, produced a
  large dead-space gap below the new, much more compact cluster on
  mobile — exactly the "huge empty areas" failure mode the brief called
  out by name. Fixed by reducing the section to `min-h-[72dvh]` and
  repositioning the background type/decorations to fill the shorter
  canvas instead of floating in empty space.
- **Verified**: no horizontal overflow at 375px or 1440px; zero
  console errors on the corrected build; `tsc --noEmit` and `eslint`
  clean on every changed file; storefront unit suite 12/12 (45/45); the
  full `brand-experience.spec.ts` E2E file 8/8 passing live, including
  the hero's own updated heading ("Find your fit.") and "Shop now"
  link assertions.
- **Environment note**: the local dev server's `.next` cache went
  stale mid-session twice more (same recurring pattern disclosed since
  Epic 13.3/Known Gap 35) — once producing a build where the newest
  Tailwind utility classes weren't in the served stylesheet (the pinned
  cluster silently failed to render at all until fixed), once with
  core `_next/static` chunks 404ing outright. Both resolved with the
  established fix (stop the dev server, delete `.next`, restart); the
  separate server Playwright's own `webServer` config spins up for E2E
  runs was unaffected both times, which is why the test suite stayed
  green throughout.

### Epic 13.5 — Hero Art Direction Rethink (2026-09-25)

A follow-up to Epic 13.4's hero, rejected on sight: the two-column
"boxed illustration panel + stacked text" composition still read as a
conventional ecommerce/SaaS hero despite the brand palette and
hand-drawn decorative vocabulary. Diagnosed via a structural critique
(not a color/type problem): the artwork was contained in a rounded card
with margin on every side, image and text occupied two fully separate
stacked bands with a hard boundary, and the copy followed the generic
"eyebrow → H1 → subhead → CTA" template rhythm.

- **One full-bleed poster composition** replaces the two-column card:
  the illustrated scene now spans the entire hero section (no rounded
  container, no margin), with the headline layered directly over the
  artwork instead of stacked below it in its own band.
- **The character breaks the grid**: `PortraitBlob`, scaled up
  significantly, is positioned asymmetrically off the section's own
  right edge (clipped by the section, not by the page) so it reads as
  artwork escaping the normal content column rather than an icon
  centered in a box — this is the brief's requested "visual surprise,"
  chosen because it reuses the existing character system as-is and
  directly sets up the disclosed future character → product → color →
  PDP architecture.
- **Logo demoted to a small corner signature stamp** (`Logo
  variant="compact"`) instead of its own row in the text stack;
  rendered `aria-hidden` since the header immediately above it already
  provides the one accessible "go home" link — avoids a duplicate,
  redundant screen-reader stop.
- Real product photo (when present) stays woven into the scene as a
  tilted keepsake-photo tag pinned near the character, now correctly
  gated behind the same `product?.ogImageUrl` check as its "this
  season" sticker (previously the sticker rendered unconditionally and
  floated with nothing to tag when a product had no image).
- **Two real bugs caught during this pass**: the `title` prop had
  become dead code (headline text was accidentally hardcoded instead of
  interpolated — caught by lint's `no-unused-vars`, fixed by rendering
  `{title}`); and the subtitle's `brand-mauve` color, fine against the
  old plain-cream background, fails WCAG contrast (~2.7:1) once the
  copy sits directly on the vivid gradient scene — fixed to `brand-ink/
  80` (~6:1+).
- Motion stays on the existing token set only (`animate-brand-fade-up`
  staggered entrance, `animate-brand-float-slow` idle float on the
  character) — no new animation library. Scroll-linked parallax was
  considered and deliberately dropped: the hero is above the fold by
  definition, the codebase has no scroll-driven-animation pattern
  anywhere else, and the brief's own reference skill bans naive
  `window.addEventListener('scroll')` — the ambient float already reads
  as "alive" without it.
- Figma-based design/handoff skills were not used: no Figma connection
  is authorized this session (same disclosed gap as every prior brand
  epic) — implemented directly in code instead, per the brief's own
  fallback instruction to make the call rather than ask.
- **Verified**: no horizontal overflow at mobile (375px) or desktop
  (1440px) widths; zero console errors; `tsc --noEmit` and `eslint`
  clean on the changed file; storefront unit suite still 12/12 suites
  (45/45 tests); the full `brand-experience.spec.ts` E2E file 8/8
  passing against the live server, including its own hero-heading and
  CTA assertions.

### Epic 13.4 — Editorial Hero Redesign (2026-09-24)

The homepage's first viewport (`BrandHero`) was rebuilt from a centered,
symmetric marketing banner into an asymmetric "editorial illustrated
fashion experience" — explicitly not a new brand identity: no new logo,
no new palette, no new component family. Everything is composed from
pieces the identity system already had.

- **Layout**: a two-column asymmetric split (`grid-cols-[1fr_1.05fr]` on
  desktop) replacing the old dead-centered stack. Mobile collapses to
  artwork first, then the small logo mark, script tagline, headline, and
  CTA — per explicit direction, not a mechanical column-to-rows stack.
- **Logo**: switched from the giant centered `primary` lockup to the
  small `wordmark` variant in the corner, the "small ZA brand mark"
  structure the brief asked for — still the same real `Logo` component
  asset, never recreated as HTML text. The `primary` lockup stays
  reserved for its own moment elsewhere if a future epic wants it back.
- **Character**: `PortraitBlob` (the identity system's disclosed
  placeholder character language, [ADR 0029] §6) scaled up and placed
  inside the illustrated scene itself rather than in a separate card, so
  it reads as part of the artwork.
- **Product**: one real, live product photo (`Product.ogImageUrl`, the
  same field `ProductCard` already uses) pinned into the scene as a
  tilted keepsake-photo card with a `PaperTape` accent, sourced from the
  homepage's existing `featured` products query. No fabricated preview;
  gracefully omitted when a product has no uploaded image (true of this
  environment's current seed data).
- **Copy**: headline changed to "Medical wear, dressed like fashion." (a
  short editorial statement, replacing the descriptive "Soft, modern
  medical wear"); subtitle rewritten to drop an em dash it previously
  contained. `brand-experience.spec.ts`'s two assertions on the old
  headline text updated to match.
- **Motion**: staggered entrance (`animate-brand-fade-up`, existing
  token, incremental delays) plus the scene's existing ambient float/
  twinkle decorations — no new animation library or keyframes added,
  everything reuses tokens already in `tailwind.config.ts`; respects
  `prefers-reduced-motion` via the same global override already in
  `globals.css`.
- **Verified live**: desktop asymmetric composition, mobile artwork-first
  collapse with no horizontal overflow, 2-line headline wrap on mobile,
  logo renders as the real asset, `tsc --noEmit` clean, `eslint` clean on
  every changed file (once past this session's recurring `node_modules`
  corruption — see Known Gap 35). The `next build`-dependent turbo
  `type-check`/`lint` tasks could not be exercised end-to-end this pass
  because the local API kept crashing on the same recurring corruption
  mid-session (a different package, `lodash.isinteger`, each time);
  direct `tsc`/`eslint` invocations on the changed files were used
  instead to get real signal despite the environment issue.

### Epic 13.3 — Homepage & PDP Structure Alignment (2026-09-24)

A client-supplied site-structure outline (Home: Hero Illustration / Art
Story Wall / 10 Products Showcase / Doll Dress-Up / Rotating Artwork /
Footer; Product: Visual / Colors / Sizes / Story-Illustration / Add to
Cart) drove a homepage section consolidation and a deliberate PDP
simplification. Scope confirmed explicitly per-section before building:
the homepage keeps every existing section (Character Showcase, Medical
Lifestyle, Instagram grid, Newsletter, TrustBadges are untouched) and only
adds/renames/consolidates the outline's named items; the PDP is a real,
disclosed content removal, not an oversight.

- **`ArtStoryWall`** (new, `apps/storefront/src/components/brand/
  art-story-wall.tsx`): consolidates the former Featured Collection
  `StorySection`, the Our Story `StorySection`, and the Brand Philosophy
  `QuoteSection` into one gallery-wall composition — tilted, paper-taped
  panels with real linked products, replacing three separate homepage
  sections with one.
- **"10 Products Showcase"**: a new `pickTenProducts()` de-duplication
  helper pools Featured/Best-Sellers/New-Arrivals into a single curated
  grid (capped at 10, no repeats across lists), replacing the three
  separate `ProductShelf` sections it superseded.
- **"Doll Dress-Up"**: the existing Dress Showcase section, renamed only
  (component and placeholder-asset behavior unchanged — still disclosed
  from Epic 13.2 as pending real character-illustration assets).
- **`RotatingArtwork`** (new, `apps/storefront/src/components/brand/
  rotating-artwork.tsx`): a purely decorative, auto-advancing carousel of
  4 abstract brand-decorative scenes (no product data). Auto-rotates every
  4.5s, pauses on hover/focus, respects `prefers-reduced-motion`, with
  manual prev/next controls and a `role="tablist"` dot indicator.
- **Product Detail Page simplified**: per explicit direction, removed
  Breadcrumbs, the description/specifications `Accordion`, all three
  `ProductRail`s (related/cross-sell/up-sell), and the review section —
  narrowing the page to Product Visual → Colors/Sizes/Add to Cart → Story/
  Illustration. The underlying components and API data are untouched and
  still used elsewhere (e.g. `ReviewSection` stays covered by its own
  spec); this is a presentation choice, reversible without any backend
  change. Confirmed via production build output: the `/products/[slug]`
  route bundle dropped from 9.39 kB to 6.75 kB.
- **Bug fix, found during this pass's visual QA**: `home-content.tsx`'s
  Instagram placeholder grid mapped `INSTAGRAM_TILE_TONES` (which
  legitimately repeats `'plum'` twice for its 4-tile pattern) with
  `key={tone}` — a real React duplicate-key warning, unrelated to this
  epic's own changes but caught while verifying the page live. Fixed to
  `key={`${tone}-${index}`}`.
- **E2E spec fix**: `brand-experience.spec.ts` referenced the old "Dress
  Showcase" heading text; updated to "Doll Dress-Up" to match the rename.
- **Quality gates**: type-check/test/build clean across the monorepo
  (storefront: 12 suites / 45 tests; `packages/ui`: 9 suites / 34 tests;
  `apps/api`: 135 suites / 655 tests). Storefront Playwright E2E 16/18 —
  the 2 failures are the same pre-existing, unrelated gaps disclosed since
  Epic 12 (unresolvable seed-image hostname; footer/page heading
  collision). `apps/storefront`'s `lint` task could not be verified this
  pass — see environment note below.
- **Environment note, not a product change**: this session hit the same
  Windows `node_modules` file-duplication corruption disclosed in Epic
  13.2, but this time it reproduced live and repeatedly — a transitive
  ESLint dependency (`safe-regex-test`) reverted to a corrupted
  `safe-regex-test(2)` duplicate within seconds of being manually fixed,
  even with no build process running, and recurred identically after a
  second and third fix attempt. `apps/api`'s dev server also crashed
  independently on a corrupted `lodash.isinteger` copy, and the storefront
  production build hit a genuinely missing (not just misnamed) `zod`
  helper file, reconstructed from its type-only sibling pattern. This is
  stronger evidence of live, real-time interference (most likely Windows
  Defender's real-time protection, confirmed still enabled via
  `Get-MpPreference`) rather than a one-time bad install — a lasting fix
  needs an admin-level antivirus exclusion for the project folder, which
  this session cannot grant itself.

### Epic 13.2 — Storefront-Wide Brand Coverage & Visual QA (2026-09-24)

A visual-audit-driven follow-up to Epic 13.1: extends the ZA Identity
System from the Homepage/PDP/editorial pages to the storefront areas Epic
13/13.1 had deliberately left with the shared `packages/ui` defaults —
Shop/Category/Collection listing chrome, the filter panel, the cart drawer,
checkout page chrome, and every empty/loading state along those paths.
Architecture unchanged from ADR 0028/0029: every restyle is a `className`
override at a storefront call site; the two `packages/ui` components that
had no styling escape hatch at all (`EmptyState`/`ErrorState`'s
`StatePanel`, and `Drawer`) gained additive `className`/`iconClassName`/
`titleClassName` props (same pattern already established for `Accordion`/
`Input`/`Textarea` in ADR 0028/0029) — defaults unchanged, so `apps/admin`
(which uses neither component) is provably unaffected, confirmed via its
own full lint/type-check/test/build pass.

- **Shop, Category, and Collection listing pages**: root containers, the
  sort/filter chrome, `FiltersPanel`'s four `Select`s + two `Input`s +
  three `Checkbox`es, `Pagination`, and the Categories/Collections index
  pages all now carry the `brand-*` palette in light mode while keeping
  their existing dark-mode support completely unchanged (per ADR 0028 §7's
  scope boundary — these pages were never meant to become fixed-light).
- **`ProductCard`** (`apps/storefront/src/features/products/components/
  product-card.tsx`, storefront-local, not `packages/ui` — safe to edit
  directly): image surface, wishlist button, and price text restyled to
  the brand palette; every listing grid across the site inherits this
  automatically.
- **Cart drawer and checkout**: the drawer panel, line items, and
  buttons/inputs use `brand-*` tokens; the checkout page's five `Card`
  panels, headings, payment radio accent color, and submit button are
  restyled without touching any form registration, validation, or mutation
  logic — verified via the full `cart-and-checkout.spec.ts` and
  `track-order.spec.ts` E2E specs, both still 100% passing.
- **Empty/loading states**: `ProductGrid`, the Cart drawer, Checkout's
  empty-cart state, and the Categories/Collections empty states all use
  the new `EmptyState`/`Skeleton` brand styling instead of the generic
  neutral-dashed-box default.
- **Disclosed, not built this pass**: the accompanying brief's "10
  reusable characters with real per-color garment overlays" Dress-Up
  requirement needs actual bespoke character illustration assets (matching
  the client-supplied "Rose" character-sheet reference) — a real
  illustration/asset-production pipeline, not a coding task, and outside
  what this session can produce (no image-generation tool available). Per
  explicit direction, the existing abstract-placeholder Dress Showcase from
  Epic 13 is kept as-is rather than faked with a lower-fidelity system.
  Similarly, the brief's Figma-as-source-of-truth workflow (design
  variables, component sync) requires a Figma connection this session has
  no authorization to open — the token system instead lives as documented
  code (`tailwind.config.ts` + ADR 0028/0029), same as every prior epic.
- **Quality gates**: full monorepo lint/type-check/test/build clean across
  all 9 packages (2 new `packages/ui` test cases added for the
  `Drawer`/`EmptyState` prop extensions); storefront Playwright E2E 16/18
  (the 2 failures are the same pre-existing, unrelated gaps disclosed since
  Epic 12 — an unresolvable seed-image hostname, and a footer/page heading
  collision — neither touched here).
- **Environment note, not a product change**: this session's local
  `node_modules` had accumulated widespread Windows file-duplication
  corruption (dozens of stray `name(1)`/`name(2)` directories across the
  pnpm store, not limited to one package) severe enough that targeted
  repairs stopped holding; fixed with a full `node_modules` wipe and clean
  reinstall (which in turn required regenerating the Prisma Client, since
  that's a manual `apps/api` step in this repo, not a package-install
  hook). Worth excluding the project folder from real-time antivirus
  scanning if this recurs.

### Epic 13.1 — ZA Identity System Rollout (2026-09-12)

A visual-only follow-up to Epic 13, implementing a client-supplied,
production-ready brand identity book (exact colors with WCAG contrast
tables, a real constructed logo, precise motion specs) on top of Epic 13's
groundwork. See [ADR 0029](docs/v2/adr/0029-za-identity-system-rollout.md)
for the full design record — it supersedes ADR 0028's specific palette/logo/
font choices while keeping its architecture (storefront-only `brand-*`
tokens, `packages/ui`/`apps/admin`/backend untouched) unchanged.

- **Color palette replaced wholesale**: Epic 13's `brand-blush/cream/butter/
  sky/plum/glow` scale is retired and replaced with the identity book's exact
  named colors (Cream, Paper, Ink, Plum, Berry, Rose, Petal, Blush, Dusty,
  Mauve, Lavender, Gold, Success, Error — see ADR 0029 §2 for the full
  hex/role table). Every one of the ~22 storefront files using the old
  palette was migrated; verified via grep that no retired class name
  remains anywhere in `apps/storefront/src`.
- **Accessibility fix, not just a reskin**: the identity book's own contrast
  table flags Rose as failing AA for white text — Epic 13 had used a
  Rose-family shade for the Newsletter and Contact-form submit buttons; both
  are corrected to Plum/Berry, the book's actual specified button colors.
- **A real logo**: every plain "ZA Store" text logo (header, footer, hero)
  is replaced with a new `Logo` component built from real Fraunces type
  (not a hand-drawn mark) — italic Rose "Z" + upright Plum "A", with the
  book's bow/ribbon and stethoscope-to-heart marks, in `primary`/`wordmark`/
  `compact` variants and light/dark/on-rose tones. Placed as the homepage
  hero's visual anchor (replacing a generic decorative blob) and in the
  header/footer nav.
- **Typography**: Inter replaced with Nunito Sans as the body/UI font (the
  book explicitly rejects Inter as "the default for every SaaS product").
  Found and fixed a real production-build failure this caused (`next/font`
  has no fallback-metric entry for Nunito Sans in this Next.js version) via
  `adjustFontFallback: false` — confirmed via a full `next build`, not just
  type-check, specifically because this class of failure only surfaces
  there.
- **Tone discipline**: every component's decorative "tone" enum (an
  arbitrary 4-hue invention from Epic 13) is replaced with the book's own
  rose/plum (freely repeatable) + gold/lavender (≤10%, at most one per
  composition, never both together) system; every repeating array on the
  homepage/PDP was hand-curated against this rule.
- **Motion**: every named pattern (ambient float, scroll fade-up, carousel
  slide, wishlist-tap pop, one-time hero reveal) now uses the book's exact
  durations/curves/distances in place of Epic 13's approximations — see
  ADR 0029 §6 for the before/after table.
- **Disclosed, not implemented this pass**: full Arabic/RTL localization
  (the book is itself written Arabic-first) — would require a real i18n
  library, an RTL audit of every page, and a database schema change for
  translated product/CMS content, a substantially larger scope than a
  visual rollout, left as an explicit future epic. Packaging and
  social-media templates (book §12/§13) are print/marketing collateral, not
  implemented in code; the brand pattern (§14) is implemented low-density
  only, as a section-background utility.
- Full quality gates re-run after the rollout: lint/type-check/test/build
  clean across all 9 packages (storefront 45/45 tests, admin 15/15,
  confirming zero admin impact), including a real production build.

### Epic 13 — Brand Experience & Theme Transformation (2026-08-05)

A complete visual-only transformation of the storefront into a premium
illustrated brand experience, inspired by two client-supplied reference
images (a storybook "Medical School" illustration and a dress-up-tool
screenshot). No backend, API, business logic, or admin-dashboard
functionality changed. See [ADR 0028](docs/v2/adr/0028-brand-experience-design-system.md)
for the full extracted design system (color palette, typography, radius/
shadow/gradient tokens, component language, decorative-element library,
motion principles, and the fixed-light-palette rule for full-redesign
pages) and its architectural resolution to the shared-Tailwind-preset
constraint (new tokens live only in `apps/storefront`'s own config,
namespaced `brand-*`; `packages/config/tailwind-preset.js` and every
`packages/ui` component file are untouched).

- **Design tokens**: `apps/storefront/tailwind.config.ts` gains an additive
  `brand-*` color/radius/shadow/gradient/spacing/animation namespace
  (blush/cream/butter/sky/plum families, `brand-radius-sm…blob`,
  `brand-shadow-soft/card/glow`, `brand-gradient-hero/section/newsletter/
  spotlight`, `section-y` spacing, `brand-float/fade-up/twinkle`
  keyframes — all disabled under `prefers-reduced-motion`). One new
  Google Font, Caveat (`--font-script`), added for short accent text only;
  the existing Fraunces/Inter (`--font-display`/`--font-sans`) setup is
  unchanged.
- **Decorative + structural component library**
  (`apps/storefront/src/components/brand/`, storefront-local, never
  `packages/ui`): 10 reusable decorative primitives (`Sparkle`,
  `TwinkleStar`, `Cloud`, `Flower`, `DoodleUnderline`, `MedicalDoodle`,
  `Sticker`, `PaperTape`, `IllustratedDivider`, `FloatingDecoration`) and
  13 structural components (`BrandHero`, `EditorialHeader`, `StorySection`,
  `IllustrationBanner`, `CharacterCard`/`CharacterCarousel`,
  `DressShowcase` — the fashion-game carousel pattern from the reference
  screenshot, `LifestyleSection`, `QuoteSection`, `NewsletterSection`,
  `IllustratedBackground`, `PortraitBlob`, `ArchPlaque`). Character/portrait
  art is an abstract organic-blob-plus-icon placeholder composition (ADR
  0028 §9's disclosed scope decision), not painted figurative art — asset
  production is future-epic work; every component takes its imagery as
  props, never a hardcoded asset path.
- **Homepage**: fully rebuilt per the brief's flow — Brand Hero, Character
  Showcase (6 personas linking into real, already-existing `/shop` filter
  routes), Featured Collection story, Dress Showcase (3 slides built from
  real featured/best-seller/new-arrival data via the unchanged
  `useFeaturedProductsQuery`/`useBestSellersQuery`/`useNewArrivalsQuery`
  hooks), Our Story, three product shelves (Featured/Best Sellers/New
  Arrivals, real `ProductGrid`), Medical Lifestyle, Brand Philosophy quote,
  a disclosed no-live-feed Instagram placeholder grid, Newsletter (local-
  only state, no backend — same disclosed pattern as the existing
  `ContactForm` mailto fallback), and the unchanged `TrustBadges`.
- **Product detail page**: visual-only redesign — an illustrated "Made with
  care" header band and a "Made for the lifestyle" recommendation band
  wrap the page's functional core (gallery, variant picker, `AddToCartForm`,
  specifications, `ProductRail`s, reviews), which is byte-identical and
  still fully theme-aware; only the two new decorative bands render in the
  fixed light palette.
- **About/Contact/FAQ**: `EditorialHeader` (a Server-Component-safe,
  no-hooks illustrated hero band) added above each page's existing
  CMS-driven content; `notFound()`/`ApiError` handling, the CMS fetch
  calls, `Accordion`'s FAQ items, and `ContactForm`'s real mailto
  submission are all unchanged.
- **Header/footer**: restyled as theme-aware global chrome (brand tokens in
  light mode, the pre-existing neutral dark palette untouched in dark
  mode) — unlike the pages above, these stay theme-aware because they're
  shared with untouched, still-fully-dark-mode-capable pages (shop/
  category/collection listings, cart, checkout, account).
- **Shared-primitive legibility fix, disclosed**: `Accordion` (`packages/ui`)
  had its item-title/panel text hardcoded to a `dark:text-neutral-*` class
  with no prop reaching it; under the new fixed-light FAQ page this
  rendered near-invisible in dark mode — not a stylistic mismatch but
  actually broken text, the same failure class as the homepage
  invisible-heading bug this ADR documents. Rather than forking the
  primitive, `Accordion` gained optional `buttonClassName`/
  `panelClassName` props (merged via the existing `cn()` pattern), and
  `Input`/`Textarea` gained an equivalent `labelClassName` prop for the
  same reason on the Contact page. All three are additive, default-
  preserving changes — `apps/admin`'s usage (and the storefront's own
  untouched PDP specifications accordion) is unaffected; full
  `apps/admin` test suite (15/15) and lint/type-check verified green
  after the change.
- **Tests**: 4 new component-test files for the brand layer
  (`newsletter-section`, `dress-showcase`, `character-carousel`, plus a
  new case in `packages/ui`'s existing `accordion.spec.tsx` for the
  `buttonClassName`/`panelClassName` props) — 18 new/updated tests, all
  passing alongside the full existing suite (`packages/ui` 30/30,
  `apps/storefront` 45/45, `apps/admin` 15/15, `apps/api` 655/655
  unit tests, confirming the frozen backend is untouched). One new
  Playwright spec, `brand-experience.spec.ts` (8 tests: illustrated hero +
  real product data, Dress Showcase navigation, Newsletter subscribe flow,
  homepage→PDP navigation, About/FAQ/Contact editorial headers with their
  existing real behavior intact) — all passing, without modifying any
  existing E2E spec.
- **Disclosed, not fixed (pre-existing, unrelated to this epic)**: the full
  storefront E2E run is 16/18 passing (plus the new 8/8 above once merged);
  the 2 failures are the same two gaps Epic 12 already disclosed and left
  unfixed — the wishlist E2E test times out because seeded product images
  point at the unresolvable `images.za-store.local` placeholder hostname
  (present since Epic 3B), and `browsing.spec.ts`'s shop-search test's
  `getByRole('heading', {name:'Shop'})` collides with the footer's
  identical-text "Shop" column heading (present since Epic 10). Neither is
  touched here, consistent with Epic 12's precedent of disclosure over
  unrelated-scope test/product changes.
- Reused shared components rendered inside "always light" sections (e.g.
  `ProductCard` on the homepage) still respond to the site-wide dark-mode
  toggle, since Tailwind's `dark:` variant is driven by an ancestor
  `[data-theme="dark"]` attribute a descendant can't locally override —
  disclosed in ADR 0028's Consequences as an accepted visual seam, not a
  legibility bug (unlike the Accordion/Input case above, which was fixed).
- Build/lint/type-check clean across all 9 packages (including production
  builds of `apps/storefront` and `apps/admin`); `apps/admin`'s own visual
  output, routes, and test suite are unchanged and unaffected — confirmed
  via lint, type-check, full test suite, and live comparison against its
  pre-epic screenshots.

### Epic 12 — Payments & Shipping (2026-08-05)

The full Payments and Shipping bounded contexts, plus the Orders-integration
glue that makes them real: card checkout via Stripe, Cash-on-Delivery,
manual-payment verification, refunds, shipping zones/methods/rates, shipment
dispatch and guest tracking — built on Epic 11's outbox/BullMQ infrastructure
and reusing it without modification. See
[ADR 0026](docs/v2/adr/0026-payments.md) and
[ADR 0027](docs/v2/adr/0027-shipping.md) (which also covers the Orders
fulfillment-sync integration) for the full designs.

- **Payments module**: provider abstraction (`PaymentProviderPort`) with COD,
  Stripe, and Manual providers behind a `PAYMENT_PROVIDER_REGISTRY` map;
  `PaymentSession`/`PaymentTransaction`/`PaymentStatusHistoryEntry`/`Refund`
  entities; Stripe Checkout Sessions via `InitiateCardCheckoutUseCase` +
  webhook-driven `ConfirmCardPaymentUseCase`/`FailCardPaymentUseCase`
  (idempotent); manual-payment verification and refund issuance for staff.
  **Design invariant**: no `Order` exists for a card payment until the
  webhook confirms it — `PaymentSession.pendingOrderSnapshot` materializes
  into a real order only on success, never on the initial request.
- **Shipping module**: provider abstraction (`ShippingProviderPort`, one
  Manual/flat-rate provider today) with Zones/Methods/Rates for rate
  quoting, a `Shipment` entity with its own status machine
  (`PENDING → IN_TRANSIT → DELIVERED`, `→ FAILED`/`RETURNED`) and tracking
  events, a placeholder label-creation abstraction (no real carrier
  integration yet — disclosed gap), and guest-friendly order tracking
  (`GET /shipments/track?orderNumber=&email=`, ownership proven by the
  order/email pair, not a session — identical "not found" for either wrong
  field to prevent enumeration).
- **Orders integration**: `PlaceOrderUseCase` now creates a `Shipment` at
  `PENDING` eagerly, in the same transaction as order confirmation, so a
  COD order is trackable the instant checkout completes.
  `DispatchShipmentUseCase` is the one staff action that walks the linked
  `Order` through every remaining fulfillment hop
  (`CONFIRMED → PREPARING → PACKED → SHIPPED`) before mutating the
  shipment, so a failed order-status transition never leaves the shipment
  durably out of sync with its order — this ordering was a real bug caught
  and fixed via live testing this epic, not a design that shipped first
  try (see below).
- **Admin dashboard**: Payment transactions/status-history/manual-verify/
  refund sections on the Order Detail page; Shipping Zones/Methods/Rates
  CRUD; Shipments list + detail with Dispatch/Mark-delivered actions.
- **Storefront**: real delivery-method selection with a live rate quote on
  the checkout page (previously only a Subtotal line — Shipping and Total
  are new); a real COD/CARD payment choice (previously a single
  disabled-looking COD radio); a Stripe-redirect payment-result page; a
  standalone guest `/track-order` page and an automatic shipment section on
  the customer's own order-detail page.
- **Reused Epic 11 infrastructure unchanged**: the generic
  `OutboxRelayProcessor` needed zero new code for this epic's 5 new event
  types (`PAYMENT_CAPTURED`, `PAYMENT_REFUNDED`, `PAYMENT_FAILED`,
  `SHIPMENT_DISPATCHED`, `SHIPMENT_DELIVERED`) — only
  `DispatchNotificationEventUseCase`'s routing/templates needed extending,
  confirmed by reading the relay's code rather than assumed.
- **Two real bugs found and fixed via live browser testing against the
  running stack** (not just unit tests): (1) `ShippingPolicy`'s transition
  graph only allowed `PENDING → LABEL_CREATED`, but nothing anywhere ever
  writes `LABEL_CREATED` — every dispatch attempt, on every shipment,
  always failed. (2) The original `DispatchShipmentUseCase` mutated the
  shipment to `IN_TRANSIT` *before* advancing the order's status, and
  assumed the order was already `PACKED`; since a fresh order is actually
  `CONFIRMED`, the order-status call always failed, and by then the
  shipment had already committed — leaving `IN_TRANSIT` shipments attached
  to orders stuck at `CONFIRMED` forever. Both fixed; the fix was verified
  by placing a second real order and dispatching it end to end, and by
  inspecting raw network responses (not just the UI) to confirm no
  inconsistent state could be left behind by a partial failure.
- **A third, narrower bug caught in code review, not testing**:
  `OrderPolicy.assertSupportedPaymentMethod` had briefly been broadened
  earlier this epic to accept `CARD` as well as `COD`, on the mistaken
  assumption it was shared across both payment paths. It isn't —
  `InitiateCardCheckoutUseCase` (the real CARD entry point) never calls it.
  Left broadened, a client could `POST /checkout/place-order` with
  `paymentMethod: "CARD"` directly and get an instant, unpaid `Order`,
  bypassing the whole card-payment design. Reverted to strict COD-only.
- **Pre-existing bugs found and fixed this epic, unrelated to Payments/
  Shipping but blocking its own quality gates**: (1) `pino-pretty`'s
  transport spawns a worker thread that Jest's environment can't host,
  breaking every full-HTTP-bootstrap integration test — pre-existing,
  reproduced on an untouched Auth test file; fixed by gating pretty-print
  on `NODE_ENV === 'development'` instead of `!== 'production'`, so Jest's
  `NODE_ENV=test` gets plain JSON logging. (2) `packages/ui`'s
  `ToastProvider` (frozen since Epic 9) gated its `createPortal` call on
  `typeof document !== 'undefined'` alone, which is already true on the
  client's *first* hydration render — one render ahead of the server's
  markup, which had no `document` and thus no portal content. That
  mismatch made React discard and remount the entire app tree on every
  page load in the admin app, breaking every interactive element on first
  render; deferred the portal to a post-mount effect instead. (3) The
  admin login page (frozen since Epic 9) disabled its submit button via
  `disabled={!isValid}` with `mode: 'onBlur'` validation — fragile enough
  that automated form-filling could leave the button stuck disabled
  indefinitely; removed the pre-disable and let `handleSubmit`'s own
  validation gate submission instead, which is what it already does.
  (4) The admin topbar (frozen since Epic 9) rendered the current page
  name as a second `<h1>`, alongside each page's own `PageHeader` — an
  accessibility anti-pattern that also made almost every
  `getByRole('heading', …)` E2E query ambiguous; changed to a `<p>` (the
  real heading is `PageHeader`'s). Together, (2)–(4) were blocking nearly
  every admin Playwright E2E test, old and new — this is very likely the
  first time in this project's session history that a live Playwright run
  against the real stack (Docker Postgres + API + admin) completed enough
  to surface them, since Docker had not reliably been available in earlier
  sessions. All four are minimal, disclosed, behavior-preserving fixes to
  otherwise-frozen files, not scope creep.
- **Tests**: `apps/api` gained 117 new unit tests (655 total, up from Epic
  11's 538) and 54 new integration tests (209 total, up from 155) covering
  the new Payments/Shipping modules — full suite green.
  `apps/storefront` gained 7 new component
  tests (34 total, 9 suites) for the checkout page's delivery/payment
  sections and the payment-result page, plus 1 new Playwright E2E test
  (guest checkout → live order tracking); `apps/admin` gained 3 new
  Playwright E2E files (Shipping Zones/Methods/Rates CRUD, full
  Shipment dispatch→deliver flow with order-status-sync verification) —
  no new admin component tests, matching this repo's existing convention
  of E2E-only coverage for `apps/admin`. Storefront E2E: 9/11 passing, the
  admin: 20/21 — every failure is a pre-existing, unrelated gap (see
  disclosed gaps below), not a Payments/Shipping regression.
- **Disclosed gaps, not fixed (out of this epic's scope)**: two pre-existing
  Epic 10 storefront E2E tests fail for reasons unrelated to Payments/
  Shipping — the wishlist test times out because seeded product images
  point at `images.za-store.local`, a placeholder hostname that's never
  resolved locally (present since Epic 3B's seed data); the shop-search
  test's `getByRole('heading', {name:'Shop'})` collides with the footer's
  identical-text "Shop" column heading (present since Epic 10). One
  pre-existing Epic 9 admin E2E test ("creates a new product") also fails
  for a reason not fully root-caused in the time available — isolated,
  does not block any Payments/Shipping flow, and the underlying Products
  feature is unchanged this epic. A local-dev environment gap was also
  found and fixed in passing: `CORS_ORIGIN` only allowed ports 3000/3001,
  not the 3010/3011 the Playwright E2E `webServer`s actually run on,
  silently turning every cross-origin request into an unhelpful generic
  error instead of a real one.

### Epic 11 — Commerce Services (2026-08-04)

Notifications, CMS, and SEO on top of a from-scratch Event Architecture and
Background Job System (ADR 0002/0003 designs existed but were never
implemented until now — confirmed via grep before writing any code, then
paused with `AskUserQuestion`; the user chose full ADR compliance over a
scoped-down interim version). See [ADR 0023](docs/v2/adr/0023-event-architecture-and-job-system-implementation.md),
[ADR 0024](docs/v2/adr/0024-notifications.md), and
[ADR 0025](docs/v2/adr/0025-cms-and-seo.md) for the full designs.

- **Transactional outbox** (ADR 0002): new `OutboxEvent`/`FailedJobLog` tables;
  every business write that needs to notify anything (`Order.create`/
  `changeStatus`, `Customer.create`, `Review.create`,
  `PasswordResetToken.create`) now inserts its domain event in the same
  Prisma `$transaction` as the write itself — additive-only, no existing
  repository method signature changed except `PasswordResetToken`'s creation
  data gaining `rawToken`/`email` fields the email actually needs to send.
- **BullMQ background jobs** (ADR 0003) via a second NestJS bootstrap file,
  `apps/api/src/worker.main.ts` (`WorkerModule`, run as a separate `za-worker`
  PM2 process from `za-api`) — an outbox-relay processor polls and dispatches
  pending events, a maintenance queue absorbs the pre-existing reservation-expiry
  sweep, and permanently-failed jobs archive to `FailedJobLog` plus raise a
  `SYSTEM` alert `Notification`. `za-api` itself has zero Redis/BullMQ
  dependency — HTTP and worker concerns are split into separate NestJS modules.
- **Notifications module**: Email Service (Nodemailer, Mailpit in dev),
  5 templates (order-placed admin alert, review-submitted admin alert,
  order-status-changed customer, welcome customer, password-reset), a queue
  processor per channel, staff notification preferences
  (`SETTINGS_MANAGE`-guarded) and customer notification preferences, and
  notification history (`AUDIT_LOG_VIEW`-guarded). Event→trigger→recipient
  routing lives in `DispatchNotificationEventUseCase`, listening on the same
  outbox events the relay emits in-process via `EventEmitter2`.
- **CMS module**: one `CmsPage` model for five fixed slugs (about, contact,
  faq, privacy-policy, terms-of-service) — reused the design Category/Collection
  already established (slug + title + body + SEO fields + publish state), with
  a nullable `faqItems` JSON column instead of a second table for FAQ's Q&A
  pairs. Admin CRUD (`CONTENT_MANAGE`-guarded, an already-seeded permission
  that had never been wired to anything) plus a public
  `GET /storefront/cms/pages/:slug` (`PUBLISHED`-only).
- **Admin dashboard**: new CMS pages (list + per-slug editor, FAQ gets a
  `useFieldArray` question/answer editor) and Notifications page (History +
  Preferences tabs) under new "Marketing"/"System" nav entries.
- **Storefront**: About/Contact/FAQ now read from the CMS API instead of
  hardcoded JSX (Contact's `mailto:` form itself is unchanged); two new pages,
  Privacy Policy and Terms of Service; `app/sitemap.ts` (every `ACTIVE`
  product, category, live collection, and `PUBLISHED` CMS page) and
  `app/robots.ts` (Next.js native conventions, both genuinely new — canonical/
  OpenGraph/Twitter/JSON-LD/dynamic metadata already existed from Epic 10 and
  are simply reused on the new/changed pages, not rebuilt).
- **Reused existing RBAC permissions** instead of adding new ones
  (`CONTENT_MANAGE` for CMS, `AUDIT_LOG_VIEW` for notification history,
  `SETTINGS_MANAGE` for staff notification preferences) — Identity's frozen
  `permissions.constants.ts` and seed grants were never touched.
- Tests: 538 unit tests passing for `apps/api` (up from prior epics' count),
  including new coverage for the outbox relay processor, notification
  dispatch routing, and CMS use-cases/entities; 155 integration tests passing
  against real Postgres (Docker was available this session — a first for this
  project's session history), including two new assertions proving
  `OutboxEvent` rows are actually written on order placement and status
  change. Admin gained 15 total component tests (unchanged from Epic 9,
  new CMS/Notifications UI verified live in-browser instead); storefront
  gained no new component tests (CMS-backed pages are server components with
  no new client logic to unit-test) but were verified live in-browser
  (About/FAQ/Privacy/Terms render seeded content; `/sitemap.xml` and
  `/robots.txt` return correct output). Full monorepo build/lint/type-check
  clean.
- Fixed two unrelated pre-existing environment issues found while verifying:
  (1) `apps/storefront` had no `.env.local`, so it silently pointed at the
  wrong API port (`4000` instead of the actually-running `4100`) exactly like
  `apps/admin` did in an earlier session — same fix, a local env file pointing
  at port 4100. (2) The dev database had never had `seedCms()` run against it
  (added mid-epic, after the last interactive seed), leaving all 5 CMS pages
  genuinely absent in Postgres despite existing in code — fixed by running
  `pnpm prisma db seed` (idempotent, upsert-based, safe to re-run).
- Also hit the same class of pnpm-store corruption from earlier sessions
  (missing package contents behind valid symlinks) three more times this
  epic, for `statuses`, `picocolors`, and `string-width` — each repaired the
  same way, `pnpm install --force`.

### Epic 9.5 — Public Catalog API (2026-08-03)

Closes the gap ADR 0020 found and Epic 10 paused on — an additive, backend-only
extension of the Catalog module. No schema migration; no existing route's behavior
changed; every new route is a thin composition over already-existing use-cases
(ADR 0021).

- **New public routes**, all on `StorefrontCatalogController` (`catalog/storefront`,
  already `@Public()`): `GET /products` (paginated list/search/filter/sort, ACTIVE-only,
  forced server-side), `GET /products/:slug` (single product), `GET /products/:slug
  /detail` (product + variants + media + specifications + related + cross-sell +
  up-sell, one call), `GET /products/:productId/variants` (standalone variant read),
  `GET /collections` (list-all, closes gap #14 — never existed before, admin or public),
  `GET /collections/:id/products` (a second, correctly ACTIVE-only route alongside the
  older, unchanged `GET /catalog/collections/:id/products`).
- **New use-cases**, each a thin composition, none duplicating existing logic:
  `GetPublicProductBySlugUseCase` (the one genuinely new rule — slug→ACTIVE gate, using
  `ProductRepository.findBySlug()`, which already existed for admin uniqueness checks
  but was never exposed as a read path), `GetPublicProductDetailUseCase` (delegates to
  the existing `GetProductDetailUseCase` + three parallel calls to the existing
  `ListProductRelationsUseCase`), `ListPublicProductVariantsUseCase` (delegates to the
  existing `ListProductVariantsUseCase`), `ListPublicCollectionsUseCase` (the repository's
  `list()` already existed, just never had a use-case or route in front of it — filters
  via `Collection.isCurrentlyLive()`, the entity's own pre-existing method),
  `ListPublicCollectionProductsUseCase` (delegates to the existing
  `ListCollectionProductsUseCase`, adds the stricter ACTIVE-only filter this epic's
  rule requires).
- **`ProductListFilters` gains four optional fields** (`priceMin`, `priceMax`, `colorId`,
  `sizeId`), extended additively in the one shared interface/`PrismaProductRepository
  .list()` both admin and public callers use — the admin `ListProductsQueryDto` never
  sends them, so its behavior is unchanged.
- **Three scope items needed zero new code**, already fully public since earlier epics:
  category listing/tree (Epic 6), product relations/cross-sell/up-sell as a standalone
  endpoint (Epic 3B), and products-by-category (now just a `categoryId` query param on
  the new `GET /products`, matching how the admin equivalent already works).
- **Disclosed, deliberate discrepancy**: the older `GET /catalog/collections/:id/products`
  (public since Epic 3A/6) only excludes `ARCHIVED` products, not `DRAFT` — left
  completely unmodified per "keep admin endpoints unchanged," rather than silently
  changing behavior of a pre-existing route. The new `GET /catalog/storefront/collections
  /:id/products` is the correct, ACTIVE-only path forward for Epic 10 to use.
- Tests: 13 new unit tests (5 new spec files, one per new use-case) plus 2 new
  integration test cases extending the existing `prisma-product.repository.integration
  .spec.ts` for the price-range and color/size variant filters. Full suite: 518 unit
  tests passing (up from 505); build/lint/type-check all clean. Integration tests are
  written but, as with every prior epic in this environment, require Docker Postgres to
  actually execute — not run here.
- `PROJECT_STATUS.md` gap #15 closed; Epic 10 (Storefront Release) may now resume.
- See [ADR 0021](docs/v2/adr/0021-public-catalog-read-api.md) for the full design.

### Epic 10 — Storefront Release (2026-08-03)

Resumed after Epic 9.5 closed the public-catalog gap. Full customer-facing storefront
against the Public Catalog API (ADR 0021) exclusively — no admin endpoints, no new
frontend business logic. See [ADR 0022](docs/v2/adr/0022-storefront-frontend-architecture.md)
for the full architecture.

- **New shared UI primitives** in `packages/ui`: `Drawer` (slide-in panel, reuses
  `Dialog`'s focus-trap/Escape/backdrop pattern), `Accordion`, read-only `Rating`,
  framework-agnostic `Breadcrumbs` (takes a `linkComponent` prop so the package never
  imports `next/link`), `QuantityStepper`. 29 new component tests.
- **Storefront infra**: API client + customer-auth token storage mirroring ADR 0019's
  admin pattern in a separate `za-customer-auth` localStorage namespace; guest-cart
  token (`za-guest-token`, reuses ADR 0018 §3's existing merge-on-login use case rather
  than duplicating it); React Query provider with SSR hydration boundaries for every
  SEO-critical page; SEO helper (`buildMetadata`) and a small `JsonLd` component for
  `WebSite`/`Product`/`AggregateRating`/`FAQPage` structured data.
- **Pages**: Homepage (Featured/Best Sellers/New Arrivals), Shop (search/filter/sort/
  pagination), Categories (tree browsing + per-category listing), Collections (index +
  detail), Product Detail (gallery, variant picker, specifications, related/cross-sell/
  up-sell, reviews), Wishlist, Cart (drawer + full page), Checkout (guest + customer),
  Customer Account (profile, addresses, order history/tracking), Login/Register,
  About/Contact/FAQ, 404/error boundaries.
- **Disclosed gaps worked around without new backend logic**: no category/collection
  by-slug endpoint (resolved by searching the already-fetched tree/list in memory); no
  cover-media field on list-view products (reuses `ogImageUrl`, avoiding an N+1 fetch
  per grid); no guest order-lookup endpoint (order confirmation reads from the React
  Query cache set at placement time only — a hard refresh loses it, with a fallback
  pointing signed-in customers at Order History); customer-facing order notes are
  filtered client-side to hide `isInternal` staff notes (a display filter, not new
  business logic — the API doesn't filter these itself); Contact page has no backing
  endpoint, so the form opens a pre-filled `mailto:` link instead of fabricating a
  submission handler.
- Tests: 27 new component tests across 7 files (login, search, wishlist toggling,
  add-to-cart variant matching, review submission, contact form, auth-gated routes) plus
  10 Playwright E2E specs covering guest browsing/search, guest cart + checkout end to
  end, and signed-in account/wishlist/order-history flows. Build/lint/type-check all
  clean. E2E specs are written and verified to parse/list correctly but, as with every
  prior epic in this environment, require the real API against a seeded Postgres to
  actually execute — not run here (no Docker daemon available).
- Fixed an unrelated pre-existing environment issue found while running the first test
  pass: a corrupted `strip-ansi` package under the shared pnpm store (missing package
  contents behind an otherwise-valid symlink) was breaking `jest` for every app in the
  monorepo, not just the storefront. Repaired by re-running `pnpm install`.

### Epic 10 — Storefront Release, first attempt (2026-08-03) — **paused, not implemented**

**Investigated, then stopped before writing any `apps/storefront` code.**

- Before touching the storefront, read the actual `apps/api` catalog
  controllers directly (not just `PROJECT_STATUS.md`'s summary, which
  understated this). Confirmed: `ProductsController`'s list/get/detail
  routes are guarded end to end, by explicit design — its own docblock
  says storefront reads belong on `StorefrontCatalogController`
  instead. The *entire* public product-browsing surface is three fixed,
  unpaginated curated shelves (Featured/Best Sellers/New Arrivals) plus
  `GET /catalog/collections/:id/products` (itself unreachable without
  already knowing a collection id — no list-all-collections endpoint
  exists). No search, no filters, no products-by-category, and no
  public product-variant read exist anywhere in the API.
- This directly conflicts with the epic's own constraints ("no business
  logic in the frontend," "all state comes from the existing API") for
  five of the scoped areas — Shop, Search, Filters, Categories (product
  listing), and arbitrary-product-id Product Details cannot be built as
  real features against this API without either faking a browse
  experience out of ~a dozen curated products or violating those same
  constraints.
- Presented this finding to the user with three options (build a thin
  disclosed wrapper anyway; pause and recommend a backend follow-up
  first; build everything *except* the catalog-browsing pages at full
  quality). **User chose: pause the epic and prioritize a backend
  follow-up first.**
- [ADR 0020](docs/v2/adr/0020-storefront-release-paused-catalog-read-gap.md)
  records the full finding, the decision, what already *does* have solid
  backend support and could ship immediately in a re-scoped attempt
  (Cart, Checkout, Customer Account, Wishlist, Reviews, logged-in Order
  History), and a concrete, schema-free backend follow-up scope: a
  public product list/search/filter endpoint, a public product-by-id/
  slug read (ACTIVE-only), a public product-variant read, and
  `GET /v1/catalog/collections` (list-all).
- `PROJECT_STATUS.md` gap #15 rewritten to reflect the true scope of the
  gap (previously framed narrowly as "no by-slug variant"); a new
  top-priority "Open items" entry points future work at the ADR 0020
  follow-up.
- `apps/storefront` is unchanged — still exactly the Epic 1 placeholder
  (root layout, header, footer, one placeholder homepage). No dependencies
  added, no test tooling set up, no quality gates run, since nothing was
  implemented.

### Epic 9 — Admin Dashboard (2026-08-03)

**Added**

- [ADR 0019](docs/v2/adr/0019-admin-dashboard-frontend.md) — the epic's
  governing design: TanStack Query + a thin `apiFetch` wrapper decoding
  the existing ADR 0016 envelope (no DTO codegen); auth tokens held in a
  `localStorage`-backed `AuthProvider`, a disclosed SPA-without-BFF
  trade-off; no client-side permission-based nav hiding (the API has no
  `/auth/me/permissions` endpoint) — every nav item is always visible and
  a `<ForbiddenState />` handles a real 403 per page instead; five
  disclosed backend-shaped constraints (no Dashboard/stats endpoint, no
  list-all-collections, no list-all-customers, no list-all-reviews, no
  Store Settings endpoint at all); a "Staff" (Admin Users) page added as
  the only functional companion to the read-only Roles/Permissions
  endpoints; new shared components added to `@za/ui` rather than built
  locally in `apps/admin`; `lucide-react` as the monorepo's first icon
  dependency; `next/jest` + React Testing Library for component tests
  and Playwright for E2E, both new to the repo.
- `@za/ui` gained its first Table/Badge/Select/Dialog/Toast/Pagination/
  Checkbox/Textarea/Skeleton/Tabs/Switch/Callout/Spinner/state-panel
  components (`DataTable`, `Badge`, `Select`, `Dialog`, `ToastProvider`/
  `useToast`, `Pagination`, `Checkbox`, `Textarea`, `Skeleton`, `Tabs`,
  `Switch`, `Callout`, `Spinner`, `EmptyState`/`ErrorState`/
  `ForbiddenState`), all dark-mode-aware from the start; `Button`/`Card`/
  `Input`/`Heading`/`Text` — light-only until now — were patched with
  `dark:` classes.
- `apps/admin` real infrastructure: `apiFetch`/`apiFetchPaginated`
  (`src/lib/api/client.ts`) with transparent one-shot access-token
  refresh on a 401; `AuthProvider`/`useAuth` (`src/lib/auth/`) wired to
  the real `POST /v1/auth/login` (replacing the Epic-1-era placeholder
  submit handler) and `POST /v1/auth/logout`; a `QueryClientProvider`
  (`src/lib/providers.tsx`); an auth guard in `(dashboard)/layout.tsx`
  redirecting to `/login` when signed out.
- All fifteen scoped feature areas, each with loading/error/empty states,
  React Query data-fetching, and react-hook-form + zod validation on
  every form: **Dashboard** (stat cards + recent orders, composed
  client-side from existing list endpoints — no aggregate endpoint
  exists); **Products** (list/create/edit/status/tags plus a tabbed
  detail page for Variants/Media/Specifications, each variant row
  offering a copy-id action since Inventory has no product/variant
  search); **Categories** (list/create/edit/active-toggle/delete);
  **Collections** (create + lookup-by-ID managed view — no list-all
  endpoint exists); **Brands**, **Tags**, **Colors**, **Sizes**
  (list/create/edit/delete); **Inventory** (Warehouses, Stock lookup
  with receive/adjust/return/threshold actions + movement history,
  Low Stock, Reservations lookup-by-ID with confirm/release);
  **Orders** (list/detail/advance-status/cancel/notes); **Customers**
  (lookup-by-ID profile + order history — no list-all endpoint exists);
  **Reviews** (pending-moderation queue, approve/reject — no full
  history endpoint exists); **Roles** (read-only, view permission set
  per role), **Permissions** (read-only catalog, flags the six seeded
  keys with no backing route), **Staff** (Admin Users
  list/create/activate/deactivate/role-reassign); **Store Settings**
  (a disclosed placeholder — no backend endpoint exists at all).
- Sidebar/topbar overhaul: full `NAV_GROUPS` (Catalog/Operations/
  Marketing/System, per docs/09-DESIGN-SYSTEM.md §7) replacing the
  single-item placeholder nav; a mobile hamburger drawer (`Sidebar`/
  `Topbar` now take `isMobileOpen`/`onOpenMobileNav` props) where none
  existed; a user menu with sign-out in the topbar.
- Component tests (`next/jest` + React Testing Library): 11 new tests in
  `@za/ui` (`Badge`, `DataTable`, `Dialog`) and 15 new tests in
  `apps/admin` (`LoginPage`, `PageHeader`, `useTableState`,
  `buildQueryString`).
- Playwright E2E suite (`apps/admin/e2e/`, 17 tests across 9 files) for
  the critical flows: login (redirect-when-signed-out, wrong-password,
  successful login + session-survives-reload), Brands full CRUD, Orders
  (view + add note), Inventory (tab navigation), Reviews (empty-state
  queue), Products (search + detail + create), Roles/Permissions/Staff
  (view permissions, view catalog, create + reassign-role + deactivate a
  staff account), and responsive/dark-mode behavior. A `setup` project
  logs in once and reuses the session via Playwright `storageState`
  across every other spec, respecting staff login's 5-req/60s rate limit
  (ADR 0017 §6). **Not part of `turbo run test`** (same reasoning as
  `test:integration`) — needs the real API + a seeded Postgres up, run
  via `pnpm --filter @za/admin test:e2e`.

**Fixed**

- `apps/admin`'s `dev`/`start` scripts hardcoded `--port 3001`, which
  fights any tool that assigns its own port via the `PORT` env var
  (Next.js already reads `PORT` automatically when no `-p` flag is
  given). Removed the hardcoded flags.

**Quality gates**: build, lint, and type-check pass clean across the
whole monorepo (including `apps/storefront`, which also consumes
`@za/ui`); 505 API unit tests, 11 `@za/ui` component tests, and 15
`apps/admin` component tests all pass. The Playwright suite is written
and its config verified (`npx playwright test --list` resolves all 17
tests), but could not be executed end-to-end in this environment — no
Docker/Postgres access, so `apps/api` could not be brought up. Every
prior epic's `test:integration` carries the identical precondition.

### Epic 8 — Customer Accounts (2026-08-02)

**Added**

- [ADR 0018](docs/v2/adr/0018-customer-accounts.md) — the epic's
  governing design: `Customer` (credentials + profile unified, per the
  epic's "keep Customer separate from Admin Identity" rule — a
  deliberate deviation from docs/06-DDD-BOUNDED-CONTEXTS.md's v1 split),
  correctly `storeId`-scoped per ADR 0006 (unlike `AdminUser`'s disclosed
  gap); guest cart merge via a permanent, customer-owned `cartToken`
  reused through the exact same guest-cart machinery Epic 5 already
  built, rather than adding `customerId` to `Cart`; guest order
  association as an email-match backfill run at register/login time
  (not real-time linking at checkout — disclosed); customer JWT auth
  with its own separate secrets/refresh-token table from staff auth (a
  real security boundary, not just code organization); Review moderation
  reusing the `REVIEWS_MODERATE` permission key seeded in Epic 2 and
  never used until now; average rating/review count computed live from
  `Review` rows, never stored on `Product`.
- A new unified `src/modules/customers/` bounded context: `Customer`,
  `CustomerAddress`, `WishlistItem` (references `Product` directly, per
  docs/product/14-WISHLIST.md), `Review` (PENDING/APPROVED/REJECTED,
  edit-in-place resubmission), `CustomerRefreshToken` (own rotation +
  reuse-detection table, mirroring but separate from Epic 7's). New
  migration adds these tables plus a nullable, additive `Order.customerId`
  (`onDelete: SetNull`).
- Customer auth use-cases: `RegisterCustomerUseCase`/
  `CustomerLoginUseCase` (both run the guest-merge/association step when
  a `guestToken` is supplied), `RefreshCustomerTokenUseCase`/
  `LogoutCustomerUseCase` (identical rotation-with-reuse-detection shape
  to staff auth). Deliberately smaller in scope than Epic 7's staff auth
  per this epic's own narrower scope list: no customer session list/
  revoke, login history, or password reset yet (disclosed).
- Profile/address/wishlist/review/order-history use-cases:
  `GetCustomerUseCase`, `UpdateCustomerProfileUseCase`,
  `ChangeCustomerPasswordUseCase` (revokes every session, same as
  staff), `CreateAddressUseCase`/`UpdateAddressUseCase`/
  `DeleteAddressUseCase`/`ListAddressesUseCase` (exactly-one-default
  invariant enforced transactionally in the repository),
  `AddWishlistItemUseCase`/`RemoveWishlistItemUseCase`/
  `ListWishlistUseCase` (live availability, reusing Catalog's
  `ProductRepository`/`ProductNotFoundError` directly), `SubmitReviewUseCase`
  (create-or-edit-in-place)/`ListProductReviewsUseCase` (public,
  approved-only + live summary)/`ListPendingReviewsUseCase`/
  `ModerateReviewUseCase` (staff), `ListCustomerOrdersUseCase` (reuses
  `OrdersModule`'s `ORDER_REPOSITORY`, shared by the customer's own
  history view and a new staff support-lookup controller reusing the
  `CUSTOMERS_VIEW` permission key, also seeded in Epic 2 and unused
  until now), `MergeGuestCartUseCase`, `AssociateGuestOrdersUseCase`.
- `CustomerAuthGuard` — the customer-facing equivalent of `JwtAuthGuard`,
  verifying the separate customer JWT secret and loading a `Customer`.
  Applied locally via `@UseGuards()`, never globally: every controller
  in the Customers module is `@Public()` at the class level (staff's
  global guard stack would otherwise reject every customer call), with
  `@UseGuards(CustomerAuthGuard)` added per-route wherever a logged-in
  customer is required. Populates the same `request.actor`/
  `@CurrentActor()` shape staff auth uses, safe only because no route is
  ever guarded by both at once.
- New controllers: `CustomerAuthController` (`/v1/customers/auth/*` —
  register/login/refresh/logout), `CustomerProfileController` (profile
  get/update, change-password), `CustomerAddressController`,
  `CustomerWishlistController`, `CustomerReviewController` (public read,
  customer-guarded submit, under `/v1/catalog/products/:id/reviews`),
  `ReviewModerationController` (staff, `/v1/reviews/*`),
  `CustomerOrderHistoryController` (`/v1/customers/me/orders`),
  `StaffCustomerController` (`/v1/customers/:id` + `/:id/orders`, staff
  support lookup).
- Two additive changes to already-frozen modules: `CheckoutModule` now
  also exports `CART_REPOSITORY` (for the guest-cart merge), and
  `OrderRepository` gains `listByCustomerId()` and
  `associateGuestOrders()` (plus an additive, nullable `customerId` on
  `CreateOrderData`/the `Order` entity) — `PlaceOrderUseCase` itself is
  unchanged and never sets it.
- 59 new unit tests (entities, `CustomerPolicy`, all use-cases with real
  logic) and 46 new integration tests across four files — registration/
  login/refresh-rotation/logout, profile/change-password/address book
  (including the exactly-one-default invariant and a cross-account 404,
  not a leak), wishlist/reviews (including staff moderation and a
  403-for-the-wrong-role check), and the full guest-cart-merge +
  guest-order-association + staff-lookup flow — against real Postgres.

**Changed**

- None (no Foundation/Identity/Catalog/Inventory/Orders/API/Auth bug
  fixes were needed this epic).

**Fixed**

- None.

### Epic 7 — Authentication & Authorization (2026-08-02)

**Added**

- [ADR 0017](docs/v2/adr/0017-authentication-and-authorization.md) —
  the epic's governing design: HS256 access (15 min) + refresh (7 day)
  JWTs, refresh-token rotation with family-based reuse detection, a
  disclosed dev-only reset-token reveal (no Notifications epic exists
  to email it), and IP-based login rate limiting via `@nestjs/throttler`
  as the practical realization of the product spec's brute-force rule.
  Documents the one deliberate, necessary exception to "no API contract
  changes": the `x-admin-user-id` header is retired in favor of
  `Authorization: Bearer <access-token>` — every route path, request/
  response shape, and 401-vs-403 convention is otherwise unchanged.
- A new `src/modules/auth/` bounded context, deliberately separate from
  Identity (which still owns `AdminUser`/`Role`/`Permission`/RBAC data)
  per the epic's "keep authentication separate from business logic"
  rule — imports `IdentityModule` for `AdminUserRepository`/
  `PasswordHasher`/`CheckPermissionUseCase` rather than reimplementing
  any of it, the same cross-module shape as Checkout importing Catalog/
  Inventory/Orders. New Prisma models: `RefreshToken`, `LoginHistory`,
  `PasswordResetToken` (migration `20260802124155_add_auth_tables`).
- Use-cases: `LoginUseCase`/`LogoutUseCase`/`RefreshAccessTokenUseCase`
  (rotation + reuse detection — reusing an already-rotated token revokes
  its entire token family), `ChangePasswordUseCase`/
  `RequestPasswordResetUseCase`/`ResetPasswordUseCase` (both revoke
  every existing session on success), `ListSessionsUseCase`/
  `RevokeSessionUseCase` (self-service session management),
  `ListLoginHistoryUseCase`. Every login attempt — success or failure —
  is recorded, with the real failure reason kept internal-only
  (`InvalidCredentialsError`'s single generic message never reveals
  whether the email or password was wrong, per the anti-enumeration
  rule in docs/product/01-AUTHENTICATION.md).
- `JwtAuthGuard` + `PermissionGuard` (global `APP_GUARD`s, in that order)
  replace `TemporaryAdminGuard` — `JwtAuthGuard` verifies the Bearer
  token and, exactly like the guard it replaces, re-fetches the
  `AdminUser` from Postgres on every request so a deactivation takes
  effect on the admin's very next call; `PermissionGuard` closes the gap
  ADR 0016 explicitly deferred, calling the unchanged, Epic-2-built
  `CheckPermissionUseCase` for a new `@RequirePermission(key)` decorator
  now applied across all eighteen previously-guarded controllers,
  reusing only already-seeded `PERMISSION_KEYS` — no new permission keys
  were needed.
- `AuthController` (`/v1/auth/*`): `login`/`refresh`/
  `request-password-reset`/`reset-password` are `@Public()`;
  `logout`/`change-password`/`sessions` (list/revoke)/`login-history`
  require authentication but no specific permission (self-service on
  the caller's own account).
- Two small, additive changes to already-frozen Epic 2 code, both
  disclosed: `AdminUser.changePassword()` (a new mutator, same shape as
  `deactivate`/`activate`/`changeRole`) and `PrismaAdminUserRepository
  .save()` now also writes back `passwordHash` (a no-op for every
  existing caller, which never touches it). `IdentityModule` now also
  exports `PASSWORD_HASHER` (same additive-export precedent as
  `ADMIN_USER_REPOSITORY`).
- A necessary correctness fix in `HttpExceptionFilter`: `PermissionDeniedError`
  (built in Epic 2, never wired to HTTP) now maps to 403, and a new
  branch maps `InvalidCredentialsError`/`InvalidRefreshTokenError`/
  `RefreshTokenReusedError`/`InvalidPasswordResetTokenError` to 401 —
  closing this epic's explicit "support 401 and 403 correctly"
  requirement.
- 44 new unit tests (entities, all nine use-cases) and 26 new
  integration tests across five files — login/failure/history,
  refresh rotation + family-wide reuse detection, logout, change/reset
  password (each revoking every session), session list/revoke
  (including a cross-account 404, not a leak), and `PermissionGuard`
  enforcement (a Warehouse-role admin passes `INVENTORY_VIEW`, is
  forbidden from `USERS_MANAGE`) — deliberately split into several
  small files (plus updating the existing `app.integration.spec.ts` to
  log in instead of using `x-admin-user-id`) so the login endpoint's
  5-per-60-second throttle stays scoped per file's own fresh app
  instance rather than shared across the whole suite.

**Changed**

- Swagger's security scheme switches from an `x-admin-user-id` API-key
  header to `Authorization: Bearer` (`ApiBearerAuth('access-token')`)
  across every previously-guarded controller.

**Fixed**

- `PermissionDeniedError` had no HTTP status mapping at all (see above)
  — the only bug fix bundled into this epic, required by its own "401
  and 403 correctly" rule.

### Epic 6 — API Layer (2026-08-02)

**Added**

- [ADR 0016](docs/v2/adr/0016-api-layer-conventions.md) — the epic's
  governing conventions: `/v1` prefix + `@nestjs/swagger` CLI plugin
  (auto-generates `@ApiProperty()` from existing DTOs instead of
  manually decorating ~60 of them); a single coarse `TemporaryAdminGuard`
  (401-only — no per-permission 403 until real Auth) with a `@Public()`
  opt-out for guest-facing routes; a shared in-memory `paginate()`
  utility applied after each list use-case returns, with explicit
  per-endpoint searchable/sortable field allow-lists; `DomainError.code`
  used directly as the wire error-code registry via a convention-based
  name-classifier (`*NotFound*` → 404, `*AlreadyInUse|AlreadyExists|
  Duplicate*` → 409, else 400); offset pagination only (cursor
  deferred); no rate limiting, idempotency keys, or webhooks (all
  explicitly out of scope).
- **First HTTP surface for every bounded context built so far.**
  Controllers under each module's new `http/` folder: Identity
  (`admin-users`, `roles`, `permissions` — all guarded), Catalog
  (`products`, `product-variants`, `product-media`, `product-
  specifications`, `product-relations`, `categories`, `collections`,
  `brands`, `tags`, `colors`, `sizes`, plus a fully-public `storefront/`
  controller for featured/best-seller/new-arrival lists — reads are
  `@Public()`, writes are guarded), Inventory (`warehouses`, `stock`,
  `stock-reservations` — all guarded), Checkout (`cart`, `checkout` —
  fully `@Public()`, guest-token based, no admin identity required to
  buy), Orders (guarded — list/get/status/cancel/notes).
- `TemporaryAdminGuard` — a global `APP_GUARD` reading a real
  `AdminUser.id` from the `x-admin-user-id` header (no password),
  validating the account is active via `AdminUserRepository`, and
  attaching `request.actor: ActorRef` for use-cases that need one.
  Deliberately does not call `CheckPermissionUseCase`; that per-route
  403 layer is left for the real Authentication epic, whose own doc
  comments already anticipated a future guard replacing this one.
- Shared API infrastructure: `ApiSuccessResponse`/`ApiErrorResponse`
  response envelope (`response-envelope.interceptor.ts`), the
  `classifyDomainErrorStatus()` exception filter extension,
  `ListQueryDto`/`paginate()`, `@Public()`/`@CurrentActor()` decorators.
- Swagger documentation at `/v1/docs`, gated off in production by
  `NODE_ENV`; documents the `x-admin-user-id` header as an API-key
  security scheme.
- Full-stack HTTP integration test suite (`app.integration.spec.ts`,
  new `supertest`-based pattern for this codebase) against real
  Postgres and the actual Nest pipeline (guard, pipes, interceptor,
  exception filter) — 8 tests covering the guard's 401 discipline and
  `@Public()` opt-out, `DomainError` → HTTP status mapping,
  pagination/sort/search, and one full guest browse → cart → checkout →
  order → staff-view → cancel flow exercising every layer this epic
  wired together.
- Two additive exports on already-frozen modules, same precedent as
  every prior epic: `IdentityModule` now also exports
  `ADMIN_USER_REPOSITORY` (the guard needs it).

**Changed**

- `nest-cli.json` — added the `@nestjs/swagger` compiler plugin.
- `main.ts` — Swagger setup gated behind non-production `NODE_ENV`;
  `DocumentBuilder` now declares the `x-admin-user-id` API-key scheme.

**Fixed**

- None (no Foundation/Identity/Catalog/Inventory/Orders bug fixes were
  needed this epic).

### Epic 5 — Orders & Checkout Core (2026-08-02)

**Added**

- `Cart`/`CartItem` (guest-only — no `customerId` yet) and
  `Order`/`OrderItem`/`OrderStatusHistory`/`OrderNote` — two new bounded
  contexts, `src/modules/checkout/` and `src/modules/orders/`. Migration
  `20260802072905_init_orders_checkout`.
- [ADR 0015](docs/v2/adr/0015-guest-checkout-and-minimal-order-dependencies.md)
  — the epic's central scope decision: Cart/Order carry no
  `customerId`/`shippingAddressId`/`couponId` at all (Customers/Coupons
  don't exist yet; contact and address are pure snapshot columns, per
  [ADR 0004](docs/v2/adr/0004-order-snapshot-redesign.md), with nothing
  live upstream of them); `paymentMethod`/`paymentStatus` are flat
  columns (only `COD` is processable end-to-end — `CARD` is schema-ready
  but rejected with a clear "not yet supported" error);
  `shippingFee` is a flat policy constant, not a computed Shipping
  domain. Also documents reusing Inventory's `ProcessReturnUseCase`
  (RESELLABLE) to restock a cancelled, stock-committed order, and the
  two additive cross-module exports below.
- `OrderPolicy` — centralizes every order business rule: the exact
  status state machine from docs/product/07-ORDERS.md (`PENDING →
  CONFIRMED → PREPARING → PACKED → SHIPPED → DELIVERED`, `CANCELLED`
  reachable from any pre-`SHIPPED` status, `DELIVERED → RETURNED`,
  `CANCELLED`/`RETURNED` terminal), order-number generation, total
  computation, and checkout's contact-info/shipping-address/
  payment-method validation.
- `PlaceOrderUseCase` — the Cart→Order orchestration
  (docs/06-DDD-BOUNDED-CONTEXTS.md's Checkout saga): validates input,
  reserves stock per cart item via Inventory's
  `CreateStockReservationUseCase` (releasing every reservation already
  created in the same attempt if a later item fails — a compensating
  action — and surfacing exactly which item is unavailable), snapshots
  pricing/name/SKU from Catalog's current state, creates the `Order`,
  then (since only COD is supported) immediately confirms every
  reservation and transitions the order to `CONFIRMED`, and clears the
  cart.
- `CancelOrderUseCase` — per ADR 0015 §4, releases a still-`ACTIVE`
  reservation or restocks a `CONFIRMED` one via a RESELLABLE return,
  keyed off each `OrderItem`'s own `stockReservationId`.
  `AdvanceOrderStatusUseCase` (the normal fulfillment path plus
  `DELIVERED → RETURNED`) explicitly rejects `CANCELLED`, forcing
  callers through `CancelOrderUseCase` instead.
- Cart use-cases (`AddCartItemUseCase`, `UpdateCartItemQuantityUseCase`,
  `RemoveCartItemUseCase`, `GetCartUseCase` — live-priced, never a
  snapshot) and Order query/notes use-cases (`GetOrderUseCase`,
  `ListOrdersUseCase`, `AddOrderNoteUseCase`).
- Two additive exports on already-frozen modules, both following Epic
  4's precedent: `CatalogModule` now also exports `PRODUCT_REPOSITORY`
  (Checkout needs product name/price to snapshot); `InventoryModule`
  gains a new `GetStockReservationUseCase` (Orders needs to read a
  reservation's status/warehouse before deciding release-vs-restock).
- Seed data: one guest cart (left empty, matching post-checkout state)
  and one already-placed, `CONFIRMED` Cash-on-Delivery order against a
  seeded variant — mirrors `PlaceOrderUseCase` exactly (a `StockReservation`
  created straight into `CONFIRMED`, a matching `SALE` `StockMovement`,
  the full `Order`/`OrderItem`/`OrderStatusHistory` rows), expressed via
  raw Prisma calls per this codebase's seed-script convention.
- 32 new unit tests, 19 new integration tests — including a full
  checkout-to-order-to-cancel flow and a concurrency test proving two
  simultaneous checkouts for the last unit of stock still can't oversell
  (`PlaceOrderUseCase`'s reservation call inherits Inventory's row-lock
  guarantee transitively).

**Changed**

- None (no Foundation/Identity/Catalog/Inventory bug fixes were needed
  this epic).

**Fixed**

- None.

### Epic 4 — Inventory & Stock Management (2026-08-02)

**Added**

- `Warehouse`, `VariantStock`, `StockMovement`, `StockReservation` domains
  — a new `src/modules/inventory/` bounded context, full domain/
  application/infrastructure layers. Migration
  `20260802064206_init_inventory`.
- [ADR 0014](docs/v2/adr/0014-warehouse-scoping-and-single-warehouse-model.md)
  — extends ADR 0006/0012/0013's store-scoping test to `Warehouse`
  (store-scoped, since `code` is an independent business key) and
  establishes that stock lives in a `VariantStock` join table keyed by
  `(variantId, warehouseId)` rather than a scalar on `ProductVariant`, so
  multi-warehouse support later needs zero schema migration.
  `StockMovement`/`StockReservation` both carry `warehouseId` from day
  one, since ledger rows can't be reliably attributed to a warehouse
  after the fact once more than one exists.
- `InventoryPolicy` — centralizes every inventory business rule per this
  epic's explicit instruction (mirrors Epic 3B's `ProductPolicy`):
  available-stock computation (`stock - SUM(active reservations)`, per
  [ADR 0001](docs/v2/adr/0001-inventory-reservation-strategy.md)),
  positive/non-zero quantity guards, the never-negative-stock guard, the
  no-overselling guard, the RECEIVE/SALE/ADJUSTMENT/RETURN/DAMAGED
  stock-delta mapping (DAMAGED always nets to a zero ledger delta — a
  damaged unit is never returned to sellable stock, though the count is
  still recorded for loss-reporting), low-stock detection, the
  unusually-large-adjustment flag, and idempotent reservation-transition
  checks (confirm/release are safe to retry — never a double-decrement).
- 14 use-cases: Warehouse CRUD/list; `ReceiveStockUseCase`,
  `AdjustStockUseCase` (reason required, flags unusually-large
  adjustments), `GetVariantStockUseCase`, `ListLowStockVariantsUseCase`,
  `SetLowStockThresholdUseCase`; `ProcessReturnUseCase` (RESELLABLE →
  restocked via a RETURN movement, DAMAGED → logged as a loss via a
  DAMAGED movement, never auto-restocked), `ListStockMovementsUseCase`
  (the permanent per-variant audit trail); `CreateStockReservationUseCase`,
  `ConfirmStockReservationUseCase`, `ReleaseStockReservationUseCase`,
  `ExpireStockReservationsUseCase` (the ADR 0001 §5 background-sweep
  logic — a future job-scheduler epic wires the actual schedule; this
  epic delivers the fully-functional, independently-testable logic it
  will call).
- `VariantStockRepository.applyMovement()` is the only code path that
  ever changes `VariantStock.quantity` — it locks the row (`SELECT ...
  FOR UPDATE` via `tx.$queryRaw` inside a Prisma interactive
  transaction, since Prisma has no first-class row-lock API), computes
  and validates the new quantity, and writes the corresponding
  `StockMovement` row in the same transaction, so every stock change is
  audited by construction. `StockReservationRepository.createIfAvailable`/
  `confirm`/`release`/`expireAllDue` implement ADR 0001's reservation
  lifecycle with the same locking discipline.
- `CatalogModule` now additionally exports `PRODUCT_VARIANT_REPOSITORY`
  (not just its use-cases) — the one legitimate cross-bounded-context
  repository dependency in the codebase, justified by
  `docs/06-DDD-BOUNDED-CONTEXTS.md` naming it explicitly ("a
  ProductVariant must exist to hold stock").
- Seed data: one `MAIN` warehouse plus starting `VariantStock` for all 4
  Epic 3B variants, each paired with its own founding `RECEIVE`
  `StockMovement` (never a bare quantity write) — one variant seeded
  below its low-stock threshold to demonstrate
  `ListLowStockVariantsUseCase`.
- 97 new unit tests (domain entities, `InventoryPolicy`, all 14
  use-cases with mocked repositories) and 23 new integration tests
  against real Postgres, including a concurrent-reservation race test
  that fires two simultaneous `createIfAvailable` calls for the last
  unit of stock and proves exactly one succeeds — the `FOR UPDATE` row
  lock holds under real concurrency, not just in single-threaded mocks.

**Changed**

- None (no Foundation/Identity/Catalog bug fixes were needed this
  epic).

**Fixed**

- None.

### Epic 3B — Product Experience & Merchandising (2026-08-02)

**Added**

- `Color`, `Size`, `ProductVariant` domains (store-scoped per
  [ADR 0013](docs/v2/adr/0013-store-scoping-extended-to-variant-attributes.md),
  which extends ADR 0006/0012's pattern). `ProductMedia`
  (images/videos, cover-image flag, alt text), `ProductSpecification`
  (structured spec sheet), `ProductRelation` (admin-curated Related/
  Cross-sell/Up-sell, one mechanism discriminated by type). `Product`
  gains `highlights` (string array) and `richContent` (HTML block).
  Migration `20260802055832_init_product_experience`.
- `ProductPolicy` — centralizes every Product business rule (name/SKU/
  pricing validation, the Active-status readiness gate, media-set
  validation, variant-duplicate-attribute checks, and two new
  regression guards: a variant can't be removed if it's the last one on
  an Active product, and a cover image can't be removed from an Active
  product's media set). Supersedes and removes Epic 3A's
  `ProductPublishReadinessService`.
- **The Active-status gate is now real**: `ProductPolicy.assertReadyForActive()`
  enforces "≥1 variant, ≥1 cover image" (previously a disclosed no-op gap
  from Epic 3A, since Variants/Media didn't exist yet).
- 23 new use-cases: Color/Size/Variant CRUD (4 each), `SetProductMediaUseCase`,
  `SetProductSpecificationsUseCase`, `UpdateProductContentUseCase`,
  `SetProductRelationsUseCase` + `ListProductRelationsUseCase`,
  storefront-facing `ListFeaturedProductsUseCase` / `ListBestSellersUseCase`
  / `ListNewArrivalsUseCase` (ACTIVE-only, distinct from the admin's
  generic filterable list), and `GetProductDetailUseCase` (composes
  product + variants + media + specifications for a PDP read).
- Seed data extended: 3 colors, 5 sizes, 4 variants, 3 media rows (2
  products now have a real cover image), 2 specifications, highlights +
  rich content on one product, 2 cross-sell relations — the two Epic 3A
  "Active" products now actually satisfy `ProductPolicy.assertReadyForActive()`
  rather than being Active only because the seed script writes directly
  via Prisma.
- [ADR 0013](docs/v2/adr/0013-store-scoping-extended-to-variant-attributes.md).
- 67 new unit tests, 22 new integration tests.

**Changed**

- `Product` entity: `validateName`/`validateSku`/`validatePricing` moved
  to `ProductPolicy` (removed from the entity, which now delegates to
  it) — the explicit "centralize all product business rules" instruction
  for this epic.
- `ChangeProductStatusUseCase` (Epic 3A) extended to load variant/cover-
  image state and call the now-real readiness gate — this is the
  designated extension seam Epic 3A's own compliance report named, not
  an unplanned change to a frozen file.
- `CatalogModule` refactored to build its provider/export arrays from
  two lists rather than duplicating ~50 entries twice, given the
  provider count roughly doubled this epic.

**Fixed**

- None (no Foundation/Identity bug fixes were needed this epic).

### Epic 3A — Commerce Core (2026-08-02)

**Added**

- `Store` model + `StoreContext` (per
  [ADR 0006](docs/v2/adr/0006-saas-ready-schema-pattern.md) /
  [ADR 0012](docs/v2/adr/0012-store-scoping-extended-to-catalog-taxonomy.md)),
  seeded with exactly one row.
- Catalog bounded context: `Product`, `Category`, `Collection`, `Brand`,
  `Tag` domains — full domain/application/infrastructure layers, 26
  use-cases, 5 Prisma repositories, `CatalogModule`.
- `Slug`, `Money`, `SeoMetadata` value objects; `CategoryHierarchyPolicy`
  (3-level depth + cycle validation); `ProductPublishReadinessService`
  (the Active-status gate — see the disclosed scope gap in
  [EPIC-03A-ARCHITECTURE-COMPLIANCE.md](docs/epics/EPIC-03A-ARCHITECTURE-COMPLIANCE.md)).
  Migration `20260801210526_init_commerce_core`.
- Seed data: the one `Store` row plus an illustrative 3-level category
  tree, 2 brands, 3 tags, 3 products (2 Active, 1 Draft).
- 99 new unit tests, 32 new integration tests.
- [ADR 0012](docs/v2/adr/0012-store-scoping-extended-to-catalog-taxonomy.md).

**Changed**

- `src/app.module.ts` — registered `StoreModule` and `CatalogModule`.

**Fixed**

- None (no Foundation/Identity bug fixes were needed or made this
  epic — see
  [EPIC-03A-LESSONS-LEARNED.md](docs/epics/EPIC-03A-LESSONS-LEARNED.md)
  §1 for a *discovered-but-not-fixed* gap in Epic 2, reported rather
  than silently patched).

### Epic 2 — Identity & Access Management Core (2026-08-01)

**Added**

- User/Role/Permission domains, data-driven RBAC (`Role`, `Permission`,
  `RolePermission` — see
  [ADR 0011](docs/v2/adr/0011-data-driven-rbac-schema.md)), Argon2id
  password hashing, length-based password policy, `AuthorizationService`.
  9 use-cases, Prisma repositories, `IdentityModule` (no controllers —
  disclosed security-boundary decision). Migration
  `20260801203259_init_identity_core`. Seed: 5 roles, 17 permissions,
  1 bootstrap Super Admin.
- Jest unit + integration test tooling (new to the project this epic) —
  47 unit tests, 16 integration tests.
- `turbo.json` `test` task; `.github/workflows/ci.yml` `test` job.

**Fixed**

- A latent race in `turbo.json`'s `type-check` task (depended only on
  upstream packages' builds, not the same package's own `build`),
  surfaced by a forced/uncached verification run against `@za/admin`.

### Epic 1 — Project Foundation (2026-07-31)

**Added**

- Turborepo monorepo (`apps/api` NestJS, `apps/storefront` +
  `apps/admin` Next.js, `packages/{types,shared,ui,tsconfig,eslint-config,config}`).
  Docker Compose (Postgres, Redis, Mailpit). GitHub Actions CI
  (lint/type-check/build). Global exception filter, response envelope,
  structured logging, health checks.

**Fixed**

- `packages/ui` shipped as raw TSX (no build step) after a CJS/`'use
  client'` directive-detection bug; ESLint flat-config ordering fixed
  for `eslint-config-next` + typed linting; incremental TypeScript
  build-cache bug removed (`incremental: true` dropped from the shared
  tsconfig base).
