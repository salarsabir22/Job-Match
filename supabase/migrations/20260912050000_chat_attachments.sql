-- WhatsApp-style chat attachments: video, audio files, captions, original name/size.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS file_size integer,
  ADD COLUMN IF NOT EXISTS mime_type text;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'voice', 'image', 'file', 'video', 'audio'));
