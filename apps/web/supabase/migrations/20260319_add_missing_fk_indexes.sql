-- Add missing indexes on foreign key and frequently queried columns
-- These improve JOIN performance and speed up queries on common access patterns

-- Chat: messages are always filtered/sorted by group
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_created
  ON public.chat_messages (group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id
  ON public.chat_messages (sender_id);

-- Chat: participant lookups by user (e.g. "which groups am I in?")
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id
  ON public.chat_participants (user_id);

-- Posts: sorted by creation date, filtered by author
CREATE INDEX IF NOT EXISTS idx_posts_created_at
  ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id
  ON public.posts (user_id);

-- Comments on posts
CREATE INDEX IF NOT EXISTS idx_comments_post_id
  ON public.comments (post_id);

-- Event RSVPs: lookup by user ("my RSVPs")
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id
  ON public.event_rsvps (user_id);

-- Event comments: lookup by user
CREATE INDEX IF NOT EXISTS idx_event_comments_user_id
  ON public.event_comments (user_id);

-- Push subscriptions: sending notifications to a user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions (user_id);

-- Expo push tokens: sending mobile push to a user
CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_user_id
  ON public.expo_push_tokens (user_id);

-- Applications: lookup by phone + status (common admin query)
CREATE INDEX IF NOT EXISTS idx_applications_phone_status
  ON public.applications (phone_number, status);

-- Events: sorted listing by start time
CREATE INDEX IF NOT EXISTS idx_events_start_time
  ON public.events (start_time DESC);

-- Submissions: filtered by status (admin approval queue)
CREATE INDEX IF NOT EXISTS idx_submissions_status
  ON public.submissions (status);

-- Resources: sorted by upload date
CREATE INDEX IF NOT EXISTS idx_resources_created_at
  ON public.resources (created_at DESC);
