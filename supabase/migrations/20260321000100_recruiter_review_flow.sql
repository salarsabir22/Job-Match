-- Recruiter review flow:
-- 1) allow recruiters to read applicants for their own jobs
-- 2) notify candidates on shortlist/reject decisions
-- 3) send interview Calendly message when shortlisted

CREATE POLICY "js_select_recruiter_own_job" ON job_swipes FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM jobs
    WHERE jobs.id = job_swipes.job_id
      AND jobs.recruiter_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id    UUID;
  v_recruiter_id  UUID;
  v_job_id        UUID;
  v_match_id      UUID;
  v_conv_id       UUID;
  v_calendly_link TEXT := 'https://calendly.com/your-company/30min';
BEGIN
  IF TG_TABLE_NAME = 'job_swipes' THEN
    IF NEW.direction != 'right' THEN
      RETURN NEW;
    END IF;

    v_student_id := NEW.student_id;
    v_job_id     := NEW.job_id;

    SELECT rp.id INTO v_recruiter_id
    FROM jobs j
    JOIN recruiter_profiles rp ON rp.id = j.recruiter_id
    WHERE j.id = v_job_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES
      (
        v_recruiter_id,
        'candidate_interested',
        'Candidate interested',
        'A candidate applied to your job.',
        jsonb_build_object('student_id', v_student_id, 'job_id', v_job_id)
      );

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
            'New Match! 🎉',
            'A recruiter liked your profile!',
            jsonb_build_object('match_id', v_match_id, 'conversation_id', v_conv_id, 'job_id', v_job_id)
          ),
          (
            v_recruiter_id,
            'match',
            'New Match! 🎉',
            'A candidate matched with your job!',
            jsonb_build_object('match_id', v_match_id, 'conversation_id', v_conv_id, 'job_id', v_job_id)
          );
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'candidate_swipes' THEN
    v_recruiter_id := NEW.recruiter_id;
    v_student_id   := NEW.student_id;
    v_job_id       := NEW.job_id;

    IF NEW.direction = 'left' THEN
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        v_student_id,
        'application_rejected',
        'Application update',
        'A recruiter reviewed your profile but unfortunately you do not meet the criteria for this role.',
        jsonb_build_object('job_id', v_job_id, 'recruiter_id', v_recruiter_id)
      );
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
            'A recruiter wants to interview you. Here''s the Calendly link to book a 30 min session: ' || v_calendly_link,
            FALSE
          );
        END IF;
      END IF;

      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        v_student_id,
        'candidate_shortlisted',
        'Interview request',
        'A recruiter wants to interview you. Here''s the Calendly link to book a 30 min session.',
        jsonb_build_object(
          'match_id', v_match_id,
          'conversation_id', v_conv_id,
          'job_id', v_job_id,
          'calendly_link', v_calendly_link
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_candidate_swipe ON candidate_swipes;
CREATE TRIGGER on_candidate_swipe
  AFTER INSERT OR UPDATE ON candidate_swipes
  FOR EACH ROW EXECUTE FUNCTION check_and_create_match();
