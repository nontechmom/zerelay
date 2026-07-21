import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// GET /api/inbox - Fetch inbox messages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mailbox_id = searchParams.get('mailbox_id');
    const is_read = searchParams.get('is_read');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    // If admin, use service role to bypass RLS
    let queryClient = supabase;
    if (isAdmin) {
      queryClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }

    let query = queryClient
      .from('inbox_messages')
      .select(`
        *,
        mailbox:mailboxes(id, email_address, display_name)
      `)
      .order('received_at', { ascending: false })
      .limit(limit);

    // For non-admins, filter by user_id or mailbox access (handled by RLS)
    // For admins, no user_id filter to see all messages
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    if (mailbox_id) {
      query = query.eq('mailbox_id', mailbox_id);
    }

    if (is_read !== null && is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true');
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching inbox messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get unread count
    let unreadQuery = queryClient
      .from('inbox_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (!isAdmin) {
      unreadQuery = unreadQuery.eq('user_id', user.id);
    }

    const { count: unreadCount } = await unreadQuery;

    return NextResponse.json({
      messages: messages || [],
      unreadCount: unreadCount || 0,
      isAdmin,
    });
  } catch (error) {
    console.error('Error in GET /api/inbox:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
