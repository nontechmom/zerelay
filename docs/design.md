# Design

This document captures product and UX design guidance for ZeRelay.

---

## Brand / positioning

**ZeRelay isn’t a mobile dashboard.**

**ZeRelay is the first mobile workspace for Resend where inbound email becomes actionable.**

Primary promise:

> Stop reading JSON. Start reading emails.

---

## Information architecture

### Primary navigation (recommended)
- Inbox (hero)
- Outbound
- Domains
- Activity
- Settings

### Workspace-level screens
- Workspace switcher
- Members
- Resend connection (OAuth preferred; API-key fallback hidden behind backend)
- Notification settings (future)

---

## Inbox UX (hero)

### Inbox list
- Gmail-inspired conversation list
- Must support:
  - search
  - unread state
  - assignment indicator
  - priority indicator
  - status chip
  - attachments indicator

### Conversation detail
- Threaded messages
- Sticky action bar:
  - Reply
  - Assign
  - Status
  - Priority
  - Comment
- Internal comments should be visually distinct from email messages.

---

## Collaboration UX

### Assignment
- Quick assign to self
- Assign to member picker
- Filter: “Assigned to me”

### Status
Default set:
- Open
- In progress
- Waiting
- Resolved
- Closed

### Priority
- Low
- Medium
- High
- Urgent

### Comments
- Comments are internal only (never sent externally).
- Support mentions `@name` (can be v2).

---

## Notifications

### Priority notifications
Notify for:
- assigned to me
- mention in a comment
- inbound email in high-priority conversations

Deep link behavior:
- tapping notification opens the target conversation in the correct workspace.

---

## Accessibility & performance
- Dark mode and light mode supported.
- Text size should scale with OS settings.
- Prefer native-feeling interactions and avoid heavy animations.

---

## Future design considerations
- Labels and smart filters
- Attachment preview
- AI assistant surfaces (summaries, drafts)
