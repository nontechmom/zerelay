# ZeRelay

ZeRelay is a mobile-first workspace for Resend. It turns inbound Resend webhook payloads into an actionable mobile inbox with conversations, team collaboration, replies, outbound analytics, domain management, and activity logs.

## Repository structure

- `lib/` — Flutter mobile app UI and mock Riverpod state.
- `backend/` — Next.js backend route handlers that proxy Resend safely.
- `docs/` — product, architecture, phase, and Resend integration documentation.

## Current status

This repo is still in an MVP/prototype state:

- Flutter screens use local mock state (`lib/providers/state.dart`).
- Backend routes exist for Resend send/domains/webhooks and OAuth-ready connection handling.
- Production auth, Supabase persistence, encrypted credential storage, and real workspace RBAC are not wired yet.

## Resend connection model

For mobile, ZeRelay should not embed or directly pass long-lived Resend API keys from the app.

Preferred production model:

1. User signs into ZeRelay.
2. User connects Resend via OAuth.
3. Backend receives the OAuth callback and stores the grant encrypted.
4. Flutter calls ZeRelay backend with its app session.
5. Backend calls Resend with the stored OAuth token.

Temporary fallback for local/MVP testing:

- Store a user-provided Resend API key server-side via the backend credentials endpoint.
- Do not call Resend directly from Flutter.

See [`docs/resend-integration.md`](./docs/resend-integration.md) for details.

## Development

Flutter:

```bash
flutter pub get
flutter run
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Docs index: [`docs/README.md`](./docs/README.md)
