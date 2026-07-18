# Product Requirements Document (PRD)

# ZeRelay

## The Mobile Workspace for Resend

- **Version:** 1.0
- **Company:** Zeppelin Labs
- **Platform:** Android (Flutter) → iOS (Future)
- **Backend:** Next.js + Supabase
- **Primary Integration:** Resend API

---

## Vision

Empower every developer, startup, and business using Resend with a native mobile workspace to manage transactional email infrastructure, collaborate with teams, and process inbound email from anywhere.

Unlike traditional dashboards, ZeRelay transforms inbound email into a collaborative workspace optimized for mobile devices.

---

## Mission

Build the world's best mobile experience for Resend.

Not another email provider.

Not another dashboard.

A mobile workspace where developers can monitor, receive, collaborate, and act on email infrastructure in real time.

---

## Positioning

### What ZeRelay is

- Mobile-first workspace
- Companion for Resend
- Email operations application
- Team collaboration platform
- Inbound email workspace

### What ZeRelay is NOT

- Gmail replacement
- Email hosting provider
- SMTP provider
- Email sending service

---

## Unique Selling Proposition

### Inbound Mail Workspace

This is the defining feature of ZeRelay.

Resend provides powerful email receiving capabilities, but developers currently work with webhook payloads, JSON, and backend logs.

ZeRelay converts inbound email into a polished, Gmail-inspired mobile experience.

Instead of inspecting webhook data, users receive a complete inbox with conversations, attachments, search, collaboration, and reply capabilities.

This transforms inbound email from a developer feature into a business workflow.

---

## Target Users

### Developers

Receive application emails.

Example:

```text
support@company.com
```

### SaaS Founders

Need production monitoring.

### Agencies

Manage client Resend workspaces.

### Customer Support Teams

Respond to customer emails.

### Operations Teams

Manage transactional communication.

---

## User Journey

```text
Install ZeRelay

↓

Create Account

↓

Create Workspace

↓

Connect Resend via OAuth

↓

Configure Receiving Domain

↓

Receive Emails

↓

Collaborate

↓

Reply

↓

Monitor
```

---

## Core Modules

### Authentication

Supported:

- Email & Password
- Google
- GitHub

Each user belongs to one or more workspaces.

### Resend connection

Preferred:

- Resend OAuth / Connect flow, initiated from the mobile app and completed through the backend callback.
- OAuth grants are stored server-side and encrypted at rest.

Fallback for MVP/local testing only:

- User-provided Resend API key captured once and stored server-side.
- The mobile client must not call Resend directly or pass the key on every request.

---

## Workspace

Each workspace contains:

```text
Workspace

├── Members

├── Resend OAuth connection / fallback server-side credentials

├── Domains

├── Inbound Mail

├── Outbound Emails

├── Templates

├── Broadcasts

├── Contacts

├── Webhooks

└── Activity
```

---

## Home

Shows:

```text
Today's Emails

Inbound

Outbound

Failed

Delivered

Domains

Broadcasts

Recent Activity
```

---

## Hero Module: Inbound Mail

This is the homepage for most users.

Instead of JSON.

Instead of webhook payloads.

Users see:

```text
Inbox
```

---

## Inbox UI

Gmail-inspired.

```text
☰ Inbox

Search...

──────────────────

John Smith

Payment Issue

Can someone help...

2m

──────────────────

GitHub

PR Approved

8m

──────────────────

Stripe

Payment Received

18m

──────────────────

Customer

Refund Request

Yesterday

──────────────────

Support

Bug Report

Yesterday
```

---

## Email Detail

```text
←

Payment Issue

John Smith

Today

────────────────────

Email Content

────────────────────

Attachments

proposal.pdf

────────────────────

Reply

Forward

Archive

Delete

Assign

Comment
```

---

## Thread View

Emails appear as conversations.

```text
Customer

↓

Support

↓

Customer

↓

Support
```

---

## Reply

Uses Resend Send Email API.

```text
Compose Reply

↓

Send

↓

Conversation Updated
```

---

## Search

Search by:

- Subject
- Sender
- Recipient
- Attachment
- Date
- Conversation

---

## Labels

ZeRelay managed.

Examples:

```text
Support

Sales

Finance

HR

VIP

Bug

Refund

Invoice
```

---

## Smart Filters

```text
Unread

Assigned

Important

Has Attachments

Today

Last Week

Needs Reply
```

---

## Attachments

- Preview
- Download
- Share

---

## Notifications

```text
New Email

↓

Phone Notification

↓

Open Inbox
```

---

## Collaboration

Every email becomes collaborative.

### Comments

Internal discussion.

```text
Ahmed

Need Finance approval.

──────────

Ali

Working on it.
```

### Mentions

```text
@Sarah

Please review.
```

### Assign

```text
Assign

↓

Ali
```

### Status

```text
Open

In Progress

Waiting

Resolved

Closed
```

### Priority

```text
Low

Medium

High

Urgent
```

### Internal Notes

Visible only inside workspace.

### Activity Timeline

```text
Ali replied.

Sarah assigned.

Ahmed resolved.

Domain updated.
```

---

## Outbound Email

List of emails sent through Resend.

```text
Search

↓

OTP

Delivered

↓

Invoice

Opened

↓

Receipt

Clicked
```

---

## Compose Email

Supports:

- To
- CC
- BCC
- Subject
- HTML
- Text
- Attachments
- Schedule Send

---

## Templates

- Browse
- Preview
- Duplicate
- Send Test

---

## Broadcasts

- Create
- Schedule
- Monitor
- Cancel

---

## Contacts

- Audiences
- Subscribers
- Import
- Export
- Search

---

## Domains

Shows:

```text
Verified

Pending

Failed
```

Capabilities:

- DNS
- SPF
- DKIM
- DMARC
- Verification

---

## Webhooks

- Monitor
- Recent Events
- Retry Failures
- Health

---

## Analytics

Charts:

- Daily
- Weekly
- Monthly

Metrics:

- Sent
- Delivered
- Failed
- Bounce
- Complaint
- Opens
- Clicks

---

## Push Notifications

Examples:

```text
New Support Email

────────────

Broadcast Completed

────────────

Webhook Failed

────────────

Bounce Rate Increased

────────────

Domain Verified

────────────

Customer Replied
```

---

## AI Assistant (Premium)

```text
Summarize Inbox

────────────

Which customers need replies?

────────────

Summarize today's support emails.

────────────

Generate reply draft.

────────────

Find urgent conversations.
```

Future models can also classify emails automatically (support, sales, billing, spam), extract action items, and suggest canned responses.

---

## Security

- Backend proxy for all Resend API calls
- Encrypted API keys (AES-256 at rest)
- JWT-based authentication
- Biometric app lock
- Secure local storage
- Role-based access control
- Audit logs

---

## Technology Stack

### Mobile

- Flutter
- Riverpod
- GoRouter
- Material 3

### Backend

- Next.js (API Routes / Route Handlers)
- Webhook-driven ingestion for inbound events (initially)

### Database

- Supabase PostgreSQL

### Authentication

- Supabase Auth

### Realtime

- Supabase Realtime

### Storage

- Supabase Storage

### Notifications

- Firebase Cloud Messaging

### Analytics

- PostHog

### Error Monitoring

- Sentry

---

## Monetization

### Free

- 1 Workspace
- 1 Resend Account
- Inbound Inbox
- Outbound History
- Push Notifications

### Pro ($9/month)

- Unlimited Workspaces
- Team Collaboration
- Labels & Filters
- AI Reply Suggestions
- Broadcast Management
- Advanced Search

### Team ($29/month)

- Unlimited Members
- Assignment Workflow
- Internal Comments
- Audit Logs
- Shared Workspaces
- Priority Notifications

### Enterprise

- SSO
- SCIM
- Compliance
- Advanced RBAC
- Dedicated Support

---

## Build Strategy

### Phase 1: Build “Team” plan capabilities first (ungated)

Before introducing monetization, we will implement the **Team** plan feature set end-to-end and ship it to users to validate workflows and retention.

Includes:

- Unlimited Members
- Assignment Workflow
- Internal Comments
- Audit Logs
- Shared Workspaces
- Priority Notifications

### Phase 2: Add paid plans after user feedback

After gathering real user feedback and usage data, we will introduce paid subscriptions and gate features by plan.

---

## MVP Scope (v1)

- User authentication
- Workspace creation
- Secure Resend API integration
- **Inbound Mail inbox (flagship feature)**
- Gmail-style conversation UI
- Outbound email history
- Compose & reply
- Push notifications
- Domain management
- Basic analytics

> Note: While the MVP focuses on Inbound Mail, we will **build the Team plan capabilities first (ungated)** as described in the Build Strategy above.

---

## Product Vision (3–5 Years)

ZeRelay becomes the **mobile operating system for transactional email**. It starts as the premier mobile workspace for Resend, centered on a best-in-class inbound mailbox experience. Over time, it evolves into a provider-agnostic platform supporting Resend, Amazon SES, Postmark, SendGrid, Mailgun, and other providers, while retaining its core advantage: **turning developer-centric email infrastructure into a collaborative, mobile-first workflow**.

### One Strategic Addition

If I were building ZeRelay, I would make one promise the homepage revolves around:

> "Stop reading JSON. Start reading emails."

That single message immediately explains the product's value to Resend users. Developers already receive inbound email through webhooks and inspect payloads or logs. ZeRelay converts those events into a familiar, Gmail-like inbox with collaboration, search, replies, notifications, and team workflows—making the product instantly understandable and highly differentiated.
