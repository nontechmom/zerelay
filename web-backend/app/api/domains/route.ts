import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/domains - List all domains for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch domains
    const { data: domains, error } = await supabase
      .from('domains')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching domains:', error);
      return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
    }

    return NextResponse.json({ domains: domains || [] });
  } catch (error) {
    console.error('Error in GET /api/domains:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/domains - Add a new domain
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domain_name, resend_domain_id } = body;

    if (!domain_name) {
      return NextResponse.json({ error: 'domain_name is required' }, { status: 400 });
    }

    // Insert domain
    const { data: domain, error } = await supabase
      .from('domains')
      .insert({
        user_id: user.id,
        workspace_id: null, // TODO: Add workspace support
        domain_name: domain_name.toLowerCase().trim(),
        resend_domain_id: resend_domain_id || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating domain:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Domain already exists' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Failed to create domain' }, { status: 500 });
    }

    return NextResponse.json({ domain }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/domains:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
