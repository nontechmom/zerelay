import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getClientIp } from '../../_lib/auth';
import { deleteOAuthForUser, deleteApiKeyForUser } from '../../_lib/credentialStoreDB';
import { getSupabaseServiceClient } from '../../../_lib/supabase';

export const runtime = 'nodejs';

/** POST /api/resend/oauth/disconnect */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get('workspaceId');

  try {
    // Delete both OAuth and API key credentials
    await deleteOAuthForUser(userId, workspaceId);
    await deleteApiKeyForUser(userId, workspaceId);

    // Log audit event
    const supabase = getSupabaseServiceClient();
    await supabase.rpc('log_audit_event', {
      p_user_id: userId,
      p_workspace_id: workspaceId,
      p_action: 'credential.disconnected',
      p_resource_type: 'resend_credential',
      p_ip_address: getClientIp(req),
      p_user_agent: req.headers.get('user-agent') || null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error disconnecting credentials:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
