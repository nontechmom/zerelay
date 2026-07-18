# Rules

This file defines the non-negotiable product and engineering rules for ZeRelay.

---

## Product rules

1. **ZeRelay is a workspace, not a dashboard.**
   - The default experience should be action-oriented (assign, comment, reply), not metrics-only.

2. **Inbound Mail is the hero.**
   - Primary navigation and defaults should bias toward the inbox and conversations.

3. **Stop reading JSON. Start reading emails.**
   - User-facing UI must present messages in a readable email format.
   - Raw webhook payloads are for diagnostics only.

4. **Collaboration is first-class.**
   - Every conversation supports assignment, comments, status, and priority.

5. **Build Team capabilities first (ungated).**
   - Unlimited Members
   - Assignment Workflow
   - Internal Comments
   - Audit Logs
   - Shared Workspaces
   - Priority Notifications

6. **Monetize later, based on evidence.**
   - Add billing + feature gating only after we gather user feedback and usage data.

---

## Engineering rules

1. **Backend is the security boundary.**
   - The client never talks to Resend directly.
   - Secrets never ship to the client.
   - Prefer Resend OAuth over raw API keys for mobile connection flows.
   - Raw Resend API keys are allowed only as a temporary server-side fallback.

2. **Authorization is workspace-scoped.**
   - Every API call and DB query must enforce `workspace_id` access.

3. **Audit logs are append-only.**
   - Prefer immutable event records for member, assignment, comment, and domain changes.

4. **Prefer realtime where it improves collaboration.**
   - Inbox updates, comments, assignment changes should update live.

5. **Make mobile fast by default.**
   - Pagination everywhere.
   - Avoid large HTML rendering when not needed.
   - Cache aggressively with clear invalidation rules.

6. **Ship incrementally.**
   - Each milestone should be testable with a small set of users.

---

## Naming rules (docs)
- Use lowercase filenames in `docs/`.
- Use clear, stable names (avoid version suffixes in filenames).
