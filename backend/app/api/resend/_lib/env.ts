import { getApiKeyForUser, getOAuthAccessTokenForUser } from './credentialStoreDB';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  return process.env[name];
}

/**
 * Resolve the credential used as Resend's Bearer token with this priority:
 * 1. Per-user OAuth access token (preferred for mobile)
 * 2. Per-user stored API key (temporary/MVP fallback)
 * 3. Server-wide env var RESEND_API_KEY (local/dev fallback)
 *
 * Now uses Supabase for encrypted credential storage instead of in-memory maps.
 */
export async function getResendApiKey(userId: string, workspaceId?: string | null): Promise<string | undefined> {
  // Priority 1: OAuth token from database
  const oauthToken = await getOAuthAccessTokenForUser(userId, workspaceId);
  if (oauthToken) {
    return oauthToken;
  }

  // Priority 2: Stored API key from database
  const userApiKey = await getApiKeyForUser(userId, workspaceId);
  if (userApiKey?.startsWith('re_')) {
    return userApiKey;
  }

  // Priority 3: Server-wide fallback (for local dev only)
  const serverKey = getOptionalEnv('RESEND_API_KEY');
  if (serverKey?.startsWith('re_')) {
    return serverKey;
  }

  return undefined;
}

export function getResendUserAgent(): string {
  return getOptionalEnv('RESEND_USER_AGENT') ?? 'ZeRelayBackend/1.0';
}
