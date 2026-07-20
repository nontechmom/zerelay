import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getOptionalEnv } from '../../_lib/env';
import { getSupabaseServiceClient } from '../../../_lib/supabase';

/** Tolerance window for webhook timestamp replay protection (5 minutes). */
const TIMESTAMP_TOLERANCE_SEC = 300;

/**
 * Verify Resend/Svix webhook signature.
 *
 * Resend webhooks include three headers:
 *   svix-id        — unique message id
 *   svix-timestamp — unix seconds when Resend sent the event
 *   svix-signature — comma-separated list of "v1,<base64>" signatures
 *
 * Signing payload = `${svix-id}.${svix-timestamp}.${rawBody}`
 * Secret is base64-encoded and prefixed with "whsec_".
 */
function verifySignature(
  rawBody: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string,
): boolean {
  const keyBase64 = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const keyBytes = Buffer.from(keyBase64, 'base64');

  const ts = parseInt(svixTimestamp, 10);
  if (Number.isNaN(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > TIMESTAMP_TOLERANCE_SEC) return false;

  const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = createHmac('sha256', keyBytes).update(toSign).digest('base64');

  const candidates = svixSignature.split(' ');
  for (const candidate of candidates) {
    const parts = candidate.split(',');
    if (parts.length !== 2) continue;
    const sig = parts[1];
    try {
      if (timingSafeEqual(Buffer.from(expected, 'base64'), Buffer.from(sig, 'base64'))) {
        return true;
      }
    } catch {
      // length mismatch — skip
    }
  }

  return false;
}

/**
 * Validate webhook token from database
 */
async function validateWebhookToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  workspaceId?: string;
  tokenId?: string;
}> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('webhook_tokens')
    .select('id, user_id, workspace_id, is_active')
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return { valid: false };
  }

  return {
    valid: true,
    userId: data.user_id,
    workspaceId: data.workspace_id || undefined,
    tokenId: data.id,
  };
}

export async function handleResendWebhook(req: NextRequest, token?: string) {
  const rawBody = await req.text();
  let userId: string | undefined;
  let workspaceId: string | undefined;
  let tokenId: string | undefined;
  let userSigningSecret: string | undefined;

  // If token is provided, validate it
  if (token) {
    const tokenValidation = await validateWebhookToken(token);
    if (!tokenValidation.valid) {
      return NextResponse.json({ error: 'Invalid or inactive webhook token' }, { status: 401 });
    }
    userId = tokenValidation.userId;
    workspaceId = tokenValidation.workspaceId;
    tokenId = tokenValidation.tokenId;

    // Look up user's signing secret
    const supabase = getSupabaseServiceClient();
    const { data: secretData } = await supabase
      .from('webhook_secrets')
      .select('signing_secret')
      .eq('user_id', userId!)
      .is('workspace_id', workspaceId ? workspaceId : null)
      .maybeSingle();

    if (secretData) {
      userSigningSecret = secretData.signing_secret;
    }
  }

  // Verify signature if secret is configured
  // Prioritize user-specific secret, fall back to global secret
  const secret = userSigningSecret || getOptionalEnv('RESEND_WEBHOOK_SIGNING_SECRET');
  if (secret) {
    const svixId = req.headers.get('svix-id') ?? '';
    const svixTimestamp = req.headers.get('svix-timestamp') ?? '';
    const svixSignature = req.headers.get('svix-signature') ?? '';

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing svix signature headers' }, { status: 401 });
    }

    if (!verifySignature(rawBody, svixId, svixTimestamp, svixSignature, secret)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
  } else {
    console.warn(
      'No webhook signing secret found (user-specific or global) — webhook payload accepted without signature verification. ' +
        'Configure signing secret in onboarding or set RESEND_WEBHOOK_SIGNING_SECRET env var.',
    );
  }

  let event: { type?: string; data?: unknown };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('Resend webhook event', token ? `[${token}]` : '', event.type, JSON.stringify(event.data));

  // Store webhook event and update token last_used_at
  try {
    const supabase = getSupabaseServiceClient();

    // Update webhook token last_used_at
    if (tokenId) {
      await supabase
        .from('webhook_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', tokenId);
    }

    // Log webhook receipt in audit log
    await supabase.rpc('log_audit_event', {
      p_user_id: userId || null,
      p_workspace_id: workspaceId || null,
      p_action: 'webhook.received',
      p_resource_type: 'webhook_event',
      p_metadata: {
        event_type: event.type,
        token_provided: !!token,
      },
      p_ip_address: null,
      p_user_agent: null,
    });

    // TODO: Process webhook event based on type
    // - Store in inbound_messages table
    // - Create/update conversations
    // - Emit realtime updates
    // - Send push notifications
  } catch (error) {
    console.error('Error processing webhook:', error);
  }

  return NextResponse.json({ ok: true });
}
