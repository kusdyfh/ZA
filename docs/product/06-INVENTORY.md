# 06 — Inventory

## Purpose

Keep stock levels accurate and fully explained at all times — protecting
against overselling, giving Warehouse staff full operational visibility,
and giving the business a trustworthy audit trail of every stock change,
why it happened, and who was responsible.

## Business Rules

**Reservations**
- When a customer begins checkout, the stock they intend to buy is
  temporarily **held** for a short window (a few minutes) — long enough to
  complete payment, short enough that an abandoned checkout doesn't lock
  stock away from other shoppers for long.
- A held reservation that's never completed is automatically released
  back to available stock — no manual cleanup required, and no customer
  or staff action needed.
- "Available stock" shown to customers always accounts for active
  reservations — if 5 are in stock and 2 are currently held by other
  shoppers mid-checkout, only 3 are shown as purchasable.

**Movements**
- Every single stock change — a sale, a manual correction, a return, a
  damaged-stock write-off — is permanently logged as a **movement**, with
  a reason and who/what caused it. Stock levels are never silently
  edited; they're always the sum of a real, inspectable history.

**Manual Adjustments**
- A manual stock correction (e.g., after a physical count) always
  requires a reason, chosen from a standard list (stocktake correction,
  damaged, found, other) plus optional free-text detail.
- Stock can never be adjusted to a negative number.
- An unusually large adjustment (above a configurable size) flags the
  Manager for awareness — a lightweight fraud/error safeguard, not a
  blocker.

**Returns & Damaged Stock**
- A returned item is never automatically added back to sellable stock.
  Warehouse inspects its condition first and decides: resellable (added
  back to stock) or damaged (logged as a loss, never resellable).
- Damaged stock is tracked as its own category, separate from sales —
  it's a cost/loss the business needs to see clearly, not something that
  quietly reduces "units sold" figures or gets confused with normal stock
  depletion.

**Audit Trail**
- Every movement records what changed, by how much, why, and who (a
  specific staff member, or "system" for automated changes like a sale or
  a reservation expiring) — a complete, permanent, and reviewable history
  per variant.

## User Stories

- As a Warehouse staff member, I want to see true available stock
  (accounting for active holds), so I always know what I can actually
  promise a customer.
- As a Warehouse staff member, I want to correct stock after a physical
  count with a clear reason recorded, so discrepancies are explained, not
  just changed.
- As a Warehouse staff member, I want to inspect a returned item and
  decide whether it's resellable or damaged, so our stock numbers stay
  trustworthy.
- As a Manager, I want a low-stock alert before we run out, so I can
  reorder in time.
- As a Super Admin, I want to see the full movement history of any
  variant, so I can investigate any discrepancy.

## Acceptance Criteria

- Given a variant with 5 in stock and 2 currently held in other
  customers' active checkouts, When a customer tries to buy 4, Then they
  see "only 3 available" and cannot complete a purchase of 4.
- Given a checkout hold that's gone unconfirmed past its time limit, When
  the cleanup runs, Then the held stock becomes available again
  automatically, with no manual action from any staff member.
- Given a returned item is marked "damaged" by Warehouse, When that's
  saved, Then sellable stock is not increased, and the item is recorded
  as a damaged-stock loss, visible separately in reporting.
- Given a variant's stock crosses its configured low-stock threshold,
  When that happens, Then Warehouse and Manager receive an alert within a
  few minutes.
- Given a manual adjustment attempt that would bring stock below zero,
  When submitted, Then it's blocked with a clear explanation.

## Edge Cases

- Two Warehouse staff attempt to adjust the same variant's stock at the
  same time → the second save is warned that the stock was just changed
  by someone else and asked to review the current value before
  confirming, rather than silently overwriting the first change.
- A payment confirmation arrives after its stock hold already expired
  (an unusually slow payment step) → the sale is not allowed to proceed
  against stock that's no longer actually held; if payment had already
  been captured, it's automatically refunded and the situation is
  escalated to Customer Support to make it right with the customer.
- A bulk stock-count import (spreadsheet) contains one bad row → the
  valid rows still apply; the bad row is reported individually rather
  than failing the entire import.
- An item is found to be out of stock only when Warehouse goes to pack an
  already-confirmed order → handled as an order-level exception (see
  [07-Orders](07-ORDERS.md)'s edge cases), not as a silent inventory
  correction.

## Validation Rules

- Adjustment quantity cannot be zero.
- A reason is always required for a manual adjustment.
- Resulting stock can never go below zero.

## Permissions

- Warehouse: full rights to adjust stock, receive new stock, and process
  returns.
- Manager, Super Admin: full read access and reporting; Super Admin can
  also adjust stock directly if needed.
- Sales, Customer Support: read-only, no adjustment rights.

## UI Behaviour

- Stock table with clear visual flags for low-stock and out-of-stock
  rows.
- A dedicated adjustment action (variant, quantity change, reason) kept
  simple and fast, since Warehouse staff use this frequently.
- A per-variant movement history, viewable as a simple timeline/log.
- A guided returns-processing flow: look up the order → select the
  item(s) → inspect and decide resellable or damaged → confirm.

## Error States

- Adjustment that would result in negative stock: blocked, explained.
- Concurrent-edit conflict: warned, not silently overwritten (see Edge
  Cases).
- Bulk import row errors: reported per row, not as one blanket failure.

## Notifications

- Low-stock alert (Warehouse + Manager).
- Out-of-stock alert (elevated priority over low-stock).
- Damaged-stock-recorded notice (Manager, for cost visibility).
- Unusually large adjustment flag (Manager, oversight).
- Full channel detail: [19-Notifications](19-NOTIFICATIONS.md).

## Future Expansion

- Multi-warehouse/multi-location stock tracking.
- Purchase-order and automatic reorder-point suggestions.
- Barcode-scanner-driven stocktakes.
- Predictive reorder recommendations based on sales velocity.

## Functional Requirements

- FR-1: Track stock per variant, with a full movement history.
- FR-2: Temporarily hold stock during active checkouts, releasing
  automatically if unconfirmed.
- FR-3: Support manual adjustments with mandatory reason codes.
- FR-4: Support a returns-inspection workflow separating resellable from
  damaged stock.
- FR-5: Trigger low-stock and out-of-stock alerts at configurable
  thresholds.
- FR-6: Support bulk stock-count import with per-row error reporting.

## Non-Functional Requirements

- Available-stock figures shown to customers are always accurate in real
  time, accounting for active holds — customers should never be able to
  buy more than truly exists.
- Low-stock alerts fire within a few minutes of the threshold being
  crossed, not hours later.

## Business Constraints

- Stock is never silently edited outside the movement-ledger mechanism —
  every change has a recorded reason and actor, without exception.
- Returned items are never auto-restocked without a human inspection
  step.

## Dependencies

- [03-Products](03-PRODUCTS.md) — variants are the unit inventory tracks.
- [07-Orders](07-ORDERS.md), [08-Checkout](08-CHECKOUT.md) — reservations
  and sales movements originate from the purchase flow.
- [19-Notifications](19-NOTIFICATIONS.md) — alert delivery.

## Open Questions

- What's the default low-stock threshold, and should it vary by product
  type (e.g., a fast-selling best-seller vs. a slow-moving accessory)?
- What quantity counts as an "unusually large" adjustment worth flagging?
- Is there a maximum time a customer can spend in checkout before their
  hold expires that needs tuning based on real payment-flow timing once
  a card gateway is live?
