import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { z } from 'zod';

const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  is_resolved: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await context.params;
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = resolvedParams.id;
    const data = await request.json();
    const validatedData = UpdateCommentSchema.parse(data);

    // First, check if the comment exists and user has permission to edit it
    const { data: existingComment, error: fetchError } = await supabase
      .from('user_comments')
      .select('user_id, entity_type, entity_id, parent_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check permissions: user can only edit their own comments or resolve any comment if they have permissions
    const canEdit = existingComment.user_id === user.id;
    const canResolve = validatedData.is_resolved !== undefined; // You might want more complex permission logic here

    if (!canEdit && !canResolve) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (validatedData.content && canEdit) {
      updateData.content = validatedData.content;
      updateData.is_edited = true;
    }

    if (validatedData.is_resolved !== undefined && canResolve) {
      updateData.is_resolved = validatedData.is_resolved;
      if (validatedData.is_resolved) {
        updateData.resolved_by = user.id;
        updateData.resolved_at = new Date().toISOString();
      } else {
        updateData.resolved_by = null;
        updateData.resolved_at = null;
      }
    }

    // Update the comment
    const { data: updatedComment, error } = await supabase
      .from('user_comments')
      .update(updateData)
      .eq('id', commentId)
      .select(`
        *,
        author:profiles!user_comments_user_id_fkey(
          id,
          email,
          full_name,
          avatar_url
        ),
        mentioned_users:user_comments_mentions(
          user_id,
          profiles!user_comments_mentions_user_id_fkey(
            id,
            email,
            full_name,
            avatar_url
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }

    // If this is a thread resolution, update all replies as well
    if (validatedData.is_resolved !== undefined && !existingComment.parent_id) {
      await supabase
        .from('user_comments')
        .update({
          is_resolved: validatedData.is_resolved,
          updated_at: new Date().toISOString()
        })
        .eq('parent_id', commentId);
    }

    return NextResponse.json(updatedComment);

  } catch (error) {
    console.error('Error in PATCH /api/comments/[id]:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await context.params;
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = resolvedParams.id;

    // First, check if the comment exists and user has permission to delete it
    const { data: existingComment, error: fetchError } = await supabase
      .from('user_comments')
      .select('user_id, parent_id, attachments')
      .eq('id', commentId)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check permissions: user can only delete their own comments
    if (existingComment.user_id !== user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete any file attachments from storage
    if (existingComment.attachments && Array.isArray(existingComment.attachments)) {
      for (const attachment of existingComment.attachments) {
        if (attachment.url) {
          // Extract file path from URL
          const urlParts = attachment.url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `${user.id}/${fileName}`;
          
          await supabase.storage
            .from('comment-attachments')
            .remove([filePath]);
        }
      }
    }

    // Delete mention records
    await supabase
      .from('user_comments_mentions')
      .delete()
      .eq('comment_id', commentId);

    // If this is a root comment, delete all replies first
    if (!existingComment.parent_id) {
      const { data: replies } = await supabase
        .from('user_comments')
        .select('id')
        .eq('parent_id', commentId);

      if (replies && replies.length > 0) {
        // Delete mentions for all replies
        const replyIds = replies.map(r => r.id);
        await supabase
          .from('user_comments_mentions')
          .delete()
          .in('comment_id', replyIds);

        // Delete all replies
        await supabase
          .from('user_comments')
          .delete()
          .eq('parent_id', commentId);
      }
    }

    // Delete the comment itself
    const { error } = await supabase
      .from('user_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/comments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  } 