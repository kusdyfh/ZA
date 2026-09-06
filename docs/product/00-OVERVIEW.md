# ZA Store — Product Specification v1

## What this is, and what it isn't

Everything in `docs/01`–`16` and `docs/v2` is **Software Architecture** —
it answers "how is this built": schema, APIs, event flow, deployment,
Clean Architecture layering. This document set is **Product
Specification** — it answers a different question entirely: **what does
the product do, for whom, under what rules, and how do we know it's
right?**

No code, no NestJS, no React, no Prisma appears anywhere in this set.
Nothing here should require an engineering background to read. If a
developer, a designer, a project manager, a QA engineer, and the business
owner each read one of these module documents, each should come away
with the same understanding of what the feature does and why — that
shared understanding is the actual deliverable, not the document itself.

## Who reads this, and for what

| Reader | Uses this document to... |
|---|---|
| **Business Owner** | Confirm the rules match how the business actually operates, and decide priority via the Backlog. |
| **Project Manager** | Scope phases, write tickets, track what "done" means for a feature. |
| **Designer** | Understand user flows, states, and edge cases before drawing a screen. |
| **Developer** | Understand *what* to build and *why* a rule exists, before opening the architecture docs for *how*. |
| **QA Engineer** | Turn Acceptance Criteria and Edge Cases directly into test cases. |

## How every module document is structured

Every module in `01`–`23` follows the same template, in the same order,
so you can jump to the section you need without re-learning the
document's shape each time:

1. **Purpose** — why this module exists, in one or two sentences.
2. **Business Rules** — the actual rules of the business, stated plainly.
3. **User Stories** — `As a [role], I want [goal], so that [reason].`
4. **Acceptance Criteria** — `Given [context], When [action], Then
   [outcome].` — directly testable.
5. **Edge Cases** — the situations that aren't the happy path, and what
   should happen.
6. **Validation Rules** — what makes an input valid or invalid.
7. **Permissions** — who can do what, mapped to the roles below.
8. **UI Behaviour** — how it should feel to use, without prescribing exact
   pixels.
9. **Error States** — what the user sees when something goes wrong, and
   why that specific message.
10. **Notifications** — what triggers a notification, to whom, on which
    channel (channel detail lives in [19-NOTIFICATIONS.md](19-NOTIFICATIONS.md)).
11. **Future Expansion** — explicitly out of scope for v1, named so it's
    not forgotten and not accidentally built early.
12. **Functional Requirements** — a numbered list of what the system must
    do.
13. **Non-Functional Requirements** — how well it must do it (speed,
    reliability, clarity).
14. **Business Constraints** — deliberate limitations, and why they're
    deliberate.
15. **Dependencies** — which other modules this one relies on.
16. **Open Questions** — genuinely undecided things, named rather than
    silently assumed.

## The roles used throughout

Six roles appear in every Permissions section. Five are staff roles (the
same ones the architecture documents already established — this is the
same matrix, described here in business terms rather than as an access
matrix):

| Role | In plain terms |
|---|---|
| **Customer** | A shopper on the storefront — the only role that isn't staff. |
| **Super Admin** | Owns everything — the only role that can manage other staff accounts and store-wide settings. |
| **Manager** | Runs day-to-day merchandising and operations — products, orders, coupons, content — but not staff/settings. |
| **Warehouse** | Owns physical stock reality — inventory, packing, shipping status. |
| **Sales** | Owns the customer-facing sales relationship — orders, customer lookups, applying coupons. |
| **Customer Support** | Owns post-purchase customer care — order notes, returns, review moderation. |

Full detail on this role model is its own module:
[23-ROLES-PERMISSIONS.md](23-ROLES-PERMISSIONS.md).

## Reading order

There's no required order — each module stands alone — but a sensible
first pass is: [01-AUTHENTICATION](01-AUTHENTICATION.md) →
[02-CUSTOMERS](02-CUSTOMERS.md) →
[03-PRODUCTS](03-PRODUCTS.md) through
[05-COLLECTIONS](05-COLLECTIONS.md) (the catalog) →
[06-INVENTORY](06-INVENTORY.md) through
[08-CHECKOUT](08-CHECKOUT.md) (the purchase path) →
[09-COUPONS](09-COUPONS.md) through
[12-PAYMENTS](12-PAYMENTS.md) (pricing & fulfillment) →
[13-REVIEWS](13-REVIEWS.md)–[18-BLOG](18-BLOG.md) (engagement & content) →
[19-NOTIFICATIONS](19-NOTIFICATIONS.md)–[23-ROLES-PERMISSIONS](23-ROLES-PERMISSIONS.md)
(operations) → [24-PRODUCT-BACKLOG.md](24-PRODUCT-BACKLOG.md) (what ships
when).

## Full module index

| # | Module | Extra depth per the brief |
|---|---|---|
| 01 | [Authentication](01-AUTHENTICATION.md) | |
| 02 | [Customers](02-CUSTOMERS.md) | |
| 03 | [Products](03-PRODUCTS.md) | Variants, colors, sizes, images, video, SEO, status, collections, stock, visibility |
| 04 | [Categories](04-CATEGORIES.md) | |
| 05 | [Collections](05-COLLECTIONS.md) | |
| 06 | [Inventory](06-INVENTORY.md) | Reservations, movements, adjustments, returns, damaged stock, audit trail |
| 07 | [Orders](07-ORDERS.md) | Complete lifecycle, every transition, every cancellation, every failure scenario |
| 08 | [Checkout](08-CHECKOUT.md) | |
| 09 | [Coupons](09-COUPONS.md) | Usage limits, expiration, restrictions, stacking, priority |
| 10 | [Discounts](10-DISCOUNTS.md) | |
| 11 | [Shipping](11-SHIPPING.md) | |
| 12 | [Payments](12-PAYMENTS.md) | |
| 13 | [Reviews](13-REVIEWS.md) | |
| 14 | [Wishlist](14-WISHLIST.md) | |
| 15 | [CMS](15-CMS.md) | |
| 16 | [Homepage Builder](16-HOMEPAGE-BUILDER.md) | |
| 17 | [Banners](17-BANNERS.md) | |
| 18 | [Blog](18-BLOG.md) | |
| 19 | [Notifications](19-NOTIFICATIONS.md) | Email, Dashboard, WebSocket, Webhook, future WhatsApp, future Push |
| 20 | [Analytics](20-ANALYTICS.md) | |
| 21 | [Reports](21-REPORTS.md) | |
| 22 | [Settings](22-SETTINGS.md) | |
| 23 | [Roles & Permissions](23-ROLES-PERMISSIONS.md) | |
| — | [Product Backlog](24-PRODUCT-BACKLOG.md) | MVP / Phase 2 / Phase 3 / Future Ideas |

## Relationship to the Architecture documents

Where a business rule here depends on a technical mechanism already
decided (e.g., a stock hold expiring after a set time, or an order
remembering the exact address it was shipped to even if the customer
later edits their address book), this document states the rule in plain
business language and points to the relevant architecture document for
"how" — it never re-explains the technical mechanism, and it never
contradicts it. If you find a product rule here that seems to conflict
with something in `docs/v2`, that's a documentation bug to flag, not an
intentional override.
