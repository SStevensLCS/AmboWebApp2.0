-- Add events notification preference column
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS events BOOLEAN NOT NULL DEFAULT TRUE;
