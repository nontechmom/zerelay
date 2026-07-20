import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '../../../api/_lib/supabase';

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
