import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { z } from 'zod';

const SuggestionsSchema = z.object({
  q: z.string().min(1),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional(),
});

const ValidateMentionsSchema = z.object({
  user_ids: z.array(z.string().uuid()),
  entity_type: z.string(),
  entity_id: z.string().uuid(),
});

const NotifyMentionsSchema = z.object({
  comment_id: z.string().uuid(),
  mentioned_user_ids: z.array(z.string().uuid()),
  entity_type: z.string(),
  entity_id: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { q: query, entity_type, entity_id, limit = 10 } = SuggestionsSchema.parse(Object.fromEntries(searchParams));

    // Search for users based on name or email
    let usersQuery = supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .neq('id', user.id) // Exclude current user
      .limit(limit);

    // Add search filters
    if (query.includes('@')) {
      // Search by email
      usersQuery = usersQuery.ilike('email', `%${query}%`);
    } else {
      // Search by name or email
      usersQuery = usersQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
    }

    const { data: users, error } = await usersQuery;

    if (error) {
      console.error('Error fetching user suggestions:', error);
      return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
    }

    // Format as mention suggestions
    const suggestions = (users || []).map(user => ({
      id: user.id,
      display_name: user.full_name || user.email,
      email: user.email,
      avatar_url: user.avatar_url,
      type: 'user' as const
    }));

    return NextResponse.json(suggestions);

  } catch (error) {
    console.error('Error in GET /api/mentions:', error);
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

    const data = await request.json();
    const { comment_id, mentioned_user_ids, entity_type, entity_id } = NotifyMentionsSchema.parse(data);

    // Create notifications for mentioned users
    const notificationRecords = mentioned_user_ids.map(userId => ({
      user_id: userId,
      type: 'mention',
      title: 'You were mentioned in a comment',
      message: `${user.email} mentioned you in a comment`,
      data: {
        comment_id,
        entity_type,
        entity_id,
        mentioned_by: user.id
      },
      is_read: false
    }));

    const { error } = await supabase
      .from('user_notifications')
      .insert(notificationRecords);

    if (error) {
      console.error('Error creating mention notifications:', error);
      return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in POST /api/mentions:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 