import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/mailboxes/[id] - Update mailbox
export async function PATCH(
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
    const { display_name, is_active } = body;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (display_name !== undefined) updateData.display_name = display_name;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: mailbox, error } = await supabase
      .from('mailboxes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !mailbox) {
      return NextResponse.json({ error: 'Mailbox not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ mailbox });
  } catch (error) {
    console.error('Error in PATCH /api/mailboxes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/mailboxes/[id] - Delete a mailbox
export async function DELETE(
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

    const { error } = await supabase
      .from('mailboxes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete mailbox' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/mailboxes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
