import { NextRequest, NextResponse } from 'next/server';
import { getOptionalEnv } from '../../_lib/env';
import { consumePendingOAuthState, setOAuthGrantForUser } from '../../_lib/oauthStore';

export const runtime = 'nodejs';

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

/** GET /api/resend/oauth/callback */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');

  const mobileErrorRedirect = getOptionalEnv('RESEND_OAUTH_ERROR_REDIRECT') ?? 'zerelay://resend/oauth/error';
  const mobileSuccessRedirect = getOptionalEnv('RESEND_OAUTH_SUCCESS_REDIRECT') ?? 'zerelay://resend/oauth/success';

  if (error) {
    const url = new URL(mobileErrorRedirect);
    url.searchParams.set('error', error);
    return NextResponse.redirect(url);
  }

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing OAuth code or state' }, { status: 400 });
  }

  const pending = consumePendingOAuthState(state);
  if (!pending) {
    return NextResponse.json({ error: 'Invalid or expired OAuth state' }, { status: 401 });
  }

  const tokenUrl = getOptionalEnv('RESEND_OAUTH_TOKEN_URL');
  const clientId = getOptionalEnv('RESEND_OAUTH_CLIENT_ID');
  const clientSecret = getOptionalEnv('RESEND_OAUTH_CLIENT_SECRET');
  const redirectUri = getOptionalEnv('RESEND_OAUTH_REDIRECT_URI');

  if (!tokenUrl || !clientId || !redirectUri) {
    return NextResponse.json({ error: 'Resend OAuth token exchange is not configured' }, { status: 501 });
  }

  const form = new URLSearchParams();
  form.set('grant_type', 'authorization_code');
  form.set('code', code);
  form.set('client_id', clientId);
  form.set('redirect_uri', redirectUri);
  form.set('code_verifier', pending.codeVerifier);
  if (clientSecret) form.set('client_secret', clientSecret);

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': getOptionalEnv('RESEND_USER_AGENT') ?? 'ZeRelayBackend/1.0',
    },
    body: form,
    cache: 'no-store',
  });

  const tokenJson = (await tokenRes.json().catch(() => ({}))) as TokenResponse;
  if (!tokenRes.ok || !tokenJson.access_token) {
    return NextResponse.json(
      {
        error: tokenJson.error ?? 'oauth_token_exchange_failed',
        errorDescription: tokenJson.error_description,
      },
      { status: tokenRes.ok ? 502 : tokenRes.status },
    );
  }

  setOAuthGrantForUser(pending.userId, {
    accessToken: tokenJson.access_token,
    refreshToken: tokenJson.refresh_token,
    tokenType: tokenJson.token_type ?? 'Bearer',
    scope: tokenJson.scope,
    expiresAt: tokenJson.expires_in ? Date.now() + tokenJson.expires_in * 1000 : undefined,
  });

  return NextResponse.redirect(mobileSuccessRedirect);
}
