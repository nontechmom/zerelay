import { NextRequest, NextResponse } from 'next/server';
import { getResendApiKey, getResendUserAgent } from '../_lib/env';
import { resendFetch } from '../_lib/resendFetch';
import { requireAuth, getClientIp } from '../_lib/auth';
import { getSupabaseServiceClient } from '../../_lib/supabase';

export const runtime = 'nodejs';

type SendEmailBody = {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: { id: string; variables?: Record<string, unknown> };
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string | string[];
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  attachments?: Array<{ filename: string; content: string; content_type?: string }>;
  scheduled_at?: string;
  workspace_id?: string;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function validateSendBody(body: unknown): { ok: true; value: SendEmailBody } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Body must be a JSON object' };
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.from)) return { ok: false, error: '`from` is required' };
  if (!isNonEmptyString(b.subject)) return { ok: false, error: '`subject` is required' };
  if (!(isNonEmptyString(b.to) || (Array.isArray(b.to) && b.to.every(isNonEmptyString)))) {
    return { ok: false, error: '`to` must be a string or string[]' };
  }

  const hasHtml = isNonEmptyString(b.html);
  const hasText = isNonEmptyString(b.text);
  const hasTemplate = !!b.template;

  const providedCount = [hasHtml, hasText, hasTemplate].filter(Boolean).length;
  if (providedCount === 0) {
    return { ok: false, error: 'Provide one of `html`, `text`, or `template`' };
  }
  if (hasTemplate && (hasHtml || hasText)) {
    return { ok: false, error: 'Do not mix `template` with `html`/`text`' };
  }
  if (hasTemplate) {
    if (typeof b.template !== 'object' || !b.template) return { ok: false, error: '`template` must be an object' };
    const t = b.template as Record<string, unknown>;
    if (!isNonEmptyString(t.id)) return { ok: false, error: '`template.id` is required' };
    if (t.variables !== undefined && (typeof t.variables !== 'object' || !t.variables)) {
      return { ok: false, error: '`template.variables` must be an object if provided' };
    }
  }

  return { ok: true, value: body as SendEmailBody };
}

export async function POST(req: NextRequest) {
  // Authenticate user
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateSendBody(json);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 422 });
  }

  const workspaceId = validated.value.workspace_id || null;

  // Get API key for user (from encrypted database storage)
  const apiKey = await getResendApiKey(userId, workspaceId);
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'No Resend credentials configured. Please connect your Resend account via /api/resend/credentials or OAuth.',
      },
      { status: 401 },
    );
  }

  const userAgent = getResendUserAgent();
  const idempotencyKey = req.headers.get('idempotency-key') ?? undefined;

  // Remove workspace_id from body before sending to Resend
  const { workspace_id, ...resendBody } = validated.value;

  const upstream = await resendFetch({
    method: 'POST',
    path: '/emails',
    apiKey,
    userAgent,
    idempotencyKey,
    jsonBody: resendBody,
  });

  const text = await upstream.text();

  // Log audit event for email sent
  try {
    const supabase = getSupabaseServiceClient();
    await supabase.rpc('log_audit_event', {
      p_user_id: userId,
      p_workspace_id: workspaceId,
      p_action: 'email.sent',
      p_resource_type: 'email',
      p_metadata: {
        to: validated.value.to,
        subject: validated.value.subject,
        status: upstream.status,
      },
      p_ip_address: getClientIp(req),
      p_user_agent: req.headers.get('user-agent') || null,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}
