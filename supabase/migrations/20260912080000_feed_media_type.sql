-- Distinguish photos vs videos stored in feed_posts.image_url.

ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS media_type text;

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

UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'feed-media';
