-- Seed demo accounts, profiles, jobs, matches, chat, feed, and community.
-- Safe to re-run. Paste in the Supabase SQL editor after migrations.
--
-- Demo password for every @jobmatch.demo account:  JobMatch!demo
-- Students:  ayesha.khan@  hassan.malik@  zara.ahmed@  bilal.raza@
--            fatima.noor@  omar.siddiqui@  hira.sheikh@  yusuf.ali@
-- Recruiters: nadia.rehman@  imran.qureshi@  sara.patel@  daniel.park@

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_currency TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS compensation_note TEXT;
ALTER TABLE recruiter_profiles ADD COLUMN IF NOT EXISTS employee_count TEXT;
ALTER TABLE recruiter_profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_video_url TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'chatting';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;
UPDATE matches SET pipeline_status = 'chatting' WHERE pipeline_status IS NULL;

DO $$
BEGIN
  IF to_regclass('public.feed_posts') IS NULL THEN
    RETURN;
  END IF;
  ALTER TABLE feed_post_likes ADD COLUMN IF NOT EXISTS reaction TEXT NOT NULL DEFAULT 'like';
  ALTER TABLE feed_post_likes DROP CONSTRAINT IF EXISTS feed_post_likes_reaction_check;
  ALTER TABLE feed_post_likes
    ADD CONSTRAINT feed_post_likes_reaction_check
    CHECK (reaction IN ('like', 'celebrate', 'support', 'love', 'insightful', 'funny'));
  ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS shared_post_id UUID REFERENCES feed_posts(id) ON DELETE SET NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS feed_posts_author_share_unique
    ON feed_posts (author_id, shared_post_id)
    WHERE shared_post_id IS NOT NULL;
  ALTER TABLE feed_posts DROP CONSTRAINT IF EXISTS feed_posts_body_len;
  ALTER TABLE feed_posts
    ADD CONSTRAINT feed_posts_body_len CHECK (
      char_length(body) <= 3000
      AND (
        char_length(trim(body)) >= 1
        OR image_url IS NOT NULL
        OR shared_post_id IS NOT NULL
      )
    );
  EXECUTE 'DROP POLICY IF EXISTS "feed_likes_update_own" ON feed_post_likes';
  EXECUTE $p$
    CREATE POLICY "feed_likes_update_own" ON feed_post_likes FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())
  $p$;
  ALTER TABLE feed_post_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  EXECUTE 'DROP POLICY IF EXISTS "feed_comments_update_own" ON feed_post_comments';
  EXECUTE $p$
    CREATE POLICY "feed_comments_update_own" ON feed_post_comments FOR UPDATE
      TO authenticated
      USING (author_id = auth.uid())
      WITH CHECK (author_id = auth.uid())
  $p$;
  ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS media_type TEXT;
  ALTER TABLE feed_posts DROP CONSTRAINT IF EXISTS feed_posts_media_type_check;
  ALTER TABLE feed_posts
    ADD CONSTRAINT feed_posts_media_type_check
    CHECK (media_type IS NULL OR media_type IN ('image', 'video'));
  UPDATE feed_posts
  SET media_type = 'video'
  WHERE image_url IS NOT NULL
    AND media_type IS NULL
    AND image_url ~* '\.(mp4|mov|webm|m4v)(\?|$)';
  UPDATE feed_posts
  SET media_type = 'image'
  WHERE image_url IS NOT NULL
    AND media_type IS NULL;
  UPDATE storage.buckets SET file_size_limit = 52428800 WHERE id = 'feed-media';
END $$;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'voice', 'image', 'file', 'video', 'audio'));

-- Some projects have a trigger that writes here. Create it if missing so seed can run.
CREATE TABLE IF NOT EXISTS recommendations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id       UUID REFERENCES jobs(id) ON DELETE CASCADE,
  score        DOUBLE PRECISION,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
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

CREATE TABLE IF NOT EXISTS product_feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT,
  liked      TEXT,
  disliked   TEXT,
  improve    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE product_feedback ENABLE ROW LEVEL SECURITY;

-- ── Helper: create a confirmed auth user + profile ─────────
CREATE OR REPLACE FUNCTION public.seed_auth_user(
  p_id uuid,
  p_email text,
  p_name text,
  p_role text,
  p_password text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = p_id OR email = p_email) THEN
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (p_id, p_role::user_role, p_name)
    ON CONFLICT (id) DO UPDATE
      SET role = EXCLUDED.role,
          full_name = COALESCE(NULLIF(btrim(profiles.full_name), ''), EXCLUDED.full_name);
    RETURN;
  END IF;

  BEGIN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      p_id,
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', p_name, 'role', p_role),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      p_id,
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', p_name, 'role', p_role),
      now(),
      now()
    );
  END;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (p_id, p_role::user_role, p_name)
  ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        full_name = COALESCE(NULLIF(btrim(profiles.full_name), ''), EXCLUDED.full_name);

  BEGIN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
    ) VALUES (
      gen_random_uuid(),
      p_id,
      jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
      'email',
      now(),
      now(),
      now(),
      p_id::text
    );
  EXCEPTION WHEN unique_violation THEN
    NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'auth.identities skipped for %: %', p_email, SQLERRM;
  END;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create auth user %: %', p_email, SQLERRM;
END;
$$;

-- ── Demo students ─────────────────────────────────────────
SELECT public.seed_auth_user('d1d1d1d1-0001-4000-8000-000000000001', 'ayesha.khan@jobmatch.demo',   'Ayesha Khan',    'student',   'JobMatch!demo');
SELECT public.seed_auth_user('d1d1d1d1-0002-4000-8000-000000000002', 'hassan.malik@jobmatch.demo',  'Hassan Malik',   'student',   'JobMatch!demo');
SELECT public.seed_auth_user('d1d1d1d1-0003-4000-8000-000000000003', 'zara.ahmed@jobmatch.demo',    'Zara Ahmed',     'student',   'JobMatch!demo');
SELECT public.seed_auth_user('d1d1d1d1-0004-4000-8000-000000000004', 'bilal.raza@jobmatch.demo',    'Bilal Raza',     'student',   'JobMatch!demo');
SELECT public.seed_auth_user('d1d1d1d1-0005-4000-8000-000000000005', 'fatima.noor@jobmatch.demo',   'Fatima Noor',    'student',   'JobMatch!demo');
SELECT public.seed_auth_user('d1d1d1d1-0006-4000-8000-000000000006', 'omar.siddiqui@jobmatch.demo', 'Omar Siddiqui',  'student',   'JobMatch!demo');
SELECT public.seed_auth_user('d1d1d1d1-0007-4000-8000-000000000007', 'hira.sheikh@jobmatch.demo',   'Hira Sheikh',    'student',   'JobMatch!demo');
SELECT public.seed_auth_user('d1d1d1d1-0008-4000-8000-000000000008', 'yusuf.ali@jobmatch.demo',     'Yusuf Ali',      'student',   'JobMatch!demo');

-- ── Demo recruiters ───────────────────────────────────────
SELECT public.seed_auth_user('e1e1e1e1-0001-4000-8000-000000000001', 'nadia.rehman@jobmatch.demo',  'Nadia Rehman',   'recruiter', 'JobMatch!demo');
SELECT public.seed_auth_user('e1e1e1e1-0002-4000-8000-000000000002', 'imran.qureshi@jobmatch.demo', 'Imran Qureshi',  'recruiter', 'JobMatch!demo');
SELECT public.seed_auth_user('e1e1e1e1-0003-4000-8000-000000000003', 'sara.patel@jobmatch.demo',    'Sara Patel',     'recruiter', 'JobMatch!demo');
SELECT public.seed_auth_user('e1e1e1e1-0004-4000-8000-000000000004', 'daniel.park@jobmatch.demo',   'Daniel Park',    'recruiter', 'JobMatch!demo');

-- ── Profile photos + bios for demo users ──────────────────
UPDATE profiles SET
  avatar_url = v.avatar_url,
  bio = v.bio
FROM (VALUES
  ('d1d1d1d1-0001-4000-8000-000000000001'::uuid, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', 'CS at LUMS. Looking for a backend or full-stack internship. Built two campus products with TypeScript and Postgres.'),
  ('d1d1d1d1-0002-4000-8000-000000000002'::uuid, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80', 'Software engineering at NUST. Comfortable with React, Python, and shipping small features weekly.'),
  ('d1d1d1d1-0003-4000-8000-000000000003'::uuid, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', 'Data science at IBA. SQL, Python, and a bias for clear charts over dashboards nobody opens.'),
  ('d1d1d1d1-0004-4000-8000-000000000004'::uuid, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', 'FAST-NU CS. Systems, APIs, and internships that involve real code review — not slide decks.'),
  ('d1d1d1d1-0005-4000-8000-000000000005'::uuid, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80', 'UET Lahore, electrical with a software minor. Interested in embedded-adjacent product teams.'),
  ('d1d1d1d1-0006-4000-8000-000000000006'::uuid, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80', 'GIKI, AI track. Fine-tuning is a hobby; production evals are the job I want.'),
  ('d1d1d1d1-0007-4000-8000-000000000007'::uuid, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', 'NCA communication design. Portfolios over adjectives. Looking for a UX intern seat.'),
  ('d1d1d1d1-0008-4000-8000-000000000008'::uuid, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80', 'LUMS economics. Product-minded. Happy in analyst or APM roles that still touch the customer.'),
  ('e1e1e1e1-0001-4000-8000-000000000001'::uuid, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80', 'University hiring at Systems Limited. Interns who can ship a ticket this month, not next semester.'),
  ('e1e1e1e1-0002-4000-8000-000000000002'::uuid, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80', 'Campus recruiting for Careem product and ops. We read profiles before we swipe.'),
  ('e1e1e1e1-0003-4000-8000-000000000003'::uuid, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80', 'Folio3 engineering hiring. New grads who can explain a system they actually built.'),
  ('e1e1e1e1-0004-4000-8000-000000000004'::uuid, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80', 'Design hiring at Motive. Critique a job card, do not just restyle it.')
) AS v(id, avatar_url, bio)
WHERE profiles.id = v.id;

-- ── Student profile rows ──────────────────────────────────
INSERT INTO student_profiles (
  id, university, degree, graduation_year, skills, interests,
  linkedin_url, github_url, portfolio_url, preferred_job_categories
)
SELECT v.id, v.university, v.degree, v.graduation_year, v.skills, v.interests,
       v.linkedin_url, v.github_url, v.portfolio_url, v.preferred_job_categories
FROM (VALUES
  (
    'd1d1d1d1-0001-4000-8000-000000000001'::uuid,
    'LUMS', 'Computer Science', 2027,
    ARRAY['TypeScript', 'React', 'PostgreSQL', 'Node.js'],
    ARRAY['Startups', 'Open source'],
    'https://linkedin.com/in/ayesha-khan-demo',
    'https://github.com/ayesha-khan-demo',
    NULL,
    ARRAY['Software Engineering']
  ),
  (
    'd1d1d1d1-0002-4000-8000-000000000002',
    'NUST', 'Software Engineering', 2026,
    ARRAY['JavaScript', 'React', 'Python', 'Git'],
    ARRAY['Mobile', 'Hackathons'],
    'https://linkedin.com/in/hassan-malik-demo',
    'https://github.com/hassan-malik-demo',
    NULL,
    ARRAY['Software Engineering']
  ),
  (
    'd1d1d1d1-0003-4000-8000-000000000003',
    'IBA Karachi', 'Data Science', 2027,
    ARRAY['SQL', 'Python', 'Excel', 'Statistics'],
    ARRAY['Analytics', 'Fintech'],
    'https://linkedin.com/in/zara-ahmed-demo',
    'https://github.com/zara-ahmed-demo',
    NULL,
    ARRAY['Data Science', 'Product Management']
  ),
  (
    'd1d1d1d1-0004-4000-8000-000000000004',
    'FAST-NU', 'Computer Science', 2026,
    ARRAY['Go', 'SQL', 'Docker', 'Linux'],
    ARRAY['Infrastructure', 'APIs'],
    'https://linkedin.com/in/bilal-raza-demo',
    'https://github.com/bilal-raza-demo',
    NULL,
    ARRAY['Software Engineering']
  ),
  (
    'd1d1d1d1-0005-4000-8000-000000000005',
    'UET Lahore', 'Electrical Engineering', 2028,
    ARRAY['C++', 'Python', 'MATLAB'],
    ARRAY['Hardware', 'IoT'],
    'https://linkedin.com/in/fatima-noor-demo',
    NULL,
    NULL,
    ARRAY['Software Engineering', 'Operations']
  ),
  (
    'd1d1d1d1-0006-4000-8000-000000000006',
    'GIKI', 'Artificial Intelligence', 2027,
    ARRAY['Python', 'PyTorch', 'SQL'],
    ARRAY['ML', 'Research'],
    'https://linkedin.com/in/omar-siddiqui-demo',
    'https://github.com/omar-siddiqui-demo',
    NULL,
    ARRAY['Data Science', 'Software Engineering']
  ),
  (
    'd1d1d1d1-0007-4000-8000-000000000007',
    'NCA', 'Communication Design', 2026,
    ARRAY['Figma', 'User research', 'Prototyping'],
    ARRAY['UX', 'Brand'],
    'https://linkedin.com/in/hira-sheikh-demo',
    NULL,
    'https://behance.net/hira-sheikh-demo',
    ARRAY['Design', 'Product Management']
  ),
  (
    'd1d1d1d1-0008-4000-8000-000000000008',
    'LUMS', 'Economics', 2027,
    ARRAY['Excel', 'SQL', 'Product sense'],
    ARRAY['Marketplaces', 'Writing'],
    'https://linkedin.com/in/yusuf-ali-demo',
    NULL,
    NULL,
    ARRAY['Product Management', 'Finance']
  )
) AS v(id, university, degree, graduation_year, skills, interests, linkedin_url, github_url, portfolio_url, preferred_job_categories)
JOIN profiles p ON p.id = v.id
ON CONFLICT (id) DO UPDATE SET
  university = EXCLUDED.university,
  degree = EXCLUDED.degree,
  graduation_year = EXCLUDED.graduation_year,
  skills = EXCLUDED.skills,
  interests = EXCLUDED.interests,
  linkedin_url = EXCLUDED.linkedin_url,
  github_url = EXCLUDED.github_url,
  portfolio_url = EXCLUDED.portfolio_url,
  preferred_job_categories = EXCLUDED.preferred_job_categories;

-- Any other student with no student_profiles row
INSERT INTO student_profiles (id, university, degree, graduation_year, skills, interests, preferred_job_categories)
SELECT p.id, 'LUMS', 'Computer Science', 2027,
  ARRAY['Python', 'SQL', 'Communication'],
  ARRAY['Internships'],
  ARRAY['Software Engineering']
FROM profiles p
WHERE p.role = 'student'
  AND NOT EXISTS (SELECT 1 FROM student_profiles s WHERE s.id = p.id);

UPDATE student_profiles SET
  university = COALESCE(NULLIF(btrim(university), ''), 'LUMS'),
  degree = COALESCE(NULLIF(btrim(degree), ''), 'Computer Science'),
  graduation_year = COALESCE(graduation_year, 2027),
  skills = CASE WHEN skills IS NULL OR cardinality(skills) = 0 THEN ARRAY['Python', 'SQL', 'Communication'] ELSE skills END,
  preferred_job_categories = CASE
    WHEN preferred_job_categories IS NULL OR cardinality(preferred_job_categories) = 0
    THEN ARRAY['Software Engineering']
    ELSE preferred_job_categories
  END
WHERE id NOT IN (
  'd1d1d1d1-0001-4000-8000-000000000001',
  'd1d1d1d1-0002-4000-8000-000000000002',
  'd1d1d1d1-0003-4000-8000-000000000003',
  'd1d1d1d1-0004-4000-8000-000000000004',
  'd1d1d1d1-0005-4000-8000-000000000005',
  'd1d1d1d1-0006-4000-8000-000000000006',
  'd1d1d1d1-0007-4000-8000-000000000007',
  'd1d1d1d1-0008-4000-8000-000000000008'
);

-- Empty avatars / bios on leftover accounts
UPDATE profiles
SET avatar_url = 'https://api.dicebear.com/9.x/initials/png?seed=' || replace(coalesce(full_name, id::text), ' ', '')
WHERE avatar_url IS NULL OR btrim(avatar_url) = '';

UPDATE profiles
SET bio = CASE role
  WHEN 'student' THEN 'Student looking for internships and new-grad roles.'
  WHEN 'recruiter' THEN 'Hiring interns and new grads on campus.'
  ELSE bio
END
WHERE bio IS NULL OR btrim(bio) = '';

-- ── Recruiter / company profiles ──────────────────────────
INSERT INTO recruiter_profiles (
  id, company_name, logo_url, description, hiring_focus, website_url,
  is_approved, employee_count, industry
)
SELECT v.*
FROM (VALUES
  (
    'e1e1e1e1-0001-4000-8000-000000000001'::uuid,
    'Systems Limited',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    'Product and engineering teams shipping software for enterprises and campuses across Pakistan.',
    'SWE interns and new-grad engineers who can take a ticket from spec to review.',
    'https://www.systemsltd.com',
    true, '1000+', 'Software and ITES'
  ),
  (
    'e1e1e1e1-0002-4000-8000-000000000002',
    'Careem',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    'Super app hiring product, ops, and data talent from campus.',
    'Product analysts and intern PMs who are specific about city and salary range.',
    'https://www.careem.com',
    true, '1000+', 'E-commerce'
  ),
  (
    'e1e1e1e1-0003-4000-8000-000000000003',
    'Folio3',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    'Software studio. We hire people who can explain a system they actually built.',
    'Full-stack and data engineering internships.',
    'https://www.folio3.com',
    true, '201-500', 'Technology / IT'
  ),
  (
    'e1e1e1e1-0004-4000-8000-000000000004',
    'Motive',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
    'Design and product in fleet and operations software.',
    'UX interns who critique flows, not only visuals.',
    'https://www.gomotive.com',
    true, '1000+', 'Technology / IT'
  )
) AS v(id, company_name, logo_url, description, hiring_focus, website_url, is_approved, employee_count, industry)
JOIN profiles p ON p.id = v.id
ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  logo_url = EXCLUDED.logo_url,
  description = EXCLUDED.description,
  hiring_focus = EXCLUDED.hiring_focus,
  website_url = EXCLUDED.website_url,
  is_approved = true,
  employee_count = EXCLUDED.employee_count,
  industry = EXCLUDED.industry;

INSERT INTO recruiter_profiles (id, company_name, description, hiring_focus, is_approved, industry, employee_count)
SELECT
  p.id,
  COALESCE(NULLIF(btrim(p.full_name), ''), 'Campus') || ' Hiring',
  'Campus hiring team.',
  'Interns and new grads.',
  true,
  'Technology / IT',
  '51-200'
FROM profiles p
WHERE p.role = 'recruiter'
  AND NOT EXISTS (SELECT 1 FROM recruiter_profiles r WHERE r.id = p.id);

UPDATE recruiter_profiles rp
SET is_approved = true
WHERE is_approved IS DISTINCT FROM true
  AND (
    rp.id IN (
      'e1e1e1e1-0001-4000-8000-000000000001',
      'e1e1e1e1-0002-4000-8000-000000000002',
      'e1e1e1e1-0003-4000-8000-000000000003',
      'e1e1e1e1-0004-4000-8000-000000000004'
    )
    OR EXISTS (SELECT 1 FROM jobs j WHERE j.recruiter_id = rp.id)
  );

-- ── Community channels ────────────────────────────────────
INSERT INTO community_channels (name, description, category)
VALUES
  ('introductions', 'New here? Say hi and share what you are looking for.', 'general'),
  ('career-advice', 'Interviews, resumes, and offer decisions.', 'career'),
  ('internships', 'Summer internships, winter attachments, and return offers.', 'career'),
  ('software-engineering', 'Systems, web, mobile, and intern-to-full-time SWE talk.', 'tech'),
  ('data-science', 'Analytics, ML, and research roles.', 'data'),
  ('product-design', 'UX, product, and portfolio reviews.', 'design'),
  ('startups', 'Early-stage teams hiring on campus.', 'startup'),
  ('lahore-jobs', 'Roles and events in Lahore.', 'general')
ON CONFLICT (name) DO NOTHING;

-- ── Jobs for demo recruiters ──────────────────────────────
INSERT INTO jobs (
  id, recruiter_id, title, description, job_type, required_skills, nice_to_have_skills,
  location, category, is_remote, is_active, salary_min, salary_max, salary_currency, compensation_note
)
SELECT
  v.id, v.recruiter_id, v.title, v.description, v.job_type::job_type, v.required_skills, v.nice_to_have_skills,
  v.location, v.category, v.is_remote, true, v.salary_min, v.salary_max, v.salary_currency, v.compensation_note
FROM (VALUES
  (
    'f1f1f1f1-0001-4000-8000-000000000001'::uuid,
    'e1e1e1e1-0001-4000-8000-000000000001'::uuid,
    'Software Engineering Intern',
    'Ship web features with a product squad. Weekly tickets, design reviews, and a mentor who still writes code.',
    'internship',
    ARRAY['JavaScript', 'React', 'Git'],
    ARRAY['TypeScript', 'SQL'],
    'Lahore', 'Software Engineering', false, true, 40000, 70000, 'PKR', 'Monthly stipend'
  ),
  (
    'f1f1f1f1-0002-4000-8000-000000000002',
    'e1e1e1e1-0001-4000-8000-000000000001',
    'Backend Engineer (New Grad)',
    'Own APIs used by hiring teams. Postgres, reviews, and on-call that is actually documented.',
    'full_time',
    ARRAY['TypeScript', 'PostgreSQL', 'Node.js'],
    ARRAY['Go', 'Docker'],
    'Lahore', 'Software Engineering', false, true, 140000, 190000, 'PKR', 'Plus health cover'
  ),
  (
    'f1f1f1f1-0003-4000-8000-000000000003',
    'e1e1e1e1-0002-4000-8000-000000000002',
    'Product Analyst (New Grad)',
    'Own funnels for Discover and applications. Turn swipe data into recommendations for campus hiring.',
    'full_time',
    ARRAY['SQL', 'Excel', 'Python'],
    ARRAY['Looker', 'Statistics'],
    'Karachi', 'Data Science', false, true, 120000, 180000, 'PKR', 'Plus health cover'
  ),
  (
    'f1f1f1f1-0004-4000-8000-000000000004',
    'e1e1e1e1-0002-4000-8000-000000000002',
    'Associate Product Manager Intern',
    'Write specs for one campus flow. Sit with ops, then ship with engineering.',
    'internship',
    ARRAY['Product sense', 'Communication'],
    ARRAY['SQL', 'Figma'],
    'Dubai', 'Product Management', true, true, 50000, 80000, 'PKR', 'Remote-friendly'
  ),
  (
    'f1f1f1f1-0005-4000-8000-000000000005',
    'e1e1e1e1-0003-4000-8000-000000000003',
    'Full-Stack Intern',
    'React + API work on client projects. You will present a demo every other Friday.',
    'internship',
    ARRAY['JavaScript', 'React', 'SQL'],
    ARRAY['TypeScript', 'AWS'],
    'Karachi', 'Software Engineering', false, true, 35000, 60000, 'PKR', 'Monthly stipend'
  ),
  (
    'f1f1f1f1-0006-4000-8000-000000000006',
    'e1e1e1e1-0003-4000-8000-000000000003',
    'Data Engineer Intern',
    'Pipelines, not slide decks. Python, SQL, and a warehouse that analysts actually query.',
    'internship',
    ARRAY['Python', 'SQL'],
    ARRAY['dbt', 'Airflow'],
    'Lahore', 'Data Science', true, true, 40000, 65000, 'PKR', 'Remote across Pakistan'
  ),
  (
    'f1f1f1f1-0007-4000-8000-000000000007',
    'e1e1e1e1-0004-4000-8000-000000000004',
    'Remote UX Intern',
    'Help redesign job cards and the candidate profile. Portfolio of 2–3 case studies preferred.',
    'internship',
    ARRAY['Figma', 'User research'],
    ARRAY['HTML', 'CSS'],
    NULL, 'Design', true, true, 35000, 55000, 'PKR', 'Remote across Pakistan'
  ),
  (
    'f1f1f1f1-0008-4000-8000-000000000008',
    'e1e1e1e1-0004-4000-8000-000000000004',
    'Product Designer (New Grad)',
    'Own one hiring surface end to end. Critique over decoration.',
    'full_time',
    ARRAY['Figma', 'Prototyping', 'User research'],
    ARRAY['Design systems'],
    'Islamabad', 'Design', false, true, 130000, 170000, 'PKR', 'Plus equipment stipend'
  )
) AS v(id, recruiter_id, title, description, job_type, required_skills, nice_to_have_skills, location, category, is_remote, is_active, salary_min, salary_max, salary_currency, compensation_note)
JOIN recruiter_profiles rp ON rp.id = v.recruiter_id
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  required_skills = EXCLUDED.required_skills,
  nice_to_have_skills = EXCLUDED.nice_to_have_skills,
  location = EXCLUDED.location,
  category = EXCLUDED.category,
  is_remote = EXCLUDED.is_remote,
  is_active = true,
  salary_min = EXCLUDED.salary_min,
  salary_max = EXCLUDED.salary_max,
  salary_currency = EXCLUDED.salary_currency,
  compensation_note = EXCLUDED.compensation_note;

-- Jobs for any other existing recruiters (up to 3)
WITH recruiters AS (
  SELECT id FROM recruiter_profiles
  WHERE id NOT IN (
    'e1e1e1e1-0001-4000-8000-000000000001',
    'e1e1e1e1-0002-4000-8000-000000000002',
    'e1e1e1e1-0003-4000-8000-000000000003',
    'e1e1e1e1-0004-4000-8000-000000000004'
  )
  ORDER BY created_at
  LIMIT 3
),
numbered AS (
  SELECT id, row_number() OVER () AS n FROM recruiters
)
INSERT INTO jobs (
  id, recruiter_id, title, description, job_type, required_skills, nice_to_have_skills,
  location, category, is_remote, is_active, salary_min, salary_max, salary_currency, compensation_note
)
SELECT
  seed.id, n.id, seed.title, seed.description, seed.job_type::job_type,
  seed.required_skills, seed.nice_to_have_skills, seed.location, seed.category,
  seed.is_remote, true, seed.salary_min, seed.salary_max, 'PKR', seed.compensation_note
FROM numbered n
JOIN (
  VALUES
    (1, 'a1a1a1a1-0001-4000-8000-000000000001'::uuid, 'Software Engineering Intern', 'Work with a product squad on web features. Weekly tickets and a named mentor.', 'internship', ARRAY['JavaScript', 'React', 'Git'], ARRAY['TypeScript', 'SQL'], 'Lahore', 'Software Engineering', false, 40000, 70000, 'Monthly stipend'),
    (2, 'a1a1a1a1-0002-4000-8000-000000000002'::uuid, 'Product Analyst (New Grad)', 'Own funnels for Discover and applications.', 'full_time', ARRAY['SQL', 'Excel', 'Python'], ARRAY['Looker', 'Statistics'], 'Karachi', 'Data Science', false, 120000, 180000, 'Plus health cover'),
    (3, 'a1a1a1a1-0003-4000-8000-000000000003'::uuid, 'Marketing Intern', 'Campus campaigns and a weekly report that leadership actually reads.', 'internship', ARRAY['Writing', 'Canva'], ARRAY['Analytics'], 'Lahore', 'Marketing', false, 25000, 40000, 'Monthly stipend')
) AS seed(n, id, title, description, job_type, required_skills, nice_to_have_skills, location, category, is_remote, salary_min, salary_max, compensation_note)
  ON n.n = seed.n
ON CONFLICT (id) DO NOTHING;

-- ── 1000 extra jobs across every recruiter ────────────────
DO $$ BEGIN ALTER TABLE jobs DISABLE TRIGGER USER; EXCEPTION WHEN OTHERS THEN NULL; END $$;
INSERT INTO jobs (
  id, recruiter_id, title, description, job_type, required_skills, nice_to_have_skills,
  location, category, is_remote, is_active, salary_min, salary_max, salary_currency, compensation_note, created_at
)
SELECT
  ('a1000000-0000-4000-8000-' || lpad(to_hex(g.n), 12, '0'))::uuid,
  r.id,
  t.title || ' - ' || t.city || ' ' || g.n,
  t.blurb || ' Seat ' || g.n || '. Mutual match required before chat.',
  t.job_type::job_type,
  t.required_skills,
  t.nice_to_have,
  CASE WHEN t.is_remote THEN NULL ELSE t.city END,
  t.category,
  t.is_remote,
  true,
  t.pay_min,
  t.pay_max,
  'PKR',
  t.pay_note,
  now() - (g.n || ' minutes')::interval
FROM generate_series(1, 1000) AS g(n)
JOIN (
  SELECT id, (row_number() OVER (ORDER BY created_at, id) - 1) AS idx,
         count(*) OVER () AS nrec
  FROM recruiter_profiles
) r ON r.nrec > 0 AND r.idx = ((g.n - 1) % r.nrec)
JOIN (
  VALUES
    (0,  'Software Engineering Intern', 'internship', 'Software Engineering', 'Lahore', false, ARRAY['JavaScript', 'React', 'Git']::text[], ARRAY['TypeScript', 'SQL']::text[], 40000, 70000, 'Monthly stipend', 'Ship small web tickets with a named mentor.'),
    (1,  'Backend Engineer (New Grad)', 'full_time', 'Software Engineering', 'Lahore', false, ARRAY['TypeScript', 'PostgreSQL', 'Node.js'], ARRAY['Go', 'Docker'], 140000, 190000, 'Plus health cover', 'Own APIs used by hiring teams. Reviews are required.'),
    (2,  'Product Analyst (New Grad)', 'full_time', 'Data Science', 'Karachi', false, ARRAY['SQL', 'Excel', 'Python'], ARRAY['Looker', 'Statistics'], 120000, 180000, 'Plus health cover', 'Turn Discover and application funnels into product notes.'),
    (3,  'Associate Product Manager Intern', 'internship', 'Product Management', 'Islamabad', true, ARRAY['Product sense', 'Communication'], ARRAY['SQL', 'Figma'], 50000, 80000, 'Remote-friendly', 'Write one campus-flow spec and sit with ops and engineering.'),
    (4,  'Full-Stack Intern', 'internship', 'Software Engineering', 'Karachi', false, ARRAY['JavaScript', 'React', 'SQL'], ARRAY['TypeScript', 'AWS'], 35000, 60000, 'Monthly stipend', 'React plus API work. Demo every other Friday.'),
    (5,  'Data Engineer Intern', 'internship', 'Data Science', 'Lahore', true, ARRAY['Python', 'SQL'], ARRAY['dbt', 'Airflow'], 40000, 65000, 'Remote across Pakistan', 'Pipelines that analysts actually query.'),
    (6,  'Remote UX Intern', 'internship', 'Design', 'Islamabad', true, ARRAY['Figma', 'User research'], ARRAY['HTML', 'CSS'], 35000, 55000, 'Remote across Pakistan', 'Critique job cards and candidate profiles, not only visuals.'),
    (7,  'Product Designer (New Grad)', 'full_time', 'Design', 'Islamabad', false, ARRAY['Figma', 'Prototyping', 'User research'], ARRAY['Design systems'], 130000, 170000, 'Plus equipment stipend', 'Own one hiring surface end to end.'),
    (8,  'Marketing Intern', 'internship', 'Marketing', 'Lahore', false, ARRAY['Writing', 'Canva'], ARRAY['Analytics'], 25000, 40000, 'Monthly stipend', 'Campus campaigns and a weekly report leadership reads.'),
    (9,  'Finance Analyst Intern', 'internship', 'Finance', 'Karachi', false, ARRAY['Excel', 'Accounting'], ARRAY['SQL'], 30000, 50000, 'Monthly stipend', 'Close a campus P&L pack and flag variance.'),
    (10, 'Operations Coordinator', 'full_time', 'Operations', 'Faisalabad', false, ARRAY['Excel', 'Communication'], ARRAY['SQL'], 90000, 130000, 'Plus transport', 'Keep a campus hiring sprint on the calendar.'),
    (11, 'Sales Development Intern', 'internship', 'Sales', 'Lahore', false, ARRAY['Communication', 'CRM'], ARRAY['Excel'], 28000, 45000, 'Plus commission', 'Outbound to university career offices.'),
    (12, 'People Operations Intern', 'internship', 'HR', 'Islamabad', false, ARRAY['Communication', 'Excel'], ARRAY['HRIS'], 25000, 40000, 'Monthly stipend', 'Campus interview logistics and offer letters.'),
    (13, 'Consulting Analyst (New Grad)', 'full_time', 'Consulting', 'Karachi', false, ARRAY['Excel', 'PowerPoint'], ARRAY['SQL'], 110000, 160000, 'Plus travel', 'Staffed on a 6-week campus hiring diagnostic.'),
    (14, 'Mobile Engineer Intern', 'internship', 'Software Engineering', 'Lahore', false, ARRAY['React Native', 'TypeScript'], ARRAY['Swift'], 40000, 70000, 'Monthly stipend', 'Ship one student-facing screen per sprint.'),
    (15, 'ML Intern', 'internship', 'Data Science', 'Peshawar', true, ARRAY['Python', 'PyTorch'], ARRAY['SQL'], 45000, 75000, 'Remote-friendly', 'Eval a ranking model. Production beats a notebook.'),
    (16, 'Growth Intern', 'internship', 'Marketing', 'Karachi', true, ARRAY['Analytics', 'Copywriting'], ARRAY['SQL'], 30000, 50000, 'Remote across Pakistan', 'Run one campus acquisition experiment per week.'),
    (17, 'Part-time Support Engineer', 'part_time', 'Software Engineering', 'Lahore', true, ARRAY['SQL', 'Communication'], ARRAY['TypeScript'], 35000, 55000, 'Hourly plus stipend', 'Triage recruiter-reported bugs two evenings a week.'),
    (18, 'Contract Data Analyst', 'contract', 'Data Science', 'Islamabad', true, ARRAY['SQL', 'Python', 'Excel'], ARRAY['Looker'], 80000, 120000, '3-month contract', 'A Discover funnel pack recruiters will actually open.'),
    (19, 'Frontend Engineer (New Grad)', 'full_time', 'Software Engineering', 'Karachi', false, ARRAY['TypeScript', 'React', 'CSS'], ARRAY['Next.js'], 135000, 185000, 'Plus health cover', 'Job cards, filters, and accessibility, not just restyles.')
) AS t(ord, title, job_type, category, city, is_remote, required_skills, nice_to_have, pay_min, pay_max, pay_note, blurb)
  ON t.ord = ((g.n - 1) % 20)
ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN ALTER TABLE jobs ENABLE TRIGGER USER; EXCEPTION WHEN OTHERS THEN NULL; END $$;

UPDATE recruiter_profiles
SET is_approved = true
WHERE is_approved IS DISTINCT FROM true
  AND id IN (SELECT DISTINCT recruiter_id FROM jobs);
INSERT INTO job_swipes (student_id, job_id, direction)
SELECT v.student_id, v.job_id, v.direction::swipe_direction
FROM (VALUES
  ('d1d1d1d1-0001-4000-8000-000000000001'::uuid, 'f1f1f1f1-0001-4000-8000-000000000001'::uuid, 'right'),
  ('d1d1d1d1-0001-4000-8000-000000000001'::uuid, 'f1f1f1f1-0003-4000-8000-000000000003'::uuid, 'right'),
  ('d1d1d1d1-0001-4000-8000-000000000001'::uuid, 'f1f1f1f1-0008-4000-8000-000000000008'::uuid, 'left'),
  ('d1d1d1d1-0002-4000-8000-000000000002'::uuid, 'f1f1f1f1-0001-4000-8000-000000000001'::uuid, 'right'),
  ('d1d1d1d1-0002-4000-8000-000000000002'::uuid, 'f1f1f1f1-0005-4000-8000-000000000005'::uuid, 'saved'),
  ('d1d1d1d1-0003-4000-8000-000000000003'::uuid, 'f1f1f1f1-0003-4000-8000-000000000003'::uuid, 'right'),
  ('d1d1d1d1-0003-4000-8000-000000000003'::uuid, 'f1f1f1f1-0006-4000-8000-000000000006'::uuid, 'right'),
  ('d1d1d1d1-0004-4000-8000-000000000004'::uuid, 'f1f1f1f1-0002-4000-8000-000000000002'::uuid, 'right'),
  ('d1d1d1d1-0007-4000-8000-000000000007'::uuid, 'f1f1f1f1-0007-4000-8000-000000000007'::uuid, 'right')
) AS v(student_id, job_id, direction)
JOIN student_profiles s ON s.id = v.student_id
JOIN jobs j ON j.id = v.job_id
ON CONFLICT (student_id, job_id) DO NOTHING;

INSERT INTO candidate_swipes (recruiter_id, student_id, job_id, direction)
SELECT v.recruiter_id, v.student_id, v.job_id, v.direction::swipe_direction
FROM (VALUES
  ('e1e1e1e1-0001-4000-8000-000000000001'::uuid, 'd1d1d1d1-0001-4000-8000-000000000001'::uuid, 'f1f1f1f1-0001-4000-8000-000000000001'::uuid, 'right'),
  ('e1e1e1e1-0001-4000-8000-000000000001'::uuid, 'd1d1d1d1-0002-4000-8000-000000000002'::uuid, 'f1f1f1f1-0001-4000-8000-000000000001'::uuid, 'right'),
  ('e1e1e1e1-0002-4000-8000-000000000002'::uuid, 'd1d1d1d1-0001-4000-8000-000000000001'::uuid, 'f1f1f1f1-0003-4000-8000-000000000003'::uuid, 'right'),
  ('e1e1e1e1-0002-4000-8000-000000000002'::uuid, 'd1d1d1d1-0003-4000-8000-000000000003'::uuid, 'f1f1f1f1-0003-4000-8000-000000000003'::uuid, 'right'),
  ('e1e1e1e1-0003-4000-8000-000000000003'::uuid, 'd1d1d1d1-0003-4000-8000-000000000003'::uuid, 'f1f1f1f1-0006-4000-8000-000000000006'::uuid, 'right'),
  ('e1e1e1e1-0004-4000-8000-000000000004'::uuid, 'd1d1d1d1-0007-4000-8000-000000000007'::uuid, 'f1f1f1f1-0007-4000-8000-000000000007'::uuid, 'right'),
  ('e1e1e1e1-0001-4000-8000-000000000001'::uuid, 'd1d1d1d1-0008-4000-8000-000000000008'::uuid, 'f1f1f1f1-0001-4000-8000-000000000001'::uuid, 'left')
) AS v(recruiter_id, student_id, job_id, direction)
JOIN recruiter_profiles r ON r.id = v.recruiter_id
JOIN student_profiles s ON s.id = v.student_id
JOIN jobs j ON j.id = v.job_id
ON CONFLICT (recruiter_id, student_id, job_id) DO NOTHING;

UPDATE matches SET pipeline_status = 'interview', recruiter_notes = 'Strong TypeScript. Book a 30-minute screen.'
WHERE student_id = 'd1d1d1d1-0001-4000-8000-000000000001'
  AND job_id = 'f1f1f1f1-0001-4000-8000-000000000001'
  AND pipeline_status IS NOT NULL;

UPDATE matches SET pipeline_status = 'offer', recruiter_notes = 'Verbal yes. Sending written offer this week.'
WHERE student_id = 'd1d1d1d1-0003-4000-8000-000000000003'
  AND job_id = 'f1f1f1f1-0003-4000-8000-000000000003'
  AND pipeline_status IS NOT NULL;

UPDATE matches SET is_shortlisted = true
WHERE job_id IN (
  'f1f1f1f1-0001-4000-8000-000000000001',
  'f1f1f1f1-0007-4000-8000-000000000007'
);

-- Chat threads
INSERT INTO conversations (match_id)
SELECT m.id FROM matches m
WHERE NOT EXISTS (SELECT 1 FROM conversations c WHERE c.match_id = m.id);

INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
SELECT
  seed.id,
  c.id,
  seed.sender_id,
  seed.content,
  now() - seed.ago
FROM matches m
JOIN conversations c ON c.match_id = m.id
JOIN (
  VALUES
    (
      'aa0aa0aa-0001-4000-8000-000000000001'::uuid,
      'd1d1d1d1-0001-4000-8000-000000000001'::uuid,
      'e1e1e1e1-0001-4000-8000-000000000001'::uuid,
      'f1f1f1f1-0001-4000-8000-000000000001'::uuid,
      'Thanks for the match — I can do a screen this week after 4pm PKT.',
      interval '2 hours'
    ),
    (
      'aa0aa0aa-0002-4000-8000-000000000002'::uuid,
      'e1e1e1e1-0001-4000-8000-000000000001'::uuid,
      'd1d1d1d1-0001-4000-8000-000000000001'::uuid,
      'f1f1f1f1-0001-4000-8000-000000000001'::uuid,
      'Sending a 25-minute slot for Thursday. Bring one project you would redo.',
      interval '90 minutes'
    ),
    (
      'aa0aa0aa-0003-4000-8000-000000000003'::uuid,
      'd1d1d1d1-0002-4000-8000-000000000002'::uuid,
      'e1e1e1e1-0001-4000-8000-000000000001'::uuid,
      'f1f1f1f1-0001-4000-8000-000000000001'::uuid,
      'Sharing GitHub on my profile. Happy to walk through the campus app.',
      interval '3 hours'
    ),
    (
      'aa0aa0aa-0004-4000-8000-000000000004'::uuid,
      'e1e1e1e1-0002-4000-8000-000000000002'::uuid,
      'd1d1d1d1-0003-4000-8000-000000000003'::uuid,
      'f1f1f1f1-0003-4000-8000-000000000003'::uuid,
      'We liked the funnel notes. Offer letter is going out — check email tomorrow.',
      interval '40 minutes'
    ),
    (
      'aa0aa0aa-0005-4000-8000-000000000005'::uuid,
      'd1d1d1d1-0007-4000-8000-000000000007'::uuid,
      'e1e1e1e1-0004-4000-8000-000000000004'::uuid,
      'f1f1f1f1-0007-4000-8000-000000000007'::uuid,
      'Portfolio is on my profile. The job-card case study is the second project.',
      interval '5 hours'
    )
) AS seed(id, sender_id, peer_id, job_id, content, ago)
  ON m.job_id = seed.job_id
 AND ((m.student_id = seed.sender_id AND m.recruiter_id = seed.peer_id)
   OR (m.recruiter_id = seed.sender_id AND m.student_id = seed.peer_id))
ON CONFLICT (id) DO NOTHING;

-- Interview on Ayesha × Systems intern
DO $$
BEGIN
  IF to_regclass('public.interview_proposals') IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO interview_proposals (
    id, match_id, conversation_id, proposed_by, proposed_at, duration_minutes, location_or_link, note, status
  )
  SELECT
    'bb0bb0bb-0001-4000-8000-000000000001',
    m.id,
    c.id,
    'e1e1e1e1-0001-4000-8000-000000000001',
    now() + interval '2 days',
    25,
    'Google Meet — link in calendar',
    'Bring one project you would redo.',
    'pending'
  FROM matches m
  JOIN conversations c ON c.match_id = m.id
  WHERE m.student_id = 'd1d1d1d1-0001-4000-8000-000000000001'
    AND m.job_id = 'f1f1f1f1-0001-4000-8000-000000000001'
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Views
DO $$
BEGIN
  IF to_regclass('public.job_views') IS NOT NULL THEN
    INSERT INTO job_views (student_id, job_id)
    SELECT s.id, j.id
    FROM unnest(ARRAY[
      'd1d1d1d1-0001-4000-8000-000000000001',
      'd1d1d1d1-0002-4000-8000-000000000002',
      'd1d1d1d1-0003-4000-8000-000000000003',
      'd1d1d1d1-0006-4000-8000-000000000006'
    ]::uuid[]) AS sid(id)
    JOIN student_profiles s ON s.id = sid.id
    CROSS JOIN unnest(ARRAY[
      'f1f1f1f1-0001-4000-8000-000000000001',
      'f1f1f1f1-0003-4000-8000-000000000003',
      'f1f1f1f1-0005-4000-8000-000000000005'
    ]::uuid[]) AS jid(id)
    JOIN jobs j ON j.id = jid.id
    ON CONFLICT (student_id, job_id) DO NOTHING;
  END IF;

  IF to_regclass('public.profile_views') IS NOT NULL THEN
    INSERT INTO profile_views (viewer_id, student_id)
    SELECT v.viewer_id, v.student_id
    FROM (VALUES
      ('e1e1e1e1-0001-4000-8000-000000000001'::uuid, 'd1d1d1d1-0001-4000-8000-000000000001'::uuid),
      ('e1e1e1e1-0001-4000-8000-000000000001'::uuid, 'd1d1d1d1-0002-4000-8000-000000000002'::uuid),
      ('e1e1e1e1-0002-4000-8000-000000000002'::uuid, 'd1d1d1d1-0003-4000-8000-000000000003'::uuid),
      ('e1e1e1e1-0004-4000-8000-000000000004'::uuid, 'd1d1d1d1-0007-4000-8000-000000000007'::uuid),
      ('e1e1e1e1-0003-4000-8000-000000000003'::uuid, 'd1d1d1d1-0004-4000-8000-000000000004'::uuid)
    ) AS v(viewer_id, student_id)
    JOIN recruiter_profiles r ON r.id = v.viewer_id
    JOIN student_profiles s ON s.id = v.student_id
    ON CONFLICT (viewer_id, student_id) DO NOTHING;
  END IF;
END $$;

-- Community membership + a few room messages
INSERT INTO channel_members (channel_id, user_id)
SELECT c.id, u.id
FROM community_channels c
CROSS JOIN profiles u
WHERE c.name IN ('introductions', 'career-advice', 'internships', 'software-engineering')
  AND u.role IN ('student', 'recruiter')
ON CONFLICT DO NOTHING;

INSERT INTO channel_messages (id, channel_id, sender_id, content, created_at)
SELECT
  'cc0cc0cc-0001-4000-8000-000000000001',
  c.id,
  'd1d1d1d1-0001-4000-8000-000000000001',
  'Final-year CS at LUMS — looking for a backend internship in Lahore or remote. TypeScript + Postgres.',
  now() - interval '6 hours'
FROM community_channels c
JOIN profiles p ON p.id = 'd1d1d1d1-0001-4000-8000-000000000001'
WHERE c.name = 'introductions'
ON CONFLICT (id) DO NOTHING;

INSERT INTO channel_messages (id, channel_id, sender_id, content, created_at)
SELECT
  'cc0cc0cc-0002-4000-8000-000000000002',
  c.id,
  'e1e1e1e1-0001-4000-8000-000000000001',
  'We opened a SWE intern seat. Complete profiles (photo, education, resume) get reviewed first.',
  now() - interval '4 hours'
FROM community_channels c
JOIN profiles p ON p.id = 'e1e1e1e1-0001-4000-8000-000000000001'
WHERE c.name = 'internships'
ON CONFLICT (id) DO NOTHING;

INSERT INTO channel_messages (id, channel_id, sender_id, content, created_at)
SELECT
  'cc0cc0cc-0003-4000-8000-000000000003',
  c.id,
  'd1d1d1d1-0003-4000-8000-000000000003',
  'What is a reasonable PKR stipend to put on Discover filters for a Karachi data intern?',
  now() - interval '2 hours'
FROM community_channels c
JOIN profiles p ON p.id = 'd1d1d1d1-0003-4000-8000-000000000003'
WHERE c.name = 'career-advice'
ON CONFLICT (id) DO NOTHING;

-- ── Feed ──────────────────────────────────────────────────
DO $$
DECLARE
  post_ids uuid[] := ARRAY[
    'b1b1b1b1-0001-4000-8000-000000000001'::uuid,
    'b1b1b1b1-0002-4000-8000-000000000002'::uuid,
    'b1b1b1b1-0003-4000-8000-000000000003'::uuid,
    'b1b1b1b1-0004-4000-8000-000000000004'::uuid,
    'b1b1b1b1-0005-4000-8000-000000000005'::uuid,
    'b1b1b1b1-0006-4000-8000-000000000006'::uuid,
    'b1b1b1b1-0007-4000-8000-000000000007'::uuid,
    'b1b1b1b1-0008-4000-8000-000000000008'::uuid,
    'b1b1b1b1-0009-4000-8000-000000000009'::uuid
  ];
  comment_ids uuid[] := ARRAY[
    'c1c1c1c1-0001-4000-8000-000000000001'::uuid,
    'c1c1c1c1-0002-4000-8000-000000000002'::uuid,
    'c1c1c1c1-0003-4000-8000-000000000003'::uuid,
    'c1c1c1c1-0004-4000-8000-000000000004'::uuid,
    'c1c1c1c1-0005-4000-8000-000000000005'::uuid
  ];
  r1 uuid := 'e1e1e1e1-0001-4000-8000-000000000001';
  r2 uuid := 'e1e1e1e1-0002-4000-8000-000000000002';
  r4 uuid := 'e1e1e1e1-0004-4000-8000-000000000004';
  s1 uuid := 'd1d1d1d1-0001-4000-8000-000000000001';
  s2 uuid := 'd1d1d1d1-0002-4000-8000-000000000002';
  s3 uuid := 'd1d1d1d1-0003-4000-8000-000000000003';
  s7 uuid := 'd1d1d1d1-0007-4000-8000-000000000007';
  s8 uuid := 'd1d1d1d1-0008-4000-8000-000000000008';
BEGIN
  IF to_regclass('public.feed_posts') IS NULL THEN
    RAISE NOTICE 'feed_posts is missing. Run 20260912030000_feed_posts.sql first.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = r1) THEN
    RAISE NOTICE 'Demo profiles were not created (auth.users insert likely failed). Feed seed skipped.';
    RETURN;
  END IF;

  INSERT INTO feed_posts (id, author_id, body, image_url, created_at)
  VALUES
    (post_ids[1], r1, 'Just wrapped campus interviews for our summer intern class. If you applied this week, we are reviewing profiles tonight — keep yours complete (photo, education, resume).', 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80', now() - interval '5 hours'),
    (post_ids[2], s1, 'Final-year CS at LUMS. Looking for a backend or full-stack internship in Lahore or remote. Stack: TypeScript, Postgres, a bit of Python.', NULL, now() - interval '4 hours'),
    (post_ids[3], r2, 'We opened two product roles for new grads. Pay band is on the card. Mutual match still required before chat — swipe on Discover if the work sounds like a fit.', NULL, now() - interval '3 hours'),
    (post_ids[4], s8, 'Unpopular opinion: a 1-minute intro video beats another keyword-stuffed bio. Recruiters actually watch them. Has anyone landed a match that way here?', 'https://images.unsplash.com/photo-1522202176988-662883558ed1?auto=format&fit=crop&w=1600&q=80', now() - interval '2 hours'),
    (post_ids[5], r4, 'Hiring for a UX intern this quarter. Looking for someone who can critique a job card, not just restyle it. Portfolio link in your profile helps more than a long post.', NULL, now() - interval '80 minutes'),
    (post_ids[6], s3, 'Coffee chat takeaway: students who name a salary range and a city get shortlisted faster than “open to anything.” Be specific on Discover filters too.', NULL, now() - interval '25 minutes'),
    (post_ids[7], s2, 'Shipped a small campus tool in React this week. If you are hiring SWE interns who like boring, reliable tickets — I am your person.', NULL, now() - interval '12 hours'),
    (post_ids[8], s7, 'Dropping a job-card case study on my profile tonight. Happy to take portfolio critiques in the design channel.', NULL, now() - interval '8 hours')
  ON CONFLICT (id) DO UPDATE
    SET body = excluded.body,
        image_url = excluded.image_url,
        author_id = excluded.author_id,
        created_at = excluded.created_at;

  INSERT INTO feed_posts (id, author_id, body, image_url, shared_post_id, created_at)
  VALUES
    (post_ids[9], r2, 'This is the advice we wish showed up on more student profiles.', NULL, post_ids[6], now() - interval '18 minutes')
  ON CONFLICT (id) DO UPDATE
    SET body = excluded.body,
        shared_post_id = excluded.shared_post_id,
        author_id = excluded.author_id,
        created_at = excluded.created_at;

  DELETE FROM feed_post_likes WHERE post_id = ANY (post_ids);
  DELETE FROM feed_post_comments WHERE id = ANY (comment_ids);

  INSERT INTO feed_post_likes (post_id, user_id, reaction)
  VALUES
    (post_ids[1], s1, 'like'), (post_ids[1], s2, 'celebrate'), (post_ids[1], s3, 'insightful'),
    (post_ids[2], r1, 'like'), (post_ids[2], s3, 'support'),
    (post_ids[3], s1, 'like'), (post_ids[3], s8, 'love'),
    (post_ids[4], r4, 'funny'), (post_ids[4], s7, 'like'), (post_ids[4], s1, 'celebrate'),
    (post_ids[5], s7, 'insightful'),
    (post_ids[6], r2, 'like'), (post_ids[6], s1, 'celebrate'),
    (post_ids[9], s1, 'like')
  ON CONFLICT DO NOTHING;

  INSERT INTO feed_post_comments (id, post_id, author_id, body, created_at)
  VALUES
    (comment_ids[1], post_ids[1], s1, 'Appreciate the heads-up. Just added a resume and a clearer bio.', now() - interval '4 hours'),
    (comment_ids[2], post_ids[2], r1, 'Drop the GitHub on your profile — we look there before we swipe.', now() - interval '3 hours 20 minutes'),
    (comment_ids[3], post_ids[4], r4, 'Yes. Short, well-lit, and talking about one project beats a montage.', now() - interval '90 minutes'),
    (comment_ids[4], post_ids[6], s2, 'This tracks. I started putting PKR bands on my applications and got two views the same day.', now() - interval '10 minutes'),
    (comment_ids[5], post_ids[5], s7, 'Case study is up. Would love a critique on the information hierarchy.', now() - interval '40 minutes')
  ON CONFLICT (id) DO NOTHING;
END $$;

DROP FUNCTION IF EXISTS public.seed_auth_user(uuid, text, text, text, text);

DO $$
BEGIN
  RAISE NOTICE 'Seed complete. Demo password: JobMatch!demo — emails @jobmatch.demo';
END $$;
