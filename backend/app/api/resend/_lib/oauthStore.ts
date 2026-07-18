import { randomBytes } from 'node:crypto';

type OAuthGrant = {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  scope?: string;
  expiresAt?: number;
  updatedAt: string;
};

type PendingOAuthState = {
  userId: string;
  codeVerifier: string;
  createdAt: number;
};

const oauthGrants = new Map<string, OAuthGrant>();
const pendingStates = new Map<string, PendingOAuthState>();

const STATE_TTL_MS = 10 * 60 * 1000;

export function createPendingOAuthState(userId: string): { state: string; codeVerifier: string } {
  const state = randomBytes(24).toString('base64url');
  const codeVerifier = randomBytes(48).toString('base64url');
  pendingStates.set(state, { userId, codeVerifier, createdAt: Date.now() });
  return { state, codeVerifier };
}

export function consumePendingOAuthState(state: string): PendingOAuthState | undefined {
  const pending = pendingStates.get(state);
  pendingStates.delete(state);
  if (!pending) return undefined;
  if (Date.now() - pending.createdAt > STATE_TTL_MS) return undefined;
  return pending;
}

export function setOAuthGrantForUser(userId: string, grant: Omit<OAuthGrant, 'updatedAt'>): void {
  oauthGrants.set(userId, {
    ...grant,
    updatedAt: new Date().toISOString(),
  });
}

export function getOAuthGrantForUser(userId: string): OAuthGrant | undefined {
  return oauthGrants.get(userId);
}

export function getOAuthAccessTokenForUser(userId: string): string | undefined {
  const grant = oauthGrants.get(userId);
  if (!grant?.accessToken) return undefined;
  if (grant.expiresAt && Date.now() >= grant.expiresAt) return undefined;
  return grant.accessToken;
}

export function deleteOAuthGrantForUser(userId: string): void {
  oauthGrants.delete(userId);
}
