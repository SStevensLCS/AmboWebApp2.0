-- Fix recursive RLS policies on chat_participants

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Users can view participants of their groups" ON chat_participants;

-- 1. Users can always view their own participation rows (Base case for recursion)
CREATE POLICY "Users can view own participation"
ON chat_participants FOR SELECT
USING (auth.uid() = user_id);

-- 2. Users can view other participants in groups they belong to
-- This relies on the policy above to allow the subquery to see the user's own row
CREATE POLICY "Users can view group participants"
ON chat_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.group_id = chat_participants.group_id
    AND cp.user_id = auth.uid()
  )
);
