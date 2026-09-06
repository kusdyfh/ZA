# 18 — Blog

## Purpose

Support content marketing and organic search acquisition — scrub-care
guides, sizing tips, day-in-the-life content relevant to the target
audience of medical students and professionals.

## Business Rules

- A post has a Draft or Published state; publishing is a manual action
  in v1 — there's no scheduled-future-date publish for blog posts,
  distinct from [17-Banners](17-BANNERS.md), which does support
  scheduling. This is a deliberate scope difference: banners are
  campaign-timed by nature, blog posts are published when the content is
  actually ready.
- Posts are organized into categories, with an assigned staff author.
- Each post has its own SEO metadata and a cover image.

## User Stories

- As a Manager, I want to write and publish a blog post, so we build
  organic search presence around topics our customers actually care
  about.
- As a visitor, I want to read blog posts and filter by category, so I
  can find content relevant to me.

## Acceptance Criteria

- Given a Manager publishes a post, When saved, Then it becomes
  immediately visible on the storefront blog.
- Given a visitor filters the blog list by category, When applied, Then
  only posts in that category are shown.

## Edge Cases

- A post is unpublished after being indexed by search engines → visiting
  its old URL shows a friendly "this article is no longer available"
  message rather than a broken page.
- A post's assigned category is later removed → the post remains
  published but shows without a category filter tag, rather than
  disappearing or erroring.

## Validation Rules

- Title, slug, and body required to publish.
- Slug unique across all posts.

## Permissions

- Super Admin, Manager: full create/edit/publish rights.
- All other roles: no access.

## UI Behaviour

- Rich-text editor with cover image, category assignment, and SEO fields.
- Storefront blog list with category filtering.

## Error States

- Duplicate slug: inline error.
- Missing required field on publish attempt: blocked with explanation.

## Notifications

- None required in v1.

## Future Expansion

- Scheduled future-dated publishing.
- Comments on posts.
- Related-posts recommendations.
- Author profile pages.

## Functional Requirements

- FR-1: Create/edit/publish posts with title, slug, body, cover image,
  category, author, SEO metadata.
- FR-2: Filter the storefront blog list by category.

## Non-Functional Requirements

- Publishing a post makes it visible immediately, with no separate
  deploy step.

## Business Constraints

- No scheduled publishing in v1 — manual publish only.

## Dependencies

- None beyond standard SEO/content conventions shared with
  [15-CMS](15-CMS.md).

## Open Questions

- Is scheduled publishing (write now, go live on a future date) needed
  before launch, given content marketing often plans posts ahead of time?
