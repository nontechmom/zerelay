import { NextRequest } from 'next/server';
import { handleResendWebhook } from '../_lib/handler';

export const runtime = 'nodejs';

/** POST /api/resend/webhooks/{token} */
export async function POST(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return handleResendWebhook(req, token);
}