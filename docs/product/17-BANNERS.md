# 17 — Banners

## Purpose

Manage promotional imagery blocks (hero banners, mid-page banners,
gift-box promo blocks) independently of the overall homepage layout, so
campaigns can be scheduled and swapped without touching the layout
itself.

## Business Rules

- A banner has a placement (e.g., hero, mid-page, gift-box promo), and
  can be scheduled with a start and end date to go live and expire
  automatically.
- A banner intended for the hero placement requires both a desktop and a
  mobile image before it can be activated — a missing mobile image would
  look broken to the majority of storefront visitors, who browse on
  mobile.
- More than one banner can be active in the same placement at the same
  time — they rotate/display in sequence (e.g., a carousel) rather than
  conflicting; this is expected, normal use, not an error condition.

## User Stories

- As a Manager, I want to schedule a banner two days ahead of a sale, so
  it goes live automatically without me needing to remember to turn it on
  that day.
- As a Manager, I want to add a banner with both desktop and mobile
  images, so it looks right on every device.

## Acceptance Criteria

- Given a banner scheduled to start in two days, When that date arrives,
  Then it becomes visible automatically with no manual action needed.
- Given a Manager tries to activate a hero banner with only a desktop
  image and no mobile image, When saved, Then activation is blocked until
  a mobile image is provided.
- Given two banners are both scheduled active in the hero placement at
  once, When a customer visits, Then both display in rotation — this is
  allowed, not flagged as a conflict.

## Edge Cases

- A banner's end date passes while it's the only active banner in its
  placement → that placement simply shows nothing (or a sensible default,
  depending on the section's configuration in
  [16-Homepage Builder](16-HOMEPAGE-BUILDER.md)) rather than an error.

## Validation Rules

- End date, if set, must be after the start date.
- Desktop image required always; mobile image required specifically for
  hero-placement banners before activation.

## Permissions

- Super Admin, Manager: full create/edit/schedule rights.
- All other roles: no access.

## UI Behaviour

- Banner editor: title, subtitle, desktop/mobile images, call-to-action
  label and link, placement, schedule window.
- Admin list shows each banner's current status (scheduled / active /
  expired / inactive) clearly.

## Error States

- Missing mobile image for a hero banner: blocked at activation with a
  clear message.
- Invalid date range: inline error at save time.

## Notifications

- (Optional) a reminder that a banner is about to go live or about to
  expire.

## Future Expansion

- Per-audience-segment banner targeting.
- Click-through analytics per banner.

## Functional Requirements

- FR-1: Create/edit/schedule banners with placement, images, CTA, and
  date window.
- FR-2: Automatically activate/expire banners based on their schedule.
- FR-3: Require both desktop and mobile images for hero-placement
  banners before activation.

## Non-Functional Requirements

- Scheduled activation/expiry happens automatically and precisely at the
  configured time.

## Business Constraints

- Date-only scheduling (no minute-level precision) in v1 — sufficient
  for campaign-style use, not built for exact-moment launches.

## Dependencies

- [16-Homepage Builder](16-HOMEPAGE-BUILDER.md) — most banners are
  displayed via a homepage section.

## Open Questions

- Should a reminder notification before a banner's scheduled expiry be
  on by default?
