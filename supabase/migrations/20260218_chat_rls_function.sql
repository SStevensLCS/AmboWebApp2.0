-- Fix recursive RLS policies on chat_participants using a SECURITY DEFINER function

-- 1. Create a function to check membership without recursion
-- This function runs with the privileges of the creator (superuser) and bypasses RLS
CREATE OR REPLACE FUNCTION is_chat_member(check_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM chat_participants
    WHERE group_id = check_group_id
    AND user_id = auth.uid()
  );
$$;

-- 2. Drop existing policies on chat_participants
DROP POLICY IF EXISTS "Users can view participants of their groups" ON chat_participants;
DROP POLICY IF EXISTS "Users can view own participation" ON chat_participants;
DROP POLICY IF EXISTS "Users can view group participants" ON chat_participants;

-- 3. Re-create policies using the function

-- Policy: Users can see their own participation rows
CREATE POLICY "Users can view own participation"
ON chat_participants FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can see other participants in groups they belong to
CREATE POLICY "Users can view group participants"
ON chat_participants FOR SELECT
USING (is_chat_member(group_id));

-- 4. Update chat_groups policies to use the function as well for consistency and performance
DROP POLICY IF EXISTS "Users can view groups they are part of" ON chat_groups;

CREATE POLICY "Users can view groups they are part of"
ON chat_groups FOR SELECT
USING (is_chat_member(id));

-- 5. Update chat_messages policies
DROP POLICY IF EXISTS "Users can view messages in their groups" ON chat_messages;

CREATE POLICY "Users can view messages in their groups"
ON chat_messages FOR SELECT
USING (is_chat_member(group_id));
