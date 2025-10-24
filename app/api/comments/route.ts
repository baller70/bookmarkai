import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validation schemas
const CreateCommentSchema = z.object({
  entity_type: z.enum(['document', 'task', 'media', 'bookmark']),
  entity_id: z.string().uuid(),
  parent_id: z.string().uuid().optional(),
  content: z.string().min(1).max(10000),
  mentions: z.array(z.string().uuid()).optional(),
});

const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  is_resolved: z.boolean().optional(),
});

const CommentFiltersSchema = z.object({
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  is_resolved: z.boolean().optional(),
  has_mentions: z.boolean().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = CommentFiltersSchema.parse(Object.fromEntries(searchParams));

    // Build query
    let query = supabase
      .from('user_comments')
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
      .eq('entity_type', filters.entity_type)
      .eq('entity_id', filters.entity_id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.is_resolved !== undefined) {
      query = query.eq('is_resolved', filters.is_resolved);
    }
    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }
    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before);
    }
    if (filters.has_mentions) {
      // This would need a more complex query or post-processing
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data: comments, error } = await query;

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    // Group comments into threads
    const rootComments = comments?.filter(comment => !comment.parent_id) || [];
    const threads = rootComments.map(rootComment => {
      const replies = comments?.filter(comment => comment.parent_id === rootComment.id) || [];
      
      return {
        id: rootComment.id,
        root_comment: rootComment,
        replies,
        participant_ids: [...new Set([rootComment.user_id, ...replies.map(r => r.user_id)])],
        last_activity: new Date(Math.max(
          new Date(rootComment.updated_at).getTime(),
          ...replies.map(r => new Date(r.updated_at).getTime())
        )),
        is_resolved: rootComment.is_resolved,
        reply_count: replies.length,
        entity_type: rootComment.entity_type,
        entity_id: rootComment.entity_id
      };
    });

    // Get comment statistics
    const { data: stats } = await supabase
      .from('user_comments')
      .select('id, created_at, user_id')
      .eq('entity_type', filters.entity_type)
      .eq('entity_id', filters.entity_id);

    const commentStats = {
      total_comments: stats?.length || 0,
      resolved_threads: rootComments.filter(c => c.is_resolved).length,
      active_participants: [...new Set(stats?.map(s => s.user_id) || [])].length,
      recent_activity: comments?.slice(0, 5) || []
    };

    return NextResponse.json({
      comments: comments || [],
      threads,
      stats: commentStats,
      pagination: {
        limit: filters.limit || 20,
        offset: filters.offset || 0,
        total: stats?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in GET /api/comments:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle form data for file attachments
    const contentType = request.headers.get('content-type');
    let data;
    const attachments: File[] = [];

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      // Extract text data
      data = {
        entity_type: formData.get('entity_type') as string,
        entity_id: formData.get('entity_id') as string,
        parent_id: formData.get('parent_id') as string | undefined,
        content: formData.get('content') as string,
        mentions: formData.get('mentions') ? JSON.parse(formData.get('mentions') as string) : undefined,
      };

      // Extract file attachments
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('attachments[') && value instanceof File) {
          attachments.push(value);
        }
      }
    } else {
      data = await request.json();
    }

    const validatedData = CreateCommentSchema.parse(data);

    // Check permissions (basic check - user must be authenticated)
    // In a real app, you might check if user has access to the entity
    
    // Handle file attachments
    const attachmentData = [];
    if (attachments.length > 0) {
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('comment-attachments')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading attachment:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('comment-attachments')
          .getPublicUrl(fileName);

        attachmentData.push({
          name: file.name,
          url: publicUrl,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          size: file.size
        });
      }
    }

    // Create the comment
    const { data: comment, error } = await supabase
      .from('user_comments')
      .insert({
        user_id: user.id,
        entity_type: validatedData.entity_type,
        entity_id: validatedData.entity_id,
        parent_id: validatedData.parent_id,
        content: validatedData.content,
        attachments: attachmentData,
        mentions: validatedData.mentions || [],
        is_resolved: false,
        is_edited: false,
      })
      .select(`
        *,
        author:profiles!user_comments_user_id_fkey(
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // Create mention records if any
    if (validatedData.mentions && validatedData.mentions.length > 0) {
      const mentionRecords = validatedData.mentions.map(userId => ({
        comment_id: comment.id,
        user_id: userId,
        mentioned_by: user.id
      }));

      await supabase
        .from('user_comments_mentions')
        .insert(mentionRecords);

      // Create notifications for mentioned users
      const notificationRecords = validatedData.mentions.map(userId => ({
        user_id: userId,
        type: 'mention',
        title: 'You were mentioned in a comment',
        message: `${user.email} mentioned you in a comment`,
        data: {
          comment_id: comment.id,
          entity_type: validatedData.entity_type,
          entity_id: validatedData.entity_id,
          mentioned_by: user.id
        },
        is_read: false
      }));

      await supabase
        .from('user_notifications')
        .insert(notificationRecords);
    }

    return NextResponse.json(comment, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/comments:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 