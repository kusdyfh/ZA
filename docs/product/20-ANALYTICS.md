# 20 — Analytics

## Purpose

Give staff a live, at-a-glance view of how the business is performing —
revenue, orders, customers, product performance — to inform decisions
made elsewhere in the platform.

## Business Rules

- Analytics is read-only — it informs decisions, it doesn't act on them
  directly. Seeing a product underperform here leads to a Manager action
  in [03-Products](03-PRODUCTS.md) or [09-Coupons](09-COUPONS.md), not an
  action taken inside Analytics itself.
- Every figure shown for a date range also shows the change versus the
  previous equivalent period (e.g., this week vs. last week), so a number
  is never shown without context for whether it's trending up or down.
- What each role sees is scoped to their responsibilities — this is
  reporting, but it's still governed by the same role boundaries as
  everything else.

## User Stories

- As a Manager, I want to see today's revenue compared to yesterday's, so
  I know at a glance how the day is going.
- As a Super Admin, I want to review monthly trends, so I can spot
  longer-term patterns.
- As a Warehouse staff member, I want to see inventory-focused KPIs
  (low-stock counts, movement volume) without being shown sales figures
  that aren't relevant to my role.

## Acceptance Criteria

- Given no orders were placed in a selected date range, When the
  dashboard loads, Then it shows a clean "no activity in this period"
  state rather than a broken or empty-looking chart.
- Given a Warehouse account views the dashboard, When it loads, Then only
  inventory-related KPIs are shown — no revenue or customer figures.

## Edge Cases

- A very short or unusual date range is selected (e.g., a single day with
  no comparable "previous period" yet, such as launch day) → the
  comparison figure is simply omitted or shown as "not enough data,"
  rather than a misleading or broken calculation.

## Validation Rules

- Date range selections must have a start before an end.

## Permissions

- Super Admin, Manager: full dashboard access.
- Warehouse: inventory KPIs only.
- Sales: sales/order KPIs only.
- Customer Support: no dashboard access (their tools are order/review
  focused, not reporting-focused).

## UI Behaviour

- Stat cards (revenue, orders, customers, products) with a clear
  period-over-period delta.
- Charts for trends over time, a top-selling-products list, and a
  low-stock summary.

## Error States

- No data for the selected period: a clean empty state, never a broken
  chart or a confusing zero with no explanation.

## Notifications

- Not applicable — this module is read-only reporting.

## Future Expansion

- Cohort analysis (how a group of customers behaves over time).
- Customer lifetime value.
- Marketing-channel attribution (which source drove a sale).

## Functional Requirements

- FR-1: Display revenue, order count, customer count, and product
  performance for a selectable date range.
- FR-2: Show period-over-period comparison for every headline figure.
- FR-3: Scope visible KPIs to each role's actual responsibilities.

## Non-Functional Requirements

- The dashboard loads within a couple of seconds under normal data
  volumes.

## Business Constraints

- Read-only in v1 — no action (e.g., bulk price changes) can be
  triggered directly from Analytics.

## Dependencies

- [07-Orders](07-ORDERS.md), [03-Products](03-PRODUCTS.md),
  [02-Customers](02-CUSTOMERS.md) — the underlying data Analytics
  summarizes.

## Open Questions

- What date-range presets matter most to the business day-to-day (today/
  7 days/30 days/custom — confirm this is the right set)?
