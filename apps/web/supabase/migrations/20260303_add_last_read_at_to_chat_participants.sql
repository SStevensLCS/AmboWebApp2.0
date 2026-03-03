-- Add last_read_at column to chat_participants for tracking unread messages
-- When a user opens a chat thread, their last_read_at is updated to NOW().
-- On the chat list, compare last_read_at with the latest message timestamp
-- to determine if there are unread messages (shown as a blue dot).
ALTER TABLE chat_participants
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();
