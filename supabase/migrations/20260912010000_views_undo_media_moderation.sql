-- Image/file chat, recruiter swipe undo, unmatch-on-undo, blocks, reports.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'voice', 'image', 'file'));

DROP POLICY IF EXISTS "cs_delete_own" ON candidate_swipes;
CREATE POLICY "cs_delete_own" ON candidate_swipes FOR DELETE
  USING (recruiter_id = auth.uid() AND auth_user_role() = 'recruiter');

DROP POLICY IF EXISTS "matches_delete_party" ON matches;
CREATE POLICY "matches_delete_party" ON matches FOR DELETE
  USING (student_id = auth.uid() OR recruiter_id = auth.uid());

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  details     TEXT,
  status      TEXT NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CHECK (reporter_id <> reported_id),
  CHECK (status IN ('open', 'reviewed', 'dismissed'))
);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks_select_party" ON blocks;
CREATE POLICY "blocks_select_party" ON blocks FOR SELECT
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid() OR auth_user_role() = 'admin');

DROP POLICY IF EXISTS "blocks_insert_own" ON blocks;
CREATE POLICY "blocks_insert_own" ON blocks FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS "blocks_delete_own" ON blocks;
CREATE POLICY "blocks_delete_own" ON blocks FOR DELETE
  USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reports_select_own_or_admin" ON reports;
CREATE POLICY "reports_select_own_or_admin" ON reports FOR SELECT
  USING (reporter_id = auth.uid() OR auth_user_role() = 'admin');

DROP POLICY IF EXISTS "reports_update_admin" ON reports;
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE
  USING (auth_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS blocks_blocked_id_idx ON blocks (blocked_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status, created_at DESC);
