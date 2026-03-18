-- Waitlist emails table (public submission)

CREATE TABLE IF NOT EXISTS public.waitlist_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.waitlist_emails ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users (anon key) to insert waitlist emails
CREATE POLICY "waitlist_insert_anon" ON public.waitlist_emails
FOR INSERT TO anon
WITH CHECK (true);

-- Allow anyone to read nothing by default (no SELECT policy)

