import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '../_lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  console.log('Auth header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  console.log('Token (first 50 chars):', token.substring(0, 50));

  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.log('Supabase Auth Error:', error.message);
      return NextResponse.json({ error: 'Auth failed', details: error.message }, { status: 401 });
    }

    console.log('Authenticated user:', data.user?.id, data.user?.email);

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (error) {
    console.error('Exception:', error);
    return NextResponse.json({ error: 'Internal error', details: String(error) }, { status: 500 });
  }
}
