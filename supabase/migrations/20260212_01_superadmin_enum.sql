-- Add superadmin to user_role enum
-- This must be committed before using the value in a transaction
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';
