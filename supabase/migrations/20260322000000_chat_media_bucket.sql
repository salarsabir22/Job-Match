-- Public chat attachments (voice, images). Path: {user_id}/{conversation_id}/{filename}
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat_media_select_all" ON storage.objects;
CREATE POLICY "chat_media_select_all" ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "chat_media_insert_own" ON storage.objects;
CREATE POLICY "chat_media_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "chat_media_update_own" ON storage.objects;
CREATE POLICY "chat_media_update_own" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "chat_media_delete_own" ON storage.objects;
CREATE POLICY "chat_media_delete_own" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
