import { NextRequest, NextResponse } from 'next/server';
import { getResendApiKey, getResendUserAgent } from '../../_lib/env';
import { resendFetch } from '../../_lib/resendFetch';
import { requireAuth } from '../../_lib/auth';

export const runtime = 'nodejs';

/** POST /api/resend/domains/verify — trigger DNS re-check for a domain */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  let json: { id?: string; workspace_id?: string };
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!json.id || typeof json.id !== 'string') {
    return NextResponse.json({ error: '`id` (domain ID) is required' }, { status: 422 });
  }

  const workspaceId = json.workspace_id || null;
  const apiKey = await getResendApiKey(userId, workspaceId);
  if (!apiKey) {
    return NextResponse.json(
      { error: 'No Resend credentials configured.' },
      { status: 401 },
    );
  }

  const userAgent = getResendUserAgent();
  const upstream = await resendFetch({
    method: 'POST',
    path: `/domains/${json.id}/verify`,
    apiKey,
    userAgent,
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}
