# 16 — Homepage Builder

## Purpose

Let the business compose and reorder the homepage's sections — Hero,
Categories, New Collection, Best Sellers, Shop by Color, Gift Boxes,
Instagram Gallery, Reviews, Newsletter — without needing a developer for
every content change or seasonal refresh.

## Business Rules

- The homepage is built from a fixed set of section **types** (listed
  above); a Manager can reorder them, show/hide them, and configure each
  one's content (e.g., which Collection powers "Best Sellers," which
  Banner is the Hero) — but cannot invent an entirely new, arbitrary
  section type from scratch in v1. A fully custom block-based builder is
  explicitly Future Expansion, not part of this module's scope.
- A section that's configured to pull from something that's no longer
  available (e.g., a Collection that's been deactivated) hides itself
  gracefully rather than showing an empty or broken block.

## User Stories

- As a Manager, I want to reorder homepage sections for a seasonal
  refresh, so the homepage always highlights what's currently relevant.
- As a Manager, I want to change which Collection feeds the "New
  Arrivals" section without needing a developer, so I can keep the
  homepage current on my own schedule.

## Acceptance Criteria

- Given a Manager reorders sections and saves, When a customer visits the
  homepage, Then it reflects the new order immediately.
- Given a section is configured to display a Collection that's later
  deactivated, When a customer visits the homepage, Then that section is
  hidden gracefully rather than shown empty or broken.

## Edge Cases

- Every section is hidden/disabled at once (an unlikely but possible
  configuration mistake) → the homepage still renders (header, footer,
  navigation) rather than showing a blank page — this is treated as a
  configuration warning shown to the Manager, not a site-breaking state.

## Validation Rules

- Each visible section must have its required configuration set (e.g., a
  Hero section needs at least one active Banner) before it can be shown —
  otherwise it's flagged to the Manager rather than displayed incomplete.

## Permissions

- Super Admin, Manager: full rights to configure and reorder sections.
- All other roles: no access.

## UI Behaviour

- A simple list of sections with drag-to-reorder, a show/hide toggle per
  section, and a configuration panel specific to each section type.
- A live preview so the Manager can see the result before it goes live.

## Error States

- A section missing its required configuration: flagged clearly in the
  builder, not silently published broken.

## Notifications

- None required in v1.

## Future Expansion

- A fully custom, block-based page builder (arbitrary content blocks, not
  just the fixed section types).
- A/B testing different homepage layouts.
- Per-customer-segment personalized homepage content.

## Functional Requirements

- FR-1: Reorder, show, and hide homepage sections from the fixed set of
  types.
- FR-2: Configure each section's content source (e.g., which Collection
  or Banner it pulls from).
- FR-3: Gracefully hide a section whose configured content source is no
  longer available.

## Non-Functional Requirements

- Homepage changes reflect live within moments of being saved.

## Business Constraints

- Limited to the fixed section-type list in v1 — no arbitrary custom
  blocks.

## Dependencies

- [05-Collections](05-COLLECTIONS.md), [17-Banners](17-BANNERS.md) — most
  homepage sections pull directly from these.

## Open Questions

- Is the fixed section-type list (Hero, Categories, New Collection, Best
  Sellers, Shop by Color, Gift Boxes, Instagram Gallery, Reviews,
  Newsletter) complete for launch, or are there others to add before
  Phase 5?
