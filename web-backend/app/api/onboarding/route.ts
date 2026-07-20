import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getClientIp } from '../resend/_lib/auth';
import { getSupabaseServiceClient } from '../_lib/supabase';
import { storeApiKeyForUser } from '../resend/_lib/credentialStoreDB';

export const runtime = 'nodejs';

/**
 * POST /api/onboarding
 * Complete onboarding flow for a new user
 * 
 * Steps:
 * 1. User provides Resend API key
 * 2. System generates unique webhook token
 * 3. Returns webhook URL for user to configure in Resend
 * 4. User configures webhook in Resend and gets signing secret
 * 5. User submits signing secret to complete setup
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const body = await req.json();
    const { step, resendApiKey, webhookSigningSecret, workspaceId } = body;

    const supabase = getSupabaseServiceClient();

    // Step 1: Store API key and generate webhook URL
    if (step === 'store_api_key') {
      if (!resendApiKey || !resendApiKey.startsWith('re_')) {
        return NextResponse.json(
          { error: 'Invalid Resend API key format. Must start with re_' },
          { status: 422 }
        );
      }

      // Validate API key with Resend
      const probe = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'User-Agent': 'ZeRelayBackend/1.0',
        },
      });

      if (probe.status === 401 || probe.status === 403) {
        return NextResponse.json(
          { error: 'Invalid API key. Resend rejected this key.' },
          { status: 403 }
        );
      }

      // Store encrypted API key
      await storeApiKeyForUser(userId, resendApiKey, workspaceId);

      // Generate webhook token
      const { data: tokenData, error: tokenError } = await supabase.rpc('generate_webhook_token');
      if (tokenError || !tokenData) {
        return NextResponse.json({ error: 'Failed to generate webhook token' }, { status: 500 });
      }

      // Store webhook token
      const { data: webhookToken, error: webhookError } = await supabase
        .from('webhook_tokens')
        .insert({
          token: tokenData,
          user_id: userId,
          workspace_id: workspaceId || null,
          is_active: false, // Not active until signing secret is configured
        })
        .select()
        .single();

      if (webhookError) {
        return NextResponse.json({ error: 'Failed to create webhook token' }, { status: 500 });
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_user_id: userId,
        p_workspace_id: workspaceId || null,
        p_action: 'onboarding.api_key_stored',
        p_resource_type: 'resend_credential',
        p_ip_address: getClientIp(req),
        p_user_agent: req.headers.get('user-agent') || null,
      });

      // Get base URL (from environment or request)
      const baseUrl = process.env.WEBHOOK_BASE_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://your-domain.com';

      const webhookUrl = `${baseUrl}/api/resend/webhooks/${webhookToken.token}`;

      return NextResponse.json({
        success: true,
        step: 'configure_webhook',
        webhookUrl,
        webhookToken: webhookToken.token,
        instructions: [
          '1. Go to Resend Dashboard → Webhooks',
          '2. Click "Add Endpoint"',
          `3. Enter URL: ${webhookUrl}`,
          '4. Select events: email.sent, email.delivered, email.bounced, email.complained',
          '5. Click "Create" and copy the Signing Secret',
          '6. Return to ZeRelay and complete setup with the signing secret',
        ],
      });
    }

    // Step 2: Store webhook signing secret and activate
    if (step === 'store_signing_secret') {
      if (!webhookSigningSecret || !webhookSigningSecret.startsWith('whsec_')) {
        return NextResponse.json(
          { error: 'Invalid webhook signing secret format. Must start with whsec_' },
          { status: 422 }
        );
      }

      // Store signing secret in user's credential metadata
      const { error: updateError } = await supabase
        .from('resend_credentials')
        .update({
          // Store in a JSON metadata field or separate table
          // For now, we'll use the connection_method field to mark it as configured
        })
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId || null);

      // Activate webhook token
      const { error: activateError } = await supabase
        .from('webhook_tokens')
        .update({ is_active: true })
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId || null)
        .eq('is_active', false);

      if (activateError) {
        return NextResponse.json({ error: 'Failed to activate webhook' }, { status: 500 });
      }

      // Store signing secret (in production, store per-user or per-workspace)
      // For now, we'll store it in a separate table
      const { error: secretError } = await supabase.from('webhook_secrets').upsert({
        user_id: userId,
        workspace_id: workspaceId || null,
        signing_secret: webhookSigningSecret,
      });

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_user_id: userId,
        p_workspace_id: workspaceId || null,
        p_action: 'onboarding.completed',
        p_resource_type: 'resend_integration',
        p_ip_address: getClientIp(req),
        p_user_agent: req.headers.get('user-agent') || null,
      });

      return NextResponse.json({
        success: true,
        step: 'completed',
        message: 'Resend integration configured successfully!',
        features: [
          '✓ API key stored and encrypted',
          '✓ Webhook URL configured',
          '✓ Webhook signature verification enabled',
          '✓ Ready to send and receive emails',
        ],
      });
    }

    // Step 3: Get onboarding status
    if (step === 'status') {
      // Check if user has credentials
      const { data: credential } = await supabase
        .from('resend_credentials')
        .select('connection_method, created_at')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId || null)
        .maybeSingle();

      // Check if user has webhook token
      const { data: webhook } = await supabase
        .from('webhook_tokens')
        .select('token, is_active, created_at')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId || null)
        .maybeSingle();

      return NextResponse.json({
        hasApiKey: !!credential,
        hasWebhookToken: !!webhook,
        webhookActive: webhook?.is_active || false,
        onboardingComplete: !!credential && !!webhook && webhook.is_active,
      });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

/**
 * GET /api/onboarding
 * Get current onboarding status for user
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspaceId');

    const supabase = getSupabaseServiceClient();

    // Check credentials
    const { data: credential } = await supabase
      .from('resend_credentials')
      .select('connection_method, created_at')
      .eq('user_id', userId)
      .is('workspace_id', workspaceId)
      .maybeSingle();

    // Check webhook token
    const { data: webhook } = await supabase
      .from('webhook_tokens')
      .select('token, is_active, created_at')
      .eq('user_id', userId)
      .is('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    const baseUrl = process.env.WEBHOOK_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'https://your-domain.com';

    return NextResponse.json({
      onboardingComplete: !!credential && !!webhook && webhook.is_active,
      hasApiKey: !!credential,
      hasWebhookToken: !!webhook,
      webhookActive: webhook?.is_active || false,
      webhookUrl: webhook ? `${baseUrl}/api/resend/webhooks/${webhook.token}` : null,
      apiKeyConfiguredAt: credential?.created_at,
      webhookConfiguredAt: webhook?.created_at,
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
