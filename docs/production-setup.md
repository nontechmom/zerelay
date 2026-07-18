# Production Setup Guide

This guide covers setting up ZeRelay for production with secure API key and webhook management using Supabase.

## Architecture Overview

ZeRelay uses a **secure backend proxy pattern** where:
- Flutter mobile app authenticates with Supabase Auth (JWT)
- All Resend API calls go through Next.js backend
- Credentials are encrypted at rest in Supabase Postgres
- Webhooks are validated with signatures and database tokens

## Database Schema

The production database includes:
- **users** - User profiles linked to Supabase Auth
- **workspaces** - Multi-tenant workspace isolation
- **workspace_members** - Role-based access control (owner, admin, member, viewer)
- **resend_credentials** - Encrypted API keys and OAuth tokens
- **webhook_tokens** - Secure webhook endpoint tokens
- **audit_logs** - Security and compliance tracking

All tables have Row Level Security (RLS) policies enforcing access control.

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the `backend` directory:

```env
# Supabase (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Credential Encryption (REQUIRED)
# Generate with: openssl rand -base64 32
CREDENTIAL_ENCRYPTION_KEY=your-secure-32-char-minimum-key-here

# Resend
RESEND_USER_AGENT=ZeRelayBackend/1.0
RESEND_WEBHOOK_SIGNING_SECRET=whsec_...

# Optional: Server-wide fallback (local dev only)
RESEND_API_KEY=re_...
```

### Generating the Encryption Key

The encryption key protects API keys and OAuth tokens at rest. Generate a strong key:

```bash
openssl rand -base64 32
```

**Important**: Store this key securely. If lost, all stored credentials cannot be decrypted.

## Authentication Flow

### User Sign Up/Sign In

1. Flutter app uses Supabase Auth for user authentication
2. Supabase returns a JWT access token
3. Flutter app includes JWT in `Authorization: Bearer <token>` header for all backend requests

### Backend JWT Validation

The backend validates JWTs using Supabase:

```typescript
const authResult = await requireAuth(req);
if (authResult instanceof NextResponse) {
  return authResult; // 401 Unauthorized
}
const { userId } = authResult;
```

### No More Mock Headers

❌ **Old (Mock)**: `x-user-id` header  
✅ **New (Production)**: `Authorization: Bearer <jwt>` header

## API Key Management

### Storing API Keys

Users can store their Resend API keys via:

```http
POST /api/resend/credentials
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "resendApiKey": "re_...",
  "workspaceId": "optional-workspace-uuid"
}
```

The backend:
1. Validates the JWT
2. Probes Resend API to verify the key is valid
3. Encrypts the key using pgcrypto
4. Stores in Supabase with RLS policies
5. Logs audit event

### Retrieving Credentials

Credentials are never sent to the client. The backend automatically:
1. Looks up the user's credentials in the database
2. Decrypts the API key
3. Uses it for Resend API calls

### Credential Priority

1. **OAuth token** (preferred, stored encrypted)
2. **User API key** (fallback, stored encrypted)
3. **Server-wide API key** (local dev only, from env var)

## Webhook Security

### Creating Webhook Tokens

Users generate secure webhook tokens:

```http
POST /api/resend/webhooks/tokens
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "workspaceId": "optional-workspace-uuid"
}
```

Response:
```json
{
  "token": {
    "id": "uuid",
    "token": "wh_...",
    "user_id": "uuid",
    "workspace_id": "uuid",
    "is_active": true,
    "created_at": "2026-07-18T...",
    "last_used_at": null
  }
}
```

### Configuring Resend Webhooks

1. Log into Resend dashboard
2. Navigate to Webhooks
3. Add webhook endpoint:
   ```
   https://your-backend.com/api/resend/webhooks/wh_your_token_here
   ```
4. Set signing secret in `RESEND_WEBHOOK_SIGNING_SECRET`

### Webhook Validation

The webhook handler validates:
1. **Token** - Checks database for active token
2. **Signature** - Verifies Svix HMAC signature
3. **Timestamp** - Prevents replay attacks (5-minute window)

```typescript
// Two-layer security
POST /api/resend/webhooks/{token}
Headers:
  svix-id: msg_...
  svix-timestamp: 1234567890
  svix-signature: v1,base64sig...
```

### Managing Webhook Tokens

List tokens:
```http
GET /api/resend/webhooks/tokens?workspaceId=optional-uuid
Authorization: Bearer <jwt>
```

Deactivate token:
```http
DELETE /api/resend/webhooks/tokens?id=token-uuid
Authorization: Bearer <jwt>
```

## Workspace Isolation

### Creating Workspaces

```sql
INSERT INTO workspaces (name, owner_id)
VALUES ('My Workspace', 'user-uuid')
RETURNING id;
```

### Adding Members

```sql
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES ('workspace-uuid', 'user-uuid', 'member');
```

### Role Hierarchy

- **owner** - Full control, can delete workspace
- **admin** - Manage members, configure integrations
- **member** - Send emails, view conversations
- **viewer** - Read-only access

### Access Control

All operations check workspace membership:

```typescript
const hasAccess = await checkWorkspaceAccess(userId, workspaceId, 'member');
if (!hasAccess) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## Audit Logging

All security-sensitive operations are logged:

- Credential storage/deletion
- Webhook token creation/deactivation
- Email sent
- Webhook received
- Authentication failures

Query audit logs:
```sql
SELECT * FROM audit_logs
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 100;
```

## Security Best Practices

### ✅ DO

- Use HTTPS in production
- Rotate encryption keys periodically
- Monitor audit logs for suspicious activity
- Set up Supabase RLS policies
- Use OAuth when available
- Validate all webhook signatures
- Rate limit API endpoints
- Use workspace isolation for multi-tenancy

### ❌ DON'T

- Never log decrypted credentials
- Never send credentials to the Flutter app
- Never trust client-provided user IDs
- Never disable RLS in production
- Never store encryption keys in version control
- Never reuse webhook tokens across environments

## Migration from Mock to Production

### Step 1: Set Environment Variables

```bash
cd backend
cp .env.example .env.local
# Edit .env.local with your values
```

### Step 2: Run Migrations

Migrations are already applied via Supabase MCP. Verify:

```sql
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

### Step 3: Update Flutter App

Add Supabase Auth to `pubspec.yaml`:
```yaml
dependencies:
  supabase_flutter: ^2.0.0
```

Initialize Supabase:
```dart
await Supabase.initialize(
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key',
);
```

### Step 4: Replace Auth Headers

Old:
```dart
headers: {'x-user-id': userId}
```

New:
```dart
final session = Supabase.instance.client.auth.currentSession;
headers: {'Authorization': 'Bearer ${session?.accessToken}'}
```

### Step 5: Test End-to-End

1. Sign up new user via Flutter app
2. Store API key via `/api/resend/credentials`
3. Send test email via `/api/resend/send`
4. Create webhook token via `/api/resend/webhooks/tokens`
5. Configure Resend webhook
6. Verify webhook receipt in audit logs

## Monitoring

### Health Checks

```http
GET /api/health
```

### Database Queries

Check credential storage:
```sql
SELECT 
  user_id,
  connection_method,
  created_at,
  updated_at
FROM resend_credentials;
```

Check webhook activity:
```sql
SELECT 
  token,
  is_active,
  last_used_at,
  created_at
FROM webhook_tokens
ORDER BY last_used_at DESC;
```

### Audit Log Analysis

Failed auth attempts:
```sql
SELECT * FROM audit_logs
WHERE action LIKE '%auth%' 
  AND metadata->>'success' = 'false'
ORDER BY created_at DESC;
```

Webhook activity:
```sql
SELECT 
  action,
  metadata->>'event_type' as event_type,
  created_at
FROM audit_logs
WHERE action = 'webhook.received'
ORDER BY created_at DESC
LIMIT 50;
```

## Troubleshooting

### "Unauthorized" Errors

Check:
1. JWT is valid and not expired
2. `Authorization` header is set
3. Supabase URL and keys are correct

### "Missing Resend credentials"

Check:
1. User has stored API key or OAuth token
2. Credentials are not expired (OAuth)
3. Workspace ID matches if using workspace-scoped credentials

### Webhook Not Receiving Events

Check:
1. Token is active (`is_active = true`)
2. Webhook URL is correct in Resend dashboard
3. Signing secret is configured
4. Firewall allows Resend IPs

### Encryption Errors

Check:
1. `CREDENTIAL_ENCRYPTION_KEY` is set and >= 32 characters
2. Same key is used for encrypt and decrypt
3. `pgcrypto` extension is enabled

## Support

For issues:
1. Check audit logs first
2. Review Supabase dashboard for RLS policy errors
3. Check Next.js server logs
4. Verify environment variables are set

## Next Steps

- [ ] Set up OAuth flow when Resend provides credentials
- [ ] Implement webhook event processing (store inbound messages)
- [ ] Add rate limiting middleware
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy for encryption keys
- [ ] Implement credential rotation policies
