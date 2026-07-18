import { NextRequest, NextResponse } from 'next/server';
import { getResendApiKey, getResendUserAgent } from '../_lib/env';
import { resendFetch } from '../_lib/resendFetch';
import { requireAuth } from '../_lib/auth';

export const runtime = 'nodejs';

async function resolveKey(req: NextRequest, userId: string, workspaceId?: string | null) {
  const apiKey = await getResendApiKey(userId, workspaceId);
  if (!apiKey) {
    return {
      error: NextResponse.json(
        { error: 'No Resend credentials configured. Please connect your Resend account.' },
        { status: 401 },
      ),
    };
  }
  return { apiKey, userAgent: getResendUserAgent() };
}

async function proxyResponse(upstream: Response) {
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}

/** GET /api/resend/domains — list all domains */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const key = await resolveKey(req, userId, workspaceId);
  if ('error' in key) return key.error;

  return proxyResponse(
    await resendFetch({ method: 'GET', path: '/domains', apiKey: key.apiKey, userAgent: key.userAgent }),
  );
}

/** POST /api/resend/domains — create a new domain */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const b = json as Record<string, unknown>;
  if (typeof b.name !== 'string' || b.name.trim().length === 0) {
    return NextResponse.json({ error: '`name` (domain) is required' }, { status: 422 });
  }

  const workspaceId = typeof b.workspace_id === 'string' ? b.workspace_id : null;
  const key = await resolveKey(req, userId, workspaceId);
  if ('error' in key) return key.error;

  return proxyResponse(
    await resendFetch({ method: 'POST', path: '/domains', apiKey: key.apiKey, userAgent: key.userAgent, jsonBody: json }),
  );
}

/** PATCH /api/resend/domains — update a domain (expects `id` in body) */
export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const b = json as Record<string, unknown>;
  if (typeof b.id !== 'string' || b.id.trim().length === 0) {
    return NextResponse.json({ error: '`id` (domain ID) is required' }, { status: 422 });
  }

  const workspaceId = typeof b.workspace_id === 'string' ? b.workspace_id : null;
  const key = await resolveKey(req, userId, workspaceId);
  if ('error' in key) return key.error;

  const { id, workspace_id, ...rest } = b;
  return proxyResponse(
    await resendFetch({ method: 'PATCH', path: `/domains/${id}`, apiKey: key.apiKey, userAgent: key.userAgent, jsonBody: rest }),
  );
}

/** DELETE /api/resend/domains — delete a domain (expects `id` in body or query) */
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: '`id` query param is required' }, { status: 422 });
  }

  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const key = await resolveKey(req, userId, workspaceId);
  if ('error' in key) return key.error;

  return proxyResponse(
    await resendFetch({ method: 'DELETE', path: `/domains/${id}`, apiKey: key.apiKey, userAgent: key.userAgent }),
  );
}
