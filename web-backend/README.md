# ZeRelay Backend

Next.js backend for the ZeRelay Flutter app. It acts as the security boundary between the mobile app and Resend.

## Security model

- The mobile client must not call `https://api.resend.com` directly.
- Resend credentials stay on the backend.
- OAuth is preferred for mobile-safe Resend account connection.
- API-key storage exists only as a temporary local/MVP fallback.
- The current mock auth header is `x-user-id`; production must replace this with Supabase Auth JWT validation and workspace RBAC.

## Environment

Common:

```env
RESEND_USER_AGENT=ZeRelayBackend/1.0
RESEND_WEBHOOK_SIGNING_SECRET=whsec_...
```

Optional local fallback:

```env
RESEND_API_KEY=re_...
```

OAuth-ready configuration, once Resend OAuth app credentials are available:

```env
RESEND_OAUTH_AUTHORIZATION_URL=
RESEND_OAUTH_TOKEN_URL=
RESEND_OAUTH_CLIENT_ID=
RESEND_OAUTH_CLIENT_SECRET=
RESEND_OAUTH_REDIRECT_URI=https://your-backend.com/api/resend/oauth/callback
RESEND_OAUTH_SCOPES="emails:send domains:read domains:write webhooks:write"
RESEND_OAUTH_SUCCESS_REDIRECT=zerelay://resend/oauth/success
RESEND_OAUTH_ERROR_REDIRECT=zerelay://resend/oauth/error
```

The OAuth routes return `501` until the required OAuth env vars are set. This avoids hardcoding undocumented Resend OAuth endpoints.

## Routes

### OAuth / connection

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/resend/oauth/start` | Returns a Resend authorization URL for the signed-in user. |
| `GET` | `/api/resend/oauth/callback` | Exchanges an OAuth code and stores the grant server-side. |
| `GET` | `/api/resend/oauth/status` | Returns connection method/status for the user. |
| `POST` | `/api/resend/oauth/disconnect` | Removes OAuth grant and fallback API-key credential. |

### Temporary fallback credentials

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/resend/credentials` | Returns whether the user has a stored fallback API key. |
| `POST` | `/api/resend/credentials` | Stores a user fallback API key after validating with Resend. |
| `DELETE` | `/api/resend/credentials` | Removes the user fallback API key. |

### Resend proxy

| Method | Route | Upstream |
| --- | --- | --- |
| `POST` | `/api/resend/send` | `POST /emails` |
| `GET` | `/api/resend/domains` | `GET /domains` |
| `POST` | `/api/resend/domains` | `POST /domains` |
| `PATCH` | `/api/resend/domains` | `PATCH /domains/{id}`; expects `id` in body |
| `DELETE` | `/api/resend/domains?id=...` | `DELETE /domains/{id}` |
| `POST` | `/api/resend/domains/verify` | `POST /domains/{id}/verify`; expects `{ "id": "..." }` |

### Webhooks

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/resend/webhooks` | Receives Resend events. |
| `POST` | `/api/resend/webhooks/{token}` | Receives Resend events with a user/workspace token path. |

Webhook signature verification uses `RESEND_WEBHOOK_SIGNING_SECRET` and Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`).

## Development

```bash
npm run dev
npm run lint
npm run build
```
