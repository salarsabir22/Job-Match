-- Voice notes on match chat. Storage bucket `chat-media` already exists.
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_message_type_check'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_message_type_check
      CHECK (message_type IN ('text', 'voice'));
  END IF;
END $$;

COMMENT ON COLUMN messages.media_url IS 'Public URL in chat-media for voice (and later images).';
COMMENT ON COLUMN messages.duration_seconds IS 'Voice note length in seconds.';
