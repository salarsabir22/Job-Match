-- Company profile extras, job category, view tracking, feedback.

ALTER TABLE recruiter_profiles
  ADD COLUMN IF NOT EXISTS employee_count TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS category TEXT;

CREATE TABLE IF NOT EXISTS job_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, job_id)
);

CREATE TABLE IF NOT EXISTS profile_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (viewer_id, student_id)
);

CREATE TABLE IF NOT EXISTS product_feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT,
  liked      TEXT,
  disliked   TEXT,
  improve    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jv_insert_own" ON job_views;
CREATE POLICY "jv_insert_own" ON job_views FOR INSERT
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "jv_select_own_or_owner" ON job_views;
CREATE POLICY "jv_select_own_or_owner" ON job_views FOR SELECT USING (
  student_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = job_views.job_id
      AND jobs.recruiter_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pv_insert_own" ON profile_views;
CREATE POLICY "pv_insert_own" ON profile_views FOR INSERT
  WITH CHECK (viewer_id = auth.uid());

DROP POLICY IF EXISTS "pv_select_own_or_student" ON profile_views;
CREATE POLICY "pv_select_own_or_student" ON profile_views FOR SELECT USING (
  viewer_id = auth.uid() OR student_id = auth.uid()
);

DROP POLICY IF EXISTS "fb_insert_own" ON product_feedback;
CREATE POLICY "fb_insert_own" ON product_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "fb_select_own_or_admin" ON product_feedback;
CREATE POLICY "fb_select_own_or_admin" ON product_feedback FOR SELECT USING (
  user_id = auth.uid() OR auth_user_role() = 'admin'
);

CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id    UUID;
  v_recruiter_id  UUID;
  v_job_id        UUID;
  v_match_id      UUID;
  v_conv_id       UUID;
  v_job_title     TEXT;
  v_company_name  TEXT;
BEGIN
  IF TG_TABLE_NAME = 'job_swipes' THEN
    IF NEW.direction != 'right' THEN
      RETURN NEW;
    END IF;

    v_student_id := NEW.student_id;
    v_job_id     := NEW.job_id;

    SELECT rp.id, j.title, rp.company_name
      INTO v_recruiter_id, v_job_title, v_company_name
    FROM jobs j
    JOIN recruiter_profiles rp ON rp.id = j.recruiter_id
    WHERE j.id = v_job_id;

    IF EXISTS (
      SELECT 1 FROM candidate_swipes
      WHERE recruiter_id = v_recruiter_id
        AND student_id   = v_student_id
        AND job_id       = v_job_id
        AND direction    = 'right'
    ) THEN
      INSERT INTO matches (student_id, recruiter_id, job_id, is_shortlisted)
      VALUES (v_student_id, v_recruiter_id, v_job_id, TRUE)
      ON CONFLICT (student_id, recruiter_id, job_id) DO NOTHING
      RETURNING id INTO v_match_id;

      IF v_match_id IS NULL THEN
        SELECT id INTO v_match_id
        FROM matches
        WHERE student_id = v_student_id
          AND recruiter_id = v_recruiter_id
          AND job_id = v_job_id
        LIMIT 1;
      END IF;

      IF v_match_id IS NOT NULL THEN
        INSERT INTO conversations (match_id) VALUES (v_match_id)
        ON CONFLICT (match_id) DO NOTHING;

        SELECT id INTO v_conv_id
        FROM conversations
        WHERE match_id = v_match_id
        LIMIT 1;

        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES
          (
            v_student_id,
            'match',
            'It''s a match 🎉',
            'You and ' || COALESCE(v_company_name, 'a recruiter') || ' both said yes on ' || COALESCE(v_job_title, 'a role') || '.',
            jsonb_build_object('match_id', v_match_id, 'conversation_id', v_conv_id, 'job_id', v_job_id)
          ),
          (
            v_recruiter_id,
            'match',
            'New match unlocked ✨',
            'A candidate matched with ' || COALESCE(v_job_title, 'your job') || '. Go say hi.',
            jsonb_build_object('match_id', v_match_id, 'conversation_id', v_conv_id, 'job_id', v_job_id, 'student_id', v_student_id)
          );
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'candidate_swipes' THEN
    v_recruiter_id := NEW.recruiter_id;
    v_student_id   := NEW.student_id;
    v_job_id       := NEW.job_id;

    SELECT j.title, rp.company_name
      INTO v_job_title, v_company_name
    FROM jobs j
    JOIN recruiter_profiles rp ON rp.id = j.recruiter_id
    WHERE j.id = v_job_id;

    IF NEW.direction = 'left' THEN
      RETURN NEW;
    END IF;

    IF NEW.direction != 'right' THEN
      RETURN NEW;
    END IF;

    INSERT INTO matches (student_id, recruiter_id, job_id, is_shortlisted)
    VALUES (v_student_id, v_recruiter_id, v_job_id, TRUE)
    ON CONFLICT (student_id, recruiter_id, job_id) DO NOTHING
    RETURNING id INTO v_match_id;

    IF v_match_id IS NULL THEN
      SELECT id INTO v_match_id
      FROM matches
      WHERE student_id = v_student_id
        AND recruiter_id = v_recruiter_id
        AND job_id = v_job_id
      LIMIT 1;
    END IF;

    IF v_match_id IS NOT NULL THEN
      UPDATE matches
      SET is_shortlisted = TRUE
      WHERE id = v_match_id;

      INSERT INTO conversations (match_id) VALUES (v_match_id)
      ON CONFLICT (match_id) DO NOTHING;

      SELECT id INTO v_conv_id
      FROM conversations
      WHERE match_id = v_match_id
      LIMIT 1;

      IF v_conv_id IS NOT NULL THEN
        IF NOT EXISTS (
          SELECT 1 FROM messages
          WHERE conversation_id = v_conv_id
            AND sender_id = v_recruiter_id
            AND content LIKE 'A recruiter wants to interview you.%'
        ) THEN
          INSERT INTO messages (conversation_id, sender_id, content, is_read)
          VALUES (
            v_conv_id,
            v_recruiter_id,
            'Woohoo 🎉 A recruiter shortlisted you for ' || COALESCE(v_job_title, 'an interview') || '. Open chat and lock it in.',
            FALSE
          );
        END IF;
      END IF;

      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        v_student_id,
        'candidate_shortlisted',
        'Woohoo 🎉 A recruiter shortlisted you',
        'You got shortlisted for ' || COALESCE(v_job_title, 'an interview') || ' at ' || COALESCE(v_company_name, 'a company') || '. Tap to open chat 💬',
        jsonb_build_object(
          'match_id', v_match_id,
          'conversation_id', v_conv_id,
          'job_id', v_job_id,
          'job_title', v_job_title
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
