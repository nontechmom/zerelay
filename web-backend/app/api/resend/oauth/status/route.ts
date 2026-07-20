import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../_lib/auth';
import { getCredentialMeta } from '../../_lib/credentialStoreDB';

export const runtime = 'nodejs';

/** GET /api/resend/oauth/status */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get('workspaceId');

  try {
    const meta = await getCredentialMeta(userId, workspaceId);

    return NextResponse.json({
      connected: !!meta,
      method: meta?.connectionMethod ?? null,
      updatedAt: meta?.updatedAt ?? null,
    });
  } catch (error) {
    console.error('Error fetching credential status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
