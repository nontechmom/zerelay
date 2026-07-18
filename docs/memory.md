# Memory

This file stores project decisions and “things we don’t want to forget.”

---

## Positioning
- ZeRelay is **not** a mobile dashboard.
- ZeRelay is a **mobile workspace for Resend**.
- Hero feature: **Inbound Mail becomes actionable**.
- Core tagline: **Stop reading JSON. Start reading emails.**

---

## Build order decision
- **We will build the Team plan capabilities first (ungated).**
- We will add paid plans and gating only after gathering user feedback and usage data.

---

## Team capabilities (Phase 1 must include)
- Unlimited Members
- Assignment Workflow
- Internal Comments
- Audit Logs
- Shared Workspaces
- Priority Notifications

---

## Security invariants
- Resend API keys must not be exposed to clients.
- Prefer Resend OAuth for mobile-safe account connection once app credentials are available.
- If API keys are used during MVP/local testing, they must be stored server-side only.
- Backend proxies all Resend calls.
- Workspace-scoped authorization everywhere.

---

## Known unknowns (to decide)
- Billing provider (likely Stripe) and exact plan gating rules.
- Roles/permissions for workspace members (owner/admin/member/viewer?).
- Exact inbound email data model (message vs conversation vs participant tables).
- Confirm whether Resend will provide third-party OAuth app credentials/scopes for ZeRelay.
