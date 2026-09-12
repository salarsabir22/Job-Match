-- LinkedIn-style public feed: posts, likes, comments, optional images.

CREATE TABLE IF NOT EXISTS feed_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  image_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT feed_posts_body_len CHECK (
    char_length(body) <= 3000
    AND (char_length(trim(body)) >= 1 OR image_url IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS feed_post_likes (
  post_id    UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS feed_post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT feed_post_comments_body_len CHECK (char_length(trim(body)) BETWEEN 1 AND 1000)
);

CREATE INDEX IF NOT EXISTS feed_posts_created_at_idx ON feed_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS feed_posts_author_id_idx ON feed_posts (author_id);
CREATE INDEX IF NOT EXISTS feed_post_comments_post_id_idx ON feed_post_comments (post_id, created_at);

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_posts_select_auth" ON feed_posts;
CREATE POLICY "feed_posts_select_auth" ON feed_posts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "feed_posts_insert_own" ON feed_posts;
CREATE POLICY "feed_posts_insert_own" ON feed_posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "feed_posts_update_own" ON feed_posts;
CREATE POLICY "feed_posts_update_own" ON feed_posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "feed_posts_delete_own" ON feed_posts;
CREATE POLICY "feed_posts_delete_own" ON feed_posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() OR auth_user_role() = 'admin');

DROP POLICY IF EXISTS "feed_likes_select_auth" ON feed_post_likes;
CREATE POLICY "feed_likes_select_auth" ON feed_post_likes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "feed_likes_insert_own" ON feed_post_likes;
CREATE POLICY "feed_likes_insert_own" ON feed_post_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "feed_likes_delete_own" ON feed_post_likes;
CREATE POLICY "feed_likes_delete_own" ON feed_post_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "feed_comments_select_auth" ON feed_post_comments;
CREATE POLICY "feed_comments_select_auth" ON feed_post_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "feed_comments_insert_own" ON feed_post_comments;
CREATE POLICY "feed_comments_insert_own" ON feed_post_comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "feed_comments_delete_own" ON feed_post_comments;
CREATE POLICY "feed_comments_delete_own" ON feed_post_comments FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR auth_user_role() = 'admin'
    OR EXISTS (SELECT 1 FROM feed_posts p WHERE p.id = feed_post_comments.post_id AND p.author_id = auth.uid())
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-media', 'feed-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "feed_media_select_all" ON storage.objects;
CREATE POLICY "feed_media_select_all" ON storage.objects FOR SELECT
  USING (bucket_id = 'feed-media');

DROP POLICY IF EXISTS "feed_media_insert_own" ON storage.objects;
CREATE POLICY "feed_media_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'feed-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "feed_media_delete_own" ON storage.objects;
CREATE POLICY "feed_media_delete_own" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'feed-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

ALTER TABLE feed_posts REPLICA IDENTITY FULL;
ALTER TABLE feed_post_likes REPLICA IDENTITY FULL;
ALTER TABLE feed_post_comments REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE feed_posts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE feed_post_likes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE feed_post_comments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
