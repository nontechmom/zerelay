# Phases

This document defines the delivery phases for ZeRelay.

---

## Phase 0: Foundations
**Goal:** enable a secure, usable workspace baseline.

Deliverables:
- Authentication (Supabase Auth)
- Workspace creation
- Workspace membership model (shared workspaces)
- Resend OAuth connection flow where available
- Secure encrypted storage for OAuth grants and fallback Resend API keys
- Basic navigation + workspace switcher

---

## Phase 1: Team capabilities first (ungated)
**Goal:** ship collaboration workflows before monetization.

Deliverables:
- Unlimited members
- Assignment workflow on conversations
- Internal comments + realtime updates
- Audit logs for key actions
- Priority notifications (assignment + mentions + urgent threads)

Success signals:
- Teams actively assigning and commenting
- Return usage driven by notifications

---

## Phase 2: Inbound Mail (hero) MVP
**Goal:** a polished mobile inbox experience.

Deliverables:
- Inbox list (threaded)
- Conversation detail (thread view)
- Search
- Attachments basics
- Reply/forward via Resend Send Email API

---

## Phase 3: Outbound + domains + reliability
Deliverables:
- Outbound history
- Domain management (verification status)
- Webhook monitoring + retries
- Analytics basics

---

## Phase 4: Monetization
**Goal:** introduce paid plans based on real usage.

Deliverables:
- Subscription model (workspace-level)
- Billing integration
- Feature gating + upgrade flows
- Admin tooling

---

## Phase 5: Premium features
Deliverables:
- AI assistant
- Advanced search
- Labels/smart filters
- Enterprise needs (SSO/SCIM/RBAC)
