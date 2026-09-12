-- Compensation, match pipeline/notes, mute, interview proposals.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS salary_min INTEGER,
  ADD COLUMN IF NOT EXISTS salary_max INTEGER,
  ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'PKR',
  ADD COLUMN IF NOT EXISTS compensation_note TEXT;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS pipeline_status TEXT NOT NULL DEFAULT 'chatting',
  ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_pipeline_status_check;
ALTER TABLE matches
  ADD CONSTRAINT matches_pipeline_status_check
  CHECK (pipeline_status IN ('chatting', 'interview', 'offer', 'hired', 'passed'));

CREATE TABLE IF NOT EXISTS conversation_mutes (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, conversation_id)
);

CREATE TABLE IF NOT EXISTS interview_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposed_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  location_or_link TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'))
);

ALTER TABLE conversation_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mutes_select_own" ON conversation_mutes;
CREATE POLICY "mutes_select_own" ON conversation_mutes FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "mutes_insert_own" ON conversation_mutes;
CREATE POLICY "mutes_insert_own" ON conversation_mutes FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "mutes_delete_own" ON conversation_mutes;
CREATE POLICY "mutes_delete_own" ON conversation_mutes FOR DELETE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "interviews_select_party" ON interview_proposals;
CREATE POLICY "interviews_select_party" ON interview_proposals FOR SELECT
  USING (
    proposed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = interview_proposals.match_id
        AND (m.student_id = auth.uid() OR m.recruiter_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "interviews_insert_party" ON interview_proposals;
CREATE POLICY "interviews_insert_party" ON interview_proposals FOR INSERT
  WITH CHECK (
    proposed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND (m.student_id = auth.uid() OR m.recruiter_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "interviews_update_party" ON interview_proposals;
CREATE POLICY "interviews_update_party" ON interview_proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = interview_proposals.match_id
        AND (m.student_id = auth.uid() OR m.recruiter_id = auth.uid())
    )
  );
