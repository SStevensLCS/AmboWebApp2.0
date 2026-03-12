-- Allow users to update their own chat_participants row (e.g. last_read_at)
CREATE POLICY "Users can update own participation"
ON chat_participants FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
