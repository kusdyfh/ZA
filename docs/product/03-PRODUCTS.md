# 03 — Products

## Purpose

Represent every sellable item with everything needed to merchandise it,
sell it correctly, and be found in search — the single most important
module in the catalog, since every other storefront experience (search,
PLP, PDP, cart, order) ultimately displays or references a Product.

## Business Rules

**Variants (Colors & Sizes)**
- A product is sold through one or more **variants** — a specific
  color/size combination, each with its own SKU and stock count.
- A product cannot be made Active (purchasable) with zero variants.
- A variant can optionally override the product's base price (e.g., a
  larger size costing slightly more) — if set, the override always wins.
- Removing a color or size option that has existing orders against it
  never affects those past orders — order history keeps its own
  permanent record of exactly what was bought, unaffected by later
  catalog changes.

**Images & Video**
- At least one image is required before a product can be Active.
- Every image requires descriptive alt text before the product can go
  Active — this isn't optional polish, it's a publish requirement, since
  it's how screen-reader users and search engines understand the image.
- Images can be reordered; the first image is the primary/cover image
  shown in listings.
- Video is optional and supplementary — a product is never video-only;
  it always has at least the required images regardless of whether video
  is added.

**SEO**
- Every product has a meta title and meta description, auto-generated
  from the product name/description by default, always admin-overridable.
- A product also has an Open Graph image (defaults to the primary product
  image) for how it appears when shared on social media.

**Status & Visibility**
- Status is one of: **Draft** (not visible anywhere, still being
  authored), **Active** (visible and purchasable, subject to stock),
  **Archived** (hidden from storefront browsing/search, but preserved
  permanently — never deleted — because past orders reference it).
- A product with real order history can never be hard-deleted — only
  archived. This is a firm rule, not a preference: deleting it would
  corrupt historical order records.
- Visibility is not simply "Active = shown." An Active product with every
  variant at zero stock is still shown on the storefront, marked **Sold
  Out** — hiding it entirely would be confusing (customers who'd
  bookmarked or shared the link would hit a dead page) and loses the
  chance to capture interest for a future restock.

**Collections & Merchandising Flags**
- A product belongs to exactly one Category, and to zero or more
  Collections (see [05-Collections](05-COLLECTIONS.md)) — Category is
  structural (where it lives in the browse tree), Collections are curated
  marketing groupings (New Arrival, Best Sellers, a seasonal set).
- Featured, Best Seller, New Arrival, and Gift Box are independent
  toggles, not statuses — a product can carry any combination of them, or
  none.

## User Stories

- As a Manager, I want to create a product with multiple color/size
  variants, each with its own stock, so customers can choose their
  preferred option and we track each one accurately.
- As a Manager, I want to upload and reorder product images, with alt
  text required, so the gallery looks right and is accessible.
- As a Manager, I want to mark a product Featured or Best Seller, so it
  surfaces in the right homepage sections without a developer's help.
- As a customer, I want to see accurate availability per color/size, so I
  don't order something that's actually unavailable.
- As a Manager, I want to set custom SEO text for a product when the
  auto-generated default isn't quite right, so search results read well.
- As a Manager, I want to archive a discontinued product without losing
  its order history, so accounting and support records stay accurate.

## Acceptance Criteria

- Given a product with zero variants, When a Manager attempts to set its
  status to Active, Then the system blocks the change and explains "add
  at least one variant first."
- Given a product with no images, When a Manager attempts to set it
  Active, Then the system blocks the change and lists what's missing
  (image, alt text, etc.) as a checklist, not a single vague error.
- Given a product where every variant is at zero stock, When a customer
  views its page, Then it displays normally with a clear "Sold Out"
  state, and the add-to-cart action is disabled with an explanation, not
  silently broken.
- Given a product referenced by at least one existing order, When a
  Manager attempts to delete it, Then the system blocks hard deletion
  entirely and offers "Archive" as the available action instead.
- Given a variant with a price override, When it's displayed anywhere
  (PDP, cart, order), Then the override price is what's shown and
  charged, never the base product price.

## Edge Cases

- A color has some sizes out of stock and others in stock → the variant
  picker shows the color as available but disables only the specific
  out-of-stock sizes, rather than hiding the whole color or showing it as
  fully unavailable.
- A product is moved to a different Category after already having
  orders → past orders are unaffected (they keep their own snapshot of
  what was ordered); only future browsing reflects the new Category.
  See [07-Orders](07-ORDERS.md).
- Two variants are given the same SKU by mistake → blocked at entry with
  a clear "this SKU is already in use" message, never silently
  overwritten.
- A product is flagged as a Gift Box before the full Gift Box Builder
  feature exists → it simply displays as a normal curated product; the
  flag exists ahead of the feature intentionally and causes no broken
  behavior in the meantime.
- A product's discount price is set, then its base price is later lowered
  below the discount price → the system flags this for the Manager to
  resolve (a discount can't legitimately be higher than the price it's
  discounting from) rather than silently displaying a nonsensical "sale."

## Validation Rules

- Name, slug, and SKU: required; slug and SKU must be unique across the
  catalog.
- Price: must be zero or greater; discount price, if set, must be lower
  than the base price.
- Every variant: unique SKU; unique barcode if provided; stock is a
  whole number, zero or greater.
- Category: required. Brand: optional.
- Before Active status: at least one variant, at least one image with alt
  text.

## Permissions

- Super Admin, Manager: full create/edit/archive rights.
- Warehouse, Sales, Customer Support: read-only (Warehouse's stock-level
  editing rights live in [06-Inventory](06-INVENTORY.md), not here — this
  module governs the product's descriptive/merchandising data, not its
  stock count).

## UI Behaviour

- Tabbed editing experience: General, Variants, Media, SEO.
- Variant editing shown as a color × size grid, with inline stock and
  price-override entry per cell.
- Media supports drag-to-reorder; each image's alt-text field is visible
  and required inline, not hidden in a secondary dialog.
- A live PDP preview so a Manager can see roughly what a customer will
  see before publishing.

## Error States

- Duplicate slug/SKU: specific inline error at the exact field.
- Attempting to publish (go Active) with missing requirements: a clear,
  itemized list of what's missing, so it's fixed in one pass.
- Media upload failure: clear retry option, doesn't lose the rest of the
  form's progress.

## Notifications

- Low-stock and out-of-stock alerts are triggered from this module's data
  but owned by [06-Inventory](06-INVENTORY.md) — see that module and
  [19-Notifications](19-NOTIFICATIONS.md) for full detail.
- (Future) "Back in stock" alerts to customers who wishlisted a now-
  sold-out product.

## Future Expansion

- Product bundles/kits (buy several items as one SKU).
- Full Gift Box Builder (customer composes their own box from eligible
  products).
- Structured size-guide data per product/category.
- AI-assisted description drafting from a photo and a few keywords.
- Multi-language product content.

## Functional Requirements

- FR-1: Create/edit/archive products with name, slug, SKU, description,
  price, discount price, category, brand, tags.
- FR-2: Manage one or more variants per product (color, size, SKU,
  barcode, stock, price override).
- FR-3: Upload, reorder, and require alt text on product media (images
  required, video optional).
- FR-4: Set SEO metadata per product, with sensible auto-generated
  defaults.
- FR-5: Toggle Featured / Best Seller / New Arrival / Gift Box flags
  independently.
- FR-6: Assign a product to one Category and any number of Collections.
- FR-7: Enforce Draft → Active → Archived status rules, including the
  publish-readiness checklist.

## Non-Functional Requirements

- Product list and search results should feel instant even with a large
  catalog (thousands of products) — filtering/sorting shouldn't
  noticeably lag.
- Image uploads process and preview within a few seconds under normal
  conditions.

## Business Constraints

- No hard deletion of any product with order history — archive only.
- A product cannot be Active without meeting the full publish checklist
  (variant, image, alt text) — there is no "publish anyway, fix later"
  override, by design, to protect storefront quality.

## Dependencies

- [04-Categories](04-CATEGORIES.md), [05-Collections](05-COLLECTIONS.md) —
  where a product is organized/merchandised.
- [06-Inventory](06-INVENTORY.md) — actual stock levels and movements.
- [09-Coupons](09-COUPONS.md) — coupons can scope to specific products.
- [13-Reviews](13-REVIEWS.md), [14-Wishlist](14-WISHLIST.md) — both
  reference products directly.

## Open Questions

- Should there be a soft cap on the number of images/variants per product
  to keep authoring manageable, or is that left unconstrained?
- At what catalog size does search/filter performance need dedicated
  attention beyond what's already planned (a technical question, flagged
  here because it affects the "instant-feeling" non-functional
  requirement above)?
