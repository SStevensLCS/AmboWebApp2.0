-- Add 'basic' to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'basic';

-- Add password_hash column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
