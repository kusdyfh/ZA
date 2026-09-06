# 22 — Settings

## Purpose

Let a Super Admin change store-wide configuration — contact info, SEO
defaults, social links, shipping defaults, currency — without needing a
developer for routine changes.

## Business Rules

- Settings are grouped by topic (SEO defaults, contact info, social
  links, shipping defaults, currency) with sensible values pre-filled at
  launch.
- A settings change takes effect immediately — there's no deploy or
  waiting period.
- Settings are business configuration, not feature-rollout control — a
  setting decides *how* an already-available feature behaves (e.g., what
  the default shipping fee is), never *whether* an unfinished feature is
  visible at all.

## User Stories

- As a Super Admin, I want to update the store's support contact number,
  so customers always reach the right place.
- As a Super Admin, I want to update the default SEO title/description
  template, so new pages start with sensible metadata automatically.

## Acceptance Criteria

- Given a Super Admin updates the support email in Settings, When saved,
  Then every place that displays it (footer, contact page) reflects the
  new value immediately.
- Given a Super Admin enters an invalid URL in a social-link field, When
  saved, Then it's rejected with an inline validation error, preventing a
  broken link from ever reaching the storefront footer.

## Edge Cases

- A required setting (e.g., support email) is accidentally cleared →
  the system either prevents saving an empty required field or falls back
  to a sensible platform default rather than leaving the storefront with
  a visibly broken contact section.

## Validation Rules

- Email fields: valid email format.
- URL fields (social links): valid URL format.
- Phone fields: valid phone format.

## Permissions

- Super Admin: full access.
- All other roles: no access — settings are the one area reserved
  exclusively for the highest-privilege role, given their store-wide
  impact.

## UI Behaviour

- A sectioned settings form, grouped by topic, saved per section rather
  than one giant form.

## Error States

- Invalid field format: inline error at the specific field, save
  blocked until corrected.

## Notifications

- None required in v1.

## Future Expansion

- Per-store theme/branding settings, once more than one store exists.
- Feature-flag toggles surfaced to Super Admin for controlled rollout of
  new capabilities.

## Functional Requirements

- FR-1: View and edit grouped store settings (SEO defaults, contact info,
  social links, shipping defaults, currency).
- FR-2: Apply changes immediately, storefront-wide, without a deploy.

## Non-Functional Requirements

- Settings changes reflect across the storefront within moments of
  saving.

## Business Constraints

- Settings access is Super-Admin-only — no exceptions for other roles,
  given the store-wide blast radius of a mistake here.

## Dependencies

- Referenced by nearly every customer-facing module for defaults (SEO,
  contact info, shipping) — this module is a shared configuration source,
  not a standalone feature.

## Open Questions

- What's the complete list of settings needed at launch versus safely
  deferred?
