import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '../_lib/supabase';

export const runtime = 'nodejs';

/**
 * POST /api/webhook-test
 * Create a webhook token for testing (simplified - no JWT required for demo)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || 'cb586a99-a168-4b20-9b4d-8d8db7ec0a07'; // Default to our test user

    const supabase = getSupabaseServiceClient();

    // Generate webhook token
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_webhook_token');

    if (tokenError || !tokenData) {
      console.error('Error generating token:', tokenError);
      return NextResponse.json({ error: 'Failed to generate webhook token' }, { status: 500 });
    }

    // Insert webhook token
    const { data, error } = await supabase
      .from('webhook_tokens')
      .insert({
        token: tokenData,
        user_id: userId,
        workspace_id: body.workspaceId || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing webhook token:', error);
      return NextResponse.json({ error: 'Failed to create webhook token', details: error.message }, { status: 500 });
    }

    const webhookUrl = `http://localhost:3000/api/resend/webhooks/${data.token}`;

    return NextResponse.json({
      success: true,
      token: data.token,
      webhookUrl,
      message: 'Configure this URL in your Resend dashboard',
    }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal error', details: String(error) }, { status: 500 });
  }
}

/**
 * GET /api/webhook-test
 * List all webhook tokens
 */
export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('webhook_tokens')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tokens: data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
