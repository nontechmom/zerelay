import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// GET /api/mailboxes - List all mailboxes for the user
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

    // If admin, use service role to bypass RLS and see all mailboxes
    let queryClient = supabase;
    if (isAdmin) {
      queryClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }

    // Fetch mailboxes with domain info
    const { data: mailboxes, error } = await queryClient
      .from('mailboxes')
      .select(`
        *,
        domain:domains(id, domain_name, status)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mailboxes:', error);
      return NextResponse.json({ error: 'Failed to fetch mailboxes' }, { status: 500 });
    }

    return NextResponse.json({ 
      mailboxes: mailboxes || [],
      isAdmin 
    });
  } catch (error) {
    console.error('Error in GET /api/mailboxes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/mailboxes - Create a new mailbox
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domain_id, local_part, display_name } = body;

    if (!domain_id || !local_part) {
      return NextResponse.json(
        { error: 'domain_id and local_part are required' },
        { status: 400 }
      );
    }

    // Validate local_part format
    const localPartRegex = /^[a-z0-9._-]+$/i;
    if (!localPartRegex.test(local_part)) {
      return NextResponse.json(
        { error: 'Invalid local_part. Use only letters, numbers, dots, hyphens, and underscores.' },
        { status: 400 }
      );
    }

    // Fetch domain to construct full email
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select('domain_name')
      .eq('id', domain_id)
      .eq('user_id', user.id)
      .single();

    if (domainError || !domain) {
      return NextResponse.json({ error: 'Domain not found or unauthorized' }, { status: 404 });
    }

    const email_address = `${local_part.toLowerCase()}@${domain.domain_name}`;

    // Insert mailbox
    const { data: mailbox, error } = await supabase
      .from('mailboxes')
      .insert({
        user_id: user.id,
        workspace_id: null,
        domain_id,
        email_address,
        local_part: local_part.toLowerCase(),
        display_name: display_name || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating mailbox:', error);
      
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Mailbox already exists' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Failed to create mailbox' }, { status: 500 });
    }

    return NextResponse.json({ mailbox }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/mailboxes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
