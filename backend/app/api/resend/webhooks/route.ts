import { NextRequest } from 'next/server';
import { handleResendWebhook } from './_lib/handler';

export const runtime = 'nodejs';

/** POST /api/resend/webhooks */
export async function POST(req: NextRequest) {
  return handleResendWebhook(req);
}
