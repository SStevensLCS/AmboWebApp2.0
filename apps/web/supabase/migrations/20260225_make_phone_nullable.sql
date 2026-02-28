-- Make phone nullable so new registrations don't need a phone number yet.
-- Phone is collected later during the ambassador application.
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;
