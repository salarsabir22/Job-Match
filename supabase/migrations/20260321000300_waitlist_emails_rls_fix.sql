-- Fix waitlist RLS:
-- 1) Logged-in users use role "authenticated", not "anon" — INSERT was blocked for them.
-- 2) upsert(..., onConflict: "email") runs UPDATE on duplicate — needs UPDATE policy.

DROP POLICY IF EXISTS "waitlist_insert_anon" ON public.waitlist_emails;
DROP POLICY IF EXISTS "waitlist_insert_public" ON public.waitlist_emails;
DROP POLICY IF EXISTS "waitlist_update_upsert" ON public.waitlist_emails;

CREATE POLICY "waitlist_insert_public" ON public.waitlist_emails
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "waitlist_update_upsert" ON public.waitlist_emails
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
