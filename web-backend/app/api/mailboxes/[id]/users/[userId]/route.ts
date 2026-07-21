import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/mailboxes/[id]/users/[userId] - Update user permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates: any = {};

    if (body.can_send !== undefined) updates.can_send = body.can_send;
    if (body.can_read !== undefined) updates.can_read = body.can_read;
    if (body.role !== undefined) updates.role = body.role;
    updates.updated_at = new Date().toISOString();

    // Update mailbox user
    const { data: mailboxUser, error } = await supabase
      .from('mailbox_users')
      .update(updates)
      .eq('mailbox_id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating mailbox user:', error);
      return NextResponse.json({ error: 'Failed to update mailbox user' }, { status: 500 });
    }

    return NextResponse.json({ mailboxUser });
  } catch (error) {
    console.error('Error in PATCH /api/mailboxes/[id]/users/[userId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/mailboxes/[id]/users/[userId] - Remove user from mailbox
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete mailbox user
    const { error } = await supabase
      .from('mailbox_users')
      .delete()
      .eq('mailbox_id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing user from mailbox:', error);
      return NextResponse.json({ error: 'Failed to remove user from mailbox' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/mailboxes/[id]/users/[userId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
