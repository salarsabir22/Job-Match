-- Authors can edit their own comments. Track last edit time.

ALTER TABLE feed_post_comments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP POLICY IF EXISTS "feed_comments_update_own" ON feed_post_comments;
CREATE POLICY "feed_comments_update_own" ON feed_post_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
