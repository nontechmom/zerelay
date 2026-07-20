import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    let query = supabase
      .from('inbox_messages')
      .select(`
        *,
        mailbox:mailboxes(id, email_address, display_name)
      `)
      .eq('user_id', user.id)
      .order('received_at', { ascending: false })
      .limit(limit);

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
    const { count: unreadCount } = await supabase
      .from('inbox_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({
      messages: messages || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/inbox:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
