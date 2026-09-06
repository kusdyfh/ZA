# 15 — CMS (Static Pages)

## Purpose

Let the business author and maintain static informational pages — About,
FAQ, Shipping Policy, Terms & Conditions, Privacy Policy — without
needing a developer for every content change. (Blog and Banners are
related but separate modules — see [17-Banners](17-BANNERS.md) and
[18-Blog](18-BLOG.md) — this module covers standalone static pages
specifically.)

## Business Rules

- A page has a Draft or Published state; only Published pages are
  visible on the storefront.
- Each page has a unique slug (URL path).
- Page content is rich text, restricted to safe formatting — no embedded
  scripts or unsafe content can be added, protecting both the storefront
  and its visitors regardless of who authors a page.
- Unpublishing a page automatically removes it from any navigation menu
  (e.g., the footer) that links to it — no dead links are left visible
  after a page is taken down.

## User Stories

- As a Manager, I want to create and publish a "Shipping Policy" page, so
  customers can find that information themselves.
- As a visitor, I want to read published pages like About or FAQ, so I
  can learn more about the store before buying.

## Acceptance Criteria

- Given a Manager publishes a page, When saved, Then it becomes
  immediately visible at its URL and, if configured, in the relevant
  navigation menu.
- Given a Manager unpublishes a previously-linked page, When saved, Then
  it's removed from navigation automatically and the page itself shows a
  clear "not available" state rather than a broken error if visited
  directly.

## Edge Cases

- Two pages are given the same slug → blocked at save time with a clear
  "this URL is already in use" message.
- A page is unpublished after being indexed by search engines → visiting
  its old URL shows a friendly "this page is no longer available"
  message, not a broken/blank page.

## Validation Rules

- Title, slug, and body required before a page can be published.
- Slug must be unique across all pages.

## Permissions

- Super Admin, Manager: full create/edit/publish rights.
- All other roles: read-only (or no access, since this is purely
  editorial content with no operational relevance to Warehouse/Sales).

## UI Behaviour

- Rich-text editor with a live preview.
- Clear Draft/Published toggle, with unpublished pages clearly marked as
  such in the admin list.

## Error States

- Duplicate slug: inline error.
- Missing required field on publish attempt: blocked with a clear
  explanation.

## Notifications

- None required in v1.

## Future Expansion

- Multi-language page content.
- Version history with rollback to a previous version of a page.

## Functional Requirements

- FR-1: Create/edit/publish/unpublish pages with title, slug, body, SEO
  metadata.
- FR-2: Automatically remove an unpublished page from any navigation menu
  referencing it.

## Non-Functional Requirements

- Publishing a page makes it visible on the storefront within moments,
  with no separate deploy step required.

## Business Constraints

- No version history/rollback in v1 — the current saved version is the
  only one retained.

## Dependencies

- [19-Notifications](19-NOTIFICATIONS.md) — not currently used by this
  module, listed for completeness.

## Open Questions

- Which specific static pages are required at launch (About, FAQ, Terms,
  Privacy, Shipping Policy, Returns Policy — confirm the full list)?
