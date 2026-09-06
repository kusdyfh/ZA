# 05 — Collections

## Purpose

Provide curated, cross-category merchandising groupings — New Arrival,
Best Sellers, Sale, a seasonal campaign like "Ramadan Gift Sets" — that
exist independently of the structural Category tree
([04-Categories](04-CATEGORIES.md)).

## Business Rules

- A collection can include products from any category, in a manually
  chosen and reordered sequence — this ordering is deliberate merchandising,
  not automatic.
- A collection can optionally be time-boxed (a start and end date) for
  campaign-style use; if unset, it's simply always active while enabled.
- A collection can be temporarily deactivated without losing its product
  list or configuration.
- A product that becomes Archived (per [03-Products](03-PRODUCTS.md))
  is automatically excluded from every collection's live display, even
  though the underlying association still technically exists — an
  archived product should never reappear in a curated marketing list.
- Once a time-boxed collection's end date passes, it stops appearing in
  navigation/promotion, but if a customer has an existing direct link to
  it (e.g., shared on social media), the page still loads rather than
  404ing — it just no longer actively promotes itself or gets indexed by
  search engines.

## User Stories

- As a Manager, I want to create a themed collection and add products to
  it in a specific order, so the storefront highlights exactly what I
  intend, in the order I intend.
- As a Manager, I want to schedule a collection to start and end
  automatically, so a seasonal campaign doesn't need manual on/off
  management on launch and end day.
- As a customer, I want to browse a themed collection page, so I can shop
  a specific promotion or curated set easily.

## Acceptance Criteria

- Given a collection scheduled to start in two days, When that date
  arrives, Then the collection automatically becomes visible without any
  manual action.
- Given a product in an active collection is archived, When a customer
  views that collection, Then the archived product no longer appears in
  the list.
- Given a collection's end date has passed, When a customer visits its
  page via an old shared link, Then the page still displays its (now
  static) product list, but the collection no longer appears in active
  navigation and is excluded from search-engine indexing.

## Edge Cases

- A product is added to multiple collections at once (e.g., both "New
  Arrival" and "Gift Boxes") → fully supported; a product can belong to
  any number of collections simultaneously.
- A collection is created with an end date earlier than its start date →
  blocked at save time with a clear validation message.

## Validation Rules

- Name and slug required; slug unique.
- If both start and end dates are set, end must be after start.

## Permissions

- Super Admin, Manager: full create/edit/schedule/deactivate rights,
  including adding/reordering products within a collection.
- Warehouse, Sales, Customer Support: read-only.

## UI Behaviour

- Collection editor: name, description, banner image, schedule window,
  and a product picker with search and drag-to-reorder.
- Admin list view shows each collection's current status at a glance
  (scheduled / active / expired / inactive).

## Error States

- Invalid date range: inline error at save time.
- Attempting to feature an archived product: the picker simply excludes
  archived products from being addable in the first place.

## Notifications

- (Optional) a reminder to the Manager a few days before a scheduled
  collection ends, so a campaign can be extended or replaced in time if
  desired.

## Future Expansion

- Rule-based automatic collections (e.g., "all products tagged
  `summer`"), rather than fully manual curation.
- Per-collection analytics (views, conversion) to measure campaign
  performance directly.

## Functional Requirements

- FR-1: Create/edit/deactivate collections with name, slug, description,
  banner, schedule window.
- FR-2: Add, remove, and reorder products within a collection.
- FR-3: Automatically start/end visibility based on the schedule window.
- FR-4: Automatically exclude archived products from live display.

## Non-Functional Requirements

- Scheduled start/end transitions happen automatically and precisely at
  the configured time, with no manual trigger required.

## Business Constraints

- A collection's scheduling is date-only (no time-zone-specific
  hour-level scheduling) in v1 — sufficient for seasonal campaigns, not
  built for minute-precision launches.

## Dependencies

- [03-Products](03-PRODUCTS.md) — collection membership.
- [16-Homepage Builder](16-HOMEPAGE-BUILDER.md) — homepage sections often
  pull their product list directly from a collection.

## Open Questions

- Should the reminder-before-expiry notification be on by default, or an
  opt-in per collection?
