import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/mailboxes/[id]/users - List users with access to a mailbox
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch mailbox users with user details
    const { data: mailboxUsers, error } = await supabase
      .from('mailbox_users')
      .select(`
        *,
        user:users(id, email, role)
      `)
      .eq('mailbox_id', id);

    if (error) {
      console.error('Error fetching mailbox users:', error);
      return NextResponse.json({ error: 'Failed to fetch mailbox users' }, { status: 500 });
    }

    return NextResponse.json({ users: mailboxUsers || [] });
  } catch (error) {
    console.error('Error in GET /api/mailboxes/[id]/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/mailboxes/[id]/users - Add user to mailbox
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_email, can_send = true, can_read = true, role = 'member' } = body;

    if (!user_email) {
      return NextResponse.json({ error: 'user_email is required' }, { status: 400 });
    }

    // Verify mailbox exists and user has permission to manage it
    const { data: mailbox, error: mailboxError } = await supabase
      .from('mailboxes')
      .select('*, user:users!mailboxes_user_id_fkey(role)')
      .eq('id', id)
      .single();

    if (mailboxError || !mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 });
    }

    // Check if current user is admin or mailbox owner
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = currentUser?.role === 'admin';
    const isOwner = mailbox.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Only admins and mailbox owners can add users' }, { status: 403 });
    }

    // Find user by email
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', user_email)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found with that email' }, { status: 404 });
    }

    // Add user to mailbox
    const { data: mailboxUser, error: insertError } = await supabase
      .from('mailbox_users')
      .insert({
        mailbox_id: id,
        user_id: targetUser.id,
        role,
        can_send,
        can_read,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'User already has access to this mailbox' }, { status: 409 });
      }
      console.error('Error adding user to mailbox:', insertError);
      return NextResponse.json({ error: 'Failed to add user to mailbox' }, { status: 500 });
    }

    return NextResponse.json({ mailboxUser }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/mailboxes/[id]/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
