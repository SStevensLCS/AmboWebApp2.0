-- Add event_reminders preference column
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS event_reminders BOOLEAN NOT NULL DEFAULT TRUE;

-- Add reminder_sent flag to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
