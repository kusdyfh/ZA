# ZA Store — Admin Dashboard Specification

Every admin page, specified against the same template: Purpose, Features,
Widgets, Permissions, Filters, Bulk Actions, Tables, Forms, Validation,
User Flow. Permissions reference the RBAC matrix in
[05-ROADMAP.md](05-ROADMAP.md#rbac-permission-matrix); "Full" below means
create/edit/delete, "Read" means view-only, "—" means the page/section is
not visible to that role at all (removed from the sidebar per
[09-DESIGN-SYSTEM.md §7](09-DESIGN-SYSTEM.md#sidebar-admin)).

## 1. Dashboard Overview (`/`)

- **Purpose**: single-glance operating picture for the day.
- **Features**: date-range switcher (today / 7d / 30d / custom), revenue
  vs. previous-period delta, order funnel snapshot.
- **Widgets**: revenue stat card, orders stat card, new customers stat
  card, sales trend chart, top 5 selling products, low-stock alert list
  (top 5, link to full Inventory page), recent orders (last 10).
- **Permissions**: Super Admin/Manager — full analytics. Warehouse — only
  the inventory/low-stock widget. Sales — only the sales/orders widgets.
  Customer Support — page not shown.
- **Filters**: date range only.
- **Bulk Actions**: none (read-only page).
- **Tables**: "Recent Orders" mini-table (order #, customer, total,
  status badge, date) — click-through to Order Detail.
- **Forms**: none.
- **Validation**: n/a.
- **User Flow**: admin logs in → lands here by default → scans stat cards
  → clicks a low-stock item or recent order to drill in.

## 2. Products — List (`/products`)

- **Purpose**: browse/manage the full catalog.
- **Features**: search-as-you-type by name/SKU, status toggle inline,
  quick "duplicate product" action (fast variant-of-a-variant creation).
- **Widgets**: none (list page).
- **Permissions**: Super Admin/Manager — Full. Warehouse/Sales/Customer
  Support — Read.
- **Filters**: category, status (Draft/Active/Archived), brand, featured/
  best-seller/new-arrival flags, price range, stock level (in-stock/low/
  out).
- **Bulk Actions** (Super Admin/Manager only): bulk status change, bulk
  category reassignment, bulk delete (blocked with an explanatory toast if
  any selected product has order history — see
  [07-DATABASE-REVIEW.md §5](07-DATABASE-REVIEW.md#5-cascade-policies)),
  bulk export to CSV.
- **Tables**: thumbnail, name, SKU, category, price (+ discount price if
  set), total stock across variants, status badge, featured/best-seller/
  new-arrival mini-icons, updated date.
- **Forms**: none on this page (create/edit is its own page, below).
- **Validation**: n/a.
- **User Flow**: Manager searches or filters → selects rows for a bulk
  status change, or clicks a row → Product Detail/Edit.

## 3. Products — Create / Edit (`/products/new`, `/products/:id`)

- **Purpose**: author a product end-to-end.
- **Features**: tabbed sections (General, Variants, Media, SEO); slug
  auto-generated from name (editable); live price/discount preview; media
  drag-to-reorder; Cloudinary upload widget per
  [04-API-DESIGN.md §14](04-API-DESIGN.md#14-media-uploads-cloudinary).
- **Widgets**: n/a.
- **Permissions**: Super Admin/Manager — Full. All others — no access
  (redirected from URL if navigated directly).
- **Filters**: n/a.
- **Bulk Actions**: n/a (single-entity page); "duplicate this product"
  single action available here too.
- **Tables**: inline variant matrix (color × size grid, each cell showing
  SKU/stock/price-override, editable in place).
- **Forms**: name, slug, SKU, short/rich description, category, brand,
  price, discount price, tags, featured/best-seller/new-arrival/gift-box
  toggles, meta title/description, OG image, variant rows (color, size,
  SKU, barcode, stock, price override, low-stock threshold).
- **Validation**: name/slug/SKU required + uniqueness checked live against
  the API (debounced); price ≥ 0; discount price, if set, < price; at
  least one variant required before a product can move from Draft to
  Active; alt text required on every media item before publish (ties to
  the accessibility requirement in
  [09-DESIGN-SYSTEM.md §11](09-DESIGN-SYSTEM.md#11-accessibility)).
- **User Flow**: create → fill General → add variants → upload media (alt
  text prompted per image) → fill SEO → status stays Draft until "Publish"
  is explicitly clicked (never auto-active on save).

## 4. Categories (`/categories`)

- **Purpose**: manage the category tree.
- **Features**: drag-and-drop reordering and re-parenting (tree view),
  inline active/inactive toggle.
- **Permissions**: Super Admin/Manager — Full. Others — Read.
- **Filters**: active/inactive.
- **Bulk Actions**: none (tree structure makes bulk operations error-prone
  by design — edits are one at a time).
- **Tables**: tree-structured list (not flat), showing product count per
  category.
- **Forms**: name, slug, parent category (dropdown, excludes self/
  descendants to prevent cycles), description, image, meta title/
  description.
- **Validation**: slug uniqueness; a category with products or child
  categories cannot be deleted (deactivate instead — same archive-don't-
  delete rule as products).
- **User Flow**: Manager drags "Tops" under "Scrubs" → tree updates
  immediately, product PLP inherits the new hierarchy on next storefront
  request.

## 5. Collections (`/collections`)

- **Purpose**: curate cross-category sets (New Arrival, Best Sellers,
  Sale, seasonal).
- **Features**: product picker with search, drag-to-reorder within the
  collection, scheduling (starts/ends at, for seasonal campaigns).
- **Permissions**: Super Admin/Manager — Full. Others — Read.
- **Filters**: active/inactive, currently-scheduled vs. past.
- **Bulk Actions**: bulk add products to a collection (multi-select from
  the product picker).
- **Tables**: collection list (name, product count, active window,
  status); inside a collection, an ordered product table.
- **Forms**: name, slug, description, banner image, starts/ends at, meta
  title/description.
- **Validation**: slug uniqueness; end date must be after start date if
  both set.
- **User Flow**: Manager creates "Summer Sale" → sets a two-week window →
  adds 20 products via picker → reorders featured items to the top.

## 6. Orders — List (`/orders`)

- **Purpose**: operational order queue across every status.
- **Features**: status tabs (All/Pending/Confirmed/.../Cancelled/Returned)
  as a quick filter shortcut, order-number/customer search.
- **Permissions**: Super Admin/Manager/Sales/Customer Support — Read+
  status actions per matrix. Warehouse — Read, plus status actions limited
  to Preparing→Packed→Shipped (the fulfillment slice of the lifecycle).
- **Filters**: status, date range, payment status, payment method,
  customer.
- **Bulk Actions**: bulk status update (e.g. mark a batch "Packed" after a
  warehouse sweep), bulk export/print packing slips.
- **Tables**: order #, customer, item count, total, payment status badge,
  order status badge, date, assigned warehouse note (if any).
- **Forms**: none on the list page.
- **Validation**: n/a.
- **User Flow**: Warehouse filters to "Confirmed" → selects a batch →
  bulk-marks "Preparing" → later returns and marks the same batch "Packed."

## 7. Orders — Detail (`/orders/:id`)

- **Purpose**: full context and control for one order.
- **Features**: status timeline (visual, mirrors `OrderStatusHistory`),
  internal notes thread, customer-visible note option, resend
  confirmation, print invoice/packing slip.
- **Permissions**: status-change buttons rendered only for statuses the
  current role may set (per matrix); refund/cancel button only for Super
  Admin/Manager.
- **Filters**: n/a (single record).
- **Bulk Actions**: n/a.
- **Tables**: line items (product, variant, qty, unit price, line total),
  status history log.
- **Forms**: add note (body, internal/customer-visible toggle), change
  status (dropdown constrained to legal next states per
  `OrderStatusTransitionValidator`,
  [06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md#orders)), edit
  payment status.
- **Validation**: status dropdown never offers an illegal transition (e.g.
  no "Delivered → Pending"); cancel/refund requires a reason field.
- **User Flow**: Customer Support opens an order from a support inquiry →
  adds an internal note → if needed, escalates by flagging for Manager
  review (a customer-visible note, not a status change they're not
  permitted to make).

## 8. Customers (`/customers`)

- **Purpose**: customer directory and profile/order-history lookup.
- **Permissions**: Super Admin/Manager/Sales/Customer Support — Read.
  Warehouse — no access.
- **Filters**: registered date range, has-ordered vs. never-ordered,
  marketing opt-in.
- **Bulk Actions**: export to CSV (for marketing list building — respecting
  `marketingOptIn`).
- **Tables**: name, email, phone, order count, lifetime value, joined
  date.
- **Forms**: none (no admin-side customer creation — customers self-
  register; admin can only view, and, Super Admin only, deactivate/
  anonymize per the erasure procedure in
  [07-DATABASE-REVIEW.md §6](07-DATABASE-REVIEW.md#6-soft-delete-strategy)).
- **Validation**: n/a.
- **User Flow**: Sales searches a customer by email during a phone inquiry
  → opens profile → sees order history → opens the relevant Order Detail.

## 9. Inventory (`/inventory`)

- **Purpose**: stock levels and movement history across all variants.
- **Features**: low-stock highlight row styling, manual adjustment with
  mandatory reason, movement ledger drill-down per variant.
- **Permissions**: Super Admin — Full. Warehouse — Full. Manager — Read.
  Sales/Customer Support — no access.
- **Filters**: product/category, stock level (in-stock/low/out), movement
  type (for the ledger view).
- **Bulk Actions**: bulk stock adjustment import (CSV) for stocktake
  reconciliation.
- **Tables**: "Stock Levels" (SKU, product/variant, current stock, low-
  stock threshold, status highlight); "Movement Ledger" (variant, type,
  quantity delta, reason, actor, date).
- **Forms**: adjust stock (variant, delta or absolute new value, reason —
  required, mapped to `StockMovementType.ADJUSTMENT`).
- **Validation**: stock can never be adjusted below 0; reason field
  required on every manual adjustment (feeds the audit trail).
- **User Flow**: Warehouse notices a discrepancy during a physical count →
  opens the variant → adjusts stock with a reason → ledger records it
  immediately, dashboard low-stock widget updates on next load.

## 10. Coupons (`/coupons`)

- **Purpose**: discount rule management.
- **Permissions**: Super Admin/Manager — Full. Sales — Read (can view/
  apply during phone orders, cannot create/edit). Warehouse/Customer
  Support — no access.
- **Filters**: active/expired/scheduled, type (percentage/fixed).
- **Bulk Actions**: bulk deactivate (e.g. end a campaign early).
- **Tables**: code, type, value, usage (used/limit), validity window,
  status.
- **Forms**: code (uppercase-normalized), type, value, min order amount,
  usage limit (total + per-customer), one-time-use toggle, start/expiry
  dates, applicable products/categories (multi-select, optional — blank
  means store-wide).
- **Validation**: code uniqueness (case-insensitive, per
  [07-DATABASE-REVIEW.md §4](07-DATABASE-REVIEW.md#4-unique-keys));
  percentage value 1–100; expiry after start date; at least one of
  products/categories XOR store-wide (not both explicitly empty and
  scoped).
- **User Flow**: Manager creates `RAMADAN20` → 20% off, store-wide, capped
  at one use per customer, expiring in three weeks → monitors usage count
  on this same page as orders come in.

## 11. Reviews (`/reviews`)

- **Purpose**: moderation queue.
- **Permissions**: Super Admin/Manager/Customer Support — Full (approve/
  reject). Sales/Warehouse — no access.
- **Filters**: status (Pending/Approved/Rejected), rating, product.
- **Bulk Actions**: bulk approve, bulk reject.
- **Tables**: product, customer, rating (stars), title/body excerpt,
  submitted date, status badge.
- **Forms**: none beyond the approve/reject action (with an optional
  internal reason note for rejection).
- **Validation**: n/a.
- **User Flow**: Customer Support reviews the Pending queue daily → bulk-
  approves the clean ones, individually rejects anything flagged as spam
  or abusive.

## 12. Homepage / Banners (`/homepage`)

- **Purpose**: manage hero/promotional banners and homepage section
  content, so the CMS context genuinely drives the storefront homepage
  (per [06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md#cms)) rather
  than any of it being hardcoded.
- **Permissions**: Super Admin/Manager — Full. All others — no access.
- **Filters**: placement (hero/mid-page/gift-box), active/scheduled.
- **Bulk Actions**: reorder (drag), bulk activate/deactivate.
- **Tables**: banner list (thumbnail, title, placement, active window,
  status).
- **Forms**: title, subtitle, image (desktop + mobile variant), CTA label/
  URL, placement, schedule window.
- **Validation**: image required before activation; end date after start
  date.
- **User Flow**: Manager schedules a Gift Box promo banner two days ahead
  of a campaign launch → it goes live automatically at `startsAt`, no
  manual toggle needed on launch day.

## 13. Pages & Blog (`/pages`, `/blog`)

- **Purpose**: static page (About/FAQ/Terms) and blog authoring.
- **Permissions**: Super Admin/Manager — Full. All others — no access.
- **Filters**: status (Draft/Published), category (blog only).
- **Bulk Actions**: bulk publish/unpublish.
- **Tables**: title, slug, status, author, published date.
- **Forms**: title, slug, rich-text body (sanitized on save per
  [12-SECURITY-REVIEW.md](12-SECURITY-REVIEW.md#xss)), cover image (blog),
  category (blog), meta title/description.
- **Validation**: slug uniqueness; body required before publish.
- **User Flow**: Manager drafts a "Scrub Care Guide" blog post → previews
  → publishes → storefront revalidates that route on-demand within
  seconds (per [01-ARCHITECTURE.md §6](01-ARCHITECTURE.md#6-performance)).

## 14. Notifications (`/notifications`)

- **Purpose**: admin notification center (new order, low stock, new
  review, coupon expiring).
- **Permissions**: every role sees notifications relevant to their module
  scope only (a Warehouse account never receives a "new review"
  notification) — enforced server-side per
  [06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md#notifications).
- **Filters**: type, read/unread.
- **Bulk Actions**: mark all read.
- **Tables**: notification feed (icon by type, message, relative time,
  read/unread dot), click-through to the related entity.
- **Forms**: none.
- **Validation**: n/a.
- **User Flow**: Warehouse gets a low-stock ping → clicks through straight
  to that variant's Inventory adjustment form.

## 15. Users & RBAC (`/users`) — Super Admin only

- **Purpose**: staff account and role management.
- **Permissions**: Super Admin — Full. Every other role — page does not
  exist in their sidebar at all.
- **Filters**: role, active/inactive.
- **Bulk Actions**: bulk deactivate.
- **Tables**: name, email, role badge, last login, status.
- **Forms**: name, email, role (single-select from the five fixed roles —
  the matrix itself is not editable per-user in v1, only role *assignment*
  is; see the Administration context boundary in
  [06-DDD-BOUNDED-CONTEXTS.md](06-DDD-BOUNDED-CONTEXTS.md#administration)),
  temporary password (forced reset on first login).
- **Validation**: email uniqueness; cannot deactivate the last remaining
  active Super Admin account (a hard safety rule, checked server-side).
- **User Flow**: Super Admin onboards a new Warehouse hire → assigns the
  Warehouse role → hands over a temporary password → hire is forced to
  set a real password on first login.

## 16. Settings (`/settings`) — Super Admin only

- **Purpose**: site-wide configuration (SEO defaults, shipping fee
  defaults until the full Shipping context ships, social links, contact
  info, currency/locale).
- **Permissions**: Super Admin — Full. All others — no access.
- **Filters**: n/a (single settings form, sectioned).
- **Bulk Actions**: n/a.
- **Tables**: n/a.
- **Forms**: default meta title/description template, social links,
  support email/phone, default currency, low-stock threshold default
  (per-variant override still wins), Cloudinary preset name.
- **Validation**: URLs well-formed; email well-formed.
- **User Flow**: Super Admin updates the support contact number once at
  launch; rarely revisited after.

## 17. Audit Log (`/audit-log`)

- **Purpose**: forensic/compliance trail of every admin mutation.
- **Permissions**: Super Admin — Full (read + no edit, it's append-only
  by definition). Manager — Read. All others — no access.
- **Filters**: actor, entity type, date range, action.
- **Bulk Actions**: none (export to CSV is the closest thing — read-only
  by nature).
- **Tables**: timestamp, actor, action, entity type/id, before/after diff
  (expandable row), IP address.
- **Forms**: none.
- **Validation**: n/a.
- **User Flow**: Super Admin investigates an unexpected price change →
  filters by entity type "Product" + date range → finds the actor and
  the exact before/after diff.
