-- Candidate auto-message:
-- When a recruiter swipes RIGHT on a candidate, create a match + conversation immediately
-- and insert an automated system message to kickstart chat.

CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id    UUID;
  v_recruiter_id  UUID;
  v_job_id        UUID;
  v_match_id      UUID;
  v_conv_id       UUID;
BEGIN
  -- Only auto-message on RIGHT swipes.
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

    -- Mutual interest required for job swipe matches (existing behavior).
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
          AND job_id = v_job_id;
      END IF;

      IF v_match_id IS NOT NULL THEN
        INSERT INTO conversations (match_id) VALUES (v_match_id)
        ON CONFLICT (match_id) DO NOTHING;

        SELECT id INTO v_conv_id FROM conversations WHERE match_id = v_match_id;

        -- Notification (kept aligned with existing behavior).
        INSERT INTO notifications (user_id, type, title, body) VALUES
          (v_student_id,   'match', 'New Match! 🎉', 'You matched with a job posting!'),
          (v_recruiter_id, 'match', 'New Match! 🎉', 'A candidate matched with your job!');
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'candidate_swipes' THEN
    v_recruiter_id := NEW.recruiter_id;
    v_student_id   := NEW.student_id;
    v_job_id       := NEW.job_id;

    -- Existing app behavior inserts candidate_swipes with recruiter_id + job_id,
    -- so we can create a match/conversation immediately on recruiter RIGHT.
    INSERT INTO matches (student_id, recruiter_id, job_id, is_shortlisted)
    VALUES (v_student_id, v_recruiter_id, v_job_id, TRUE)
    ON CONFLICT (student_id, recruiter_id, job_id) DO NOTHING
    RETURNING id INTO v_match_id;

    IF v_match_id IS NULL THEN
      SELECT id INTO v_match_id
      FROM matches
      WHERE student_id = v_student_id
        AND recruiter_id = v_recruiter_id
        AND job_id = v_job_id;
    END IF;

    IF v_match_id IS NOT NULL THEN
      INSERT INTO conversations (match_id) VALUES (v_match_id)
      ON CONFLICT (match_id) DO NOTHING;

      SELECT id INTO v_conv_id FROM conversations WHERE match_id = v_match_id;

      -- Insert automated recruiter->candidate message.
      -- Guard against duplicates if trigger fires more than once for the same match.
      IF v_conv_id IS NOT NULL THEN
        IF NOT EXISTS (
          SELECT 1 FROM messages
          WHERE conversation_id = v_conv_id
            AND sender_id = v_recruiter_id
            AND content = 'Recruiter wants to talk more'
        ) THEN
          INSERT INTO messages (conversation_id, sender_id, content)
          VALUES (v_conv_id, v_recruiter_id, 'Recruiter wants to talk more');
        END IF;

        -- Optional: also notify candidate that a recruiter liked them.
        INSERT INTO notifications (user_id, type, title, body)
        VALUES (v_student_id, 'match', 'New Match! 🎉', 'A recruiter liked your profile!');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers already exist; no need to recreate them if they call the same function name.

