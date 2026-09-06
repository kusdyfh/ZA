# 24 — Product Backlog

Prioritized by **business value**, not build sequence — this is a
product view of what matters when, and it's consistent with (though not
identical in wording to) the technical build order in
[docs/05-ROADMAP.md](../05-ROADMAP.md) and
[docs/v2/10-MIGRATION-NOTES.md](../v2/10-MIGRATION-NOTES.md). Where the
two differ, it's because a feature can be technically convenient to build
early while still being a Phase 2/3 business priority, or vice versa —
that's expected and fine.

## MVP — What ZA Store Cannot Launch Without

The store cannot open, in any meaningful sense, without these. Everything
here answers: can a customer discover a product, buy it, and receive it —
and can the business run that operation day to day.

**Authentication** — customer registration/login/guest checkout, staff
login with the five fixed roles, password reset, MFA for Super
Admin/Manager.

**Customers** — profile, address book, order history view, marketing
opt-in.

**Products** — full catalog authoring: variants (color/size), images with
required alt text, SEO fields, Draft/Active/Archived status,
Featured/Best Seller/New Arrival flags, accurate stock-based visibility.

**Categories** — the core browsing tree.

**Collections** — basic curated sets (even if scheduling is added later,
manual curation is needed at launch for New Arrival/Best Sellers/Sale).

**Inventory** — stock tracking, checkout reservations with automatic
release, manual adjustments with required reasons, low-stock alerts. Full
returns/damaged-stock handling is needed at launch too, since a store
without a return process isn't operable.

**Orders** — the complete lifecycle exactly as specified in
[07-Orders](07-ORDERS.md): every status, every cancellation path, every
failure scenario. This is not deferrable — a store can't sell things
without a working, correct order process.

**Checkout** — guest and logged-in checkout, Cash on Delivery.

**Coupons** — core rules (usage limits, expiration, product/category
scoping, minimum order amount, single-coupon-per-order).

**Discounts** — a simple sale price per product; simple enough to ship at
launch rather than defer.

**Shipping** — flat-rate/free-threshold shipping cost, supported delivery
regions.

**Payments** — Cash on Delivery at minimum.

**CMS** — the essential static pages (About, FAQ, Shipping Policy, Terms,
Privacy) — a store needs these to be trustworthy and legally complete on
day one.

**Notifications** — dashboard and email channels for the core events
(order placed/status-changed/cancelled, low stock, password reset).

**Settings** — the essential store configuration (contact info, SEO
defaults, shipping defaults).

**Roles & Permissions** — the five fixed roles, enforced everywhere.

## Phase 2 — Strengthens the Business Shortly After Launch

These aren't required to open the doors, but the business will feel their
absence quickly once real customers and real content needs show up.

- **Payments**: card payment, alongside COD.
- **Reviews**: full submission + moderation — social proof matters
  quickly once there's real purchase volume to draw reviews from.
- **Wishlist**: save-for-later, a standard expectation for a premium DTC
  storefront.
- **Homepage Builder**: move from a fixed launch homepage to a
  Manager-configurable one.
- **Banners**: scheduled promotional imagery, once there are real
  campaigns to run.
- **Blog**: content marketing and SEO acquisition.
- **Analytics**: the live dashboard — useful once there's real data to
  look at.
- **Reports**: exportable sales/inventory/coupon reports for accounting.
- **Notifications**: real-time (live) dashboard updates, on top of the
  MVP's dashboard+email channels.

## Phase 3 — Scaling & Optimizing a Mature Business

Relevant once the store has real volume and the business wants to work
smarter, not just have the basics running.

- **Coupons**: automatic/code-less discounts and a defined priority order
  against manual coupons (once that's a real, not hypothetical, need).
- **Inventory**: multi-warehouse/location tracking, purchase-order/
  reorder automation.
- **Orders**: split/partial shipments, a true single-transaction exchange
  flow (replacing the return-plus-reorder approach).
- **Reviews**: verified-purchase badges, photo/video reviews.
- **Notifications**: WhatsApp order updates.
- **Roles & Permissions**: custom/granular permissions beyond the five
  fixed roles — relevant once the team or a future client genuinely needs
  a role the fixed set doesn't cover.
- **Shipping**: real carrier integration with live tracking and multiple
  speed options.

## Future Ideas — Opportunistic, No Committed Timeline

Named so they're not forgotten and not accidentally designed-around, but
genuinely speculative until there's a concrete reason to schedule them.

- Gift Box Builder (customer-composed gift boxes).
- Reward points / loyalty program.
- Referral program.
- Push notifications (once a mobile app or installable web app exists).
- Product bundles/kits.
- Multi-language storefront content.
- Multi-currency pricing.
- Social login (Google/Apple).
- A fully custom, block-based homepage/page builder.
- AI-assisted product description drafting.
- AI-driven product recommendations.
- Customer segments for targeted marketing.
- A/B testing homepage layouts.
- Wishlist sharing/gifting links.
- Back-in-stock and price-drop alerts.
- Scheduled/recurring reports emailed automatically.
- A custom report builder.
- Cohort analysis and customer lifetime value reporting.

## How to use this backlog

- A module's individual document (`01`–`23`) is the authoritative detail
  for a feature — this backlog only says *when*, not *how*.
- If a Phase 2/3/Future item turns out to be needed earlier (a real
  customer complaint, a real operational pain point), move it up
  deliberately and note why — don't silently build ahead of this backlog
  without updating it, since the whole point of writing this down is to
  keep scope decisions visible and intentional rather than ad hoc.
