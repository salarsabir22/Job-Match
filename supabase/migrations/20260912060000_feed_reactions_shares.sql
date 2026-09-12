-- Reactions on feed likes + reshare posts onto your own feed.

ALTER TABLE feed_post_likes
  ADD COLUMN IF NOT EXISTS reaction text NOT NULL DEFAULT 'like';

ALTER TABLE feed_post_likes DROP CONSTRAINT IF EXISTS feed_post_likes_reaction_check;
ALTER TABLE feed_post_likes
  ADD CONSTRAINT feed_post_likes_reaction_check
  CHECK (reaction IN ('like', 'celebrate', 'support', 'love', 'insightful', 'funny'));

DROP POLICY IF EXISTS "feed_likes_update_own" ON feed_post_likes;
CREATE POLICY "feed_likes_update_own" ON feed_post_likes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS shared_post_id uuid REFERENCES feed_posts(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS feed_posts_author_share_unique
  ON feed_posts (author_id, shared_post_id)
  WHERE shared_post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS feed_posts_shared_post_id_idx ON feed_posts (shared_post_id);

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
