import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getOptionalEnv } from '../../_lib/env';
import { requireAuth } from '../../_lib/auth';
import { getSupabaseServiceClient } from '../../../_lib/supabase';
import { randomBytes } from 'node:crypto';

export const runtime = 'nodejs';

function codeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

/**
 * GET /api/resend/oauth/start
 *
 * Starts a mobile-safe Resend OAuth flow once Resend provides a public
 * authorization endpoint/client configuration for ZeRelay.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const authorizationUrl = getOptionalEnv('RESEND_OAUTH_AUTHORIZATION_URL');
  const clientId = getOptionalEnv('RESEND_OAUTH_CLIENT_ID');
  const redirectUri = getOptionalEnv('RESEND_OAUTH_REDIRECT_URI');

  if (!authorizationUrl || !clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: 'Resend OAuth is not configured for this deployment.',
        requiredEnv: [
          'RESEND_OAUTH_AUTHORIZATION_URL',
          'RESEND_OAUTH_CLIENT_ID',
          'RESEND_OAUTH_REDIRECT_URI',
          'RESEND_OAUTH_TOKEN_URL',
        ],
      },
      { status: 501 },
    );
  }

  // Generate OAuth state and code verifier
  const state = randomBytes(24).toString('base64url');
  const codeVerifier = randomBytes(48).toString('base64url');

  // Store pending OAuth state in database (temporary, expires in 10 minutes)
  const supabase = getSupabaseServiceClient();
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'oauth.started',
    resource_type: 'oauth_state',
    metadata: { state },
  });

  // TODO: Store state/verifier in a temporary table or cache with TTL
  // For now, this is a placeholder - implement proper state storage

  const scope = getOptionalEnv('RESEND_OAUTH_SCOPES') ?? 'emails:send domains:read domains:write webhooks:write';

  const url = new URL(authorizationUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge(codeVerifier));
  url.searchParams.set('code_challenge_method', 'S256');

  const redirect = req.nextUrl.searchParams.get('redirect');
  if (redirect === 'true') {
    return NextResponse.redirect(url);
  }

  return NextResponse.json({ authorizationUrl: url.toString(), state });
}
