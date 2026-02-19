-- Add uniform column to events table
ALTER TABLE events 
ADD COLUMN uniform TEXT DEFAULT 'Ambassador Polo with Navy Pants.';

-- Create posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies (optional but recommended)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone for posts
CREATE POLICY "Public posts are viewable by everyone" 
ON posts FOR SELECT 
USING (true);

-- Allow authenticated users to insert posts
CREATE POLICY "Authenticated users can create posts" 
ON posts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts" 
ON posts FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete own posts" 
ON posts FOR DELETE 
USING (auth.uid() = user_id);

-- Allow read access to everyone for comments
CREATE POLICY "Public comments are viewable by everyone" 
ON comments FOR SELECT 
USING (true);

-- Allow authenticated users to insert comments
CREATE POLICY "Authenticated users can create comments" 
ON comments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow users to delete their own comments
CREATE POLICY "Users can delete own comments" 
ON comments FOR DELETE 
USING (auth.uid() = user_id);

-- Chat Feature Schema

-- Create chat_groups table
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_participants table
CREATE TABLE IF NOT EXISTS chat_participants (
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_groups

-- Users can view groups they are part of
CREATE POLICY "Users can view groups they are part of"
ON chat_groups FOR SELECT
USING (
  EXISTs (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.group_id = chat_groups.id
    AND chat_participants.user_id = auth.uid()
  )
);

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
ON chat_groups FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can update groups they are part of (e.g. rename)
CREATE POLICY "Participants can update groups"
ON chat_groups FOR UPDATE
USING (
  EXISTs (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.group_id = chat_groups.id
    AND chat_participants.user_id = auth.uid()
  )
);

-- Policies for chat_participants

-- Users can view participants of groups they are part of
CREATE POLICY "Users can view participants of their groups"
ON chat_participants FOR SELECT
USING (
  EXISTs (
    SELECT 1 FROM chat_participants cp
    WHERE cp.group_id = chat_participants.group_id
    AND cp.user_id = auth.uid()
  )
);

-- Users can join groups (managed via API usually, but good to have)
-- This policy might need to be looser or stricter depending on how 'adding' works.
-- For now, let's allow authenticated users to insert (the API will control who gets added).
-- Actually, strict RLS for insert on participants is hard if we want them to add OTHERS.
-- So we might rely on the creator adding others.
CREATE POLICY "Users can add participants"
ON chat_participants FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policies for chat_messages

-- Users can view messages in groups they are part of
CREATE POLICY "Users can view messages in their groups"
ON chat_messages FOR SELECT
USING (
  EXISTs (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.group_id = chat_messages.group_id
    AND chat_participants.user_id = auth.uid()
  )
);

-- Participants can insert messages
CREATE POLICY "Participants can insert messages"
ON chat_messages FOR INSERT
WITH CHECK (
  EXISTs (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.group_id = chat_messages.group_id
    AND chat_participants.user_id = auth.uid()
  )
);

-- FIX: Allow authenticated users to view profiles of other users
-- This is necessary for the User Search functionality to work for non-admin users.

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add policy for SELECT on users
CREATE POLICY "Authenticated users can view profiles"
ON public.users FOR SELECT
USING (auth.role() = 'authenticated');
