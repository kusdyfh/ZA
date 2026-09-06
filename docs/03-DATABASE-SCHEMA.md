# ZA Store — Database Schema

PostgreSQL via Prisma. This is the full schema for the initial build — every
domain in the brief is represented. Fields are grouped by bounded context;
each group maps 1:1 to a backend module in
[02-FOLDER-STRUCTURE.md](02-FOLDER-STRUCTURE.md#2-appsapi-nestjs--clean-architecture).

Notes on conventions used throughout:
- IDs are `cuid()` — sortable-ish, collision-safe, no auto-increment leak of
  order/customer counts to the outside world.
- Money fields use `Decimal @db.Money` — never `Float`, to avoid rounding
  errors in totals/discounts.
- Every mutable content model has `createdAt`/`updatedAt`.
- Soft-delete is intentionally **not** used by default — `isActive`/`status`
  flags handle "hide from storefront" without complicating every query with
  a `deletedAt IS NULL` filter. Hard deletes are reserved for genuinely
  disposable rows (cart items, notifications).

## Enums

```prisma
enum AdminRole {
  SUPER_ADMIN
  MANAGER
  WAREHOUSE
  SALES
  CUSTOMER_SUPPORT
}

enum AuthSubjectType {
  ADMIN
  CUSTOMER
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum MediaType {
  IMAGE
  VIDEO
}

enum AddressType {
  SHIPPING
  BILLING
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  PACKED
  SHIPPED
  DELIVERED
  CANCELLED
  RETURNED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum PaymentMethod {
  COD
  CARD
  WALLET
  BANK_TRANSFER
}

enum CouponType {
  PERCENTAGE
  FIXED_AMOUNT
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

enum StockMovementType {
  RECEIVE
  SALE
  ADJUSTMENT
  RETURN
  RESERVATION
  RESERVATION_RELEASE
}

enum NotificationType {
  NEW_ORDER
  LOW_STOCK
  NEW_REVIEW
  COUPON_EXPIRING
  ORDER_CANCELLED
}

enum ContentStatus {
  DRAFT
  PUBLISHED
}
```

## Auth & Users

`AdminUser` (staff) and `Customer` (storefront) are deliberately separate
tables — different lifecycle, different fields, different auth audience
(see [01-ARCHITECTURE.md §4](01-ARCHITECTURE.md#4-authentication--rbac)).
`RefreshToken` is shared and polymorphic via `subjectType` so session
management, rotation, and breach detection live in one place for both.

```prisma
model AdminUser {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  role         AdminRole
  isActive     Boolean   @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  auditLogs     AuditLog[]
  orderNotes    OrderNote[]
  notifications Notification[] @relation("NotificationRecipient")

  @@index([role])
}

model Customer {
  id              String    @id @default(cuid())
  firstName       String
  lastName        String
  email           String    @unique
  phone           String?   @unique
  passwordHash    String
  emailVerifiedAt DateTime?
  marketingOptIn  Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  addresses Address[]
  orders    Order[]
  wishlist  Wishlist?
  cart      Cart?
  reviews   Review[]

  @@index([email])
}

model RefreshToken {
  id           String          @id @default(cuid())
  tokenHash    String          @unique
  subjectId    String
  subjectType  AuthSubjectType
  familyId     String
  revokedAt    DateTime?
  replacedById String?
  userAgent    String?
  ipAddress    String?
  expiresAt    DateTime
  createdAt    DateTime        @default(now())

  @@index([subjectId, subjectType])
  @@index([familyId])
}

model Address {
  id          String      @id @default(cuid())
  customer    Customer    @relation(fields: [customerId], references: [id], onDelete: Cascade)
  customerId  String
  type        AddressType @default(SHIPPING)
  fullName    String
  phone       String
  line1       String
  line2       String?
  city        String
  governorate String
  country     String      @default("Iraq")
  isDefault   Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  orders Order[]

  @@index([customerId])
}
```

## Catalog

Categories are self-referential for a shopping tree (e.g. `Scrubs > Tops`).
Collections are a separate, curated, many-to-many concept ("New Arrival",
"Best Sellers", "Sale", seasonal sets) so a product can belong to a category
*and* several collections without duplicating it. Variants carry their own
stock/SKU/barcode so color+size combinations are independently trackable.

```prisma
model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  imageUrl    String?
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  parentId    String?
  children    Category[] @relation("CategoryTree")
  sortOrder   Int        @default(0)
  isActive    Boolean    @default(true)

  metaTitle       String?
  metaDescription String?

  products Product[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([parentId])
}

model Brand {
  id      String    @id @default(cuid())
  name    String    @unique
  slug    String    @unique
  logoUrl String?

  products Product[]
}

model Collection {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?
  bannerUrl   String?
  isActive    Boolean   @default(true)
  startsAt    DateTime?
  endsAt      DateTime?

  metaTitle       String?
  metaDescription String?

  products CollectionProduct[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CollectionProduct {
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  collectionId String
  product      Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId    String
  sortOrder    Int        @default(0)

  @@id([collectionId, productId])
}

model Color {
  id      String @id @default(cuid())
  name    String @unique
  hexCode String

  variants ProductVariant[]
}

model Size {
  id        String @id @default(cuid())
  label     String @unique
  sortOrder Int    @default(0)

  variants ProductVariant[]
}

model Tag {
  id   String @id @default(cuid())
  name String @unique
  slug String @unique

  products ProductTag[]
}

model ProductTag {
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId String
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId     String

  @@id([productId, tagId])
}

model Product {
  id               String        @id @default(cuid())
  name             String
  slug             String        @unique
  sku              String        @unique
  shortDescription String?
  description      String?
  status           ProductStatus @default(DRAFT)

  price         Decimal  @db.Money
  discountPrice Decimal? @db.Money

  category   Category @relation(fields: [categoryId], references: [id])
  categoryId String
  brand      Brand?   @relation(fields: [brandId], references: [id])
  brandId    String?

  isFeatured   Boolean @default(false)
  isBestSeller Boolean @default(false)
  isNewArrival Boolean @default(false)
  isGiftBox    Boolean @default(false)

  metaTitle       String?
  metaDescription String?
  ogImageUrl      String?

  searchVector Unsupported("tsvector")?

  variants       ProductVariant[]
  media          ProductMedia[]
  tags           ProductTag[]
  collections    CollectionProduct[]
  reviews        Review[]
  wishlistItems  WishlistItem[]
  cartItems      CartItem[]
  orderItems     OrderItem[]
  stockMovements StockMovement[]
  coupons        Coupon[]           @relation("CouponProducts")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([categoryId])
  @@index([status])
  @@index([isFeatured])
  @@index([isBestSeller])
  @@index([isNewArrival])
}

model ProductVariant {
  id                String   @id @default(cuid())
  product           Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId         String
  sku               String   @unique
  barcode           String?  @unique
  color             Color?   @relation(fields: [colorId], references: [id])
  colorId           String?
  size              Size?    @relation(fields: [sizeId], references: [id])
  sizeId            String?
  priceOverride     Decimal? @db.Money
  stock             Int      @default(0)
  lowStockThreshold Int      @default(5)
  isActive          Boolean  @default(true)

  cartItems      CartItem[]
  orderItems     OrderItem[]
  stockMovements StockMovement[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([productId, colorId, sizeId])
  @@index([productId])
}

model ProductMedia {
  id                 String    @id @default(cuid())
  product            Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId          String
  type               MediaType @default(IMAGE)
  url                String
  cloudinaryPublicId String
  altText            String?
  sortOrder          Int       @default(0)

  @@index([productId])
}
```

## Cart & Wishlist

Cart supports guest sessions (`guestToken`) that merge into the customer's
cart on login — required so "add to cart" works before signup, a standard
premium-DTC expectation.

```prisma
model Cart {
  id         String   @id @default(cuid())
  customer   Customer? @relation(fields: [customerId], references: [id], onDelete: Cascade)
  customerId String?  @unique
  guestToken String?  @unique

  items CartItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CartItem {
  id        String          @id @default(cuid())
  cart      Cart            @relation(fields: [cartId], references: [id], onDelete: Cascade)
  cartId    String
  product   Product         @relation(fields: [productId], references: [id])
  productId String
  variant   ProductVariant? @relation(fields: [variantId], references: [id])
  variantId String?
  quantity  Int             @default(1)
  createdAt DateTime        @default(now())

  @@unique([cartId, variantId])
}

model Wishlist {
  id         String @id @default(cuid())
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  customerId String @unique

  items WishlistItem[]
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlist   Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  wishlistId String
  product    Product  @relation(fields: [productId], references: [id])
  productId  String
  createdAt  DateTime @default(now())

  @@unique([wishlistId, productId])
}
```

## Orders

`OrderItem` snapshots product name/SKU/price at time of purchase so catalog
edits never rewrite order history. `OrderStatusHistory` is the audit trail
customers see on the tracking page; `OrderNote` is admin-internal (or
customer-visible via `isInternal = false`) commentary.

```prisma
model Order {
  id                String        @id @default(cuid())
  orderNumber       String        @unique
  customer          Customer      @relation(fields: [customerId], references: [id])
  customerId        String
  shippingAddress   Address       @relation(fields: [shippingAddressId], references: [id])
  shippingAddressId String
  phone             String
  status            OrderStatus   @default(PENDING)

  subtotal      Decimal @db.Money
  discountTotal Decimal @db.Money @default(0)
  shippingFee   Decimal @db.Money @default(0)
  total         Decimal @db.Money

  coupon   Coupon? @relation(fields: [couponId], references: [id])
  couponId String?

  paymentMethod PaymentMethod
  paymentStatus PaymentStatus @default(PENDING)

  items         OrderItem[]
  statusHistory OrderStatusHistory[]
  notes         OrderNote[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([customerId])
  @@index([status])
}

model OrderItem {
  id                  String          @id @default(cuid())
  order                Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId              String
  product              Product         @relation(fields: [productId], references: [id])
  productId            String
  variant              ProductVariant? @relation(fields: [variantId], references: [id])
  variantId            String?
  productNameSnapshot  String
  skuSnapshot          String
  unitPrice            Decimal         @db.Money
  quantity             Int
  lineTotal            Decimal         @db.Money

  @@index([orderId])
}

model OrderStatusHistory {
  id               String      @id @default(cuid())
  order            Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId          String
  status           OrderStatus
  note             String?
  changedByAdminId String?
  createdAt        DateTime    @default(now())

  @@index([orderId])
}

model OrderNote {
  id         String    @id @default(cuid())
  order      Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId    String
  author     AdminUser @relation(fields: [authorId], references: [id])
  authorId   String
  body       String
  isInternal Boolean   @default(true)
  createdAt  DateTime  @default(now())

  @@index([orderId])
}
```

## Coupons & Discounts

A single `Coupon` model covers both "coupons" and "discounts" from the
brief — a discount is simply a coupon with no `code` requirement disabled
at the UI layer, or (if the roadmap later calls for *automatic*, code-less
discounts) an `isAutomatic Boolean` flag can be added without a schema
overhaul. Scoping to specific products/categories is a plain many-to-many.

```prisma
model Coupon {
  id                    String     @id @default(cuid())
  code                  String     @unique
  type                  CouponType
  value                 Decimal    @db.Money
  minOrderAmount        Decimal?   @db.Money
  usageLimit            Int?
  usageLimitPerCustomer Int?       @default(1)
  timesUsed             Int        @default(0)
  isOneTimeUse          Boolean    @default(false)
  startsAt              DateTime?
  expiresAt             DateTime?
  isActive              Boolean    @default(true)

  applicableProducts   Product[]  @relation("CouponProducts")
  applicableCategories Category[] @relation("CouponCategories")

  orders Order[]
  usages CouponUsage[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([code])
}

model CouponUsage {
  id         String   @id @default(cuid())
  coupon     Coupon   @relation(fields: [couponId], references: [id], onDelete: Cascade)
  couponId   String
  customerId String
  orderId    String
  usedAt     DateTime @default(now())

  @@unique([couponId, orderId])
  @@index([couponId, customerId])
}
```

## Reviews & Inventory

`StockMovement` is an append-only ledger — current `ProductVariant.stock`
is a denormalized running total, recomputable from this table if it ever
drifts. This is what powers "inventory history" from the brief.

```prisma
model Review {
  id         String       @id @default(cuid())
  product    Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId  String
  customer   Customer     @relation(fields: [customerId], references: [id])
  customerId String
  rating     Int
  title      String?
  body       String?
  status     ReviewStatus @default(PENDING)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([productId, customerId])
  @@index([productId, status])
}

model StockMovement {
  id               String            @id @default(cuid())
  variant          ProductVariant    @relation(fields: [variantId], references: [id])
  variantId        String
  product          Product           @relation(fields: [productId], references: [id])
  productId        String
  type             StockMovementType
  quantityDelta    Int
  reason           String?
  referenceOrderId String?
  createdByAdminId String?
  createdAt        DateTime          @default(now())

  @@index([variantId])
  @@index([productId])
}

model Notification {
  id                String           @id @default(cuid())
  type              NotificationType
  title             String
  body              String
  isRead            Boolean          @default(false)
  recipient         AdminUser?       @relation("NotificationRecipient", fields: [recipientId], references: [id])
  recipientId       String?
  relatedEntityType String?
  relatedEntityId   String?
  createdAt         DateTime         @default(now())

  @@index([recipientId, isRead])
}
```

## Content & CMS

Powers the homepage builder, blog, and static pages (About, FAQ, Terms)
called out in the brief, plus the newsletter signup.

```prisma
model Banner {
  id             String    @id @default(cuid())
  title          String
  subtitle       String?
  imageUrl       String
  mobileImageUrl String?
  ctaLabel       String?
  ctaUrl         String?
  placement      String
  sortOrder      Int       @default(0)
  isActive       Boolean   @default(true)
  startsAt       DateTime?
  endsAt         DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Page {
  id              String        @id @default(cuid())
  title           String
  slug            String        @unique
  body            String
  status          ContentStatus @default(DRAFT)
  metaTitle       String?
  metaDescription String?
  publishedAt     DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model BlogCategory {
  id   String @id @default(cuid())
  name String @unique
  slug String @unique

  posts BlogPost[]
}

model BlogPost {
  id              String        @id @default(cuid())
  title           String
  slug            String        @unique
  excerpt         String?
  body            String
  coverImageUrl   String?
  category        BlogCategory? @relation(fields: [categoryId], references: [id])
  categoryId      String?
  authorAdminId   String?
  status          ContentStatus @default(DRAFT)
  metaTitle       String?
  metaDescription String?
  publishedAt     DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
}

model NewsletterSubscriber {
  id             String    @id @default(cuid())
  email          String    @unique
  isActive       Boolean   @default(true)
  subscribedAt   DateTime  @default(now())
  unsubscribedAt DateTime?
}
```

## System

```prisma
model AuditLog {
  id         String    @id @default(cuid())
  actor      AdminUser @relation(fields: [actorId], references: [id])
  actorId    String
  action     String
  entityType String
  entityId   String
  beforeData Json?
  afterData  Json?
  ipAddress  String?
  createdAt  DateTime  @default(now())

  @@index([entityType, entityId])
  @@index([actorId])
}

model Setting {
  id    String @id @default(cuid())
  key   String @unique
  value Json
}
```

## Deliberately deferred (future features from the brief)

These are **not** part of the initial schema — adding them later is
additive, not a migration risk to existing data:

- **Gift Box Builder**: `GiftBoxTemplate` + `GiftBoxSlot` models letting a
  customer compose a box from eligible products — layer on top of
  `Product.isGiftBox` once the base commerce flow is proven.
- **Reward Points**: `PointsLedger` per customer, earn/redeem rules tied to
  `Order`.
- **Referral System**: `ReferralCode` per customer + `ReferralConversion`.
- **Push Notifications**: `PushSubscription` per customer/device.

## Indexing & search strategy

- `Product.searchVector` (Postgres `tsvector`, generated column via raw SQL
  migration after `prisma migrate`) backs full-text search across name,
  short description, and tags — combined with trigram indexes
  (`pg_trgm`) for typo-tolerant "did you mean" search.
- Composite indexes on hot filter paths: `(categoryId, status)`,
  `(isBestSeller, status)`, `(isNewArrival, status)` support PLP filtering
  without full scans.
- All money columns use `Decimal`/`Money` — arithmetic (discounts, totals)
  happens server-side only, never trust a client-submitted total.
