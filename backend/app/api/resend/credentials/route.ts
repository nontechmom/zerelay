import { NextRequest, NextResponse } from 'next/server';
import { getOptionalEnv } from '../_lib/env';
import {
  storeApiKeyForUser,
  deleteApiKeyForUser,
  getCredentialMeta,
} from '../_lib/credentialStoreDB';
import { requireAuth, getClientIp } from '../_lib/auth';
import { getSupabaseServiceClient } from '../../_lib/supabase';

export const runtime = 'nodejs';

/**
 * API key storage with Supabase encrypted persistence.
 *
 * Preferred production path is Resend OAuth via /api/resend/oauth/*, with
 * encrypted server-side token storage. This fallback exists for local/MVP use
 * where OAuth app credentials are not yet available.
 */

/**
 * GET /api/resend/credentials
 * Returns whether the calling user has a stored Resend key (never echoes it back).
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  try {
    const meta = await getCredentialMeta(userId);

    return NextResponse.json({
      hasKey: !!meta,
      connectionMethod: meta?.connectionMethod || null,
      updatedAt: meta?.updatedAt || null,
    });
  } catch (error) {
    console.error('Error fetching credential metadata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/resend/credentials
 * Stores (or updates) the calling user's Resend API key as a fallback.
 * The key is validated with a lightweight probe to Resend before persisting.
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  let body: { resendApiKey?: unknown; workspaceId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const key = typeof body.resendApiKey === 'string' ? body.resendApiKey.trim() : '';
  if (!key.startsWith('re_') || key.length < 10) {
    return NextResponse.json(
      { error: 'Invalid Resend API key format. Must start with re_ and be at least 10 characters.' },
      { status: 422 },
    );
  }

  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : null;

  // Probe: call Resend's lightweight /domains endpoint to validate the key.
  const userAgent = getOptionalEnv('RESEND_USER_AGENT') ?? 'ZeRelayBackend/1.0';
  const probe = await fetch('https://api.resend.com/domains', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      'User-Agent': userAgent,
    },
    cache: 'no-store',
  });

  if (probe.status === 401 || probe.status === 403) {
    return NextResponse.json(
      { error: 'Resend rejected this API key. Check that it is valid and not expired.' },
      { status: 403 },
    );
  }

  try {
    await storeApiKeyForUser(userId, key, workspaceId);

    // Log audit event
    const supabase = getSupabaseServiceClient();
    await supabase.rpc('log_audit_event', {
      p_user_id: userId,
      p_workspace_id: workspaceId,
      p_action: 'credential.api_key.stored',
      p_resource_type: 'resend_credential',
      p_ip_address: getClientIp(req),
      p_user_agent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error storing API key:', error);
    return NextResponse.json({ error: 'Failed to store API key' }, { status: 500 });
  }
}

/**
 * DELETE /api/resend/credentials
 * Removes the calling user's stored fallback Resend key.
 */
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get('workspaceId');

  try {
    await deleteApiKeyForUser(userId, workspaceId);

    // Log audit event
    const supabase = getSupabaseServiceClient();
    await supabase.rpc('log_audit_event', {
      p_user_id: userId,
      p_workspace_id: workspaceId,
      p_action: 'credential.api_key.deleted',
      p_resource_type: 'resend_credential',
      p_ip_address: getClientIp(req),
      p_user_agent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}
