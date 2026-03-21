-- Fix waitlist RLS:
-- 1) Logged-in users use role "authenticated", not "anon".
-- 2) upsert(..., onConflict: "email") runs UPDATE on duplicate — needs UPDATE policy.
-- 3) Policies use TO public so every DB role (anon, authenticated, etc.) is covered.
-- 4) Explicit GRANTs — SQL-created tables sometimes lack anon/authenticated table privileges.

DROP POLICY IF EXISTS "waitlist_insert_anon" ON public.waitlist_emails;
DROP POLICY IF EXISTS "waitlist_insert_public" ON public.waitlist_emails;
DROP POLICY IF EXISTS "waitlist_update_upsert" ON public.waitlist_emails;

ALTER TABLE public.waitlist_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waitlist_insert_public" ON public.waitlist_emails
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "waitlist_update_upsert" ON public.waitlist_emails
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE ON public.waitlist_emails TO anon, authenticated;
