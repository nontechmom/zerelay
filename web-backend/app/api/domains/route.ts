import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// GET /api/domains - List all domains for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    // If admin, use service role to see all domains
    let queryClient = supabase;
    if (isAdmin) {
      queryClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }

    // Fetch domains
    const { data: domains, error } = await queryClient
      .from('domains')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching domains:', error);
      return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
    }

    return NextResponse.json({ 
      domains: domains || [],
      isAdmin 
    });
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
