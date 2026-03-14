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
-- ============================================================
-- 002_rls.sql  –  Row Level Security policies
-- ============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_swipes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_swipes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_channels  ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── profiles ──────────────────────────────────────────────
CREATE POLICY "profiles_select_all"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── student_profiles ──────────────────────────────────────
CREATE POLICY "sp_select_all"   ON student_profiles FOR SELECT USING (true);
CREATE POLICY "sp_insert_own"   ON student_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "sp_update_own"   ON student_profiles FOR UPDATE USING (auth.uid() = id);

-- ── recruiter_profiles ────────────────────────────────────
CREATE POLICY "rp_select_all"   ON recruiter_profiles FOR SELECT USING (true);
CREATE POLICY "rp_insert_own"   ON recruiter_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "rp_update_own"   ON recruiter_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "rp_admin_update" ON recruiter_profiles FOR UPDATE USING (auth_user_role() = 'admin');

-- ── jobs ──────────────────────────────────────────────────
CREATE POLICY "jobs_select_active"   ON jobs FOR SELECT USING (is_active = true OR recruiter_id = auth.uid());
CREATE POLICY "jobs_insert_recruiter" ON jobs FOR INSERT
  WITH CHECK (recruiter_id = auth.uid() AND auth_user_role() = 'recruiter');
CREATE POLICY "jobs_update_own"      ON jobs FOR UPDATE USING (recruiter_id = auth.uid());
CREATE POLICY "jobs_delete_own"      ON jobs FOR DELETE USING (recruiter_id = auth.uid());

-- ── job_swipes ────────────────────────────────────────────
CREATE POLICY "js_select_own" ON job_swipes FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "js_insert_own" ON job_swipes FOR INSERT
  WITH CHECK (student_id = auth.uid() AND auth_user_role() = 'student');

-- ── candidate_swipes ──────────────────────────────────────
CREATE POLICY "cs_select_own" ON candidate_swipes FOR SELECT USING (recruiter_id = auth.uid());
CREATE POLICY "cs_insert_own" ON candidate_swipes FOR INSERT
  WITH CHECK (recruiter_id = auth.uid() AND auth_user_role() = 'recruiter');

-- ── matches ───────────────────────────────────────────────
CREATE POLICY "matches_select_party" ON matches FOR SELECT
  USING (student_id = auth.uid() OR recruiter_id = auth.uid() OR auth_user_role() = 'admin');
CREATE POLICY "matches_insert_system" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "matches_update_recruiter" ON matches FOR UPDATE USING (recruiter_id = auth.uid());

-- ── conversations ─────────────────────────────────────────
CREATE POLICY "conv_select_party" ON conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = conversations.match_id
      AND (matches.student_id = auth.uid() OR matches.recruiter_id = auth.uid())
  )
);
CREATE POLICY "conv_insert_system" ON conversations FOR INSERT WITH CHECK (true);

-- ── messages ──────────────────────────────────────────────
CREATE POLICY "msg_select_party" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN matches m ON m.id = c.match_id
    WHERE c.id = messages.conversation_id
      AND (m.student_id = auth.uid() OR m.recruiter_id = auth.uid())
  )
);
CREATE POLICY "msg_insert_party" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN matches m ON m.id = c.match_id
    WHERE c.id = messages.conversation_id
      AND (m.student_id = auth.uid() OR m.recruiter_id = auth.uid())
  )
);
CREATE POLICY "msg_update_own" ON messages FOR UPDATE USING (sender_id = auth.uid());

-- ── community_channels ────────────────────────────────────
CREATE POLICY "cc_select_all"   ON community_channels FOR SELECT USING (true);
CREATE POLICY "cc_insert_admin" ON community_channels FOR INSERT WITH CHECK (auth_user_role() = 'admin');
CREATE POLICY "cc_update_admin" ON community_channels FOR UPDATE USING (auth_user_role() = 'admin');
CREATE POLICY "cc_delete_admin" ON community_channels FOR DELETE USING (auth_user_role() = 'admin');

-- ── channel_members ───────────────────────────────────────
CREATE POLICY "cm_select_all"   ON channel_members FOR SELECT USING (true);
CREATE POLICY "cm_insert_own"   ON channel_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "cm_delete_own"   ON channel_members FOR DELETE USING (user_id = auth.uid());

-- ── channel_messages ──────────────────────────────────────
CREATE POLICY "chmsg_select_member" ON channel_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_id = channel_messages.channel_id AND user_id = auth.uid()
  )
);
CREATE POLICY "chmsg_insert_member" ON channel_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_id = channel_messages.channel_id AND user_id = auth.uid()
  )
);

-- ── notifications ─────────────────────────────────────────
CREATE POLICY "notif_select_own"  ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_update_own"  ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notif_insert_sys"  ON notifications FOR INSERT WITH CHECK (true);
-- ============================================================
-- 003_storage.sql  –  Storage buckets and policies
-- Run this AFTER creating buckets in the Supabase dashboard:
--   1. "avatars"  (public)
--   2. "resumes"  (private)
--   3. "logos"    (public)
-- ============================================================

-- avatars bucket policies
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- avatars: anyone can read, only owner can write
CREATE POLICY "avatars_read_all" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- logos: public read, recruiter write
CREATE POLICY "logos_read_all" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "logos_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "logos_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- resumes: only the student owner can read/write
CREATE POLICY "resumes_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "resumes_read_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "resumes_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
