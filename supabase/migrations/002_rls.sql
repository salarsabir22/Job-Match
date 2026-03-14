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
