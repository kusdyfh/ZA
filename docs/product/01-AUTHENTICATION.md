# 01 — Authentication

## Purpose

Give customers and staff secure, appropriate access to their respective
sides of the platform — customers to their shopping account, staff to
only the admin tools their role covers.

## Business Rules

- Customers self-register with email + password. No public registration
  exists for staff — staff accounts are created only by a Super Admin.
- A customer can check out as a guest without ever creating an account.
- Email verification is **not** required to browse or purchase — it's
  required before a password-reset link is trusted, and before any future
  marketing email is sent to that address.
- Repeated failed login attempts (5 within 15 minutes) temporarily lock
  the account for 15 minutes and trigger a "someone tried to access your
  account" email — a self-recovering lock, never a permanent ban.
- Password reset links are single-use and expire after 30 minutes.
- Super Admin and Manager accounts require a second verification step
  (MFA) at login, given the level of access those roles carry. Other
  staff roles do not require MFA in v1.
- A staff account that's deactivated loses access immediately — any
  active session is ended on their next action.
- The last remaining Super Admin account can never be deactivated or
  have its role changed — the platform can never be left without one.

## User Stories

- As a visitor, I want to create an account with my email and password,
  so I can save my info and track my orders.
- As a returning customer, I want to stay logged in across visits, so I
  don't re-enter my credentials every time.
- As a customer, I want to check out without creating an account, so I
  can buy quickly.
- As a customer, I want to reset my password if I forget it, so I can
  get back into my account.
- As a staff member, I want to log into the admin dashboard and see only
  what my role covers, so I'm not confused by tools I can't use anyway.
- As a Super Admin, I want high-privilege roles to require a second login
  step, so a leaked password alone can't take over the store.

## Acceptance Criteria

- Given a new visitor submits a valid, unused email and a password
  meeting the minimum requirements, When they submit registration, Then
  their account is created and they're logged in immediately.
- Given a customer enters the wrong password 5 times within 15 minutes,
  When they attempt a 6th time, Then the account is locked for 15 minutes
  and an alert email is sent to the account's email address.
- Given a customer requests a password reset, When they click the emailed
  link within 30 minutes, Then they can set a new password; after 30
  minutes, the link shows "this link has expired, request a new one"
  instead of a broken form.
- Given a Super Admin or Manager enters the correct password, When they
  submit login, Then they are prompted for their MFA code before being
  granted access.
- Given a Super Admin deactivates a staff account, When that staff member
  next clicks anything in the dashboard, Then they are logged out and
  shown "your account has been deactivated, contact your administrator."

## Edge Cases

- A visitor tries to register with an email already on file → shown
  "this email is already registered — log in or reset your password,"
  never a generic error that hides the real reason.
- A customer's session expires while mid-checkout → their cart is
  preserved; they're prompted to log back in and returned to checkout,
  not sent back to an empty cart.
- The only remaining Super Admin tries to demote themselves or another
  admin tries to deactivate them → blocked, with an explanation that at
  least one Super Admin must always exist.
- A customer logs in from multiple devices at once → allowed; there is no
  single-session restriction for customers in v1.
- A staff member's role is changed while they're logged in → their
  permissions update on their next action, without requiring a fresh
  login.

## Validation Rules

- Email: required, valid format, unique per account type (a customer and
  a staff member could theoretically share an email — these are separate
  identity pools).
- Password: minimum 10 characters. Length is prioritized over forced
  complexity rules (no mandatory special-character requirement), since
  length matters more for real-world security and complexity rules mostly
  just frustrate users into predictable substitutions.
- Phone: optional at registration, required at checkout; validated
  against a standard phone format.

## Permissions

- Registration/login/password-reset: self-service, open to any visitor
  (customer side).
- Staff account creation, role assignment, deactivation: Super Admin only.
- No staff role can create or elevate their own permissions.

## UI Behaviour

- Login form: email + password, "forgot password" link, clear inline
  validation, a loading state on submit.
- After login, the customer returns to wherever they were headed (e.g.,
  back into checkout), not always dumped on the homepage.
- MFA prompt appears only after a correct password, never before —
  incorrect passwords don't leak whether MFA would have been required
  next.

## Error States

- Invalid email or password: a single generic message ("email or password
  is incorrect") — never reveals which one was wrong, to avoid helping an
  attacker enumerate valid emails.
- Account locked: clear message with the remaining lock time.
- Expired or already-used reset link: clear message with a "request a new
  link" action.
- Incorrect or expired MFA code: clear message, limited retry attempts
  before a short cooldown.
- Network/server error during any auth action: a retry option, never a
  silent failure.

## Notifications

- Welcome email on registration.
- Password-changed confirmation email.
- Suspicious-login-attempt (lockout) email alert.
- Password-reset-requested email with the reset link.
- Full channel detail: [19-NOTIFICATIONS.md](19-NOTIFICATIONS.md).

## Future Expansion

- Social login (Google/Apple).
- Optional MFA for customers.
- Biometric login on a future mobile app.
- Single sign-on for a future B2B/wholesale account tier.

## Functional Requirements

- FR-1: Customers can register, log in, log out, and stay logged in
  across sessions.
- FR-2: Customers can check out as a guest.
- FR-3: Customers can request and complete a password reset.
- FR-4: Super Admin can create, edit, and deactivate staff accounts and
  assign roles.
- FR-5: Super Admin and Manager logins require MFA.
- FR-6: Failed-login lockout with a self-expiring cooldown.

## Non-Functional Requirements

- Login and registration typically respond within 1 second.
- Password-reset emails are delivered within 1 minute under normal
  conditions.
- Account lockouts are always self-recoverable — never a dead end
  requiring manual support intervention (though Customer Support can
  still assist).

## Business Constraints

- No public staff registration, ever.
- Customer accounts are never automatically merged, even if two accounts
  share a name or phone number — merging is a manual, deliberate action
  outside v1 scope entirely.
- Exactly one Super Admin is the required minimum; there is no maximum.

## Dependencies

- [19-Notifications](19-NOTIFICATIONS.md) — for every email this module
  sends.
- [23-Roles & Permissions](23-ROLES-PERMISSIONS.md) — for what a staff
  role can access once logged in.
- [02-Customers](02-CUSTOMERS.md) — a customer profile is created
  alongside their auth record at registration.

## Open Questions

- Should staff sessions have a shorter idle-timeout than customer
  sessions, given the sensitivity of admin access?
- Should concurrent staff logins from multiple devices be restricted,
  unlike the customer side?
- Is there ever a case (e.g., unusually high-value orders) where email
  verification should become mandatory before checkout completes?
