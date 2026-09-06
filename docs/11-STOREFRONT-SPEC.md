# ZA Store — Storefront Specification

Every customer-facing page, specified against: Layout, Sections/Components,
API Calls, SEO, Performance. Rendering strategy references
[01-ARCHITECTURE.md §3](01-ARCHITECTURE.md#3-frontend-architecture-nextjs--both-apps)
(Server Components for SEO-critical content, client-side React Query for
authenticated/interactive state).

## 1. Homepage (`/`)

- **Layout**: full-width stacked sections, generous vertical spacing
  (`--space-16`/`--space-24`) between them per
  [09-DESIGN-SYSTEM.md §4](09-DESIGN-SYSTEM.md#4-spacing).
- **Sections**: Hero (banner carousel), Shop by Category (icon/image
  tiles), New Collection strip, Best Sellers grid, Shop by Color
  (swatch-driven visual nav), Gift Boxes promo block, Instagram Gallery
  (curated static grid, not a live API embed in v1 — avoids a third-party
  dependency on day one), Customer Reviews carousel, Newsletter signup,
  Footer.
- **Components**: `Hero`, `CategoryTile`, `ProductCard` (reused across
  every product-listing section), `ColorSwatchNav`, `ReviewCard`,
  `NewsletterForm`.
- **API calls**: `GET /storefront/banners?placement=hero` (Server
  Component, SSR), `GET /storefront/categories`,
  `GET /storefront/products?isNewArrival=true`,
  `GET /storefront/products?isBestSeller=true`,
  `GET /storefront/collections/gift-boxes`, a curated reviews endpoint
  (top-rated recent reviews across products). `POST
  /storefront/newsletter/subscribe` is the only client-side mutation on
  this page.
- **SEO**: page-level meta from Settings defaults (org-level structured
  data — `Organization` + `WebSite` JSON-LD with `SearchAction`).
- **Performance**: ISR with on-demand revalidation triggered by CMS
  publish actions (banners, featured-flag changes) — never a blanket
  short revalidate interval, since the homepage is the highest-traffic,
  highest-cache-value route on the whole site.

## 2. Category / PLP (`/category/:slug`)

- **Layout**: left filter sidebar (drawer on mobile) + product grid,
  sort control top-right, breadcrumb above the grid.
- **Sections**: category banner/description (if set), filter panel
  (color, size, price range, tags), product grid, pagination.
- **Components**: `FilterPanel`, `ProductGrid`, `ProductCard`,
  `SortSelect`, `Pagination` (or infinite scroll — decide per UX testing,
  spec defaults to numbered pagination for SEO-crawlability of each page).
- **API calls**: `GET /storefront/categories/:slug` (SSR),
  `GET /storefront/products?category=:slug&...filters` (SSR for page 1,
  client-side React Query for subsequent filter changes to avoid a full
  page reload).
- **SEO**: category `metaTitle`/`metaDescription` from the schema field;
  canonical URL excludes filter query params (filters are crawl-noise, not
  distinct indexable pages); `BreadcrumbList` JSON-LD.
- **Performance**: ISR (category shell) + client-side fetch for filtered
  results — filter changes never trigger a full server round-trip/page
  reload.

## 3. Collection (`/collections/:slug`)

- **Layout**: near-identical to PLP, but banner-forward (collections are
  campaign-driven — "Summer Sale," "New Arrival") and typically no
  category-tree breadcrumb, just the collection banner + curated product
  order (from `CollectionProduct.sortOrder`, not a generic sort default).
- **Sections**: collection banner (title, description, countdown if
  `endsAt` is set and campaign-style), curated product grid.
- **Components**: `CollectionBanner`, `ProductGrid`, `CountdownBadge`.
- **API calls**: `GET /storefront/collections/:slug` (SSR, includes
  ordered products).
- **SEO**: collection `metaTitle`/`metaDescription`; `noindex` applied
  automatically once `endsAt` has passed (a stale "Summer Sale 2026" page
  should not keep ranking after the sale ends).
- **Performance**: ISR, revalidated on-demand when the collection's
  product list or schedule changes in admin.

## 4. Product / PDP (`/products/:slug`)

- **Layout**: two-column desktop (gallery left, buy-box right), stacked on
  mobile (gallery, then buy-box, then description/reviews below the fold).
- **Sections**: media gallery (image + video), name/price/discount,
  color/size variant picker (disables out-of-stock combinations, doesn't
  hide them — customers should see a size exists but is unavailable, not
  wonder if it never existed), add-to-cart + wishlist-heart, short
  description, full rich description (accordion), size guide link,
  reviews summary + list, related products (same category, excluding
  self).
- **Components**: `Gallery`, `VariantPicker`, `AddToCartButton`,
  `WishlistToggle`, `ReviewsSummary`, `ReviewList`, `RelatedProducts`.
- **API calls**: `GET /storefront/products/:slug` (SSR — includes variants,
  media, review aggregate), `GET /storefront/products/:slug/reviews`
  (paginated, can be SSR'd for the first page for SEO value of review
  content, client-fetched for subsequent pages), `POST /cart/items`
  (client mutation on add-to-cart).
- **SEO**: `Product` + `AggregateRating` + `Offer` JSON-LD (price,
  availability derived from variant stock), canonical URL, OG image from
  primary product media.
- **Performance**: ISR with on-demand revalidation on publish/price/stock-
  status change (not on every stock unit decrement — that would revalidate
  constantly during a sale; stock *availability* — in vs. out — is what
  triggers revalidation, exact count is fetched live for the buy-box via a
  lightweight client-side stock-check call).

## 5. Search (`/search`)

- **Layout**: same grid pattern as PLP, no category sidebar — a query
  input at top instead, with "did you mean" suggestion when trigram
  fallback matching kicks in.
- **API calls**: `GET /storefront/search?q=...` — client-side, debounced
  as-you-type with a lightweight suggestion dropdown, full navigation to
  `/search?q=...` on submit for a shareable/bookmarkable, SSR'd results
  page.
- **SEO**: search results pages are `noindex` (standard practice — thin,
  duplicate-prone content) but still server-rendered for fast paint.
- **Performance**: client-side for the live-typing suggestion dropdown;
  SSR for the committed results page.

## 6. Wishlist (`/account/wishlist` or `/wishlist` for guest-visible teaser)

- **Layout**: simple grid, same `ProductCard` as elsewhere, with a remove
  action instead of (or alongside) add-to-cart.
- **API calls**: `GET /storefront/wishlist`, `DELETE
  /storefront/wishlist/items/:productId`, `POST /storefront/cart/items`
  (move-to-cart action).
- **SEO**: `noindex` (authenticated, personal content), no crawl value.
- **Performance**: fully client-side (React Query) — this page only
  exists behind auth, SSR provides no SEO benefit here.

## 7. Cart (`/cart`)

- **Layout**: line-item list + order summary panel (subtotal, coupon
  input, estimated total), primary CTA to Checkout.
- **Sections**: line items (thumbnail, name, variant, qty stepper, line
  total, remove), coupon code input with live validation feedback, order
  summary, "you might also like" upsell strip (optional, low priority).
- **Components**: `CartLineItem`, `CouponInput`, `OrderSummary`.
- **API calls**: `GET /storefront/cart`, `PATCH
  /storefront/cart/items/:itemId`, `DELETE
  /storefront/cart/items/:itemId`, `POST
  /storefront/coupons/validate`.
- **SEO**: `noindex`.
- **Performance**: fully client-side; cart state kept warm via React Query
  cache so navigating away and back doesn't re-fetch unnecessarily.

## 8. Checkout (`/checkout`)

- **Layout**: single-page, sectioned (not a multi-page wizard, to reduce
  drop-off) — Address → Shipping Method → Payment Method → Review, with an
  always-visible order summary in a sticky side panel on desktop.
- **Sections**: address form (or address-book picker if logged in),
  shipping method selector, payment method selector (COD in v1, gateway
  options as they're added), order review, place-order CTA.
- **Components**: `AddressForm`, `ShippingMethodSelector`,
  `PaymentMethodSelector`, `OrderReview`.
- **API calls**: `GET /storefront/account/addresses` (if authenticated),
  `POST /storefront/checkout` (the single orchestrated write, with an
  `Idempotency-Key` header per
  [08-API-REVIEW.md §11](08-API-REVIEW.md#11-idempotency)).
- **SEO**: `noindex`; this route should never be crawlable or linkable
  externally.
- **Performance**: this is the one storefront page where correctness
  matters more than raw speed, but perceived performance still matters —
  optimistic UI on the "Place Order" button (immediate loading state,
  disabled to prevent double-submit) while the transactional checkout
  orchestration completes server-side.

## 9. Account (`/account`)

- **Layout**: left account nav (Profile, Addresses, Orders, Wishlist) +
  content panel, collapses to a top tab bar on mobile.
- **Sections**: Profile (name, email, phone, password change, marketing
  opt-in), Addresses (list + add/edit/delete, default marker).
- **API calls**: `GET/PATCH /storefront/account/profile`, `GET/POST/PATCH/
  DELETE /storefront/account/addresses`.
- **SEO**: `noindex`.
- **Performance**: fully client-side, authenticated-only.

## 10. Orders & Tracking (`/account/orders`, `/account/orders/:orderNumber`,
public `/track/:orderNumber`)

- **Layout**: order list (order #, date, total, status badge) → detail
  view with a visual status timeline mirroring `OrderStatusHistory`.
- **Sections**: order list, order detail (line items, addresses, payment
  summary, status timeline), a lightweight public tracking page that
  doesn't require login (order number + phone/email verification instead,
  for a shared tracking-link use case).
- **API calls**: `GET /storefront/orders`, `GET
  /storefront/orders/:orderNumber`, `GET
  /storefront/orders/:orderNumber/track`.
- **SEO**: `noindex` (personal/transactional data).
- **Performance**: client-side for the authenticated account view; the
  public tracking page is a light SSR page (no auth round-trip needed
  before first paint of the "enter your order number" form).

## 11. Blog List & Detail (`/blog`, `/blog/:slug`)

- **Layout**: list — grid of `ContentCard`s with category filter; detail —
  single-column long-form article layout with a max reading width.
- **API calls**: `GET /storefront/blog`, `GET /storefront/blog/:slug` —
  both SSR.
- **SEO**: full metadata + `Article`/`BlogPosting` JSON-LD, this is a
  genuine organic-search acquisition surface (medical-student-relevant
  content: scrub care, sizing guides, day-in-the-life content) — treated
  with the same SEO rigor as PDPs.
- **Performance**: ISR, revalidated on-demand on publish.

## 12. About / Static Pages (`/pages/:slug`)

- **Layout**: single-column content page rendering the sanitized rich-text
  `Page.body`.
- **API calls**: `GET /storefront/pages/:slug` — SSR.
- **SEO**: full metadata from the `Page` schema fields.
- **Performance**: ISR, effectively static (these pages change rarely).

## 13. Contact (`/contact`)

- **Layout**: simple form + static contact details (from Settings).
- **Sections**: contact form (name, email, message), support email/phone/
  social links pulled from `Setting`.
- **API calls**: a lightweight contact-submission endpoint (routes to a
  transactional email to support — not modeled as its own bounded context;
  it's a thin utility, not a domain).
- **SEO**: indexable, `LocalBusiness`/`Organization` structured data if
  applicable.
- **Performance**: static shell, form is a small client island.

## 14. 404 (`/not-found`)

- **Layout**: on-brand illustration/copy (soft, cute tone — not a generic
  framework default page), search bar, links back to homepage/best
  sellers.
- **API calls**: none required, but optionally suggests popular products
  (`GET /storefront/products?isBestSeller=true&limit=4`) to recover the
  session rather than dead-ending it.
- **SEO**: proper `404` HTTP status (not a soft-404 that returns `200`),
  `noindex`.
- **Performance**: static.

---

## Cross-Cutting Notes

- **Every page's SEO metadata** (title/description/OG/canonical) is
  resolved through one shared `lib/seo.ts` helper reading from the
  relevant entity's `metaTitle`/`metaDescription` fields with a documented
  fallback chain (entity meta → Settings default template → hardcoded
  brand fallback) — no page hand-rolls its own `<head>` logic.
- **Every `noindex` route** listed above is enforced via the same shared
  helper (a `robots` prop), not an ad hoc `<meta>` tag per page, so a future
  audit of "what's indexable" is one code review, not fourteen.
- **Guest vs. authenticated state** (cart, wishlist) is resolved
  consistently: a guest gets a `guestToken`-backed `Cart`/no `Wishlist`;
  wishlist requires login (prompts a lightweight login/register modal
  rather than blocking the heart-icon click entirely, to avoid losing
  intent).
