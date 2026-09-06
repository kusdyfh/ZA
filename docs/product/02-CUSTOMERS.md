# 02 — Customers

## Purpose

Give customers control over their own profile and address book, and give
staff the ability to look up a customer's profile and order history to
provide support — without either side touching the other's concerns
(login/security lives in [01-Authentication](01-AUTHENTICATION.md)).

## Business Rules

- One profile per registered email.
- A customer can hold multiple saved addresses, with exactly one marked
  default.
- Marketing-email opt-in is an explicit, unchecked-by-default checkbox —
  never assumed.
- A customer can request account deletion. Because past orders are
  permanent business/financial records, a deletion request **anonymizes**
  the customer's personal details (name, email, phone) rather than
  deleting their order history — the orders remain, correctly, as
  historical records with no live link back to identifying information.
- Editing or deleting a saved address never changes any past order — an
  order always shows the address it was actually shipped to, exactly as
  it was at the time, regardless of later address-book edits.

## User Stories

- As a customer, I want to manage my profile and saved addresses, so
  checkout is fast on future orders.
- As a customer, I want to view my past orders in one place, so I can
  track or reference them later.
- As a customer, I want to opt in or out of marketing emails, so I only
  get messages I actually want.
- As a customer, I want to request deletion of my personal data, so I can
  exercise control over my information.
- As a Sales or Customer Support staff member, I want to look up a
  customer's profile and order history during a phone inquiry, so I can
  help them without asking them to repeat everything.

## Acceptance Criteria

- Given a customer adds a new address and marks it default, When they
  place their next order, Then that address is pre-selected at checkout.
- Given a customer requests account deletion, When the request is
  processed, Then their name/email/phone are replaced with anonymized
  placeholders, their saved addresses are removed, and their past orders
  remain visible in admin with the shipping details exactly as they were
  at time of purchase.
- Given a customer edits their default address after placing an order,
  When they view that past order, Then it still shows the original
  address used at the time, unaffected by the edit.

## Edge Cases

- A customer deletes their only saved address while they have an
  in-progress order → the order is unaffected, since it already has its
  own permanent copy of the address it needs.
- A customer requests deletion while they have a pending, unfulfilled
  order → the deletion request is still honored for their personal data;
  the order continues through its normal lifecycle using its own already-
  stored address/contact snapshot, and Customer Support is notified to
  ensure delivery contact is still possible via the order's stored phone
  number.
- Two saved addresses both marked "default" should never be possible —
  marking a new one default automatically un-defaults the previous one.

## Validation Rules

- First/last name required.
- Phone: validated against a standard phone format, required at
  checkout even if optional on the profile itself.
- Address fields required: line 1, city, region/governorate, country.

## Permissions

- Customers manage their own profile/addresses/marketing preference —
  self-service only, no staff role edits a customer's profile on their
  behalf in v1.
- Manager, Sales, and Customer Support can **view** a customer's profile
  and order history (per the role model) to provide support.
- Only Super Admin can initiate the account-anonymization (deletion)
  workflow, given its sensitivity.
- Warehouse has no access to customer profiles.

## UI Behaviour

- Account dashboard with clear tabs: Profile, Addresses, Orders,
  Wishlist.
- Address book shows the default clearly marked, with simple add/edit/
  delete actions.
- Deletion request requires an explicit confirmation step (not a single
  accidental click) given its irreversibility.

## Error States

- Invalid phone/address format: inline validation, specific to the field.
- Attempting to delete the only address while it's marked default: fine,
  the account simply has no address until a new one is added — not
  blocked, since a customer can legitimately want to clear their address
  book.

## Notifications

- Account-deletion-request-received confirmation email.
- Account-deletion-completed confirmation email.
- Full channel detail: [19-Notifications](19-NOTIFICATIONS.md).

## Future Expansion

- Customer segments/tags for targeted marketing.
- Loyalty tier display on the profile page.
- Saved payment methods.
- Staff-assisted profile edits (for phone-order support scenarios).

## Functional Requirements

- FR-1: Customers can view/edit their profile.
- FR-2: Customers can add/edit/delete/default multiple addresses.
- FR-3: Customers can view their order history.
- FR-4: Customers can toggle marketing-email opt-in.
- FR-5: Customers can request account anonymization.
- FR-6: Staff (per role) can view a customer's profile and order history.

## Non-Functional Requirements

- Profile/address changes save and reflect immediately, no perceptible
  delay.
- Anonymization requests are processed within a stated business timeframe
  (e.g., a few business days), with a confirmation once complete.

## Business Constraints

- No account merging in v1 — two accounts remain two accounts even if
  clearly the same person.
- Anonymization, not hard deletion, is the only "delete my data" path,
  because order history must remain intact for financial/legal record-
  keeping.

## Dependencies

- [01-Authentication](01-AUTHENTICATION.md) — owns login/credentials;
  this module owns everything else about "being a customer."
- [07-Orders](07-ORDERS.md) — order history display.
- [19-Notifications](19-NOTIFICATIONS.md) — deletion-request emails.

## Open Questions

- What's the target turnaround time for an anonymization request —
  same-day, or a stated multi-day window?
- Should Sales/Customer Support be able to edit a customer's address on
  their behalf during a phone order, or should that always require the
  customer to do it themselves?
