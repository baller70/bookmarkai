import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { z } from 'zod';

const ReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const commentId = params.id;
    const data = await request.json();
    const { emoji } = ReactionSchema.parse(data);

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from('user_comments')
      .select('id, reactions')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Get current reactions
    const currentReactions = comment.reactions || {};
    
    // Add or remove the user's reaction
    if (currentReactions[emoji]) {
      // Check if user already reacted with this emoji
      const userIndex = currentReactions[emoji].indexOf(user.id);
      if (userIndex > -1) {
        // Remove user's reaction
        currentReactions[emoji].splice(userIndex, 1);
        if (currentReactions[emoji].length === 0) {
          delete currentReactions[emoji];
        }
      } else {
        // Add user's reaction
        currentReactions[emoji].push(user.id);
      }
    } else {
      // Add new reaction
      currentReactions[emoji] = [user.id];
    }

    // Update the comment with new reactions
    const { data: updatedComment, error: updateError } = await supabase
      .from('user_comments')
      .update({ 
        reactions: currentReactions,
        updated_at: new Date().toISOString()
      })
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

    if (updateError) {
      console.error('Error updating comment reactions:', updateError);
      return NextResponse.json({ error: 'Failed to update reactions' }, { status: 500 });
    }

    return NextResponse.json(updatedComment);

  } catch (error) {
    console.error('Error in POST /api/comments/[id]/reactions:', error);
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
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const commentId = params.id;
    const data = await request.json();
    const { emoji } = ReactionSchema.parse(data);

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from('user_comments')
      .select('id, reactions')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Get current reactions
    const currentReactions = comment.reactions || {};
    
    // Remove the user's reaction
    if (currentReactions[emoji]) {
      const userIndex = currentReactions[emoji].indexOf(user.id);
      if (userIndex > -1) {
        currentReactions[emoji].splice(userIndex, 1);
        if (currentReactions[emoji].length === 0) {
          delete currentReactions[emoji];
        }
      }
    }

    // Update the comment with new reactions
    const { data: updatedComment, error: updateError } = await supabase
      .from('user_comments')
      .update({ 
        reactions: currentReactions,
        updated_at: new Date().toISOString()
      })
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

    if (updateError) {
      console.error('Error updating comment reactions:', updateError);
      return NextResponse.json({ error: 'Failed to update reactions' }, { status: 500 });
    }

    return NextResponse.json(updatedComment);

  } catch (error) {
    console.error('Error in DELETE /api/comments/[id]/reactions:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 