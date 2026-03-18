-- Notify recruiter immediately when a student swipes RIGHT on their job (pre-match)
-- and include routing hints in notifications.data.

CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id    UUID;
  v_recruiter_id  UUID;
  v_job_id        UUID;
  v_match_id      UUID;
  v_conv_id       UUID;
BEGIN
  IF NEW.direction != 'right' THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'job_swipes' THEN
    v_student_id := NEW.student_id;
    v_job_id     := NEW.job_id;

    SELECT rp.id INTO v_recruiter_id
    FROM jobs j
    JOIN recruiter_profiles rp ON rp.id = j.recruiter_id
    WHERE j.id = v_job_id;

    -- Pre-match: notify recruiter immediately that this student is interested.
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES
      (
        v_recruiter_id,
        'candidate_interested',
        'Candidate interested',
        'Candidate liked your job.',
        jsonb_build_object('student_id', v_student_id, 'job_id', v_job_id)
      );

    -- Existing mutual-match behavior (only when candidate_swipes right exists)
    IF EXISTS (
      SELECT 1 FROM candidate_swipes
      WHERE recruiter_id = v_recruiter_id
        AND student_id   = v_student_id
        AND job_id       = v_job_id
        AND direction    = 'right'
    ) THEN
      INSERT INTO matches (student_id, recruiter_id, job_id, is_shortlisted)
      VALUES (v_student_id, v_recruiter_id, v_job_id, TRUE)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_match_id;

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
            'You matched with a job posting!',
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

    -- Existing recruiter->candidate automated-message behavior
    INSERT INTO matches (student_id, recruiter_id, job_id, is_shortlisted)
    VALUES (v_student_id, v_recruiter_id, v_job_id, TRUE)
    ON CONFLICT DO NOTHING
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

      IF v_conv_id IS NOT NULL THEN
        IF NOT EXISTS (
          SELECT 1 FROM messages
          WHERE conversation_id = v_conv_id
            AND sender_id = v_recruiter_id
            AND content = 'Recruiter wants to talk more'
        ) THEN
          INSERT INTO messages (conversation_id, sender_id, content, is_read)
          VALUES (v_conv_id, v_recruiter_id, 'Recruiter wants to talk more', FALSE);
        END IF;

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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

