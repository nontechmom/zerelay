import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../resend/_lib/auth';
import { getSupabaseServiceClient } from '../../_lib/supabase';

export const runtime = 'nodejs';

/**
 * GET /api/users/profile
 * Get current user's profile
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const supabase = getSupabaseServiceClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, display_name, created_at, updated_at, onboarding_completed_at')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/users/profile
 * Update current user's profile
 */
export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const body = await req.json();
    const { display_name } = body;

    if (typeof display_name !== 'string') {
      return NextResponse.json({ error: 'display_name must be a string' }, { status: 422 });
    }

    const supabase = getSupabaseServiceClient();

    const { data: user, error } = await supabase
      .from('users')
      .update({
        display_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/users/profile
 * Create user profile (for signup)
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, email, displayName } = await req.json();

    const supabase = getSupabaseServiceClient();

    const { error } = await supabase.from('users').insert({
      id: userId,
      email,
      display_name: displayName,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
