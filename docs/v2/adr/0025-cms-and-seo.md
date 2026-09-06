# ADR 0025: CMS & SEO

**Status**: Accepted
**Epic**: 11 (Commerce Services).

## Context

Epic 10 shipped About/Contact/FAQ as hardcoded JSX — real pages, but their
copy can only change by editing and redeploying code, and Privacy
Policy/Terms of Service don't exist as pages at all. Epic 10 also built
real SEO fundamentals per-page (`buildMetadata()`: canonical URLs,
OpenGraph, Twitter Cards, `generateMetadata()` on every route; `<JsonLd>`
for `WebSite`/`Product`/`FAQPage`) — this epic's SEO scope is the two
pieces that genuinely don't exist yet (`sitemap.xml`, `robots.txt`) plus
extending the existing conventions to the new CMS-backed pages, not
rebuilding what Epic 10 already did correctly.

## Decision

### CMS — one model, not five

```prisma
model CmsPage {
  id              String    @id @default(cuid())
  storeId         String
  slug            String    // "about" | "contact" | "faq" | "privacy-policy" | "terms-of-service"
  title           String
  content         String    // plain/markdown body — About, Privacy, Terms, Contact's intro copy
  faqItems        Json?     // [{ question, answer }] — FAQ page only, null everywhere else
  status          String    @default("DRAFT") // DRAFT | PUBLISHED
  metaTitle       String?
  metaDescription String?
  ogImageUrl      String?
  publishedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([storeId, slug])
}
```

Five conceptually different page *types* (long-form text × 3, a contact
intro, a Q&A list) share one table rather than five, the same reasoning
Epic 3A used for Category/Collection sharing a slug+SEO-metadata shape:
each is "a slug, a title, a body, SEO fields, a publish state" — FAQ's
`faqItems` is the one field that doesn't generalize, kept as a nullable
JSON column rather than a second table+relation for a handful of Q&A pairs
that never need their own query surface. Slugs are a fixed, known set for
this epic (not a general "create any page" CMS) — `@@unique([storeId,
slug])` still allows adding more later without a schema change.

### Admin management

New `CmsController` (`/v1/cms/pages`), guarded by the **already-seeded**
`CONTENT_MANAGE` permission (`'content.manage'` — "Manage the homepage,
banners, blog, and static pages," added in Epic 2, never used until now).
No new permission, no `prisma/seed.ts` change — the exact capability this
epic needs already existed, unused. CRUD + publish/unpublish; content is a
plain `Textarea` (`@za/ui`, existing component) rendered as Markdown on
the storefront via a minimal, dependency-light renderer (bold/italic/
links/paragraphs/headings only — the five pages' actual content need
nothing richer, and a full rich-text editor is disproportionate scope for
five fixed pages, the same "no unnecessary dependency" call as ADR 0024's
templates).

### Public read

`GET /v1/storefront/cms/pages/:slug` (new, `@Public()`, mirrors the
`catalog/storefront` naming convention from ADR 0021) — `PUBLISHED`-only,
enforced server-side exactly like Catalog's storefront surface is
`ACTIVE`-only. A `DRAFT` page 404s for anyone without `CONTENT_MANAGE`,
same shape as an unpublished `Product`.

### Storefront consumption

Epic 10's `about/page.tsx` and `faq/page.tsx` change from hardcoded JSX to
`generateMetadata()` + a server component fetching `GET .../cms/pages/
about` (SSR + React Query hydration, the same pattern every Epic 10 page
already uses) and rendering the CMS content instead. `contact/page.tsx`
keeps its existing `mailto:`-based `ContactForm` (no backend endpoint for
submissions exists — Epic 10's disclosed, still-correct call) but its
static intro copy becomes CMS-sourced. Two new routes,
`privacy-policy/page.tsx` and `terms-of-service/page.tsx`, are the same
shape as the (now CMS-backed) About page. If the CMS fetch 404s (page not
yet published), the route renders Next's existing `notFound()` boundary —
no new empty-state design needed.

### SEO — close the two real gaps, extend the rest

- **`app/sitemap.ts`** (Next.js's native `MetadataRoute.Sitemap`
  convention) — one function fetching every `ACTIVE` product (via the
  existing Public Catalog API, ADR 0021), every category, every live
  collection, and every `PUBLISHED` CMS page, emitting one `<url>` entry
  each with `lastModified`. Regenerated per-request in dev, cached per
  Next's normal route-segment caching in production — no new
  infrastructure, this is a standard Next.js file convention.
- **`app/robots.ts`** (Next.js's native `MetadataRoute.Robots`
  convention) — allows everything except `/account/*`, `/cart`,
  `/checkout*` (session-specific, never worth indexing), points at
  `sitemap.xml`.
- **Canonical URLs, OpenGraph, Twitter Cards, dynamic metadata** — already
  fully built by Epic 10's `buildMetadata()`; the four new/changed CMS
  pages call it exactly like every existing page does. No changes to
  `lib/seo.ts` itself required.
- **JSON-LD** — the existing `<JsonLd>` component (Epic 10) gains use on
  the CMS pages: `AboutPage`/`ContactPage` schema.org types for About/
  Contact, reusing the same component, no new infra.

## Consequences

- Marketing/content copy for five pages can change without a code
  deploy — the actual point of "CMS Management from Admin Dashboard."
- `sitemap.xml`/`robots.txt` give search engines a real, complete crawl
  surface for the first time — previously only reachable via internal
  links, no canonical discovery entry point existed.
- CMS's `PUBLISHED`-only public gate mirrors Catalog's `ACTIVE`-only
  pattern closely enough that a future "scheduled publish" or "content
  versioning" feature (out of scope here) would extend it the same way
  Catalog's own status model has been extended twice already (Epic 3A →
  3B).

## Alternatives Considered

- **A full block-based page builder** (per
  `docs/product/10-CMS-HOMEPAGE-BUILDER.md`'s eventual Phase 2/3 vision) —
  rejected for this epic; five fixed pages with a title+body+SEO-fields
  shape don't need arbitrary block composition, and building that engine
  now would dwarf Epic 11's actual scope the same way a from-scratch
  BullMQ system would have if declined in ADR 0023.
- **A separate table per page type** — rejected; see "one model, not
  five" above.
- **Rebuilding Epic 10's canonical/OG/Twitter/JSON-LD conventions** —
  rejected; they already work correctly and are simply reused, not
  redesigned.
