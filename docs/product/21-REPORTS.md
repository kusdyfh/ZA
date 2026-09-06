# 21 — Reports

## Purpose

Provide exportable, point-in-time documents (a sales report, an inventory
report, a coupon-usage report) for accounting and record-keeping — a
different need from [20-Analytics](20-ANALYTICS.md)'s live, interactive
dashboard. Analytics answers "how are we doing right now"; Reports
answers "give me a document I can file, share, or hand to an accountant."

## Business Rules

- A report covers a selected date range and is generated on demand — v1
  does not support automatically recurring scheduled reports (see Future
  Expansion).
- Reports export as CSV at minimum, suitable for opening in a spreadsheet
  tool.
- A very large report (a wide date range with a lot of data) generates in
  the background rather than making the person wait on a loading screen —
  they're notified once it's ready to download.

## User Stories

- As a Manager, I want to export a monthly sales report for accounting,
  so our records are complete without manual data entry.
- As a Super Admin, I want to export a coupon-usage report after a
  campaign ends, so I can evaluate its performance in a shareable
  document.

## Acceptance Criteria

- Given a Manager selects a date range and requests a sales report, When
  submitted, Then a CSV file is generated covering exactly that range.
- Given a very large date range is requested, When submitted, Then the
  report generates in the background and the requester is notified once
  it's ready, rather than being left staring at a stalled page.

## Edge Cases

- A requested date range has no data at all → the report still generates,
  correctly showing zero/empty results, rather than failing outright.

## Validation Rules

- A date range is required; the end date must be after the start date.

## Permissions

- Super Admin, Manager: full access to all report types.
- Sales: sales-related reports only, consistent with their Analytics
  scope.
- Warehouse, Customer Support: no access to Reports (their operational
  views live in their respective modules).

## UI Behaviour

- A report-type selector, a date-range picker, an export action, and a
  short history of recently generated reports for re-download.

## Error States

- Invalid date range (end before start): inline validation error.
- Report generation failure: clearly reported, with a retry option, not a
  silently missing file.

## Notifications

- "Your report is ready" notice for background-generated large reports.

## Future Expansion

- Scheduled, recurring reports emailed automatically (e.g., a monthly
  sales report every 1st of the month).
- A custom report builder (choosing exactly which fields/metrics to
  include).

## Functional Requirements

- FR-1: Generate on-demand reports (sales, inventory, coupon-usage) for a
  selected date range, exportable as CSV.
- FR-2: Generate large reports in the background with a ready
  notification.
- FR-3: Retain a short history of recently generated reports for
  re-download.

## Non-Functional Requirements

- A typical report (a normal date range, current data volume) generates
  within a few seconds; only unusually large ranges require the
  background-generation path.

## Business Constraints

- No scheduled/recurring reports in v1 — every report is requested
  on-demand.

## Dependencies

- [07-Orders](07-ORDERS.md), [06-Inventory](06-INVENTORY.md),
  [09-Coupons](09-COUPONS.md) — the underlying data reports are built
  from.
- [19-Notifications](19-NOTIFICATIONS.md) — the "report ready" alert.

## Open Questions

- Which report types are must-haves for launch, versus reasonable to add
  after (sales, inventory, and coupon-usage are assumed must-haves —
  confirm)?
