# ZA Store — API Design

REST over HTTPS, JSON only. One NestJS app (`apps/api`) serves both the
storefront and admin dashboard; routes are separated by prefix and guarded
by RBAC, not by separate servers (see
[01-ARCHITECTURE.md §1](01-ARCHITECTURE.md#1-overview)).

## 1. Conventions

**Base paths**
- `/v1/storefront/...` — public + customer-authenticated endpoints
- `/v1/admin/...` — staff-authenticated endpoints (RBAC-guarded)
- `/v1/auth/...` — shared auth endpoints, `aud` claim determines subject type

**Response envelope**

```json
{
  "success": true,
  "data": { },
  "meta": { }
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_OUT_OF_STOCK",
    "message": "This variant is no longer available.",
    "details": {}
  }
}
```

- `code` is a stable machine-readable string (frontend can branch on it),
  `message` is safe to show the user, `details` only present for validation
  errors (field-level messages).
- HTTP status still follows convention (400/401/403/404/409/422/429/500) —
  the envelope is for structured client handling, not a replacement for
  status codes.

**Pagination** (all list endpoints)

Query: `?page=1&limit=20&sort=createdAt:desc`

```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 238, "totalPages": 12 }
}
```

**Filtering** (list endpoints accept a consistent filter query shape)

`GET /v1/storefront/products?category=scrubs&color=blush-pink&size=M&minPrice=20&maxPrice=80&sort=price:asc`

**Idempotency**: mutating endpoints that trigger side effects a client
might retry (checkout submission) accept an `Idempotency-Key` header.

**Versioning**: URI-prefixed (`/v1/`) — a breaking change ships as `/v2/`
rather than mutating `/v1/` under active clients.

## 2. Auth

```
POST   /v1/auth/customer/register
POST   /v1/auth/customer/login
POST   /v1/auth/admin/login
POST   /v1/auth/refresh              # reads refresh cookie, rotates it, returns new access token
POST   /v1/auth/logout               # revokes current refresh token family
POST   /v1/auth/customer/verify-email
POST   /v1/auth/customer/forgot-password
POST   /v1/auth/customer/reset-password
GET    /v1/auth/me                   # returns whichever subject the access token belongs to
```

- Access token returned in the JSON body (kept in memory client-side, never
  localStorage); refresh token set as an httpOnly cookie by the server.
- `POST /v1/auth/refresh` and `/v1/auth/logout` infer subject type from the
  cookie itself — the client never needs to specify which.

## 3. Storefront — Catalog

```
GET    /v1/storefront/categories
GET    /v1/storefront/categories/:slug
GET    /v1/storefront/collections
GET    /v1/storefront/collections/:slug
GET    /v1/storefront/products                     # filterable, paginated PLP feed
GET    /v1/storefront/products/:slug                # PDP — includes variants, media, reviews summary
GET    /v1/storefront/products/:slug/reviews        # paginated
GET    /v1/storefront/search?q=...                  # full-text + typo-tolerant
GET    /v1/storefront/attributes/colors
GET    /v1/storefront/attributes/sizes
```

## 4. Storefront — Cart & Wishlist

```
GET    /v1/storefront/cart                          # resolves guest token or customer cart
POST   /v1/storefront/cart/items
PATCH  /v1/storefront/cart/items/:itemId
DELETE /v1/storefront/cart/items/:itemId
POST   /v1/storefront/cart/merge                     # merge guest cart into customer cart post-login

GET    /v1/storefront/wishlist
POST   /v1/storefront/wishlist/items
DELETE /v1/storefront/wishlist/items/:productId
```

## 5. Storefront — Checkout & Orders

```
POST   /v1/storefront/coupons/validate               # { code, cartTotal } → discount preview, no mutation
POST   /v1/storefront/checkout                        # creates Order, deducts stock, returns order number
GET    /v1/storefront/orders                            # customer's own orders
GET    /v1/storefront/orders/:orderNumber
GET    /v1/storefront/orders/:orderNumber/track          # public-ish tracking (order number + phone/email check)
```

- `POST /checkout` is the one write-heavy transaction: validates stock,
  applies coupon, locks variant stock rows, creates `Order` +
  `OrderItem[]` + initial `OrderStatusHistory` (PENDING), writes
  `StockMovement` (SALE) rows, clears the cart — all inside one DB
  transaction. Payment capture (future: card gateway) happens before order
  confirmation flips to CONFIRMED; COD orders confirm immediately.

## 6. Storefront — Account

```
GET    /v1/storefront/account/profile
PATCH  /v1/storefront/account/profile
GET    /v1/storefront/account/addresses
POST   /v1/storefront/account/addresses
PATCH  /v1/storefront/account/addresses/:id
DELETE /v1/storefront/account/addresses/:id
POST   /v1/storefront/products/:slug/reviews          # authenticated, one review per product per customer
```

## 7. Storefront — Content

```
GET    /v1/storefront/blog
GET    /v1/storefront/blog/:slug
GET    /v1/storefront/pages/:slug
GET    /v1/storefront/banners?placement=hero
POST   /v1/storefront/newsletter/subscribe
```

## 8. Admin — Catalog Management

*All require an admin access token; role requirements noted per group in
the [RBAC permission matrix](05-ROADMAP.md#rbac-permission-matrix).*

```
GET/POST         /v1/admin/products
GET/PATCH/DELETE /v1/admin/products/:id
POST             /v1/admin/products/:id/media           # Cloudinary signed upload finalize
DELETE           /v1/admin/products/:id/media/:mediaId
GET/POST         /v1/admin/products/:id/variants
PATCH/DELETE     /v1/admin/variants/:id

GET/POST         /v1/admin/categories
PATCH/DELETE     /v1/admin/categories/:id
GET/POST         /v1/admin/collections
PATCH/DELETE     /v1/admin/collections/:id
POST             /v1/admin/collections/:id/products      # attach + reorder

GET/POST         /v1/admin/attributes/colors
GET/POST         /v1/admin/attributes/sizes
GET/POST         /v1/admin/attributes/tags
GET/POST         /v1/admin/brands
```

## 9. Admin — Orders & Inventory

```
GET    /v1/admin/orders                                  # filterable by status/date/customer
GET    /v1/admin/orders/:id
PATCH  /v1/admin/orders/:id/status                        # writes OrderStatusHistory, triggers customer notification
POST   /v1/admin/orders/:id/notes
PATCH  /v1/admin/orders/:id/payment-status

GET    /v1/admin/inventory/variants                        # stock levels, filterable by low-stock
POST   /v1/admin/inventory/variants/:id/adjust               # manual stock adjustment, writes StockMovement
GET    /v1/admin/inventory/movements                          # ledger, filterable by product/variant/type
GET    /v1/admin/inventory/low-stock-alerts
```

## 10. Admin — Customers, Coupons, Reviews

```
GET    /v1/admin/customers
GET    /v1/admin/customers/:id                              # profile + order history
GET/POST     /v1/admin/coupons
PATCH/DELETE /v1/admin/coupons/:id
GET    /v1/admin/coupons/:id/usages

GET    /v1/admin/reviews                                     # filterable by status
PATCH  /v1/admin/reviews/:id/status                            # approve/reject
```

## 11. Admin — Content, Homepage, Blog

```
GET/POST     /v1/admin/banners
PATCH/DELETE /v1/admin/banners/:id
GET/POST     /v1/admin/pages
PATCH/DELETE /v1/admin/pages/:id
GET/POST     /v1/admin/blog/posts
PATCH/DELETE /v1/admin/blog/posts/:id
GET/POST     /v1/admin/blog/categories
GET          /v1/admin/newsletter/subscribers
```

## 12. Admin — Users, RBAC, Settings, Audit

```
GET/POST     /v1/admin/users                                  # Super Admin only
PATCH/DELETE /v1/admin/users/:id                                # Super Admin only
GET          /v1/admin/notifications
PATCH        /v1/admin/notifications/:id/read
GET          /v1/admin/audit-log                                 # filterable by actor/entity/date
GET/PATCH    /v1/admin/settings
```

## 13. Admin — Dashboard & Analytics

```
GET /v1/admin/dashboard/summary            # revenue, orders, customers, products — current period
GET /v1/admin/dashboard/sales-chart?range=30d
GET /v1/admin/dashboard/top-products?limit=10
GET /v1/admin/dashboard/low-stock?limit=10
GET /v1/admin/dashboard/monthly-statistics?year=2026
```

All dashboard endpoints are read-models — implemented as dedicated
aggregation queries (or materialized views if volume warrants it later),
never the application's write path.

## 14. Media Uploads (Cloudinary)

```
POST /v1/admin/uploads/sign            # returns a short-lived signed upload payload (preset, timestamp, signature)
```

The frontend uploads directly to Cloudinary with the signed payload —
binary bytes never transit the NestJS server. On success, the frontend
posts the returned `public_id`/`url` to the owning resource's endpoint
(e.g. `POST /v1/admin/products/:id/media`), which persists a
`ProductMedia` row.

## 15. Webhooks (outbound, from API)

```
POST <storefront>/api/revalidate      # on product/category/page publish — triggers Next.js on-demand ISR
```

Signed with a shared secret header so the storefront can verify the call
actually originated from the API.
