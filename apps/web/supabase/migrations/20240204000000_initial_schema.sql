-- Enum types
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE submission_status AS ENUM ('Pending', 'Approved', 'Denied');

-- Users table (profiles linked by email to auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  CONSTRAINT phone_10_digits CHECK (phone ~ '^\d{10}$')
);

CREATE UNIQUE INDEX users_email_key ON public.users (email);

-- Submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL,
  credits DOUBLE PRECISION NOT NULL DEFAULT 0,
  hours DOUBLE PRECISION NOT NULL DEFAULT 0,
  feedback TEXT,
  status submission_status NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Users: students see only themselves; admins see all (via service role or policy)
CREATE POLICY "Users can read own row"
  ON public.users FOR SELECT
  USING (
    email = (auth.jwt()->>'email')
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.email = (auth.jwt()->>'email')
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.email = (auth.jwt()->>'email')
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.email = (auth.jwt()->>'email')
      AND u.role = 'admin'
    )
  );

-- Submissions: students see/insert own; admins see/update all
CREATE POLICY "Users can read own submissions"
  ON public.submissions FOR SELECT
  USING (
    user_id IN (SELECT id FROM public.users WHERE email = (auth.jwt()->>'email'))
    OR
    EXISTS (SELECT 1 FROM public.users u WHERE u.email = (auth.jwt()->>'email') AND u.role = 'admin')
  );

CREATE POLICY "Users can insert own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE email = (auth.jwt()->>'email'))
  );

CREATE POLICY "Admins can update submissions"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.email = (auth.jwt()->>'email') AND u.role = 'admin')
  );

CREATE POLICY "Admins can insert submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.email = (auth.jwt()->>'email') AND u.role = 'admin')
  );

-- Function to get current user profile by auth email
CREATE OR REPLACE FUNCTION public.get_user_by_auth_email(auth_email TEXT)
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.users WHERE email = auth_email LIMIT 1;
$$;
