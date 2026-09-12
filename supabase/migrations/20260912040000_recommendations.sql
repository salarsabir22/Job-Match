-- Compatibility table. Some databases have triggers that write here;
-- the app does not require this for Discover (scoring is computed in the client).

CREATE TABLE IF NOT EXISTS recommendations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id      UUID REFERENCES jobs(id) ON DELETE CASCADE,
  score       DOUBLE PRECISION,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recommendations_user_id_idx ON recommendations (user_id);
CREATE INDEX IF NOT EXISTS recommendations_job_id_idx ON recommendations (job_id);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS product (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id       UUID REFERENCES jobs(id) ON DELETE CASCADE,
  name         TEXT,
  category     TEXT,
  score        DOUBLE PRECISION,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE product ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recommendations_select_own" ON recommendations;
CREATE POLICY "recommendations_select_own" ON recommendations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR student_id = auth.uid()
    OR recruiter_id = auth.uid()
  );
