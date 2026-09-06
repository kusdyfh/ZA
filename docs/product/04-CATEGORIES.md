# 04 — Categories

## Purpose

Provide the structural browsing hierarchy customers use to navigate the
catalog (e.g., Scrubs → Tops), and that powers the storefront's main
navigation menu.

## Business Rules

- Categories form a tree, up to 3 levels deep — a deliberate limit to
  keep navigation simple and avoid an overwhelming, deeply-nested menu.
- A category can be deactivated (hidden from the storefront) but cannot
  be deleted while it still has products or subcategories in it — it must
  be emptied or reassigned first.
- Sort order controls the order categories appear in the storefront's
  navigation menu.
- A category cannot be made its own parent or descendant (no circular
  hierarchy).

## User Stories

- As a Manager, I want to build and reorder a category tree, so the
  storefront's navigation makes sense to shoppers.
- As a customer, I want to browse by category, so I can find the type of
  product I'm looking for.
- As a Manager, I want to deactivate a seasonal category without deleting
  its history, so I can bring it back next season.

## Acceptance Criteria

- Given a category with active products, When a Manager attempts to
  delete it, Then the system blocks deletion and suggests deactivating
  or reassigning its products instead.
- Given a Manager reorders categories in the admin tree view, When saved,
  Then the storefront navigation reflects the new order immediately.
- Given a Manager tries to set a category's parent to one of its own
  descendants, When saved, Then the system blocks it with a clear
  explanation.

## Edge Cases

- A category is deactivated while products are still assigned to it →
  those products simply stop appearing under that category in
  navigation/browsing; they remain otherwise unaffected (still findable
  via search, other categories, or collections if applicable).
- A top-level category has no children yet → displays normally as a
  simple, non-expandable navigation entry.

## Validation Rules

- Name and slug required; slug unique across all categories.
- Parent category, if set, must not create a cycle and must respect the
  3-level depth limit.

## Permissions

- Super Admin, Manager: full create/edit/deactivate rights, including
  reordering.
- Warehouse, Sales, Customer Support: read-only.

## UI Behaviour

- Tree-view editor with drag-and-drop reordering and re-parenting.
- Each category shows its current product count, so a Manager can see at
  a glance what would be affected by deactivating it.

## Error States

- Duplicate slug: inline error.
- Attempted circular parent assignment: blocked with explanation.
- Attempted deletion of a non-empty category: blocked, with a suggested
  next step (deactivate, or reassign products first).

## Notifications

- None required for normal operation.

## Future Expansion

- Category-specific landing banners/content.
- AI-assisted category description generation.
- Auto-suggested category assignment based on product attributes.

## Functional Requirements

- FR-1: Create/edit/deactivate categories with name, slug, description,
  image, parent, sort order.
- FR-2: Enforce tree depth limit and prevent circular hierarchies.
- FR-3: Block deletion of non-empty categories.

## Non-Functional Requirements

- Reordering and re-parenting reflect on the storefront without a
  noticeable delay.

## Business Constraints

- Maximum tree depth of 3 levels, by design, to keep the navigation menu
  simple for shoppers.

## Dependencies

- [03-Products](03-PRODUCTS.md) — every product belongs to exactly one
  category.

## Open Questions

- Should a deactivated category's products automatically get flagged for
  Manager review (to reassign them), or is that left entirely manual?
