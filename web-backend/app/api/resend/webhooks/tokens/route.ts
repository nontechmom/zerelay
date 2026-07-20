import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getClientIp } from '../../_lib/auth';
import { getSupabaseServiceClient } from '../../../_lib/supabase';

export const runtime = 'nodejs';

/**
 * GET /api/resend/webhooks/tokens
 * List all webhook tokens for the authenticated user
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get('workspaceId');

  try {
    const supabase = getSupabaseServiceClient();

    let query = supabase
      .from('webhook_tokens')
      .select('id, token, workspace_id, is_active, created_at, last_used_at')
      .eq('user_id', userId);

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhook tokens:', error);
      return NextResponse.json({ error: 'Failed to fetch webhook tokens' }, { status: 500 });
    }

    return NextResponse.json({ tokens: data });
  } catch (error) {
    console.error('Error fetching webhook tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/resend/webhooks/tokens
 * Create a new webhook token for the authenticated user
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  let body: { workspaceId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const workspaceId = body.workspaceId || null;

  try {
    const supabase = getSupabaseServiceClient();

    // Generate token
    const { data: token, error: tokenError } = await supabase.rpc('generate_webhook_token');

    if (tokenError || !token) {
      console.error('Error generating token:', tokenError);
      return NextResponse.json({ error: 'Failed to generate webhook token' }, { status: 500 });
    }

    // Insert webhook token
    const { data, error } = await supabase
      .from('webhook_tokens')
      .insert({
        token,
        user_id: userId,
        workspace_id: workspaceId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing webhook token:', error);
      return NextResponse.json({ error: 'Failed to create webhook token' }, { status: 500 });
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: userId,
      p_workspace_id: workspaceId,
      p_action: 'webhook_token.created',
      p_resource_type: 'webhook_token',
      p_resource_id: data.id,
      p_ip_address: getClientIp(req),
      p_user_agent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({ token: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/resend/webhooks/tokens/:tokenId
 * Deactivate a webhook token
 */
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  const url = new URL(req.url);
  const tokenId = url.searchParams.get('id');

  if (!tokenId) {
    return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceClient();

    // Verify ownership and deactivate
    const { error } = await supabase
      .from('webhook_tokens')
      .update({ is_active: false })
      .eq('id', tokenId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deactivating webhook token:', error);
      return NextResponse.json({ error: 'Failed to deactivate webhook token' }, { status: 500 });
    }

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: userId,
      p_workspace_id: null,
      p_action: 'webhook_token.deactivated',
      p_resource_type: 'webhook_token',
      p_resource_id: tokenId,
      p_ip_address: getClientIp(req),
      p_user_agent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deactivating webhook token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
