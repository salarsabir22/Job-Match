-- Profile video: add column and storage bucket
-- ============================================================

-- Add profile_video_url to profiles (students and recruiters)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_video_url TEXT;

-- Storage bucket for profile videos (public so profile viewers can play)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-videos', 'profile-videos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- RLS for profile-videos: anyone can read, only owner can write (path: {user_id}/video.*)
DROP POLICY IF EXISTS "profile_videos_read_all" ON storage.objects;
CREATE POLICY "profile_videos_read_all" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-videos');

DROP POLICY IF EXISTS "profile_videos_insert_own" ON storage.objects;
CREATE POLICY "profile_videos_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "profile_videos_update_own" ON storage.objects;
CREATE POLICY "profile_videos_update_own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "profile_videos_delete_own" ON storage.objects;
CREATE POLICY "profile_videos_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
