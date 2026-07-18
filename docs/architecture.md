# Architecture

## Overview
ZeRelay is a mobile-first workspace for Resend, built as a Flutter client backed by a Next.js backend (API Routes / Route Handlers) and Supabase (Postgres, Auth, Realtime, Storage).

**Primary goal:** turn Resend inbound email into an actionable, collaborative mobile workspace.

---

## High-level system diagram

```mermaid
flowchart TD
  U[User (Mobile App)] -->|HTTPS| APP[Flutter (Android now, iOS later)]
  APP -->|JWT / session| AUTH[Supabase Auth]
  APP -->|API calls| API[Next.js Backend]
  API --> DB[Supabase Postgres]
  API --> ST[Supabase Storage]
  API --> RT[Supabase Realtime]

  APP -->|browser connect flow| RESEND_AUTH[Resend OAuth]
  RESEND_AUTH -->|callback code| API
  API -->|OAuth token or fallback server key| RESEND[Resend API]
  RESEND -->|Inbound webhooks| API
  API --> FCM[Firebase Cloud Messaging]
  APP <-->|subscriptions| RT
```

---

## Components

### Mobile app (Flutter)
- **State management:** Riverpod
- **Navigation:** GoRouter
- **UI:** Material 3
- **Responsibilities**
  - Auth + session handling
  - Workspace selection
  - Inbound inbox + thread detail
  - Collaboration UX (assign, comments, status, priority)
  - Notification handling + deep links

### Backend (Next.js)
- Acts as a **secure proxy** for Resend API operations.
- Owns business logic and authorization.
- Uses **webhooks** as the primary mechanism for ingesting new inbound events.
- Owns Resend OAuth callback/token handling when Resend OAuth app credentials are available.
- Responsible for:
  - Workspace membership + roles
  - Data normalization (webhook payload → inbox/thread models)
  - Audit logging
  - Notification fanout

### Supabase
- **Postgres:** source of truth for app data
- **Auth:** user identities and sessions
- **Realtime:** live updates for inbox, comments, assignments
- **Storage:** attachments / files as needed

---

## Core domain model (conceptual)

### Identity & workspace
- `users`
- `workspaces`
- `workspace_members` (role-based access)
- `workspace_invites` (optional)

### Inbound mail
- `inbound_messages` (raw or normalized message)
- `conversations` (thread view)
- `conversation_participants`

### Collaboration (Team capabilities)
- `conversation_comments` (internal only)
- `conversation_assignments` (or fields on `conversations`)
- `audit_log_events`

### Notifications
- `device_tokens`
- `notification_preferences` (future)

---

## Data flow (inbound email)

1. Resend receives email on configured receiving domain.
2. Resend calls ZeRelay webhook endpoint.
3. Next.js validates signature + payload.
4. Backend normalizes payload into `inbound_messages` and updates/creates `conversations`.
5. Backend emits realtime changes (via DB + Supabase Realtime).
6. Backend evaluates notification rules and sends pushes via FCM.

---

## Security model
- Preferred production model: Resend OAuth grants are stored encrypted at rest and never exposed to the client.
- Temporary/local fallback: user-provided Resend API keys may be stored server-side only; the client must not send keys on every API call.
- Backend enforces workspace access and plan/feature checks.
- Supabase RLS policies enforce row-level access by workspace membership.
- Current mock code uses `x-user-id`; production must replace this with Supabase Auth JWT validation.
- Audit logs are append-only (enforced by policies or application rules).

---

## Observability (recommended)
- Errors: Sentry
- Product analytics: PostHog
- Server logs: structured JSON logs
- Background jobs: (not used for now; webhook-driven ingestion)
