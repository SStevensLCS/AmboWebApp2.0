# Ambassador Portal

Responsive web app for Student Ambassadors to log service hours and tour credits. Built with Next.js (App Router), Tailwind CSS, and Supabase.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon/public key  
- `SUPABASE_SERVICE_ROLE_KEY` – service role key (for admin APIs and seed)

### 3. Database

In the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql), run the migration:

- `supabase/migrations/20240204000000_initial_schema.sql`

Then run the seed (optional, for initial admin):

- Either run `supabase/seed.sql` in the SQL Editor, **or**
- From project root: `npx tsx supabase/seed.ts` (uses `.env.local`; requires `SUPABASE_SERVICE_ROLE_KEY`)

The seed ensures a user with phone **7604848038** exists with role **admin**. Update that user’s `email` in the `users` table to a real address so they can sign in (magic link is sent to that email).

### 4. Supabase Auth

- In Supabase Dashboard → Authentication → Providers, enable **Email**.
- Optionally enable “Confirm email” or use magic link only (recommended for this flow).

Users sign in by entering their **email or 10-digit phone**. If they exist in `users`, a magic link is sent to their **email**. After clicking the link they are redirected by role (Student → `/student`, Admin → `/admin`).

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Go to `/login` to sign in.

## Routes

- `/` – Redirects to `/login` or role-specific dashboard  
- `/login` – Sign in with email or phone (magic link)  
- `/student` – Student dashboard (hours & semester credits)  
- `/student/history` – Submission history  
- `/student/new` – New submission form  
- `/admin` – Admin dashboard (Submissions + Users tabs)

## CSV uploads (Admin)

- **Submissions:** columns `user_id`, `service_date`, `service_type`, `credits`, `hours`, `feedback`, `status` (optional).  
- **Users:** columns `first_name`, `last_name`, `phone` (10 digits), `email`, `role` (optional).

## Design

- **Primary:** Navy `#002e56`, White `#fff`  
- **Secondary:** Sky blue `#79bde9`  
- Mobile-first, minimal layout with bottom nav for students.
"# AmboWebApp2.0" 
