-- ============================================================
-- 001_schema.sql  –  Core tables, enums, triggers
-- ============================================================

-- Enums
CREATE TYPE user_role   AS ENUM ('student', 'recruiter', 'admin');
CREATE TYPE job_type    AS ENUM ('internship', 'full_time', 'part_time', 'contract');
CREATE TYPE swipe_direction AS ENUM ('right', 'left', 'saved');

-- ── Profiles (mirrors auth.users 1-to-1) ──────────────────
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         user_role NOT NULL DEFAULT 'student',
  full_name    TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Student profiles ──────────────────────────────────────
CREATE TABLE student_profiles (
  id                       UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  university               TEXT,
  degree                   TEXT,
  graduation_year          INTEGER,
  skills                   TEXT[] DEFAULT '{}',
  interests                TEXT[] DEFAULT '{}',
  resume_url               TEXT,
  linkedin_url             TEXT,
  github_url               TEXT,
  portfolio_url            TEXT,
  preferred_job_categories TEXT[] DEFAULT '{}',
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ── Recruiter profiles ────────────────────────────────────
CREATE TABLE recruiter_profiles (
  id           UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  logo_url     TEXT,
  description  TEXT,
  hiring_focus TEXT,
  website_url  TEXT,
  is_approved  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Jobs ──────────────────────────────────────────────────
CREATE TABLE jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id        UUID NOT NULL REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  job_type            job_type NOT NULL,
  required_skills     TEXT[] DEFAULT '{}',
  nice_to_have_skills TEXT[] DEFAULT '{}',
  location            TEXT,
  is_remote           BOOLEAN DEFAULT FALSE,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Job swipes  (student → job) ───────────────────────────
CREATE TABLE job_swipes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  direction  swipe_direction NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, job_id)
);

-- ── Candidate swipes  (recruiter → student) ───────────────
CREATE TABLE candidate_swipes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id       UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  direction    swipe_direction NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (recruiter_id, student_id, job_id)
);

-- ── Matches ───────────────────────────────────────────────
CREATE TABLE matches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id         UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  is_shortlisted BOOLEAN DEFAULT FALSE,
  is_archived    BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, recruiter_id, job_id)
);

-- ── Conversations (one per match) ─────────────────────────
CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   UUID UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Messages ──────────────────────────────────────────────
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Community channels ────────────────────────────────────
CREATE TABLE community_channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  category    TEXT,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Channel members ───────────────────────────────────────
CREATE TABLE channel_members (
  channel_id UUID NOT NULL REFERENCES community_channels(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

-- ── Channel messages ──────────────────────────────────────
CREATE TABLE channel_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES community_channels(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  data       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── updated_at trigger helper ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_recruiter_profiles_updated_at
  BEFORE UPDATE ON recruiter_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Auto-create profile on signup ─────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Match detection trigger ───────────────────────────────
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id   UUID;
  v_recruiter_id UUID;
  v_job_id       UUID;
  v_match_id     UUID;
BEGIN
  IF NEW.direction != 'right' THEN RETURN NEW; END IF;

  IF TG_TABLE_NAME = 'job_swipes' THEN
    v_student_id := NEW.student_id;
    v_job_id     := NEW.job_id;

    SELECT rp.id INTO v_recruiter_id
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
      INSERT INTO matches (student_id, recruiter_id, job_id)
      VALUES (v_student_id, v_recruiter_id, v_job_id)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_match_id;

      IF v_match_id IS NOT NULL THEN
        INSERT INTO conversations (match_id) VALUES (v_match_id);
        INSERT INTO notifications (user_id, type, title, body) VALUES
          (v_student_id,   'match', 'New Match! 🎉', 'You matched with a job posting!'),
          (v_recruiter_id, 'match', 'New Match! 🎉', 'A candidate matched with your job!');
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'candidate_swipes' THEN
    v_recruiter_id := NEW.recruiter_id;
    v_student_id   := NEW.student_id;
    v_job_id       := NEW.job_id;

    IF EXISTS (
      SELECT 1 FROM job_swipes
      WHERE student_id = v_student_id
        AND job_id     = v_job_id
        AND direction  = 'right'
    ) THEN
      INSERT INTO matches (student_id, recruiter_id, job_id)
      VALUES (v_student_id, v_recruiter_id, v_job_id)
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_match_id;

      IF v_match_id IS NOT NULL THEN
        INSERT INTO conversations (match_id) VALUES (v_match_id);
        INSERT INTO notifications (user_id, type, title, body) VALUES
          (v_student_id,   'match', 'New Match! 🎉', 'A recruiter liked your profile!'),
          (v_recruiter_id, 'match', 'New Match! 🎉', 'A candidate matched with your job!');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_job_swipe
  AFTER INSERT ON job_swipes
  FOR EACH ROW EXECUTE FUNCTION check_and_create_match();

CREATE TRIGGER on_candidate_swipe
  AFTER INSERT ON candidate_swipes
  FOR EACH ROW EXECUTE FUNCTION check_and_create_match();

-- ── Seed default community channels ──────────────────────
INSERT INTO community_channels (name, description, category) VALUES
  ('general',          'General discussion for everyone',              'general'),
  ('tech-jobs',        'Tech industry job opportunities and tips',     'tech'),
  ('internships',      'Internship opportunities and experiences',     'career'),
  ('resume-tips',      'Share and get resume feedback',                'career'),
  ('interview-prep',   'Interview tips and practice',                  'career'),
  ('networking',       'Connect with peers and professionals',         'networking');
